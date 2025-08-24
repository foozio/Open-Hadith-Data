const storage = require('../plugins/storage');
const { v4: uuidv4 } = require('uuid');

/**
 * API Token Management Routes
 */
async function tokenRoutes(fastify, options) {
  
  // Get all tokens for current user
  fastify.get('/tokens', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const tokens = await storage.getTokensByUserId(request.user.id);
      
      // Remove sensitive data before sending
      const sanitizedTokens = tokens.map(token => ({
        id: token.id,
        name: token.name,
        key: token.key.substring(0, 8) + '...' + token.key.substring(token.key.length - 4), // Show partial key
        permissions: token.permissions,
        rateLimit: token.rateLimit,
        rateLimitWindow: token.rateLimitWindow,
        allowedOrigins: token.allowedOrigins,
        isActive: token.isActive,
        createdAt: token.createdAt,
        lastUsedAt: token.lastUsedAt,
        usageCount: token.usageCount || 0
      }));
      
      reply.send({
        tokens: sanitizedTokens,
        total: sanitizedTokens.length
      });
    } catch (error) {
      fastify.log.error('Error fetching tokens:', error);
      reply.status(500).send({
        error: true,
        message: 'Failed to fetch tokens',
        statusCode: 500
      });
    }
  });

  // Create new API token
  fastify.post('/tokens', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          permissions: { 
            type: 'array', 
            items: { 
              type: 'string', 
              enum: ['read', 'write', 'admin', 'all'] 
            },
            default: ['read']
          },
          rateLimit: { type: 'integer', minimum: 1, maximum: 10000, default: 100 },
          rateLimitWindow: { type: 'string', default: '1 hour' },
          allowedOrigins: { 
            type: 'array', 
            items: { type: 'string' },
            default: []
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { name, permissions, rateLimit, rateLimitWindow, allowedOrigins } = request.body;
      
      // Generate API key
      const apiKey = 'hda_' + uuidv4().replace(/-/g, '');
      
      // Validate permissions for non-admin users
      if (request.user.role !== 'admin') {
        const allowedPermissions = ['read'];
        const invalidPermissions = permissions.filter(p => !allowedPermissions.includes(p));
        
        if (invalidPermissions.length > 0) {
          reply.status(403).send({
            error: true,
            message: `Permissions not allowed: ${invalidPermissions.join(', ')}`,
            statusCode: 403
          });
          return;
        }
      }
      
      const token = await storage.createToken(request.user.id, {
        name,
        key: apiKey,
        permissions: permissions || ['read'],
        rateLimit: rateLimit || 100,
        rateLimitWindow: rateLimitWindow || '1 hour',
        allowedOrigins: allowedOrigins || []
      });
      
      reply.status(201).send({
        success: true,
        token: {
          id: token.id,
          name: token.name,
          key: token.key, // Show full key only on creation
          permissions: token.permissions,
          rateLimit: token.rateLimit,
          rateLimitWindow: token.rateLimitWindow,
          allowedOrigins: token.allowedOrigins,
          createdAt: token.createdAt
        },
        message: 'API token created successfully. Please save this key as it will not be shown again.'
      });
    } catch (error) {
      fastify.log.error('Error creating token:', error);
      reply.status(500).send({
        error: true,
        message: 'Failed to create token',
        statusCode: 500
      });
    }
  });

  // Update API token
  fastify.put('/tokens/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          permissions: { 
            type: 'array', 
            items: { 
              type: 'string', 
              enum: ['read', 'write', 'admin', 'all'] 
            }
          },
          rateLimit: { type: 'integer', minimum: 1, maximum: 10000 },
          rateLimitWindow: { type: 'string' },
          allowedOrigins: { 
            type: 'array', 
            items: { type: 'string' }
          },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updates = request.body;
      
      // Get existing token to verify ownership
      const tokens = await storage.getTokens();
      const existingToken = tokens.find(t => t.id === id);
      
      if (!existingToken) {
        reply.status(404).send({
          error: true,
          message: 'Token not found',
          statusCode: 404
        });
        return;
      }
      
      // Check ownership (users can only modify their own tokens, admins can modify any)
      if (request.user.role !== 'admin' && existingToken.userId !== request.user.id) {
        reply.status(403).send({
          error: true,
          message: 'Access denied',
          statusCode: 403
        });
        return;
      }
      
      // Validate permissions for non-admin users
      if (request.user.role !== 'admin' && updates.permissions) {
        const allowedPermissions = ['read'];
        const invalidPermissions = updates.permissions.filter(p => !allowedPermissions.includes(p));
        
        if (invalidPermissions.length > 0) {
          reply.status(403).send({
            error: true,
            message: `Permissions not allowed: ${invalidPermissions.join(', ')}`,
            statusCode: 403
          });
          return;
        }
      }
      
      const updatedToken = await storage.updateToken(id, updates);
      
      reply.send({
        success: true,
        token: {
          id: updatedToken.id,
          name: updatedToken.name,
          permissions: updatedToken.permissions,
          rateLimit: updatedToken.rateLimit,
          rateLimitWindow: updatedToken.rateLimitWindow,
          allowedOrigins: updatedToken.allowedOrigins,
          isActive: updatedToken.isActive,
          updatedAt: updatedToken.updatedAt
        },
        message: 'Token updated successfully'
      });
    } catch (error) {
      fastify.log.error('Error updating token:', error);
      reply.status(500).send({
        error: true,
        message: 'Failed to update token',
        statusCode: 500
      });
    }
  });

  // Delete API token
  fastify.delete('/tokens/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      // Get existing token to verify ownership
      const tokens = await storage.getTokens();
      const existingToken = tokens.find(t => t.id === id);
      
      if (!existingToken) {
        reply.status(404).send({
          error: true,
          message: 'Token not found',
          statusCode: 404
        });
        return;
      }
      
      // Check ownership (users can only delete their own tokens, admins can delete any)
      if (request.user.role !== 'admin' && existingToken.userId !== request.user.id) {
        reply.status(403).send({
          error: true,
          message: 'Access denied',
          statusCode: 403
        });
        return;
      }
      
      await storage.deleteToken(id);
      
      reply.send({
        success: true,
        message: 'Token deleted successfully'
      });
    } catch (error) {
      fastify.log.error('Error deleting token:', error);
      reply.status(500).send({
        error: true,
        message: 'Failed to delete token',
        statusCode: 500
      });
    }
  });

  // Get token usage statistics
  fastify.get('/tokens/:id/stats', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      // Get token to verify ownership
      const tokens = await storage.getTokens();
      const token = tokens.find(t => t.id === id);
      
      if (!token) {
        reply.status(404).send({
          error: true,
          message: 'Token not found',
          statusCode: 404
        });
        return;
      }
      
      // Check ownership (users can only view their own token stats, admins can view any)
      if (request.user.role !== 'admin' && token.userId !== request.user.id) {
        reply.status(403).send({
          error: true,
          message: 'Access denied',
          statusCode: 403
        });
        return;
      }
      
      reply.send({
        stats: {
          id: token.id,
          name: token.name,
          usageCount: token.usageCount || 0,
          lastUsedAt: token.lastUsedAt,
          createdAt: token.createdAt,
          isActive: token.isActive,
          rateLimit: token.rateLimit,
          rateLimitWindow: token.rateLimitWindow
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching token stats:', error);
      reply.status(500).send({
        error: true,
        message: 'Failed to fetch token statistics',
        statusCode: 500
      });
    }
  });

  fastify.log.info('🔑 Token management routes registered');
}

module.exports = tokenRoutes;
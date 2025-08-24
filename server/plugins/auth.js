const storage = require('../plugins/storage');

/**
 * Authentication and Authorization Middleware
 */
async function authMiddleware(fastify, options) {
  // Ensure JWT is registered first
  if (!fastify.jwt) {
    await fastify.register(require('@fastify/jwt'), {
      secret: process.env.JWT_SECRET || 'supersecret'
    });
  }

  // Authentication decorator
  fastify.decorate('authenticate', async function(request, reply) {
    try {
      // First try session-based auth (for dashboard)
      const sessionUser = request.session?.get('user');
      const sessionToken = request.session?.get('token');
      
      if (sessionUser && sessionToken) {
        try {
          const decoded = fastify.jwt.verify(sessionToken);
          const user = await storage.getUserById(decoded.id);
          
          if (user && user.isActive) {
            request.user = user;
            return;
          }
        } catch (sessionError) {
          // Session JWT invalid, continue to API key check
        }
      }
      
      // Try API key authentication
      const apiKey = request.headers['x-api-key'] || request.query.api_key;
      
      if (apiKey) {
        const token = await storage.getTokenByKey(apiKey);
        
        if (!token || !token.isActive) {
          reply.status(401).send({
            error: true,
            message: 'Invalid API key',
            statusCode: 401
          });
          return;
        }
        
        // Get user associated with the token
        const user = await storage.getUserById(token.userId);
        
        if (!user || !user.isActive) {
          reply.status(401).send({
            error: true,
            message: 'Token user not found or inactive',
            statusCode: 401
          });
          return;
        }
        
        // Increment token usage
        await storage.incrementTokenUsage(apiKey);
        
        // Set user and token info for the request
        request.user = user;
        request.apiToken = token;
        return;
      }
      
      // Try JWT token in Authorization header
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        try {
          const decoded = fastify.jwt.verify(token);
          const user = await storage.getUserById(decoded.id);
          
          if (user && user.isActive) {
            request.user = user;
            return;
          }
        } catch (jwtError) {
          // JWT invalid, fall through to unauthorized
        }
      }
      
      // No valid authentication found
      reply.status(401).send({
        error: true,
        message: 'Authentication required',
        statusCode: 401
      });
      
    } catch (error) {
      fastify.log.error('Authentication error:', error);
      reply.status(500).send({
        error: true,
        message: 'Authentication error',
        statusCode: 500
      });
    }
  });

  // Admin role check decorator
  fastify.decorate('requireAdmin', async function(request, reply) {
    await fastify.authenticate(request, reply);
    
    if (reply.sent) return; // Authentication failed
    
    if (request.user.role !== 'admin') {
      reply.status(403).send({
        error: true,
        message: 'Admin access required',
        statusCode: 403
      });
    }
  });

  // Optional authentication decorator (doesn't fail if no auth)
  fastify.decorate('optionalAuth', async function(request, reply) {
    try {
      await fastify.authenticate(request, reply);
    } catch (error) {
      // Ignore authentication errors for optional auth
      request.user = null;
    }
    
    // Reset reply status if it was set by authenticate
    if (reply.statusCode === 401) {
      reply.status(200);
      request.user = null;
    }
  });

  // Permission check decorator
  fastify.decorate('requirePermission', function(permission) {
    return async function(request, reply) {
      await fastify.authenticate(request, reply);
      
      if (reply.sent) return; // Authentication failed
      
      // Admin has all permissions
      if (request.user.role === 'admin') {
        return;
      }
      
      // Check API token permissions
      if (request.apiToken) {
        if (!request.apiToken.permissions.includes(permission) && !request.apiToken.permissions.includes('all')) {
          reply.status(403).send({
            error: true,
            message: `Permission '${permission}' required`,
            statusCode: 403
          });
          return;
        }
      }
    };
  });

  fastify.log.info('🛡️  Authentication middleware registered');
}

module.exports = authMiddleware;
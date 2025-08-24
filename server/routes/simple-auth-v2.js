/**
 * Simplified Authentication Routes without Cookie Dependencies
 */
async function simpleAuthRoutes(fastify, options) {
  
  // Register JWT plugin
  await fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET || 'supersecret'
  });

  // Simple in-memory session storage (for testing)
  const sessions = new Map();
  
  // Mock user for testing
  const testUser = {
    id: 'test-user-1',
    email: 'admin@example.com',
    name: 'Test Admin',
    picture: 'https://via.placeholder.com/100',
    role: 'admin',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    isActive: true
  };

  // Simple login route (for testing)
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          password: { type: 'string' }
        },
        required: ['email', 'password']
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body;
    
    // Simple authentication (for testing only)
    if (email === 'admin@example.com' && password === 'admin123') {
      const token = fastify.jwt.sign({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role
      }, { expiresIn: '24h' });
      
      // Store session with token as key for simple lookup
      const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      sessions.set(sessionId, {
        user: testUser,
        token: token,
        createdAt: new Date()
      });
      
      // Return session info in response (since we can't use cookies reliably)
      reply.send({
        success: true,
        user: testUser,
        token: token,
        sessionId: sessionId
      });
    } else {
      reply.status(401).send({
        error: true,
        message: 'Invalid credentials',
        statusCode: 401
      });
    }
  });

  // Logout route
  fastify.post('/logout', async (request, reply) => {
    const sessionId = request.headers['x-session-id'] || request.body.sessionId;
    if (sessionId) {
      sessions.delete(sessionId);
    }
    
    reply.send({
      success: true,
      message: 'Logged out successfully'
    });
  });

  // Check authentication status
  fastify.get('/status', async (request, reply) => {
    const sessionId = request.headers['x-session-id'] || request.query.sessionId;
    
    if (!sessionId || !sessions.has(sessionId)) {
      return reply.send({
        authenticated: false,
        user: null
      });
    }
    
    const session = sessions.get(sessionId);
    
    try {
      const decoded = fastify.jwt.verify(session.token);
      reply.send({
        authenticated: true,
        user: session.user
      });
    } catch (error) {
      sessions.delete(sessionId);
      reply.send({
        authenticated: false,
        user: null
      });
    }
  });

  // Get current user (protected route)
  fastify.get('/me', async (request, reply) => {
    const sessionId = request.headers['x-session-id'] || request.query.sessionId;
    
    if (!sessionId || !sessions.has(sessionId)) {
      return reply.status(401).send({
        error: true,
        message: 'Authentication required',
        statusCode: 401
      });
    }
    
    const session = sessions.get(sessionId);
    
    try {
      const decoded = fastify.jwt.verify(session.token);
      reply.send({
        user: session.user
      });
    } catch (error) {
      sessions.delete(sessionId);
      reply.status(401).send({
        error: true,
        message: 'Invalid session',
        statusCode: 401
      });
    }
  });

  fastify.log.info('🔐 Simple authentication routes registered');
}

module.exports = simpleAuthRoutes;
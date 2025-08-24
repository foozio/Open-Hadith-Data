const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Authentication Routes with Google OAuth
 */
async function authRoutes(fastify, options) {
  
  // Simple in-memory session storage (for testing)
  const sessions = new Map();
  
  // OAuth state storage for security
  const oauthStates = new Map();
  
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

  // JWT secret
  const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

  // Authentication middleware
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      const sessionId = request.headers['x-session-id'] || request.query.sessionId;
      
      if (!sessionId || !sessions.has(sessionId)) {
        reply.status(401).send({
          error: true,
          message: 'Authentication required',
          statusCode: 401
        });
        return;
      }
      
      const session = sessions.get(sessionId);
      
      try {
        const decoded = jwt.verify(session.token, JWT_SECRET);
        request.user = session.user;
      } catch (error) {
        sessions.delete(sessionId);
        reply.status(401).send({
          error: true,
          message: 'Invalid session',
          statusCode: 401
        });
        return;
      }
    } catch (error) {
      reply.status(401).send({
        error: true,
        message: 'Authentication failed',
        statusCode: 401
      });
    }
  });

  // Helper function to create user session
  function createUserSession(user) {
    const token = jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }, JWT_SECRET, { expiresIn: '24h' });
    
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    sessions.set(sessionId, {
      user: user,
      token: token,
      createdAt: new Date()
    });
    
    return { user, token, sessionId };
  }

  // Google OAuth initiation
  fastify.get('/google', async (request, reply) => {
    const state = crypto.randomBytes(32).toString('hex');
    oauthStates.set(state, { createdAt: Date.now() });
    
    // Clean up old states (older than 10 minutes)
    for (const [key, value] of oauthStates.entries()) {
      if (Date.now() - value.createdAt > 10 * 60 * 1000) {
        oauthStates.delete(key);
      }
    }
    
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.set('redirect_uri', process.env.GOOGLE_REDIRECT_URI);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'profile email');
    googleAuthUrl.searchParams.set('state', state);
    
    reply.redirect(googleAuthUrl.toString());
  });

  // Google OAuth callback route
  fastify.get('/google/callback', async (request, reply) => {
    try {
      const { code, state } = request.query;
      
      // Verify state parameter
      if (!state || !oauthStates.has(state)) {
        throw new Error('Invalid state parameter');
      }
      oauthStates.delete(state);
      
      if (!code) {
        throw new Error('Authorization code not received');
      }
      
      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: process.env.GOOGLE_REDIRECT_URI
        })
      });
      
      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${error}`);
      }
      
      const tokens = await tokenResponse.json();
      
      // Get user info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`
        }
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user info from Google');
      }
      
      const googleUser = await userResponse.json();
      
      // Check if user is admin
      const adminEmails = (process.env.ADMIN_EMAILS || 'admin@example.com').split(',');
      const isAdmin = adminEmails.includes(googleUser.email);
      
      // Create user object
      const user = {
        id: `google-${googleUser.id}`,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        role: isAdmin ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isActive: true,
        provider: 'google'
      };
      
      const sessionData = createUserSession(user);
      
      // Redirect to dashboard with session info
      const redirectUrl = `/dashboard.html?sessionId=${sessionData.sessionId}&token=${sessionData.token}&loginSuccess=true`;
      reply.redirect(redirectUrl);
      
    } catch (error) {
      fastify.log.error('Google OAuth callback error:', error);
      reply.redirect('/dashboard.html?error=oauth_failed&message=' + encodeURIComponent(error.message));
    }
  });

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
      const sessionData = createUserSession(testUser);
      reply.send({
        success: true,
        ...sessionData
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
      const decoded = jwt.verify(session.token, JWT_SECRET);
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
      const decoded = jwt.verify(session.token, JWT_SECRET);
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

  // Register token management routes
  await fastify.register(require('./tokens'), { prefix: '' });

  fastify.log.info('🔐 Authentication routes registered');
  fastify.log.info('🔑 Token management routes registered');
}

module.exports = authRoutes;
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Simple JSON-based storage for users and API tokens
 * In production, this should be replaced with a proper database
 */
class JsonStorage {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.tokensFile = path.join(this.dataDir, 'api-tokens.json');
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      // Ensure data directory exists
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Initialize users file if it doesn't exist
      try {
        await fs.access(this.usersFile);
      } catch {
        await fs.writeFile(this.usersFile, JSON.stringify([], null, 2));
      }
      
      // Initialize tokens file if it doesn't exist
      try {
        await fs.access(this.tokensFile);
      } catch {
        await fs.writeFile(this.tokensFile, JSON.stringify([], null, 2));
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  async readFile(filePath) {
    await this.init();
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Failed to read ${filePath}:`, error);
      return [];
    }
  }

  async writeFile(filePath, data) {
    await this.init();
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Failed to write ${filePath}:`, error);
      throw error;
    }
  }

  // User management
  async getUsers() {
    return await this.readFile(this.usersFile);
  }

  async getUserByEmail(email) {
    const users = await this.getUsers();
    return users.find(user => user.email === email);
  }

  async getUserById(id) {
    const users = await this.getUsers();
    return users.find(user => user.id === id);
  }

  async createUser(userData) {
    const users = await this.getUsers();
    const newUser = {
      id: uuidv4(),
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
      role: userData.role || 'user',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isActive: true
    };
    
    users.push(newUser);
    await this.writeFile(this.usersFile, users);
    return newUser;
  }

  async updateUser(id, updates) {
    const users = await this.getUsers();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    users[userIndex] = { ...users[userIndex], ...updates, updatedAt: new Date().toISOString() };
    await this.writeFile(this.usersFile, users);
    return users[userIndex];
  }

  // API Token management
  async getTokens() {
    return await this.readFile(this.tokensFile);
  }

  async getTokensByUserId(userId) {
    const tokens = await this.getTokens();
    return tokens.filter(token => token.userId === userId && token.isActive);
  }

  async getTokenByKey(tokenKey) {
    const tokens = await this.getTokens();
    return tokens.find(token => token.key === tokenKey && token.isActive);
  }

  async createToken(userId, tokenData) {
    const tokens = await this.getTokens();
    const hashedKey = await bcrypt.hash(tokenData.key, 10);
    
    const newToken = {
      id: uuidv4(),
      userId: userId,
      name: tokenData.name,
      key: tokenData.key, // Store unhashed for display (in production, store hash only)
      hashedKey: hashedKey,
      permissions: tokenData.permissions || ['read'],
      rateLimit: tokenData.rateLimit || 100,
      rateLimitWindow: tokenData.rateLimitWindow || '1 hour',
      allowedOrigins: tokenData.allowedOrigins || [],
      isActive: true,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      usageCount: 0
    };
    
    tokens.push(newToken);
    await this.writeFile(this.tokensFile, tokens);
    return newToken;
  }

  async updateToken(id, updates) {
    const tokens = await this.getTokens();
    const tokenIndex = tokens.findIndex(token => token.id === id);
    
    if (tokenIndex === -1) {
      throw new Error('Token not found');
    }
    
    tokens[tokenIndex] = { ...tokens[tokenIndex], ...updates, updatedAt: new Date().toISOString() };
    await this.writeFile(this.tokensFile, tokens);
    return tokens[tokenIndex];
  }

  async deleteToken(id) {
    const tokens = await this.getTokens();
    const tokenIndex = tokens.findIndex(token => token.id === id);
    
    if (tokenIndex === -1) {
      throw new Error('Token not found');
    }
    
    tokens[tokenIndex].isActive = false;
    tokens[tokenIndex].deletedAt = new Date().toISOString();
    await this.writeFile(this.tokensFile, tokens);
    return true;
  }

  async incrementTokenUsage(tokenKey) {
    const tokens = await this.getTokens();
    const tokenIndex = tokens.findIndex(token => token.key === tokenKey && token.isActive);
    
    if (tokenIndex !== -1) {
      tokens[tokenIndex].usageCount = (tokens[tokenIndex].usageCount || 0) + 1;
      tokens[tokenIndex].lastUsedAt = new Date().toISOString();
      await this.writeFile(this.tokensFile, tokens);
    }
  }

  // Statistics
  async getStats() {
    const users = await this.getUsers();
    const tokens = await this.getTokens();
    
    const activeUsers = users.filter(user => user.isActive);
    const activeTokens = tokens.filter(token => token.isActive);
    const totalRequests = tokens.reduce((sum, token) => sum + (token.usageCount || 0), 0);
    
    return {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      totalTokens: tokens.length,
      activeTokens: activeTokens.length,
      totalRequests: totalRequests,
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = new JsonStorage();
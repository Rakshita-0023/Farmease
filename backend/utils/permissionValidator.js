const db = require('../db');

/**
 * Permission Validator Utility
 * Validates role-based permissions for Charcha operations
 */

const PermissionValidator = {
  /**
   * Check if user is the owner of a Charcha
   * @param {number} userId
   * @param {number} charchaId
   * @returns {Promise<boolean>}
   */
  async isOwner(userId, charchaId) {
    const sql = 'SELECT owner_id FROM charchas WHERE id = ?';
    const [rows] = await db.query(sql, [charchaId]);
    
    if (rows.length === 0) {
      return false;
    }
    
    return rows[0].owner_id === userId;
  },

  /**
   * Check if user is a moderator of a Charcha
   * @param {number} userId
   * @param {number} charchaId
   * @returns {Promise<boolean>}
   */
  async isModerator(userId, charchaId) {
    const sql = `
      SELECT role FROM members 
      WHERE user_id = ? AND charcha_id = ?
    `;
    const [rows] = await db.query(sql, [userId, charchaId]);
    
    if (rows.length === 0) {
      return false;
    }
    
    return rows[0].role === 'MODERATOR';
  },

  /**
   * Check if user is a member of a Charcha (any role)
   * @param {number} userId
   * @param {number} charchaId
   * @returns {Promise<boolean>}
   */
  async isMember(userId, charchaId) {
    const sql = `
      SELECT id FROM members 
      WHERE user_id = ? AND charcha_id = ?
    `;
    const [rows] = await db.query(sql, [userId, charchaId]);
    
    return rows.length > 0;
  },

  /**
   * Get user's role in a Charcha
   * @param {number} userId
   * @param {number} charchaId
   * @returns {Promise<string|null>} 'OWNER', 'MODERATOR', 'MEMBER', or null
   */
  async getUserRole(userId, charchaId) {
    const sql = `
      SELECT role FROM members 
      WHERE user_id = ? AND charcha_id = ?
    `;
    const [rows] = await db.query(sql, [userId, charchaId]);
    
    return rows.length > 0 ? rows[0].role : null;
  },

  /**
   * Check if user can delete messages in a Charcha
   * Only owners and moderators can delete messages
   * @param {number} userId
   * @param {number} charchaId
   * @returns {Promise<boolean>}
   */
  async canDeleteMessages(userId, charchaId) {
    const sql = `
      SELECT role FROM members 
      WHERE user_id = ? AND charcha_id = ?
    `;
    const [rows] = await db.query(sql, [userId, charchaId]);
    
    if (rows.length === 0) {
      return false;
    }
    
    const role = rows[0].role;
    return role === 'OWNER' || role === 'MODERATOR';
  },

  /**
   * Check if user can approve join requests for a Charcha
   * Only owners can approve join requests
   * @param {number} userId
   * @param {number} charchaId
   * @returns {Promise<boolean>}
   */
  async canApproveRequests(userId, charchaId) {
    return await this.isOwner(userId, charchaId);
  },

  /**
   * Check if user can assign moderators in a Charcha
   * Only owners can assign moderators
   * @param {number} userId
   * @param {number} charchaId
   * @returns {Promise<boolean>}
   */
  async canAssignModerators(userId, charchaId) {
    return await this.isOwner(userId, charchaId);
  },

  /**
   * Check if user can post messages in a Charcha
   * All members (including owners and moderators) can post
   * @param {number} userId
   * @param {number} charchaId
   * @returns {Promise<boolean>}
   */
  async canPostMessages(userId, charchaId) {
    return await this.isMember(userId, charchaId);
  },

  /**
   * Check if user can view a Charcha
   * Public Charchas: anyone can view
   * Private Charchas: only members can view
   * @param {number} userId
   * @param {number} charchaId
   * @returns {Promise<boolean>}
   */
  async canViewCharcha(userId, charchaId) {
    // Check if Charcha is public
    const sql = 'SELECT visibility FROM charchas WHERE id = ?';
    const [rows] = await db.query(sql, [charchaId]);
    
    if (rows.length === 0) {
      return false;
    }
    
    const visibility = rows[0].visibility;
    
    // Public Charchas can be viewed by anyone
    if (visibility === 'public') {
      return true;
    }
    
    // Private Charchas require membership
    return await this.isMember(userId, charchaId);
  },

  /**
   * Validate permission and throw error if unauthorized
   * @param {boolean} hasPermission
   * @param {string} message - Error message
   * @throws {Error} If permission check fails
   */
  requirePermission(hasPermission, message = 'Unauthorized') {
    if (!hasPermission) {
      const error = new Error(message);
      error.statusCode = 403;
      throw error;
    }
  },

  /**
   * Check multiple permissions at once
   * @param {number} userId
   * @param {number} charchaId
   * @returns {Promise<Object>} Object with all permission flags
   */
  async getAllPermissions(userId, charchaId) {
    const role = await this.getUserRole(userId, charchaId);
    
    return {
      isOwner: role === 'OWNER',
      isModerator: role === 'MODERATOR',
      isMember: role !== null,
      canDeleteMessages: role === 'OWNER' || role === 'MODERATOR',
      canApproveRequests: role === 'OWNER',
      canAssignModerators: role === 'OWNER',
      canPostMessages: role !== null,
      role: role
    };
  }
};

module.exports = PermissionValidator;

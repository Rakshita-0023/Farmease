const db = require('../db');

/**
 * Membership Model - Database query helpers for membership and join request operations
 * Handles member management and join request workflows
 */

const MembershipModel = {
  // ============ MEMBERS TABLE OPERATIONS ============

  /**
   * Add a member to a Charcha
   * @param {number} charchaId
   * @param {number} userId
   * @param {string} role - 'OWNER', 'MODERATOR', or 'MEMBER'
   * @returns {Promise<Object>} Created member record
   */
  async addMember(charchaId, userId, role = 'MEMBER') {
    const sql = `
      INSERT INTO members (charcha_id, user_id, role)
      VALUES (?, ?, ?)
    `;
    
    const [result] = await db.execute(sql, [charchaId, userId, role]);
    return { 
      id: result.insertId, 
      charcha_id: charchaId, 
      user_id: userId, 
      role,
      joined_at: new Date().toISOString()
    };
  },

  /**
   * Check if user is a member of a Charcha
   * @param {number} userId
   * @param {number} charchaId
   * @returns {Promise<boolean>}
   */
  async isMember(userId, charchaId) {
    const sql = 'SELECT id FROM members WHERE user_id = ? AND charcha_id = ?';
    const [rows] = await db.query(sql, [userId, charchaId]);
    return rows.length > 0;
  },

  /**
   * Get user's role in a Charcha
   * @param {number} userId
   * @param {number} charchaId
   * @returns {Promise<string|null>} Role or null if not a member
   */
  async getMemberRole(userId, charchaId) {
    const sql = 'SELECT role FROM members WHERE user_id = ? AND charcha_id = ?';
    const [rows] = await db.query(sql, [userId, charchaId]);
    return rows.length > 0 ? rows[0].role : null;
  },

  /**
   * Get all members of a Charcha with user details
   * @param {number} charchaId
   * @returns {Promise<Array>} Array of members with user info
   */
  async getCharchaMembers(charchaId) {
    const sql = `
      SELECT 
        m.*,
        u.name as user_name,
        u.email as user_email
      FROM members m
      JOIN users u ON m.user_id = u.id
      WHERE m.charcha_id = ?
      ORDER BY 
        CASE m.role
          WHEN 'OWNER' THEN 1
          WHEN 'MODERATOR' THEN 2
          WHEN 'MEMBER' THEN 3
        END,
        m.joined_at ASC
    `;
    
    const [rows] = await db.query(sql, [charchaId]);
    return rows;
  },

  /**
   * Update member role
   * @param {number} charchaId
   * @param {number} userId
   * @param {string} newRole - 'MODERATOR' or 'MEMBER'
   * @returns {Promise<Object>} Update result
   */
  async updateMemberRole(charchaId, userId, newRole) {
    const sql = `
      UPDATE members 
      SET role = ? 
      WHERE charcha_id = ? AND user_id = ?
    `;
    
    const [result] = await db.execute(sql, [newRole, charchaId, userId]);
    return { affectedRows: result.affectedRows };
  },

  /**
   * Remove member from Charcha
   * @param {number} charchaId
   * @param {number} userId
   * @returns {Promise<Object>} Delete result
   */
  async removeMember(charchaId, userId) {
    const sql = 'DELETE FROM members WHERE charcha_id = ? AND user_id = ?';
    const [result] = await db.execute(sql, [charchaId, userId]);
    return { affectedRows: result.affectedRows };
  },

  // ============ JOIN REQUESTS TABLE OPERATIONS ============

  /**
   * Create a join request
   * @param {number} charchaId
   * @param {number} userId
   * @returns {Promise<Object>} Created join request
   */
  async createJoinRequest(charchaId, userId) {
    const sql = `
      INSERT INTO join_requests (charcha_id, user_id, status)
      VALUES (?, ?, 'PENDING')
    `;
    
    const [result] = await db.execute(sql, [charchaId, userId]);
    return {
      id: result.insertId,
      charcha_id: charchaId,
      user_id: userId,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
  },

  /**
   * Check if user has a pending join request
   * @param {number} userId
   * @param {number} charchaId
   * @returns {Promise<boolean>}
   */
  async hasPendingRequest(userId, charchaId) {
    const sql = `
      SELECT id FROM join_requests 
      WHERE user_id = ? AND charcha_id = ? AND status = 'PENDING'
    `;
    const [rows] = await db.query(sql, [userId, charchaId]);
    return rows.length > 0;
  },

  /**
   * Get join request by ID
   * @param {number} requestId
   * @returns {Promise<Object|null>} Join request or null
   */
  async getJoinRequestById(requestId) {
    const sql = `
      SELECT 
        jr.*,
        u.name as user_name,
        c.title as charcha_title,
        c.owner_id
      FROM join_requests jr
      JOIN users u ON jr.user_id = u.id
      JOIN charchas c ON jr.charcha_id = c.id
      WHERE jr.id = ?
    `;
    
    const [rows] = await db.query(sql, [requestId]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Get pending join requests for Charchas owned by user
   * @param {number} ownerId
   * @returns {Promise<Array>} Array of pending requests
   */
  async getPendingRequestsForOwner(ownerId) {
    const sql = `
      SELECT 
        jr.*,
        u.name as user_name,
        u.email as user_email,
        c.title as charcha_title
      FROM join_requests jr
      JOIN users u ON jr.user_id = u.id
      JOIN charchas c ON jr.charcha_id = c.id
      WHERE c.owner_id = ? AND jr.status = 'PENDING'
      ORDER BY jr.created_at DESC
    `;
    
    const [rows] = await db.query(sql, [ownerId]);
    return rows;
  },

  /**
   * Update join request status
   * @param {number} requestId
   * @param {string} status - 'APPROVED' or 'REJECTED'
   * @returns {Promise<Object>} Update result
   */
  async updateRequestStatus(requestId, status) {
    const sql = `
      UPDATE join_requests 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    const [result] = await db.execute(sql, [status, requestId]);
    return { affectedRows: result.affectedRows };
  },

  /**
   * Get user's join requests
   * @param {number} userId
   * @returns {Promise<Array>} Array of user's join requests
   */
  async getUserJoinRequests(userId) {
    const sql = `
      SELECT 
        jr.*,
        c.title as charcha_title,
        c.category,
        u.name as owner_name
      FROM join_requests jr
      JOIN charchas c ON jr.charcha_id = c.id
      JOIN users u ON c.owner_id = u.id
      WHERE jr.user_id = ?
      ORDER BY jr.created_at DESC
    `;
    
    const [rows] = await db.query(sql, [userId]);
    return rows;
  },

  /**
   * Alias for getCharchaMembers - Get all members of a Charcha
   * @param {number} charchaId
   * @returns {Promise<Array>} Array of members with user info
   */
  async getMembers(charchaId) {
    return this.getCharchaMembers(charchaId);
  }
};

module.exports = MembershipModel;

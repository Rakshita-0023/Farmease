const db = require('../db');

/**
 * Charcha Model - Database query helpers for Charcha operations
 * Handles CRUD operations for discussion groups
 */

const CharchaModel = {
  /**
   * Create a new Charcha
   * @param {Object} charchaData - { title, description, category, visibility, owner_id }
   * @returns {Promise<Object>} Created Charcha with id
   */
  async create(charchaData) {
    const { title, description, category, visibility, owner_id } = charchaData;
    
    const sql = `
      INSERT INTO charchas (title, description, category, visibility, owner_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(sql, [title, description, category, visibility, owner_id]);
    return { id: result.insertId, ...charchaData, created_at: new Date().toISOString() };
  },

  /**
   * Get Charcha by ID with owner information and member count
   * @param {number} charchaId
   * @returns {Promise<Object|null>} Charcha object or null
   */
  async getById(charchaId) {
    const sql = `
      SELECT 
        c.*,
        u.name as owner_name,
        (SELECT COUNT(*) FROM members WHERE charcha_id = c.id) as member_count
      FROM charchas c
      JOIN users u ON c.owner_id = u.id
      WHERE c.id = ?
    `;
    
    const [rows] = await db.query(sql, [charchaId]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Get all Charchas where user is owner, moderator, or member
   * @param {number} userId
   * @returns {Promise<Array>} Array of Charchas
   */
  async getUserCharchas(userId) {
    const sql = `
      SELECT DISTINCT
        c.*,
        u.name as owner_name,
        m.role as user_role,
        (SELECT COUNT(*) FROM members WHERE charcha_id = c.id) as member_count
      FROM charchas c
      JOIN users u ON c.owner_id = u.id
      JOIN members m ON c.id = m.charcha_id
      WHERE m.user_id = ?
      ORDER BY c.created_at DESC
    `;
    
    const [rows] = await db.query(sql, [userId]);
    return rows;
  },

  /**
   * Browse all Charchas (public and private) with optional filters
   * @param {Object} filters - { category?, search? }
   * @returns {Promise<Array>} Array of all Charchas
   */
  async browsePublic(filters = {}) {
    let sql = `
      SELECT 
        c.*,
        u.name as owner_name,
        (SELECT COUNT(*) FROM members WHERE charcha_id = c.id) as member_count
      FROM charchas c
      JOIN users u ON c.owner_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.category) {
      sql += ' AND c.category = ?';
      params.push(filters.category);
    }
    
    if (filters.search) {
      sql += ' AND (c.title LIKE ? OR c.description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    sql += ' ORDER BY c.created_at DESC';
    
    const [rows] = await db.query(sql, params);
    return rows;
  },

  /**
   * Update Charcha
   * @param {number} charchaId
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Update result
   */
  async update(charchaId, updates) {
    const allowedFields = ['title', 'description', 'category', 'visibility'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(charchaId);
    
    const sql = `UPDATE charchas SET ${setClause} WHERE id = ?`;
    const [result] = await db.execute(sql, values);
    
    return { affectedRows: result.affectedRows };
  },

  /**
   * Delete Charcha (cascades to related tables)
   * @param {number} charchaId
   * @returns {Promise<Object>} Delete result
   */
  async delete(charchaId) {
    const sql = 'DELETE FROM charchas WHERE id = ?';
    const [result] = await db.execute(sql, [charchaId]);
    return { affectedRows: result.affectedRows };
  },

  /**
   * Check if user is owner of Charcha
   * @param {number} userId
   * @param {number} charchaId
   * @returns {Promise<boolean>}
   */
  async isOwner(userId, charchaId) {
    const sql = 'SELECT owner_id FROM charchas WHERE id = ?';
    const [rows] = await db.query(sql, [charchaId]);
    return rows.length > 0 && rows[0].owner_id === userId;
  },

  /**
   * Get Charcha visibility
   * @param {number} charchaId
   * @returns {Promise<string|null>} 'public' or 'private' or null
   */
  async getVisibility(charchaId) {
    const sql = 'SELECT visibility FROM charchas WHERE id = ?';
    const [rows] = await db.query(sql, [charchaId]);
    return rows.length > 0 ? rows[0].visibility : null;
  }
};

module.exports = CharchaModel;

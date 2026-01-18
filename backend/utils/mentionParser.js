const db = require('../db-sqlite');

/**
 * Mention Parser Utility
 * Extracts and validates @mentions from message content
 */

const MentionParser = {
  /**
   * Parse @mentions from text content
   * Extracts all @username patterns and returns unique usernames
   * @param {string} content - Message content
   * @returns {Array<string>} Array of unique usernames (without @ symbol)
   */
  parseMentions(content) {
    if (!content || typeof content !== 'string') {
      return [];
    }

    // Regex to match @username pattern (alphanumeric and underscore)
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]); // Extract username without @ symbol
    }

    // Return unique usernames
    return [...new Set(mentions)];
  },

  /**
   * Validate that mentioned users are members of the Charcha
   * @param {Array<string>} usernames - Array of usernames to validate
   * @param {number} charchaId - Charcha ID
   * @returns {Promise<Array<number>>} Array of valid user IDs who are members
   */
  async validateMentions(usernames, charchaId) {
    if (!usernames || usernames.length === 0) {
      return [];
    }

    // Create placeholders for SQL IN clause
    const placeholders = usernames.map(() => '?').join(',');
    
    const sql = `
      SELECT DISTINCT u.id
      FROM users u
      JOIN members m ON u.id = m.user_id
      WHERE u.name IN (${placeholders})
        AND m.charcha_id = ?
    `;

    const params = [...usernames, charchaId];
    const [rows] = await db.query(sql, params);
    
    return rows.map(row => row.id);
  },

  /**
   * Get user IDs from usernames (without Charcha membership check)
   * @param {Array<string>} usernames - Array of usernames
   * @returns {Promise<Array<number>>} Array of user IDs
   */
  async getUserIdsByNames(usernames) {
    if (!usernames || usernames.length === 0) {
      return [];
    }

    const placeholders = usernames.map(() => '?').join(',');
    const sql = `SELECT id FROM users WHERE name IN (${placeholders})`;
    
    const [rows] = await db.query(sql, usernames);
    return rows.map(row => row.id);
  },

  /**
   * Parse and validate mentions in one operation
   * @param {string} content - Message content
   * @param {number} charchaId - Charcha ID
   * @param {number} senderId - ID of the user sending the message (to exclude from mentions)
   * @returns {Promise<Object>} { usernames: Array<string>, validUserIds: Array<number> }
   */
  async parseAndValidate(content, charchaId, senderId) {
    const usernames = this.parseMentions(content);
    
    if (usernames.length === 0) {
      return { usernames: [], validUserIds: [] };
    }

    const validUserIds = await this.validateMentions(usernames, charchaId);
    
    // Filter out the sender from mentions (users shouldn't notify themselves)
    const filteredUserIds = validUserIds.filter(id => id !== senderId);
    
    return {
      usernames,
      validUserIds: filteredUserIds
    };
  },

  /**
   * Create mention records in the database
   * @param {number} messageId - Message ID
   * @param {Array<number>} userIds - Array of user IDs to mention
   * @returns {Promise<Array<Object>>} Array of created mention records
   */
  async createMentions(messageId, userIds) {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    const mentions = [];
    
    for (const userId of userIds) {
      const sql = `
        INSERT INTO mentions (message_id, mentioned_user_id)
        VALUES (?, ?)
      `;
      
      const [result] = await db.execute(sql, [messageId, userId]);
      mentions.push({
        id: result.insertId,
        message_id: messageId,
        mentioned_user_id: userId,
        created_at: new Date().toISOString()
      });
    }

    return mentions;
  },

  /**
   * Get mentions for a message
   * @param {number} messageId - Message ID
   * @returns {Promise<Array<Object>>} Array of mentions with user details
   */
  async getMentionsForMessage(messageId) {
    const sql = `
      SELECT 
        m.*,
        u.name as username,
        u.email as user_email
      FROM mentions m
      JOIN users u ON m.mentioned_user_id = u.id
      WHERE m.message_id = ?
    `;
    
    const [rows] = await db.query(sql, [messageId]);
    return rows;
  }
};

module.exports = MentionParser;

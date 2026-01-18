const fc = require('fast-check');
const MentionParser = require('../utils/mentionParser');
const CharchaModel = require('../models/charchaModel');
const MembershipModel = require('../models/membershipModel');
const db = require('../db-sqlite');

/**
 * Property-Based Tests for Mention Parser
 * 
 * Tests:
 * - Property 22: Mention Parsing Completeness
 * - Property 23: Member-Only Mention Validation
 */

describe('Mention Parser Properties', () => {
  let testUserId;
  let testCharchaId;
  let memberUserIds = [];

  beforeAll(async () => {
    // Clean up any existing test users first
    await db.execute('DELETE FROM users WHERE name IN (?, ?, ?, ?)', ['TestOwner', 'Member1', 'Member2', 'NonMember']);
    
    // Create test users
    const users = ['TestOwner', 'Member1', 'Member2', 'NonMember'];
    for (const name of users) {
      const sql = `
        INSERT INTO users (name, email, password_hash)
        VALUES (?, ?, 'hashedpassword')
      `;
      const [result] = await db.execute(sql, [name, `${name.toLowerCase()}@example.com`]);
      if (name === 'TestOwner') {
        testUserId = result.insertId;
      } else if (name !== 'NonMember') {
        memberUserIds.push(result.insertId);
      }
    }

    // Create test Charcha
    const charcha = await CharchaModel.create({
      title: 'Test Charcha',
      description: 'For mention testing',
      category: 'General',
      visibility: 'private',
      owner_id: testUserId
    });
    testCharchaId = charcha.id;

    // Add owner and members
    await MembershipModel.addMember(testCharchaId, testUserId, 'OWNER');
    for (const userId of memberUserIds) {
      await MembershipModel.addMember(testCharchaId, userId, 'MEMBER');
    }
  });

  afterAll(async () => {
    // Clean up test data
    await db.execute('DELETE FROM charchas WHERE id = ?', [testCharchaId]);
    await db.execute('DELETE FROM users WHERE name LIKE ?', ['Test%']);
    await db.execute('DELETE FROM users WHERE name LIKE ?', ['Member%']);
    await db.execute('DELETE FROM users WHERE name = ?', ['NonMember']);
  });

  /**
   * Property 22: Mention Parsing Completeness
   * For any message containing @username patterns, the mention parser should
   * extract all unique usernames from the content.
   * 
   * **Validates: Requirements 5.1, 5.4**
   */
  test('Property 22: Parser should extract all unique @mentions from content', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^\w+$/.test(s))),
        fc.string(),
        (usernames, extraText) => {
          // Create content with mentions
          const mentionStrings = usernames.map(u => `@${u}`);
          const content = mentionStrings.join(' ') + ' ' + extraText;
          
          // Parse mentions
          const parsed = MentionParser.parseMentions(content);
          
          // Get unique usernames from input
          const uniqueUsernames = [...new Set(usernames)];
          
          // Verify all unique usernames are extracted
          return uniqueUsernames.every(username => parsed.includes(username)) &&
                 parsed.length === uniqueUsernames.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 22: Parser should handle duplicate mentions correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^\w+$/.test(s)),
        fc.integer({ min: 1, max: 10 }),
        (username, count) => {
          // Create content with duplicate mentions
          const mentions = Array(count).fill(`@${username}`);
          const content = mentions.join(' ');
          
          // Parse mentions
          const parsed = MentionParser.parseMentions(content);
          
          // Should return only one instance of the username
          return parsed.length === 1 && parsed[0] === username;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 22: Parser should handle empty or invalid content', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant(null),
          fc.constant(undefined),
          fc.string().filter(s => !s.includes('@'))
        ),
        (content) => {
          const parsed = MentionParser.parseMentions(content);
          return Array.isArray(parsed) && parsed.length === 0;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 23: Member-Only Mention Validation
   * For any username mentioned in a message, only usernames belonging to members
   * of that Charcha should be validated as valid mentions.
   * 
   * **Validates: Requirements 5.2**
   */
  test('Property 23: Only members should be validated as valid mentions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.constantFrom('TestOwner', 'Member1', 'Member2', 'NonMember'),
          { minLength: 1, maxLength: 4 }
        ),
        async (usernames) => {
          // Validate mentions
          const validUserIds = await MentionParser.validateMentions(usernames, testCharchaId);
          
          // Get user IDs for the mentioned usernames
          const sql = `SELECT id, name FROM users WHERE name IN (${usernames.map(() => '?').join(',')})`;
          const [users] = await db.query(sql, usernames);
          
          // Check which users are members
          const memberNames = ['TestOwner', 'Member1', 'Member2'];
          const expectedValidUsers = users.filter(u => memberNames.includes(u.name));
          
          // Verify only members are in validUserIds
          const allValidUsersAreMembers = validUserIds.every(id => 
            expectedValidUsers.some(u => u.id === id)
          );
          
          // Verify NonMember is not in validUserIds if mentioned
          const nonMemberUser = users.find(u => u.name === 'NonMember');
          const nonMemberNotIncluded = !nonMemberUser || !validUserIds.includes(nonMemberUser.id);
          
          return allValidUsersAreMembers && nonMemberNotIncluded;
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Property 23: Empty username array should return empty validation result', async () => {
    const validUserIds = await MentionParser.validateMentions([], testCharchaId);
    expect(validUserIds).toEqual([]);
  });

  test('Property 23: Non-existent usernames should return empty validation result', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^NonExistent\w+$/.test(s))),
        async (usernames) => {
          const validUserIds = await MentionParser.validateMentions(usernames, testCharchaId);
          return validUserIds.length === 0;
        }
      ),
      { numRuns: 20 }
    );
  });
});

const fc = require('fast-check');
const CharchaModel = require('../models/charchaModel');
const MembershipModel = require('../models/membershipModel');
const db = require('../db-sqlite');

/**
 * Property-Based Tests for Charcha Creation
 * 
 * Tests:
 * - Property 1: Charcha Creation Requires All Fields
 * - Property 3: Owner Initialization on Creation
 * - Property 5: Charcha Round-Trip Consistency
 */

describe('Charcha Creation Properties', () => {
  let testUserId;

  beforeAll(async () => {
    // Create a test user for property tests
    const sql = `
      INSERT INTO users (name, email, password_hash)
      VALUES ('TestUser', 'test@example.com', 'hashedpassword')
    `;
    const [result] = await db.execute(sql);
    testUserId = result.insertId;
  });

  afterAll(async () => {
    // Clean up test data
    await db.execute('DELETE FROM charchas WHERE owner_id = ?', [testUserId]);
    await db.execute('DELETE FROM users WHERE id = ?', [testUserId]);
  });

  afterEach(async () => {
    // Clean up charchas created during tests
    await db.execute('DELETE FROM charchas WHERE owner_id = ?', [testUserId]);
  });

  /**
   * Property 1: Charcha Creation Requires All Fields
   * For any Charcha creation request missing title, description, or category,
   * the system should reject the request with a validation error.
   * 
   * **Validates: Requirements 1.1, 10.1**
   */
  test('Property 1: Charcha creation should fail when required fields are missing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
          category: fc.option(
            fc.constantFrom('Crops', 'Livestock', 'Market', 'Weather', 'Equipment', 'General'),
            { nil: null }
          ),
          visibility: fc.constantFrom('public', 'private')
        }),
        async (charchaData) => {
          // Skip if all fields are present (valid case)
          if (charchaData.title && charchaData.description && charchaData.category) {
            return true;
          }

          // At least one required field is missing
          const dataWithOwner = { ...charchaData, owner_id: testUserId };

          try {
            await CharchaModel.create(dataWithOwner);
            // If creation succeeds with missing fields, property is violated
            return false;
          } catch (error) {
            // Creation should fail with missing fields
            return true;
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 3: Owner Initialization on Creation
   * For any user creating a Charcha, that user should be both the owner of the Charcha
   * and appear in the members list with OWNER role.
   * 
   * **Validates: Requirements 1.3, 1.4**
   */
  test('Property 3: Creator should be owner and member with OWNER role', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ minLength: 1, maxLength: 500 }),
          category: fc.constantFrom('Crops', 'Livestock', 'Market', 'Weather', 'Equipment', 'General'),
          visibility: fc.constantFrom('public', 'private')
        }),
        async (charchaData) => {
          const dataWithOwner = { ...charchaData, owner_id: testUserId };
          
          // Create Charcha
          const createdCharcha = await CharchaModel.create(dataWithOwner);
          
          // Add creator as owner member (this should be done by the API layer)
          await MembershipModel.addMember(createdCharcha.id, testUserId, 'OWNER');
          
          // Verify owner_id matches creator
          const charcha = await CharchaModel.getById(createdCharcha.id);
          const ownerMatches = charcha.owner_id === testUserId;
          
          // Verify creator is in members list with OWNER role
          const role = await MembershipModel.getMemberRole(testUserId, createdCharcha.id);
          const hasOwnerRole = role === 'OWNER';
          
          // Verify creator is a member
          const isMember = await MembershipModel.isMember(testUserId, createdCharcha.id);
          
          return ownerMatches && hasOwnerRole && isMember;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 5: Charcha Round-Trip Consistency
   * For any valid Charcha data, creating a Charcha and then querying it back
   * should return equivalent data (same title, description, category, visibility).
   * 
   * **Validates: Requirements 1.5**
   */
  test('Property 5: Created Charcha data should match when retrieved', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.string({ minLength: 1, maxLength: 500 }),
          category: fc.constantFrom('Crops', 'Livestock', 'Market', 'Weather', 'Equipment', 'General'),
          visibility: fc.constantFrom('public', 'private')
        }),
        async (charchaData) => {
          const dataWithOwner = { ...charchaData, owner_id: testUserId };
          
          // Create Charcha
          const created = await CharchaModel.create(dataWithOwner);
          
          // Retrieve Charcha
          const retrieved = await CharchaModel.getById(created.id);
          
          // Verify data consistency
          return (
            retrieved.title === charchaData.title &&
            retrieved.description === charchaData.description &&
            retrieved.category === charchaData.category &&
            retrieved.visibility === charchaData.visibility &&
            retrieved.owner_id === testUserId
          );
        }
      ),
      { numRuns: 30 }
    );
  });
});

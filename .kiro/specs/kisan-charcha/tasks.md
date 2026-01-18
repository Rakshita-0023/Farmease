# Implementation Plan: Kisan Charcha Community Discussion System

## Overview

This implementation plan breaks down the Kisan Charcha feature into incremental coding tasks. The approach follows a bottom-up strategy: database schema → backend API → frontend components → integration. Each task builds on previous work, with testing integrated throughout to validate functionality early.

## Tasks

- [x] 1. Set up database schema and migrations
  - Create migration file for all Kisan Charcha tables (charchas, members, join_requests, messages, mentions, notifications)
  - Add indexes for performance optimization
  - Set up foreign key constraints with CASCADE delete
  - Run migration and verify schema in farmease.db
  - _Requirements: 10.2, 10.3, 10.4_

- [x] 2. Implement core backend models and utilities
  - [x] 2.1 Create database query helpers for Charcha operations
    - Write functions for CRUD operations on charchas table
    - Include joins for owner information and member counts
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 2.2 Create database query helpers for membership operations
    - Write functions for members table operations
    - Write functions for join_requests table operations
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 2.7_

  - [x] 2.3 Create mention parser utility
    - Implement regex-based @mention extraction
    - Implement member validation logic
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 2.4 Create permission validator utility
    - Implement role checking functions (isOwner, isModerator, isMember)
    - Implement permission checking functions (canDeleteMessages, canApproveRequests)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 2.5 Write property test for Charcha creation
    - **Property 1: Charcha Creation Requires All Fields**
    - **Property 3: Owner Initialization on Creation**
    - **Property 5: Charcha Round-Trip Consistency**
    - **Validates: Requirements 1.1, 1.3, 1.4, 1.5**

  - [x] 2.6 Write property test for mention parser
    - **Property 22: Mention Parsing Completeness**
    - **Property 23: Member-Only Mention Validation**
    - **Validates: Requirements 5.1, 5.2**

- [ ] 3. Implement Charcha management API endpoints
  - [x] 3.1 Create POST /api/charchas endpoint
    - Validate input (title, description, category, visibility)
    - Create Charcha record
    - Add creator as owner and member
    - Return created Charcha with 201 status
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 12.1, 12.2, 12.5, 14.2, 14.3_

  - [x] 3.2 Create GET /api/charchas/:id endpoint
    - Validate user has access (member or public)
    - Return Charcha with owner info and member count
    - Return 404 if not found, 403 if private and not member
    - _Requirements: 1.6, 8.5, 11.4_

  - [x] 3.3 Create GET /api/charchas/my endpoint
    - Query all Charchas where user is owner/moderator/member
    - Return array of Charchas with metadata
    - _Requirements: 9.1_

  - [x] 3.4 Create GET /api/charchas/browse endpoint
    - Support category filter query parameter
    - Support search query parameter
    - Return only public Charchas
    - _Requirements: 9.4, 12.3_

  - [x] 3.5 Create DELETE /api/charchas/:id endpoint
    - Verify user is owner
    - Delete Charcha (cascade to related tables)
    - Return 204 on success, 403 if not owner
    - _Requirements: 8.2, 10.3_

  - [x] 3.6 Write property tests for Charcha API
    - **Property 2: Charcha Visibility Persistence**
    - **Property 4: Charcha Response Completeness**
    - **Property 48: Category Validation**
    - **Property 50: Category Filtering**
    - **Validates: Requirements 1.2, 1.6, 12.1, 12.3**

  - [x] 3.7 Write unit tests for Charcha endpoints
    - Test 404 for non-existent Charcha
    - Test 403 for private Charcha access by non-member
    - Test validation errors for missing fields
    - _Requirements: 11.2, 11.3, 11.4_

- [x] 4. Checkpoint - Ensure Charcha creation and retrieval work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement membership and join request API endpoints
  - [x] 5.1 Create POST /api/charchas/:id/join endpoint
    - Check if user is already a member
    - For public Charchas: add member directly
    - For private Charchas: create pending join request and notify owner
    - Prevent duplicate requests
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.7_

  - [x] 5.2 Create GET /api/join-requests/pending endpoint
    - Query pending requests for Charchas owned by user
    - Return array with requester details
    - _Requirements: 9.2_

  - [x] 5.3 Create POST /api/join-requests/:id/approve endpoint
    - Verify user is Charcha owner
    - Update request status to APPROVED
    - Add user to members table
    - Create JOIN_APPROVED notification
    - Return 403 if not owner
    - _Requirements: 2.4, 6.3, 8.2_

  - [x] 5.4 Create POST /api/join-requests/:id/reject endpoint
    - Verify user is Charcha owner
    - Update request status to REJECTED
    - Create JOIN_REJECTED notification
    - Return 403 if not owner
    - _Requirements: 2.5, 6.4, 8.2_

  - [x] 5.5 Create POST /api/charchas/:id/moderators endpoint
    - Verify user is Charcha owner
    - Update member role to MODERATOR
    - Return 403 if not owner, 404 if member not found
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 5.6 Create DELETE /api/charchas/:id/moderators/:userId endpoint
    - Verify user is Charcha owner
    - Update member role back to MEMBER
    - Return 403 if not owner
    - _Requirements: 3.5_

  - [x] 5.7 Write property tests for membership flow
    - **Property 6: Private Charcha Join Creates Pending Request**
    - **Property 7: Public Charcha Join Immediate Membership**
    - **Property 9: Join Request Approval Flow**
    - **Property 10: Join Request Rejection Flow**
    - **Property 11: Duplicate Join Request Prevention**
    - **Property 12: Member Join Request Prevention**
    - **Validates: Requirements 2.1, 2.2, 2.4, 2.5, 2.6, 2.7**

  - [x] 5.8 Write property tests for moderator management
    - **Property 13: Moderator Role Assignment**
    - **Property 16: Multiple Moderators Support**
    - **Property 17: Moderator Role Removal**
    - **Validates: Requirements 3.1, 3.4, 3.5**

- [x] 6. Checkpoint - Ensure membership workflows function correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement notification system
  - [x] 7.1 Create notification database helpers
    - Write functions for creating notifications
    - Write functions for querying user notifications
    - Write functions for marking as read
    - Write function for unread count
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 7.2 Create GET /api/notifications endpoint
    - Query notifications for authenticated user
    - Support unreadOnly filter
    - Return array of notifications with related data
    - _Requirements: 6.6_

  - [x] 7.3 Create PATCH /api/notifications/:id/read endpoint
    - Verify notification belongs to user
    - Update is_read to true
    - Return updated notification
    - _Requirements: 6.6_

  - [x] 7.4 Create GET /api/notifications/unread-count endpoint
    - Count unread notifications for user
    - Return count as integer
    - _Requirements: 9.3_

  - [x] 7.5 Write property tests for notifications
    - **Property 27: Notification Default Unread Status**
    - **Property 28: Notification Mark as Read**
    - **Property 29: Notification Round-Trip Consistency**
    - **Property 37: Unread Notification Count Accuracy**
    - **Validates: Requirements 6.5, 6.6, 6.7, 9.3**

- [ ] 8. Implement message posting and retrieval API endpoints
  - [x] 8.1 Create POST /api/charchas/:id/messages endpoint
    - Verify user is member of Charcha
    - Validate message content length (max 2000 chars)
    - Sanitize HTML/script tags for XSS prevention
    - Parse @mentions from content
    - Validate mentioned users are members
    - Create message record
    - Create mention records for valid mentions
    - Create MENTION notifications for mentioned users
    - Return created message with 201 status
    - _Requirements: 4.1, 4.2, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 14.1, 14.4_

  - [x] 8.2 Create GET /api/charchas/:id/messages endpoint
    - Verify user has access to Charcha
    - Query messages with pagination (limit, offset)
    - Order by timestamp ascending
    - Include author name and timestamp
    - Return array of messages
    - _Requirements: 4.4, 8.5_

  - [x] 8.3 Create DELETE /api/messages/:id endpoint
    - Verify user is owner or moderator of the Charcha
    - Delete message and associated mentions
    - Return 204 on success, 403 if unauthorized
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.2, 8.3_

  - [x] 8.4 Write property tests for message operations
    - **Property 18: Message Persistence with Metadata**
    - **Property 19: Member-Only Message Posting**
    - **Property 20: Message Chronological Ordering**
    - **Property 21: Message Round-Trip Consistency**
    - **Property 25: Mention Association Persistence**
    - **Property 30: Authorized Message Deletion**
    - **Property 31: Unauthorized Deletion Prevention**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 5.5, 7.1, 7.2, 7.3, 7.4**

  - [x] 8.5 Write property tests for mention notifications
    - **Property 24: Non-Member Mention Rejection**
    - **Property 26: Mention Notification Creation**
    - **Validates: Requirements 5.3, 6.1**

  - [x] 8.6 Write unit tests for message edge cases
    - Test empty message rejection
    - Test message over 2000 characters rejection
    - Test XSS sanitization (script tags removed)
    - Test mention of non-existent user
    - _Requirements: 14.1, 14.4, 14.6_

- [x] 9. Checkpoint - Ensure messaging system works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement WebSocket real-time updates
  - [x] 10.1 Set up WebSocket server
    - Initialize ws library
    - Create connection handler
    - Implement client registration by userId
    - Implement disconnection cleanup
    - _Requirements: 13.3_

  - [x] 10.2 Integrate WebSocket broadcasting in message posting
    - After message creation, broadcast to all Charcha members
    - Send message data with author info
    - _Requirements: 13.1_

  - [x] 10.3 Integrate WebSocket notifications
    - After notification creation, send to user's connection
    - Update unread count in real-time
    - _Requirements: 13.2_

  - [x] 10.4 Write integration tests for WebSocket
    - Test message broadcast to multiple connected clients
    - Test notification delivery to specific user
    - Test reconnection handling
    - _Requirements: 13.1, 13.2_

- [ ] 11. Implement input validation middleware
  - [x] 11.1 Create validation middleware for Charcha creation
    - Validate required fields (title, description, category)
    - Validate title length (max 100 chars)
    - Validate description length (max 500 chars)
    - Validate category is in allowed list
    - Validate visibility is 'public' or 'private'
    - Return 400 with error details on validation failure
    - _Requirements: 1.1, 12.1, 12.2, 12.5, 14.2, 14.3_

  - [x] 11.2 Create validation middleware for message posting
    - Validate content is not empty
    - Validate content length (max 2000 chars)
    - Return 400 with error details on validation failure
    - _Requirements: 14.4, 14.5_

  - [x] 11.3 Write property tests for input validation
    - **Property 39: Required Field Validation**
    - **Property 52: Input Length Validation**
    - **Validates: Requirements 10.1, 14.2, 14.3, 14.4, 14.5**

- [ ] 12. Implement frontend Dashboard component
  - [x] 12.1 Create Dashboard component structure
    - Set up state for myCharchas, pendingRequests, unreadCount
    - Fetch user's Charchas on mount (GET /api/charchas/my)
    - Fetch pending requests if user owns Charchas (GET /api/join-requests/pending)
    - Fetch unread notification count (GET /api/notifications/unread-count)
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 12.2 Create Charcha card component
    - Display title, category, member count, visibility
    - Show "Owner" badge if user is owner
    - Link to Charcha view
    - _Requirements: 9.5_

  - [x] 12.3 Create pending requests section
    - Display count badge
    - Show list of pending requests with requester names
    - Add approve/reject buttons
    - Handle approve/reject actions
    - _Requirements: 9.2_

  - [x] 12.4 Add navigation to notifications center
    - Display unread count badge
    - Link to notifications page
    - _Requirements: 9.3_

- [ ] 13. Implement frontend CharchaBrowser component
  - [x] 13.1 Create CharchaBrowser component structure
    - Set up state for charchas, category filter, search query
    - Fetch public Charchas on mount (GET /api/charchas/browse)
    - _Requirements: 9.4_

  - [x] 13.2 Add category filter dropdown
    - Show all categories (Crops, Livestock, Market, Weather, Equipment, General)
    - Update query on selection
    - Refetch Charchas with filter
    - _Requirements: 12.3_

  - [x] 13.3 Add search input with debounce
    - Debounce search input (300ms)
    - Update query on change
    - Refetch Charchas with search term
    - _Requirements: 9.4_

  - [x] 13.4 Add join button functionality
    - Show "Join" button for non-members
    - Show "Request Sent" for pending requests
    - Show "Member" for existing members
    - Handle join action (POST /api/charchas/:id/join)
    - _Requirements: 2.1, 2.2_

- [ ] 14. Implement frontend CharchaView component
  - [x] 14.1 Create CharchaView component structure
    - Set up state for charcha, messages, members, userRole
    - Fetch Charcha details on mount (GET /api/charchas/:id)
    - Fetch messages (GET /api/charchas/:id/messages)
    - Fetch members list
    - Determine user's role in Charcha
    - _Requirements: 1.6, 4.4_

  - [x] 14.2 Create message list display
    - Render messages in chronological order
    - Show author name and timestamp for each message
    - Highlight @mentions in message content
    - Show delete button for owners/moderators
    - _Requirements: 4.4_

  - [x] 14.3 Create MessageInput component
    - Text input for message content
    - Character count display (max 2000)
    - Send button
    - Handle message submission (POST /api/charchas/:id/messages)
    - Clear input after successful send
    - _Requirements: 4.1, 14.4_

  - [x] 14.4 Add @mention autocomplete to MessageInput
    - Detect @ character in input
    - Show dropdown with member suggestions
    - Filter members by typed query
    - Insert @username on selection
    - _Requirements: 5.1, 5.4_

  - [x] 14.5 Add moderation controls
    - Show "Assign Moderator" button for owners
    - Show member list with role badges
    - Handle moderator assignment (POST /api/charchas/:id/moderators)
    - Handle moderator removal (DELETE /api/charchas/:id/moderators/:userId)
    - _Requirements: 3.1, 3.5_

  - [x] 14.6 Integrate WebSocket for real-time updates
    - Establish WebSocket connection on mount
    - Listen for new message events
    - Append new messages to list in real-time
    - Clean up connection on unmount
    - _Requirements: 13.1_

- [ ] 15. Implement frontend NotificationCenter component
  - [x] 15.1 Create NotificationCenter component structure
    - Set up state for notifications
    - Fetch notifications on mount (GET /api/notifications)
    - _Requirements: 6.6_

  - [x] 15.2 Display notifications grouped by type
    - Group by MENTION, JOIN_REQUEST, JOIN_APPROVED, JOIN_REJECTED
    - Show notification message and timestamp
    - Highlight unread notifications
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 15.3 Add mark as read functionality
    - Mark notification as read on click (PATCH /api/notifications/:id/read)
    - Update UI to show as read
    - Update unread count
    - _Requirements: 6.6_

  - [x] 15.4 Add links to related content
    - Link MENTION notifications to Charcha/message
    - Link JOIN_REQUEST notifications to pending requests
    - Link JOIN_APPROVED notifications to Charcha
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 15.5 Integrate WebSocket for real-time notifications
    - Listen for new notification events
    - Prepend new notifications to list
    - Update unread count in real-time
    - _Requirements: 13.2_

- [ ] 16. Implement frontend CreateCharcha component
  - [x] 16.1 Create form for Charcha creation
    - Input for title (max 100 chars)
    - Textarea for description (max 500 chars)
    - Dropdown for category selection
    - Radio buttons for visibility (public/private)
    - Submit button
    - _Requirements: 1.1, 1.2, 12.2_

  - [x] 16.2 Add client-side validation
    - Validate required fields
    - Validate length limits
    - Show validation errors
    - _Requirements: 14.2, 14.3_

  - [x] 16.3 Handle form submission
    - Submit to POST /api/charchas
    - Handle success (redirect to new Charcha)
    - Handle errors (display error message)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 17. Add routing and navigation
  - [x] 17.1 Set up React Router routes
    - /charchas - Dashboard
    - /charchas/browse - CharchaBrowser
    - /charchas/create - CreateCharcha
    - /charchas/:id - CharchaView
    - /notifications - NotificationCenter

  - [x] 17.2 Add navigation menu
    - Link to Dashboard
    - Link to Browse Charchas
    - Link to Create Charcha
    - Link to Notifications with unread badge

- [ ] 18. Final integration and testing
  - [x] 18.1 Test complete user flows
    - Create Charcha → Join → Post message → Receive notification
    - Request join → Owner approves → Become member
    - Post message with @mention → Mentioned user receives notification
    - Owner assigns moderator → Moderator deletes message

  - [x] 18.2 Write integration tests for API
    - **Property 8: Join Request Notification Creation**
    - **Property 32: Owner Permission Completeness**
    - **Property 33: Member Posting and Mentioning**
    - **Property 41: Cascade Deletion Completeness**
    - **Validates: Requirements 2.3, 8.2, 8.4, 10.3**

  - [x] 18.3 Write property tests for API response formats
    - **Property 42: Success Response Status Codes**
    - **Property 43: Validation Error Response**
    - **Property 44: Authorization Error Response**
    - **Property 45: Not Found Error Response**
    - **Property 46: Timestamp Format Consistency**
    - **Property 47: List Response Structure**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6**

- [x] 19. Final checkpoint - Ensure all features work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- WebSocket implementation provides real-time updates with polling fallback
- All API endpoints follow RESTful conventions
- Frontend components use React hooks for state management
- Authentication uses existing JWT system from the farming application

# Design Document: Kisan Charcha Community Discussion System

## Overview

Kisan Charcha is a community discussion platform integrated into a MERN stack farming application. The system enables farmers to create and participate in topic-based discussion groups with role-based permissions, membership approval workflows, @mention functionality, and real-time notifications.

The architecture follows a three-tier pattern: React frontend, Express REST API backend with WebSocket support, and SQLite database. The design emphasizes data integrity, role-based access control, and real-time user experience.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Dashboard   │  │   Charcha    │  │ Notifications│     │
│  │  Component   │  │   View       │  │   Center     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTP/WebSocket
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Express Backend API                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Charcha    │  │   Message    │  │ Notification │     │
│  │   Routes     │  │   Routes     │  │   Routes     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth         │  │  Mention     │  │  WebSocket   │     │
│  │ Middleware   │  │  Parser      │  │  Handler     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                         SQLite
                            │
┌─────────────────────────────────────────────────────────────┐
│                    SQLite Database                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   charchas   │  │   messages   │  │notifications │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   members    │  │join_requests │  │   mentions   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React with functional components and hooks
- **Backend**: Node.js with Express framework
- **Database**: SQLite (existing farmease.db)
- **Real-time**: WebSocket (ws library)
- **Authentication**: JWT tokens (existing auth system)

### Design Principles

1. **Role-Based Access Control**: All operations validate user roles before execution
2. **Data Integrity**: Foreign key constraints and transaction management
3. **Real-time Updates**: WebSocket for live message and notification delivery
4. **Mention Validation**: Only notify users who are members of the Charcha
5. **Cascading Operations**: Deleting a Charcha removes all associated data

## Components and Interfaces

### Backend Components

#### 1. Charcha Controller

Handles Charcha creation, retrieval, and management operations.

```javascript
class CharchaController {
  // Create a new Charcha
  async createCharcha(userId, charchaData) {
    // Input: { title, description, category, visibility }
    // Output: { id, title, description, category, visibility, ownerId, createdAt }
    // Validates required fields
    // Creates Charcha record
    // Adds creator as owner and member
    // Returns created Charcha
  }

  // Get Charcha by ID with member check
  async getCharcha(charchaId, userId) {
    // Input: charchaId, userId
    // Output: Charcha object with members list
    // Validates user has access (member or public)
    // Returns Charcha details
  }

  // List user's Charchas
  async getUserCharchas(userId) {
    // Input: userId
    // Output: Array of Charchas where user is owner/moderator/member
    // Returns owned and joined Charchas
  }

  // Browse public Charchas
  async browseCharchas(filters) {
    // Input: { category?, search? }
    // Output: Array of public Charchas
    // Supports filtering by category
    // Supports search by title
  }

  // Delete Charcha (owner only)
  async deleteCharcha(charchaId, userId) {
    // Input: charchaId, userId
    // Output: Success confirmation
    // Validates user is owner
    // Cascades delete to messages, requests, notifications
  }
}
```

#### 2. Membership Controller

Manages join requests and member operations.

```javascript
class MembershipController {
  // Request to join a Charcha
  async requestJoin(userId, charchaId) {
    // Input: userId, charchaId
    // Output: JoinRequest object or immediate membership
    // For public: adds member directly
    // For private: creates pending request and notifies owner
    // Prevents duplicate requests
  }

  // Approve join request (owner only)
  async approveRequest(requestId, ownerId) {
    // Input: requestId, ownerId
    // Output: Updated request with APPROVED status
    // Validates owner permission
    // Adds user to members
    // Creates notification for requester
  }

  // Reject join request (owner only)
  async rejectRequest(requestId, ownerId) {
    // Input: requestId, ownerId
    // Output: Updated request with REJECTED status
    // Validates owner permission
    // Creates notification for requester
  }

  // Get pending requests for owner
  async getPendingRequests(ownerId) {
    // Input: ownerId
    // Output: Array of pending JoinRequests for owner's Charchas
    // Returns requests with user details
  }

  // Assign moderator (owner only)
  async assignModerator(charchaId, userId, ownerId) {
    // Input: charchaId, userId, ownerId
    // Output: Updated member record
    // Validates owner permission
    // Updates member role to MODERATOR
  }

  // Remove moderator (owner only)
  async removeModerator(charchaId, userId, ownerId) {
    // Input: charchaId, userId, ownerId
    // Output: Updated member record
    // Validates owner permission
    // Updates member role to MEMBER
  }
}
```

#### 3. Message Controller

Handles message posting, retrieval, and deletion.

```javascript
class MessageController {
  // Post a message
  async postMessage(userId, charchaId, content) {
    // Input: userId, charchaId, content
    // Output: Message object with mentions
    // Validates user is member
    // Parses @mentions
    // Validates mentioned users are members
    // Creates message record
    // Creates mention records
    // Creates notifications for mentioned users
    // Broadcasts via WebSocket
  }

  // Get messages for a Charcha
  async getMessages(charchaId, userId, pagination) {
    // Input: charchaId, userId, { limit, offset }
    // Output: Array of messages with author details
    // Validates user has access
    // Returns messages in chronological order
    // Includes author name and timestamp
  }

  // Delete message (owner/moderator only)
  async deleteMessage(messageId, userId, charchaId) {
    // Input: messageId, userId, charchaId
    // Output: Success confirmation
    // Validates user is owner or moderator
    // Deletes message and associated mentions
    // Broadcasts deletion via WebSocket
  }
}
```

#### 4. Mention Parser

Extracts and validates @mentions from message content.

```javascript
class MentionParser {
  // Parse mentions from text
  parseMentions(content) {
    // Input: message content string
    // Output: Array of usernames
    // Regex: /@(\w+)/g
    // Returns unique usernames
  }

  // Validate mentions are members
  async validateMentions(usernames, charchaId) {
    // Input: Array of usernames, charchaId
    // Output: Array of valid user IDs
    // Queries database for users who are members
    // Returns only valid member IDs
  }
}
```

#### 5. Notification Controller

Manages notification creation and retrieval.

```javascript
class NotificationController {
  // Create notification
  async createNotification(userId, type, data) {
    // Input: userId, type (MENTION|JOIN_REQUEST|JOIN_APPROVED|JOIN_REJECTED), data
    // Output: Notification object
    // Creates notification record
    // Broadcasts via WebSocket
  }

  // Get user notifications
  async getNotifications(userId, filters) {
    // Input: userId, { unreadOnly?, limit? }
    // Output: Array of notifications
    // Returns notifications with related data
    // Supports filtering by read status
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    // Input: notificationId, userId
    // Output: Updated notification
    // Validates ownership
    // Updates read status
  }

  // Get unread count
  async getUnreadCount(userId) {
    // Input: userId
    // Output: Integer count
    // Returns count of unread notifications
  }
}
```

#### 6. Permission Validator

Validates role-based permissions.

```javascript
class PermissionValidator {
  // Check if user is owner
  async isOwner(userId, charchaId) {
    // Input: userId, charchaId
    // Output: Boolean
    // Queries Charcha owner
  }

  // Check if user is moderator
  async isModerator(userId, charchaId) {
    // Input: userId, charchaId
    // Output: Boolean
    // Queries member role
  }

  // Check if user is member
  async isMember(userId, charchaId) {
    // Input: userId, charchaId
    // Output: Boolean
    // Queries members table
  }

  // Check if user can delete messages
  async canDeleteMessages(userId, charchaId) {
    // Input: userId, charchaId
    // Output: Boolean
    // Returns true if owner or moderator
  }

  // Check if user can approve requests
  async canApproveRequests(userId, charchaId) {
    // Input: userId, charchaId
    // Output: Boolean
    // Returns true if owner
  }
}
```

#### 7. WebSocket Manager

Handles real-time communication.

```javascript
class WebSocketManager {
  // Register client connection
  registerClient(userId, socket) {
    // Input: userId, WebSocket connection
    // Stores connection in map
  }

  // Broadcast message to Charcha members
  broadcastToCharcha(charchaId, event, data) {
    // Input: charchaId, event type, data
    // Gets all member IDs
    // Sends to connected clients
  }

  // Send notification to user
  sendToUser(userId, event, data) {
    // Input: userId, event type, data
    // Sends to user's connection if online
  }

  // Handle disconnection
  unregisterClient(userId) {
    // Input: userId
    // Removes connection from map
  }
}
```

### Frontend Components

#### 1. Dashboard Component

Main landing page showing user's Charchas and activity.

```javascript
function Dashboard() {
  // State: myCharchas, pendingRequests, unreadCount
  // Fetches user's Charchas on mount
  // Fetches pending requests if user owns Charchas
  // Displays Charcha cards with member count
  // Shows pending request count badge
  // Links to Charcha view and notifications
}
```

#### 2. CharchaView Component

Displays a single Charcha with messages and controls.

```javascript
function CharchaView({ charchaId }) {
  // State: charcha, messages, members, userRole
  // Fetches Charcha details and messages
  // Establishes WebSocket connection
  // Renders message list with author and timestamp
  // Shows message input for members
  // Shows moderation controls for owner/moderator
  // Handles @mention autocomplete
  // Listens for real-time message updates
}
```

#### 3. MessageInput Component

Text input with @mention support.

```javascript
function MessageInput({ charchaId, members, onSend }) {
  // State: content, showMentionSuggestions, mentionQuery
  // Detects @ character for mention autocomplete
  // Filters members by typed query
  // Shows dropdown with member suggestions
  // Inserts @username on selection
  // Validates and sends message
}
```

#### 4. NotificationCenter Component

Displays user notifications.

```javascript
function NotificationCenter() {
  // State: notifications, unreadCount
  // Fetches notifications on mount
  // Listens for real-time notification updates
  // Groups by type (mentions, requests, approvals)
  // Marks as read on click
  // Links to relevant Charcha or request
}
```

#### 5. JoinRequestManager Component

Owner interface for managing join requests.

```javascript
function JoinRequestManager({ charchaId }) {
  // State: pendingRequests
  // Fetches pending requests for Charcha
  // Shows requester name and request date
  // Approve/Reject buttons
  // Updates list on action
  // Shows success/error feedback
}
```

#### 6. CharchaBrowser Component

Browse and search public Charchas.

```javascript
function CharchaBrowser() {
  // State: charchas, filters (category, search)
  // Fetches public Charchas
  // Category filter dropdown
  // Search input with debounce
  // Displays Charcha cards
  // Join button for non-members
  // Shows "Request Sent" for pending requests
}
```

## Data Models

### Database Schema

#### charchas Table

```sql
CREATE TABLE charchas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK(visibility IN ('public', 'private')),
  owner_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_charchas_owner ON charchas(owner_id);
CREATE INDEX idx_charchas_category ON charchas(category);
CREATE INDEX idx_charchas_visibility ON charchas(visibility);
```

#### members Table

```sql
CREATE TABLE members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  charcha_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('OWNER', 'MODERATOR', 'MEMBER')),
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (charcha_id) REFERENCES charchas(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(charcha_id, user_id)
);

CREATE INDEX idx_members_charcha ON members(charcha_id);
CREATE INDEX idx_members_user ON members(user_id);
```

#### join_requests Table

```sql
CREATE TABLE join_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  charcha_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (charcha_id) REFERENCES charchas(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(charcha_id, user_id, status)
);

CREATE INDEX idx_join_requests_charcha ON join_requests(charcha_id);
CREATE INDEX idx_join_requests_user ON join_requests(user_id);
CREATE INDEX idx_join_requests_status ON join_requests(status);
```

#### messages Table

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  charcha_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (charcha_id) REFERENCES charchas(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_charcha ON messages(charcha_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

#### mentions Table

```sql
CREATE TABLE mentions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  mentioned_user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (mentioned_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_mentions_message ON mentions(message_id);
CREATE INDEX idx_mentions_user ON mentions(mentioned_user_id);
```

#### notifications Table

```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('MENTION', 'JOIN_REQUEST', 'JOIN_APPROVED', 'JOIN_REJECTED')),
  related_id INTEGER,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
```

### Data Model Relationships

```
users (existing)
  ├─→ charchas (owner_id)
  ├─→ members (user_id)
  ├─→ join_requests (user_id)
  ├─→ messages (user_id)
  ├─→ mentions (mentioned_user_id)
  └─→ notifications (user_id)

charchas
  ├─→ members (charcha_id)
  ├─→ join_requests (charcha_id)
  ├─→ messages (charcha_id)
  └─→ notifications (related_id for JOIN_REQUEST type)

messages
  ├─→ mentions (message_id)
  └─→ notifications (related_id for MENTION type)

join_requests
  └─→ notifications (related_id for JOIN_APPROVED/REJECTED types)
```

### API Data Transfer Objects

#### CharchaDTO

```javascript
{
  id: number,
  title: string,
  description: string,
  category: string,
  visibility: 'public' | 'private',
  ownerId: number,
  ownerName: string,
  memberCount: number,
  createdAt: string (ISO 8601)
}
```

#### MessageDTO

```javascript
{
  id: number,
  charchaId: number,
  userId: number,
  userName: string,
  content: string,
  mentions: [{ userId: number, username: string }],
  createdAt: string (ISO 8601)
}
```

#### NotificationDTO

```javascript
{
  id: number,
  userId: number,
  type: 'MENTION' | 'JOIN_REQUEST' | 'JOIN_APPROVED' | 'JOIN_REJECTED',
  message: string,
  relatedId: number,
  isRead: boolean,
  createdAt: string (ISO 8601)
}
```

#### JoinRequestDTO

```javascript
{
  id: number,
  charchaId: number,
  charchaTitle: string,
  userId: number,
  userName: string,
  status: 'PENDING' | 'APPROVED' | 'REJECTED',
  createdAt: string (ISO 8601),
  updatedAt: string (ISO 8601)
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Charcha Creation and Management Properties

**Property 1: Charcha Creation Requires All Fields**
*For any* Charcha creation request missing title, description, or category, the system should reject the request with a 400 validation error.
**Validates: Requirements 1.1, 10.1**

**Property 2: Charcha Visibility Persistence**
*For any* Charcha created with a specific visibility setting (public or private), querying that Charcha should return the same visibility value.
**Validates: Requirements 1.2, 1.5**

**Property 3: Owner Initialization on Creation**
*For any* user creating a Charcha, that user should be both the owner of the Charcha and appear in the members list with OWNER role.
**Validates: Requirements 1.3, 1.4**

**Property 4: Charcha Response Completeness**
*For any* Charcha retrieved from the API, the response should contain title, description, category, visibility, owner information, and member count.
**Validates: Requirements 1.6, 9.5, 12.4**

**Property 5: Charcha Round-Trip Consistency**
*For any* valid Charcha data, creating a Charcha and then querying it back should return equivalent data (same title, description, category, visibility).
**Validates: Requirements 1.5**

### Membership and Join Request Properties

**Property 6: Private Charcha Join Creates Pending Request**
*For any* user requesting to join a private Charcha where they are not a member, a join request with PENDING status should be created.
**Validates: Requirements 2.1**

**Property 7: Public Charcha Join Immediate Membership**
*For any* user requesting to join a public Charcha, they should be immediately added to the members list without requiring approval.
**Validates: Requirements 2.2**

**Property 8: Join Request Notification Creation**
*For any* join request created for a private Charcha, a notification with type JOIN_REQUEST should be created for the Charcha owner.
**Validates: Requirements 2.3, 6.2**

**Property 9: Join Request Approval Flow**
*For any* pending join request, when approved by the owner, the request status should change to APPROVED, the user should be added to members, and a JOIN_APPROVED notification should be created for the requester.
**Validates: Requirements 2.4, 6.3**

**Property 10: Join Request Rejection Flow**
*For any* pending join request, when rejected by the owner, the request status should change to REJECTED and a JOIN_REJECTED notification should be created for the requester.
**Validates: Requirements 2.5, 6.4**

**Property 11: Duplicate Join Request Prevention**
*For any* user with a pending join request for a Charcha, attempting to create another join request for the same Charcha should be rejected.
**Validates: Requirements 2.6**

**Property 12: Member Join Request Prevention**
*For any* user who is already a member of a Charcha, attempting to create a join request should be rejected.
**Validates: Requirements 2.7**

### Moderator Management Properties

**Property 13: Moderator Role Assignment**
*For any* member of a Charcha, when the owner assigns them moderator role, their role field should be updated to MODERATOR.
**Validates: Requirements 3.1**

**Property 14: Moderator Assignment Authorization**
*For any* non-owner user attempting to assign moderator roles, the request should be rejected with a 403 error.
**Validates: Requirements 3.2, 8.6**

**Property 15: Moderator Message Deletion Permission**
*For any* user with MODERATOR role in a Charcha, they should be able to successfully delete messages in that Charcha.
**Validates: Requirements 3.3, 7.2, 8.3**

**Property 16: Multiple Moderators Support**
*For any* Charcha, assigning moderator role to multiple different members should succeed without conflicts.
**Validates: Requirements 3.4**

**Property 17: Moderator Role Removal**
*For any* user with MODERATOR role, when the owner removes their moderator status, their role should revert to MEMBER.
**Validates: Requirements 3.5**

### Message Posting Properties

**Property 18: Message Persistence with Metadata**
*For any* member posting a message in a Charcha, the stored message should contain the content, author ID, Charcha ID, and timestamp.
**Validates: Requirements 4.1, 4.5**

**Property 19: Member-Only Message Posting**
*For any* user who is not a member of a Charcha, attempting to post a message should be rejected with an error.
**Validates: Requirements 4.2, 4.3, 8.5**

**Property 20: Message Chronological Ordering**
*For any* set of messages in a Charcha, when retrieved, they should be ordered by timestamp with the oldest first, and each should include author name and timestamp.
**Validates: Requirements 4.4**

**Property 21: Message Round-Trip Consistency**
*For any* valid message content posted by a member, querying the messages immediately after should return a message with equivalent content.
**Validates: Requirements 4.5**

### Mention Detection and Validation Properties

**Property 22: Mention Parsing Completeness**
*For any* message containing @username patterns, the mention parser should extract all unique usernames from the content.
**Validates: Requirements 5.1, 5.4**

**Property 23: Member-Only Mention Validation**
*For any* username mentioned in a message, only usernames belonging to members of that Charcha should be validated as valid mentions.
**Validates: Requirements 5.2**

**Property 24: Non-Member Mention Rejection**
*For any* username mentioned in a message that does not belong to a member of the Charcha, no notification should be created for that user.
**Validates: Requirements 5.3**

**Property 25: Mention Association Persistence**
*For any* message posted with valid mentions, the mentions table should contain records associating the message with each mentioned user.
**Validates: Requirements 5.5**

### Notification System Properties

**Property 26: Mention Notification Creation**
*For any* valid mention of a member in a message, a notification with type MENTION should be created for the mentioned user.
**Validates: Requirements 6.1**

**Property 27: Notification Default Unread Status**
*For any* newly created notification, the is_read field should default to false (unread).
**Validates: Requirements 6.5**

**Property 28: Notification Mark as Read**
*For any* notification, when a user marks it as read, the is_read field should be updated to true.
**Validates: Requirements 6.6**

**Property 29: Notification Round-Trip Consistency**
*For any* notification created, querying notifications immediately after should return a notification with equivalent type, message, and related_id.
**Validates: Requirements 6.7**

### Message Deletion Properties

**Property 30: Authorized Message Deletion**
*For any* message in a Charcha, when deleted by an owner or moderator, the message should be removed from the database and not appear in subsequent queries.
**Validates: Requirements 7.1, 7.2, 7.5**

**Property 31: Unauthorized Deletion Prevention**
*For any* regular member (non-owner, non-moderator) attempting to delete a message, the request should be rejected with a 403 error.
**Validates: Requirements 7.3, 7.4, 8.6**

### Role-Based Access Control Properties

**Property 32: Owner Permission Completeness**
*For any* user who is the owner of a Charcha, they should be able to approve join requests, delete messages, and assign moderators.
**Validates: Requirements 8.2**

**Property 33: Member Posting and Mentioning**
*For any* user who is a member of a Charcha, they should be able to post messages and mention other members.
**Validates: Requirements 8.4**

**Property 34: Non-Member Access Prevention**
*For any* user who is not a member of a private Charcha, attempting to post messages or view messages should be rejected with a 403 error.
**Validates: Requirements 8.5, 8.6**

### Dashboard and Discovery Properties

**Property 35: User Charcha List Completeness**
*For any* user, their dashboard should return all Charchas where they have OWNER, MODERATOR, or MEMBER role.
**Validates: Requirements 9.1**

**Property 36: Owner Pending Requests Display**
*For any* user who owns Charchas, their dashboard should display all pending join requests for those Charchas.
**Validates: Requirements 9.2**

**Property 37: Unread Notification Count Accuracy**
*For any* user, the unread notification count should equal the number of notifications where is_read is false.
**Validates: Requirements 9.3**

**Property 38: Public Charcha Search Results**
*For any* search query, only public Charchas matching the search criteria should be returned.
**Validates: Requirements 9.4**

### Data Integrity Properties

**Property 39: Required Field Validation**
*For any* entity creation request with missing required fields, the system should reject the request with a 400 validation error.
**Validates: Requirements 10.1**

**Property 40: Foreign Key Enforcement**
*For any* attempt to create a record with an invalid foreign key (non-existent user_id, charcha_id, etc.), the operation should fail with an error.
**Validates: Requirements 10.2, 10.4**

**Property 41: Cascade Deletion Completeness**
*For any* Charcha, when deleted, all associated messages, join requests, mentions, and notifications should also be deleted from the database.
**Validates: Requirements 10.3**

### API Response Format Properties

**Property 42: Success Response Status Codes**
*For any* successful API operation, the response status code should be 200 (for queries/updates) or 201 (for creations).
**Validates: Requirements 11.1**

**Property 43: Validation Error Response**
*For any* API request with invalid input, the response should have status code 400 and include error details.
**Validates: Requirements 11.2**

**Property 44: Authorization Error Response**
*For any* API request where the user lacks permission, the response should have status code 403 and include an error message.
**Validates: Requirements 11.3**

**Property 45: Not Found Error Response**
*For any* API request for a non-existent resource, the response should have status code 404 and include an error message.
**Validates: Requirements 11.4**

**Property 46: Timestamp Format Consistency**
*For any* API response containing timestamps, all timestamps should be in ISO 8601 format.
**Validates: Requirements 11.5**

**Property 47: List Response Structure**
*For any* API endpoint returning a list, the response should be a JSON array.
**Validates: Requirements 11.6**

### Category Management Properties

**Property 48: Category Validation**
*For any* Charcha creation request with a category not in the allowed list (Crops, Livestock, Market, Weather, Equipment, General), the request should be rejected with a 400 error.
**Validates: Requirements 12.1, 12.5**

**Property 49: Category Requirement**
*For any* Charcha creation request without a category, the request should be rejected with a 400 validation error.
**Validates: Requirements 12.2**

**Property 50: Category Filtering**
*For any* category filter applied to Charcha browsing, only Charchas with that specific category should be returned.
**Validates: Requirements 12.3**

### Input Validation and Security Properties

**Property 51: XSS Prevention**
*For any* text input containing HTML or script tags, the stored and returned content should have those tags sanitized or escaped.
**Validates: Requirements 14.1**

**Property 52: Input Length Validation**
*For any* input exceeding the defined limits (title > 100 chars, description > 500 chars, message > 2000 chars), the request should be rejected with a 400 validation error.
**Validates: Requirements 14.2, 14.3, 14.4, 14.5**

**Property 53: Mention Username Validation**
*For any* @mention with a username that doesn't exist in the database, the mention should be ignored and no notification created.
**Validates: Requirements 14.6**

## Error Handling

### Error Categories

1. **Validation Errors (400)**
   - Missing required fields
   - Invalid field values
   - Input length violations
   - Invalid category selection

2. **Authorization Errors (403)**
   - Non-member attempting to post messages
   - Non-owner attempting to approve requests
   - Non-moderator attempting to delete messages
   - Accessing private Charcha content without membership

3. **Not Found Errors (404)**
   - Charcha ID doesn't exist
   - Message ID doesn't exist
   - User ID doesn't exist
   - Join request ID doesn't exist

4. **Conflict Errors (409)**
   - Duplicate join request
   - Member attempting to create join request

5. **Server Errors (500)**
   - Database connection failures
   - Transaction rollback failures
   - WebSocket connection errors

### Error Response Format

All errors follow a consistent structure:

```javascript
{
  error: {
    code: string,        // Error code (e.g., "VALIDATION_ERROR")
    message: string,     // Human-readable error message
    details?: object     // Optional additional error details
  }
}
```

### Error Handling Strategies

1. **Input Validation**: Validate all inputs before database operations
2. **Transaction Management**: Wrap multi-step operations in transactions
3. **Graceful Degradation**: Fall back to polling if WebSocket fails
4. **Error Logging**: Log all errors with context for debugging
5. **User Feedback**: Provide clear, actionable error messages to users

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs using randomized test data

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing

**Library Selection**: Use **fast-check** for JavaScript/Node.js property-based testing.

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: kisan-charcha, Property {number}: {property_text}`

**Property Test Coverage**:
- Each correctness property listed above must be implemented as a single property-based test
- Tests should generate random valid and invalid inputs
- Tests should verify the property holds across all generated inputs

**Example Property Test Structure**:

```javascript
// Feature: kisan-charcha, Property 3: Owner Initialization on Creation
test('owner initialization on Charcha creation', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        title: fc.string({ minLength: 1, maxLength: 100 }),
        description: fc.string({ minLength: 1, maxLength: 500 }),
        category: fc.constantFrom('Crops', 'Livestock', 'Market', 'Weather', 'Equipment', 'General'),
        visibility: fc.constantFrom('public', 'private')
      }),
      async (charchaData) => {
        const userId = await createTestUser();
        const charcha = await createCharcha(userId, charchaData);
        
        // Verify owner assignment
        expect(charcha.ownerId).toBe(userId);
        
        // Verify owner in members list
        const members = await getMembers(charcha.id);
        const ownerMember = members.find(m => m.userId === userId);
        expect(ownerMember).toBeDefined();
        expect(ownerMember.role).toBe('OWNER');
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing

**Focus Areas**:
- Specific examples demonstrating correct behavior
- Edge cases (empty inputs, boundary values, special characters)
- Error conditions (invalid IDs, unauthorized access)
- Integration points between components

**Unit Test Balance**:
- Avoid writing too many unit tests for scenarios covered by property tests
- Focus on concrete examples that illustrate requirements
- Test error handling and edge cases not easily covered by property tests

**Example Unit Test**:

```javascript
test('should reject join request for non-existent Charcha', async () => {
  const userId = await createTestUser();
  const nonExistentCharchaId = 99999;
  
  await expect(
    requestJoin(userId, nonExistentCharchaId)
  ).rejects.toThrow('Charcha not found');
});
```

### Integration Testing

**Scope**:
- End-to-end user flows (create Charcha → join → post message → receive notification)
- WebSocket real-time updates
- Database transaction integrity
- API endpoint integration

**Test Scenarios**:
1. Complete join request workflow (request → notify → approve → add member)
2. Message posting with mentions (post → parse → validate → notify)
3. Cascade deletion (delete Charcha → verify all related data deleted)
4. Real-time message broadcasting (post → WebSocket → all members receive)

### Test Data Management

**Generators for Property Tests**:
- User generator: random user IDs and usernames
- Charcha generator: random valid Charcha data
- Message generator: random content with optional mentions
- Role generator: random roles (OWNER, MODERATOR, MEMBER)

**Test Database**:
- Use separate test database (farmease_test.db)
- Reset database before each test suite
- Clean up test data after each test

### Testing Tools

- **Test Framework**: Jest
- **Property Testing**: fast-check
- **API Testing**: supertest
- **WebSocket Testing**: ws + jest
- **Database**: SQLite in-memory for tests

### Continuous Testing

- Run unit tests on every commit
- Run property tests on every pull request
- Run integration tests before deployment
- Monitor test execution time and optimize slow tests

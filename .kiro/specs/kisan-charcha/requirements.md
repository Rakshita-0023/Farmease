# Requirements Document: Kisan Charcha Community Discussion System

## Introduction

Kisan Charcha is a group-based discussion platform for farmers that enables community building through discussion groups. The system supports group creation, membership management with approval workflows, threaded conversations with @mentions, role-based permissions, and a comprehensive notification system. This feature integrates into an existing MERN stack farming application.

## Glossary

- **Charcha**: A discussion group where farmers can have conversations
- **Owner**: The user who created a Charcha and has full administrative rights
- **Moderator**: A user assigned by the Owner to help manage a Charcha
- **Member**: A user who has been approved to participate in a Charcha
- **Join_Request**: A request from a user to join a private Charcha
- **Mention**: An @username reference in a message that notifies the mentioned user
- **Notification_System**: The system that tracks and delivers notifications to users
- **Message**: A text post within a Charcha conversation
- **Category**: A classification tag for organizing Charchas by topic
- **Visibility**: Whether a Charcha is public (anyone can join) or private (requires approval)

## Requirements

### Requirement 1: Charcha Creation and Management

**User Story:** As a farmer, I want to create discussion groups with specific topics, so that I can build communities around shared interests.

#### Acceptance Criteria

1. WHEN a user creates a Charcha, THE System SHALL require a title, description, and category
2. WHEN a user creates a Charcha, THE System SHALL allow the user to set visibility as public or private
3. WHEN a Charcha is created, THE System SHALL automatically assign the creator as the Owner
4. WHEN a Charcha is created, THE System SHALL automatically add the Owner to the members list
5. THE System SHALL persist all Charcha data to the database immediately upon creation
6. WHEN a user views a Charcha, THE System SHALL display the title, description, category, visibility, owner, and member count

### Requirement 2: Membership Management

**User Story:** As a Charcha owner, I want to control who can join my private discussion groups, so that I can maintain quality conversations.

#### Acceptance Criteria

1. WHEN a user requests to join a private Charcha, THE System SHALL create a Join_Request with PENDING status
2. WHEN a user requests to join a public Charcha, THE System SHALL automatically add them as a Member without approval
3. WHEN a Join_Request is created, THE System SHALL notify the Charcha Owner
4. WHEN an Owner approves a Join_Request, THE System SHALL change the status to APPROVED and add the user to the members list
5. WHEN an Owner rejects a Join_Request, THE System SHALL change the status to REJECTED
6. THE System SHALL prevent duplicate Join_Requests from the same user for the same Charcha
7. WHEN a user is already a Member, THE System SHALL prevent them from creating new Join_Requests

### Requirement 3: Moderator Assignment

**User Story:** As a Charcha owner, I want to assign moderators to help manage my discussion group, so that I can distribute moderation responsibilities.

#### Acceptance Criteria

1. WHEN an Owner assigns a moderator role to a Member, THE System SHALL update that user's role to Moderator
2. THE System SHALL only allow Owners to assign moderator roles
3. WHEN a user becomes a Moderator, THE System SHALL grant them message deletion permissions
4. THE System SHALL allow multiple Moderators per Charcha
5. WHEN an Owner removes moderator status, THE System SHALL revert the user to Member role

### Requirement 4: Message Posting and Conversations

**User Story:** As a Charcha member, I want to post messages and participate in discussions, so that I can share knowledge and ask questions.

#### Acceptance Criteria

1. WHEN a Member posts a message, THE System SHALL store the message with timestamp, author, and Charcha association
2. THE System SHALL only allow Members, Moderators, and Owners to post messages
3. WHEN a non-member attempts to post a message, THE System SHALL reject the request with an error
4. WHEN messages are displayed, THE System SHALL show them in chronological order with author name and timestamp
5. THE System SHALL persist all messages to the database immediately upon posting

### Requirement 5: @Mention Detection and Validation

**User Story:** As a Charcha member, I want to mention other members using @username, so that I can direct messages to specific people.

#### Acceptance Criteria

1. WHEN a message contains @username syntax, THE System SHALL parse and extract all mentions
2. WHEN a mention is detected, THE System SHALL validate that the mentioned user is a Member of the Charcha
3. WHEN a mentioned user is not a Member, THE System SHALL ignore the mention and not create a notification
4. THE System SHALL support multiple mentions in a single message
5. WHEN a message is posted with valid mentions, THE System SHALL store the mention associations with the message

### Requirement 6: Notification System

**User Story:** As a user, I want to receive notifications for mentions and join request updates, so that I stay informed about relevant activities.

#### Acceptance Criteria

1. WHEN a user is mentioned in a message, THE System SHALL create a notification for that user with type MENTION
2. WHEN a Join_Request is created, THE System SHALL create a notification for the Charcha Owner with type JOIN_REQUEST
3. WHEN a Join_Request is approved, THE System SHALL create a notification for the requesting user with type JOIN_APPROVED
4. WHEN a Join_Request is rejected, THE System SHALL create a notification for the requesting user with type JOIN_REJECTED
5. THE System SHALL store all notifications with read/unread status defaulting to unread
6. WHEN a user views a notification, THE System SHALL allow marking it as read
7. THE System SHALL persist all notifications to the database immediately upon creation

### Requirement 7: Message Deletion and Moderation

**User Story:** As a Charcha owner or moderator, I want to delete inappropriate messages, so that I can maintain discussion quality.

#### Acceptance Criteria

1. WHEN an Owner deletes a message, THE System SHALL remove the message from the database
2. WHEN a Moderator deletes a message, THE System SHALL remove the message from the database
3. THE System SHALL only allow Owners and Moderators to delete messages
4. WHEN a Member attempts to delete a message, THE System SHALL reject the request with an error
5. WHEN a message is deleted, THE System SHALL remove it from all conversation views immediately

### Requirement 8: Role-Based Access Control

**User Story:** As the system, I want to enforce role-based permissions, so that users can only perform actions appropriate to their role.

#### Acceptance Criteria

1. WHEN checking permissions, THE System SHALL verify the user's role in the specific Charcha
2. THE System SHALL allow Owners to approve Join_Requests, delete messages, and assign Moderators
3. THE System SHALL allow Moderators to delete messages
4. THE System SHALL allow Members to post messages and mention other Members
5. THE System SHALL prevent non-members from posting messages or accessing private Charcha content
6. WHEN a user attempts an unauthorized action, THE System SHALL return an error with status code 403

### Requirement 9: User Dashboard and Charcha Discovery

**User Story:** As a user, I want to see my Charchas and pending requests in one place, so that I can easily manage my community participation.

#### Acceptance Criteria

1. WHEN a user views their dashboard, THE System SHALL display all Charchas where they are Owner, Moderator, or Member
2. WHEN an Owner views their dashboard, THE System SHALL display all pending Join_Requests for their Charchas
3. WHEN a user views their dashboard, THE System SHALL display their unread notification count
4. THE System SHALL allow users to browse and search public Charchas
5. WHEN displaying Charchas, THE System SHALL show title, category, member count, and visibility status

### Requirement 10: Data Persistence and Integrity

**User Story:** As the system, I want to maintain data consistency and integrity, so that the platform remains reliable.

#### Acceptance Criteria

1. WHEN any entity is created or modified, THE System SHALL validate all required fields before persisting
2. THE System SHALL enforce foreign key relationships between Users, Charchas, Messages, and Notifications
3. WHEN a Charcha is deleted, THE System SHALL cascade delete all associated Messages, Join_Requests, and Notifications
4. THE System SHALL prevent orphaned records by maintaining referential integrity
5. WHEN database operations fail, THE System SHALL rollback transactions and return appropriate error messages

### Requirement 11: API Response Format

**User Story:** As a frontend developer, I want consistent API responses, so that I can reliably handle data in the UI.

#### Acceptance Criteria

1. WHEN an API request succeeds, THE System SHALL return a response with status code 200 or 201 and the requested data
2. WHEN an API request fails due to validation, THE System SHALL return status code 400 with error details
3. WHEN an API request fails due to authorization, THE System SHALL return status code 403 with error message
4. WHEN an API request fails due to missing resources, THE System SHALL return status code 404 with error message
5. THE System SHALL return all timestamps in ISO 8601 format
6. THE System SHALL return all list responses with consistent array structures

### Requirement 12: Charcha Categories and Organization

**User Story:** As a user, I want to organize Charchas by categories, so that I can find relevant discussion groups easily.

#### Acceptance Criteria

1. THE System SHALL support predefined categories including Crops, Livestock, Market, Weather, Equipment, and General
2. WHEN creating a Charcha, THE System SHALL require selection of exactly one category
3. WHEN browsing Charchas, THE System SHALL allow filtering by category
4. WHEN displaying a Charcha, THE System SHALL show its category prominently
5. THE System SHALL validate that the selected category is from the allowed list

### Requirement 13: Real-time Updates and Synchronization

**User Story:** As a user, I want to see new messages and notifications without refreshing, so that I can have fluid conversations.

#### Acceptance Criteria

1. WHEN a new message is posted in a Charcha, THE System SHALL broadcast the update to all active Members viewing that Charcha
2. WHEN a new notification is created, THE System SHALL update the user's notification count in real-time
3. THE System SHALL use WebSocket connections for real-time updates
4. WHEN a WebSocket connection fails, THE System SHALL fall back to polling every 30 seconds
5. WHEN a user reconnects, THE System SHALL synchronize any missed updates

### Requirement 14: Input Validation and Security

**User Story:** As the system, I want to validate and sanitize all user inputs, so that the platform remains secure.

#### Acceptance Criteria

1. WHEN a user submits text input, THE System SHALL sanitize HTML and script tags to prevent XSS attacks
2. THE System SHALL limit Charcha titles to 100 characters
3. THE System SHALL limit Charcha descriptions to 500 characters
4. THE System SHALL limit message content to 2000 characters
5. WHEN input exceeds length limits, THE System SHALL reject the request with a validation error
6. THE System SHALL validate that usernames in mentions exist in the database

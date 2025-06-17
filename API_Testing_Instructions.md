# TATU API Testing Instructions

## Setup

1. Import the `TATU_API_Postman_Collection.json` file into Postman
2. Set up the environment variables:
   - `base_url`: `http://localhost:5000`
   - `token`: Your JWT token after authentication
   - `artist_token`: JWT token for an artist user
   - Other IDs will be populated during testing

## Authentication Flow

1. **Register Users**: Create both regular users and artist accounts
2. **Login**: Get JWT tokens for authentication
3. **Save Tokens**: Copy tokens to `{{token}}` and `{{artist_token}}` variables

## Testing Order

### 1. Authentication
- Register User
- Register Artist  
- Login (save tokens)
- Get Profile

### 2. Users
- Get All Users
- Get User By ID
- Update User
- Upload Avatar

### 3. Portfolios
- Create/Update Portfolio (artist)
- Add Images to Portfolio
- Get Portfolio by Artist ID
- Get All Portfolios

### 4. Bookings
- Create Booking
- Get User's Bookings
- Get Artist's Bookings
- Update Booking Status

### 5. Reviews
- Create Review
- Get Reviews for Artist
- Update Review
- Delete Review

### 6. **Messages (NEW)**
- Get All Conversations
- Get Unread Message Count
- Start Conversation with User
- Send Message
- Get Conversation Messages
- Mark Messages as Read
- Delete Message

## **Messaging Endpoints Testing Guide**

### Prerequisites
- Have at least 2 registered users (can be 1 regular user + 1 artist)
- Both users should be authenticated with valid tokens
- Save user IDs in variables: `{{user_id}}`, `{{artist_id}}`, `{{other_user_id}}`

### **Step 1: Get Initial State**
```
GET /api/messages/conversations
Authorization: Bearer {{token}}
```
- **Expected**: Empty array `[]` (no conversations yet)
- **Purpose**: Verify user starts with no conversations

### **Step 2: Check Unread Count**
```
GET /api/messages/unread-count  
Authorization: Bearer {{token}}
```
- **Expected**: `{"unreadCount": 0}`
- **Purpose**: Verify no unread messages initially

### **Step 3: Start Conversation**
```
POST /api/messages/conversations/{{other_user_id}}
Authorization: Bearer {{token}}
```
- **Expected**: Conversation object with user details
- **Save**: Copy `id` from response to `{{conversation_id}}` variable
- **Purpose**: Create conversation between two users

### **Step 4: Send First Message**
```
POST /api/messages
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "receiverId": "{{other_user_id}}",
  "content": "Hello! I'm interested in booking a tattoo session with you.",
  "messageType": "text"
}
```
- **Expected**: Message object with sender/receiver details
- **Save**: Copy `id` from response to `{{message_id}}` variable
- **Purpose**: Send message in conversation

### **Step 5: Send Reply (Switch User)**
```
POST /api/messages
Authorization: Bearer {{artist_token}}  // Switch to other user
Content-Type: application/json

{
  "receiverId": "{{user_id}}",  // Original sender
  "content": "Hi! I'd be happy to discuss your tattoo ideas. What style are you thinking?",
  "messageType": "text"
}
```
- **Expected**: Reply message object
- **Purpose**: Create back-and-forth conversation

### **Step 6: Get Conversations (Both Users)**
```
GET /api/messages/conversations
Authorization: Bearer {{token}}  // First user
```
- **Expected**: Array with 1 conversation
- **Check**: `otherUser` details, `lastMessage`, `unreadCount > 0`

```
GET /api/messages/conversations  
Authorization: Bearer {{artist_token}}  // Second user
```
- **Expected**: Same conversation from other user's perspective
- **Check**: `lastMessage` shows the reply sent in Step 5

### **Step 7: Get Conversation Messages**
```
GET /api/messages/conversations/{{conversation_id}}/messages?page=1&limit=50
Authorization: Bearer {{token}}
```
- **Expected**: Array of messages in chronological order
- **Check**: Both messages from steps 4 and 5 are present
- **Check**: Pagination info (page, limit, total, hasMore)

### **Step 8: Check Unread Count**
```
GET /api/messages/unread-count
Authorization: Bearer {{token}}
```
- **Expected**: `{"unreadCount": 1}` (the reply from step 5)
- **Purpose**: Verify unread count increases with new messages

### **Step 9: Mark Messages as Read**
```
PUT /api/messages/conversations/{{conversation_id}}/read
Authorization: Bearer {{token}}
```
- **Expected**: `{"message": "Messages marked as read", "markedCount": 1}`
- **Purpose**: Mark unread messages as read

### **Step 10: Verify Read Status**
```
GET /api/messages/unread-count
Authorization: Bearer {{token}}
```
- **Expected**: `{"unreadCount": 0}` (messages now read)

```
GET /api/messages/conversations
Authorization: Bearer {{token}}
```
- **Expected**: `unreadCount: 0` in conversation object

### **Step 11: Delete Message (Optional)**
```
DELETE /api/messages/{{message_id}}
Authorization: Bearer {{token}}  // Must be message sender
```
- **Expected**: `{"message": "Message deleted successfully"}`
- **Purpose**: Verify message deletion (sender only)

### **Step 12: Verify Deletion**
```
GET /api/messages/conversations/{{conversation_id}}/messages
Authorization: Bearer {{token}}
```
- **Expected**: Message from step 4 should be gone, only reply remains
- **Purpose**: Confirm message was deleted from conversation

## **Testing Scenarios**

### **Error Cases to Test:**

1. **Unauthorized Access**
   - Try any endpoint without `Authorization` header
   - **Expected**: 401 Unauthorized

2. **Invalid Conversation Access**
   - Use `{{conversation_id}}` with wrong user token
   - **Expected**: 404 or 403 error

3. **Self-messaging Prevention**
   - Try to send message to same user ID as sender
   - **Expected**: 400 error "Cannot send message to yourself"

4. **Invalid User IDs**
   - Use non-existent `receiverId` in send message
   - **Expected**: 400 or 404 error

5. **Delete Other's Messages**
   - Try to delete message sent by another user
   - **Expected**: 404 "Message not found or unauthorized"

### **Performance Testing:**
- Send multiple messages quickly
- Test pagination with large conversation
- Test with multiple simultaneous conversations

## Notes
- Always authenticate before testing protected endpoints
- Update variable values as you get responses
- Test both regular users and artists
- Verify different user perspectives in same conversation
- Check that database operations are working correctly
- Monitor server logs for any errors during testing 
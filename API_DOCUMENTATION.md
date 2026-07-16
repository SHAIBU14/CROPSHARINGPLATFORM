# Community Garden Platform - API Documentation

## Overview

The Community Garden Platform API provides endpoints for managing users, gardens, crops, messages, and community interactions.

## Base URL

- Development: `http://localhost:5000/api`
- Production: `https://your-api-domain.com/api`



**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "location": {
    "address": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "coordinates": {
      "lat": "number",
      "lng": "number"
    }
  }
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt-token",
  "user": {
    "_id": "string",
    "username": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "location": "object",
    "gardenExperience": "string",
    "isVerified": "boolean",
    "isAdmin": "boolean",
    "createdAt": "string"
  }
}
```

#### POST /auth/login
Login user.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt-token",
  "user": "user-object"
}
```

#### GET /auth/me
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": "user-object"
}
```

### Users

#### GET /users/profile
Get user profile.

**Headers:** `Authorization: Bearer <token>`

#### PUT /users/profile
Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "bio": "string",
  "gardenExperience": "beginner|intermediate|advanced|expert",
  "location": "object"
}
```

#### GET /users/search
Search users.

**Query Parameters:**
- `q`: Search query (required)
- `limit`: Number of results (default: 10)
- `page`: Page number (default: 1)

#### GET /users/:id
Get user by ID.

### Gardens

#### POST /gardens
Create a new garden.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "location": {
    "address": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "coordinates": {
      "lat": "number",
      "lng": "number"
    }
  },
  "size": "small|medium|large|extra-large",
  "gardenType": "vegetable|herb|fruit|flower|mixed",
  "images": "array",
  "features": "array"
}
```

#### GET /gardens
Get all gardens with optional filters.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Number of results (default: 10)
- `city`: Filter by city
- `state`: Filter by state
- `gardenType`: Filter by garden type
- `size`: Filter by size
- `lat`: Latitude for location-based search
- `lng`: Longitude for location-based search
- `radius`: Search radius in km (default: 50)

#### GET /gardens/my-gardens
Get current user's gardens.

**Headers:** `Authorization: Bearer <token>`

#### GET /gardens/:id
Get garden by ID.

#### PUT /gardens/:id
Update garden.

**Headers:** `Authorization: Bearer <token>`

#### DELETE /gardens/:id
Delete garden.

**Headers:** `Authorization: Bearer <token>`

#### POST /gardens/:id/visit
Record garden visit.

**Headers:** `Authorization: Bearer <token>`

#### POST /gardens/:id/rate
Rate garden.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "rating": "number (1-5)",
  "review": "string"
}
```

### Crops

#### POST /crops
Create a new crop listing.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "string",
  "variety": "string",
  "description": "string",
  "garden": "garden-id",
  "category": "vegetable|herb|fruit|flower|grain|legume",
  "quantity": {
    "amount": "number",
    "unit": "kg|lbs|pieces|bunches|bags|containers"
  },
  "harvestDate": "ISO-date-string",
  "expiryDate": "ISO-date-string",
  "price": "number",
  "isFree": "boolean",
  "tradeOptions": "array",
  "images": "array",
  "growingMethod": "organic|conventional|hydroponic|permaculture",
  "season": "spring|summer|fall|winter|year-round",
  "tags": "array"
}
```

#### GET /crops
Get all crops with optional filters.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Number of results (default: 10)
- `category`: Filter by category
- `availability`: Filter by availability
- `lat`: Latitude for location-based search
- `lng`: Longitude for location-based search
- `radius`: Search radius in km (default: 50)
- `season`: Filter by season
- `isFree`: Filter free crops (true/false)
- `search`: Search term

#### GET /crops/my-crops
Get current user's crops.

**Headers:** `Authorization: Bearer <token>`

#### GET /crops/:id
Get crop by ID.

#### PUT /crops/:id
Update crop.

**Headers:** `Authorization: Bearer <token>`

#### DELETE /crops/:id
Delete crop.

**Headers:** `Authorization: Bearer <token>`

#### POST /crops/:id/request
Request crop.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "quantity": {
    "amount": "number",
    "unit": "string"
  },
  "message": "string"
}
```

#### PUT /crops/:id/request/:requestId
Respond to crop request.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "approved|rejected",
  "message": "string"
}
```

### Messages

#### GET /messages/conversations
Get all conversations for current user.

**Headers:** `Authorization: Bearer <token>`

#### GET /messages/:userId
Get messages between current user and another user.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Number of messages (default: 50)

#### POST /messages/:userId
Send message to user.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "string",
  "type": "text|image|crop-request|trade-offer",
  "relatedCrop": "crop-id",
  "relatedGarden": "garden-id",
  "attachments": "array"
}
```

#### PUT /messages/:messageId/read
Mark message as read.

**Headers:** `Authorization: Bearer <token>`

#### DELETE /messages/:messageId
Delete message.

**Headers:** `Authorization: Bearer <token>`

#### GET /messages/unread/count
Get unread message count.

**Headers:** `Authorization: Bearer <token>`

### Community Feed

#### POST /feed
Create a new feed post.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "type": "update|tip|event|question|achievement|help",
  "title": "string",
  "content": "string",
  "images": "array",
  "tags": "array",
  "relatedGarden": "garden-id",
  "relatedCrop": "crop-id",
  "location": "object",
  "eventDetails": "object"
}
```

#### GET /feed
Get feed posts with optional filters.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Number of results (default: 10)
- `type`: Filter by post type
- `tags`: Filter by tags
- `lat`: Latitude for location-based search
- `lng`: Longitude for location-based search
- `radius`: Search radius in km (default: 50)
- `author`: Filter by author
- `search`: Search term

#### GET /feed/:id
Get feed post by ID.

#### POST /feed/:id/like
Like/unlike a post.

**Headers:** `Authorization: Bearer <token>`

#### POST /feed/:id/comment
Add comment to post.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "string"
}
```

#### POST /feed/:id/share
Share a post.

**Headers:** `Authorization: Bearer <token>`

#### POST /feed/:id/attend
Attend an event.

**Headers:** `Authorization: Bearer <token>`

#### PUT /feed/:id
Update feed post.

**Headers:** `Authorization: Bearer <token>`

#### DELETE /feed/:id
Delete feed post.

**Headers:** `Authorization: Bearer <token>`

### AI Features

#### POST /ai/identify-crop
Identify crop from image using AI.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "imageUrl": "string"
}
```

#### POST /ai/crop-recommendations
Get AI-powered crop recommendations.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "location": {
    "lat": "number",
    "lng": "number"
  },
  "season": "spring|summer|fall|winter",
  "gardenSize": "small|medium|large|extra-large",
  "experience": "beginner|intermediate|advanced|expert",
  "preferences": "array"
}
```

#### POST /ai/garden-tips
Get AI-powered gardening tips.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "topic": "string",
  "experience": "beginner|intermediate|advanced|expert",
  "specificQuestions": "array"
}
```

#### POST /ai/message-suggestions
Get AI-powered message suggestions for crop trades.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "cropName": "string",
  "tradeType": "request|offer|trade",
  "quantity": "string",
  "tone": "friendly|professional|casual",
  "additionalContext": "string"
}
```

### Notifications

#### GET /notifications
Get user notifications.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Number of results (default: 20)
- `unreadOnly`: Show only unread notifications (true/false)

#### PUT /notifications/:id/read
Mark notification as read.

**Headers:** `Authorization: Bearer <token>`

#### PUT /notifications/read-all
Mark all notifications as read.

**Headers:** `Authorization: Bearer <token>`

#### DELETE /notifications/:id
Delete notification.

**Headers:** `Authorization: Bearer <token>`

#### GET /notifications/unread-count
Get unread notification count.

**Headers:** `Authorization: Bearer <token>`

### Admin

#### GET /admin/dashboard
Get admin dashboard statistics.

**Headers:** `Authorization: Bearer <token>` (Admin only)

#### GET /admin/users
Get all users with pagination and filters.

**Headers:** `Authorization: Bearer <token>` (Admin only)

#### PUT /admin/users/:id
Update user (admin).

**Headers:** `Authorization: Bearer <token>` (Admin only)

#### DELETE /admin/users/:id
Delete user (admin).

**Headers:** `Authorization: Bearer <token>` (Admin only)

#### GET /admin/gardens
Get all gardens with admin filters.

**Headers:** `Authorization: Bearer <token>` (Admin only)

#### PUT /admin/gardens/:id
Update garden (admin).

**Headers:** `Authorization: Bearer <token>` (Admin only)

#### GET /admin/posts
Get all feed posts with admin filters.

**Headers:** `Authorization: Bearer <token>` (Admin only)

#### PUT /admin/posts/:id
Update post (admin).

**Headers:** `Authorization: Bearer <token>` (Admin only)

#### GET /admin/analytics
Get platform analytics.

**Headers:** `Authorization: Bearer <token>` (Admin only)

## Error Responses

All error responses follow this format:

```json
{
  "message": "Error description",
  "error": "Detailed error information (development only)"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API requests are rate limited to 100 requests per 15 minutes per IP address.

## Pagination

Most list endpoints support pagination using these query parameters:

- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 10)

Response includes pagination metadata:

```json
{
  "data": "array",
  "pagination": {
    "current": "number",
    "pages": "number",
    "total": "number"
  }
}
```

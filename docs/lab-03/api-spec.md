# Sprint 3 REST API Specification

## Base Path: `/api`

### 1. Authentication Endpoints

#### `POST /api/auth/login`
- **Description:** Authenticates user credentials.
- **Request Body:**
  ```json
  {
    "email": "sarah.johnson@toktickit.local",
    "password": "Password123!"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "token": "jwt_bearer_token",
      "user": {
        "id": "uuid",
        "email": "sarah.johnson@toktickit.local",
        "fullName": "Sarah Johnson",
        "role": "IT_STAFF",
        "mustChangePassword": false
      }
    }
    ```
  - `401 Unauthorized`: Invalid email/password or account inactive.

#### `POST /api/auth/logout`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `200 OK`
  ```json
  { "message": "Logged out successfully" }
  ```

#### `GET /api/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Responses:**
  - `200 OK`: Current authenticated user object.
  - `401 Unauthorized`: Missing or invalid token.

#### `POST /api/auth/change-password`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "currentPassword": "OldPassword123!",
    "newPassword": "SecurePassword123!"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    { "message": "Password changed successfully" }
    ```
  - `400 Bad Request`: Validation failure or incorrect current password.

### 2. IT Staff Queue Endpoints

#### `GET /api/staff/tickets`
- **Headers:** `Authorization: Bearer <token>` (IT_STAFF or ADMINISTRATOR only)
- **Query Parameters:**
  - `search`: string (matches ticketNumber or summary)
  - `status`: string (enum)
  - `priority`: string (enum)
  - `ownerId`: string
  - `page`: integer (default: 1)
  - `limit`: integer (default: 10)
- **Response:** `200 OK`
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "ticketNumber": "TKT-2026-00001",
        "summary": "Cannot connect to VPN",
        "category": { "name": "Network" },
        "requestedPriority": "HIGH",
        "itPriority": "HIGH",
        "status": "OPEN",
        "owner": { "id": "uuid", "fullName": "Sarah Johnson" },
        "createdAt": "2026-09-01T10:00:00.000Z",
        "updatedAt": "2026-09-01T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5
    }
  }
  ```

### 3. Ticket Operations Endpoints

#### `PATCH /api/tickets/:id/claim`
- **Headers:** `Authorization: Bearer <token>` (IT_STAFF or ADMINISTRATOR)
- **Response:** `200 OK` (Returns ticket object with updated ownerId)

#### `PATCH /api/tickets/:id/assign`
- **Headers:** `Authorization: Bearer <token>` (IT_STAFF or ADMINISTRATOR)
- **Request Body:**
  ```json
  { "ownerId": "uuid" }
  ```
- **Responses:**
  - `200 OK`: Updated ticket object.
  - `404 Not Found`: Target owner or ticket not found.

#### `PATCH /api/tickets/:id/priority`
- **Headers:** `Authorization: Bearer <token>` (IT_STAFF or ADMINISTRATOR)
- **Request Body:**
  ```json
  { "itPriority": "LOW | MEDIUM | HIGH | URGENT" }
  ```
- **Response:** `200 OK`

#### `PATCH /api/tickets/:id/status`
- **Headers:** `Authorization: Bearer <token>` (IT_STAFF or ADMINISTRATOR)
- **Request Body:**
  ```json
  {
    "status": "TicketStatus",
    "resolutionSummary": "string (optional)"
  }
  ```
- **Responses:**
  - `200 OK`: Updated ticket object.
  - `400 Bad Request`: Invalid status transition.

#### `POST /api/tickets/:id/resolve-indication`
- **Headers:** `Authorization: Bearer <token>` (REQUESTER, ticket author only)
- **Response:** `200 OK`
  ```json
  { "requesterResolved": true }
  ```

### 4. Public Comments & Internal Notes Endpoints

#### `GET /api/tickets/:id/comments`
- **Headers:** `Authorization: Bearer <token>` (Requesters may only view owned tickets)
- **Response:** `200 OK` (Array of comments with author profile)

#### `POST /api/tickets/:id/comments`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  { "content": "string" }
  ```
- **Response:** `201 Created`

#### `GET /api/tickets/:id/notes`
- **Headers:** `Authorization: Bearer <token>` (IT_STAFF or ADMINISTRATOR only)
- **Responses:**
  - `200 OK`: Array of internal notes.
  - `403 Forbidden`: Returned for any REQUESTER token.

#### `POST /api/tickets/:id/notes`
- **Headers:** `Authorization: Bearer <token>` (IT_STAFF or ADMINISTRATOR only)
- **Request Body:**
  ```json
  { "content": "string" }
  ```
- **Response:** `201 Created`

### 5. Administrator User Management Endpoints

#### `GET /api/admin/users`
- **Headers:** `Authorization: Bearer <token>` (ADMINISTRATOR only)
- **Query Parameters:**
  - `search`: string
  - `role`: string
- **Response:** `200 OK` (Array of user records excluding passwordHash)

#### `POST /api/admin/users`
- **Headers:** `Authorization: Bearer <token>` (ADMINISTRATOR only)
- **Request Body:**
  ```json
  {
    "fullName": "Alex Thompson",
    "email": "alex.thompson@toktickit.local",
    "role": "IT_STAFF",
    "initialPassword": "TempPassword123!"
  }
  ```
- **Responses:**
  - `201 Created`: User created with `mustChangePassword: true`.
  - `409 Conflict`: Email already in use.

#### `PATCH /api/admin/users/:id`
- **Headers:** `Authorization: Bearer <token>` (ADMINISTRATOR only)
- **Request Body:**
  ```json
  {
    "fullName": "string",
    "email": "string",
    "role": "Role",
    "isActive": true
  }
  ```
- **Responses:**
  - `200 OK`: User updated.
  - `400 Bad Request`: Self-deactivation or removing the last active administrator.

#### `POST /api/admin/users/:id/reset-password`
- **Headers:** `Authorization: Bearer <token>` (ADMINISTRATOR only)
- **Request Body:**
  ```json
  { "initialPassword": "string" }
  ```
- **Response:** `200 OK` (Password updated, mustChangePassword reset to true)
# REST API Documentation: Injibara Campus Lost & Found

**Base URL:** `http://localhost:5000/api/v1` (or your local IP for mobile devices)
**Swagger UI:** `http://localhost:5000/api/docs`

---

## Standard Envelopes

### Success Envelope
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 54,
    "totalPages": 3
  }
}
```

### Error Envelope
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "phone", "message": "Phone number must be at least 9 characters" }
  ]
}
```

---

## 1. Authentication Endpoints

### `POST /auth/register`
Create a new user account. Does not allow registering privileged roles.
- **Body:**
```json
{
  "fullName": "Dawit Tadesse",
  "email": "dawit@injibara.edu.et",
  "universityId": "UGR/14022/14",
  "phone": "+251911223344",
  "department": "Computer Science",
  "password": "SecurePassword123!"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "Dawit Tadesse",
      "email": "dawit@injibara.edu.et",
      "universityId": "UGR/14022/14",
      "role": "USER"
    },
    "tokens": {
      "accessToken": "jwt.token.here",
      "refreshToken": "jwt.refresh.here"
    }
  }
}
```

### `POST /auth/login`
- **Body:**
```json
{
  "identifier": "dawit@injibara.edu.et",
  "password": "SecurePassword123!"
}
```
- **Response (200 OK):** Returns user profile and tokens.

### `POST /auth/refresh`
Rotate refresh token and retrieve a fresh short-lived access token.
- **Body:** `{ "refreshToken": "jwt.refresh.here" }`

### `POST /auth/logout`
Revoke refresh token session in database.
- **Body:** `{ "refreshToken": "jwt.refresh.here" }`

---

## 2. Items Endpoints

### `GET /items`
Public feed with pagination, keyword search, and filters.
- **Query Params:**
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
  - `type` (`LOST` or `FOUND`)
  - `categoryId` (UUID)
  - `locationId` (UUID)
  - `status` (`OPEN`, `CLAIM_PENDING`, `APPROVED`, `RETURNED`)
  - `search` (keyword search in title, description, brand, color)
  - `sortBy` (`createdAt`, `dateEvent`, `title`)
  - `sortOrder` (`asc`, `desc`)
- **Note:** Excludes `hiddenDetail` to prevent unauthorized viewers from learning ownership verification clues.

### `POST /items/upload`
Requires authentication (`Bearer <token>`). Multipart form upload for up to 3 photos.
- **Form Data:** `images` (File array, max 5MB each, JPEG/PNG/WebP).
- **Response (201):** `{ "imageUrls": ["/uploads/item-123.jpg"] }`

### `POST /items`
Requires authentication. Reports a lost or found item.
- **Body:**
```json
{
  "type": "FOUND",
  "title": "Samsung Galaxy A54 Blue",
  "description": "Found on the 2nd floor library study desk.",
  "categoryId": "category-uuid",
  "locationId": "location-uuid",
  "dateEvent": "2026-10-22T09:00:00.000Z",
  "color": "Blue",
  "brand": "Samsung",
  "hiddenDetail": "Lockscreen wallpaper is a golden retriever dog",
  "keptAt": "SECURITY_OFFICE",
  "imageUrls": ["/uploads/item-123.jpg"]
}
```

### `GET /items/:id`
Retrieve full item details. Excludes `hiddenDetail` unless the caller is the reporter, campus security officer, or administrator.

---

## 3. Claims Endpoints

### `POST /items/:id/claims`
Submit an ownership claim against an item.
- **Body:**
```json
{
  "proofDescription": "I left this phone at the library desk yesterday during exam revision.",
  "verificationAnswers": "The lockscreen wallpaper is my dog, and there is a Messi sticker on the back cover.",
  "proofImageUrl": "/uploads/proof-456.jpg",
  "lostLocation": "Central Library 2nd Floor"
}
```

### `PATCH /claims/:id/approve`
Requires role: `ADMIN` or `SECURITY_OFFICER`.
Approves claim, transitions item to `APPROVED`, cancels conflicting claims, and notifies parties.

### `PATCH /claims/:id/reject`
Requires role: `ADMIN` or `SECURITY_OFFICER`.
Rejects claim with a review note. If no other active claims exist, returns item to `OPEN`.

### `PATCH /claims/:id/handover`
Requires role: `ADMIN` or `SECURITY_OFFICER`.
Schedules physical collection location and date/time.

### `PATCH /claims/:id/confirm-return`
Requires role: `ADMIN` or `SECURITY_OFFICER`.
Confirms handover is complete, marks item and claim as `RETURNED`, logs audit entry.

---

## 4. Administration Endpoints

### `GET /admin/stats`
Calculates real-time campus statistics directly from PostgreSQL:
- Total reports, lost count, found count, returned count, open count.
- Pending claims count, approved count.
- Total campus users, active accounts.
- University recovery rate percentage.

### `GET /admin/users`
List campus directory with status and reported item counts.

### `PATCH /admin/users/:id/status`
Toggle user active status (`isActive: false` blocks login and revokes sessions).

# Follow Service

A production-ready microservice for managing follow/unfollow relationships in a distributed system. This service owns all follow-related business logic and data persistence.

## Architecture

```
Client → Follow Service ↔ PostgreSQL
```

The Follow Service is designed as a standalone microservice that:
- Manages user follow relationships
- Provides RESTful API endpoints for follow/unfollow operations
- Maintains data consistency with unique constraints and transactions
- Offers pagination for large follower lists
- Includes comprehensive error handling

## Technology Stack

**Language**: TypeScript/Node.js

**Web Framework**: Express.js

**Database**: PostgreSQL with Prisma ORM

**Why These Choices?**

1. **TypeScript**: Type safety prevents bugs, excellent tooling, and clear contracts between services
2. **Express.js**: Lightweight, fast, minimal overhead - perfect for microservices
3. **Prisma**: 
   - Type-safe database client with excellent DX
   - Automatic migrations
   - Easy unique constraint enforcement (prevents duplicate follows)
   - Transaction support
4. **PostgreSQL**: 
   - ACID guarantees for data consistency
   - Native unique constraints and indexes
   - Mature and reliable for production use

## API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Follow Operations

#### Follow a User
```http
POST /follows
Content-Type: application/json

{
  "followerId": "11111111-1111-1111-1111-111111111111",
  "followeeId": "22222222-2222-2222-2222-222222222222"
}
```

**Responses:**
- `201 Created`: Follow relationship created
- `400 Bad Request`: Invalid payload, self-follow, or duplicate follow
- `404 Not Found`: User not found
- `409 Conflict`: Already following (duplicate prevention)

#### Unfollow a User
```http
DELETE /follows
Content-Type: application/json

{
  "followerId": "11111111-1111-1111-1111-111111111111",
  "followeeId": "22222222-2222-2222-2222-222222222222"
}
```

**Responses:**
- `200 OK`: Successfully unfollowed
- `404 Not Found`: Follow relationship does not exist

#### Check if Following
```http
GET /follows/check?followerId=11111111-1111-1111-1111-111111111111&followeeId=22222222-2222-2222-2222-222222222222
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isFollowing": true
  }
}
```

### User Operations

#### Get All Users
```http
GET /users
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "username": "alice",
      "displayName": "Alice"
    }
  ]
}
```

### Follower Operations

#### Get Followers of a User
```http
GET /users/:userId/followers?limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "items": [
      {
        "id": "11111111-1111-1111-1111-111111111111",
        "username": "alice",
        "displayName": "Alice"
      }
    ]
  }
}
```

#### Get Follower Count
```http
GET /users/:userId/followers/count
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

### Following Operations

#### Get Following (Users That User Follows)
```http
GET /users/:userId/following?limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "items": [
      {
        "id": "22222222-2222-2222-2222-222222222222",
        "username": "bob",
        "displayName": "Bob"
      }
    ]
  }
}
```

#### Get Following Count
```http
GET /users/:userId/following/count
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

## Database Schema

```sql
-- Users Table
CREATE TABLE "User" (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  displayName TEXT,
  createdAt TIMESTAMP DEFAULT now()
);

-- Follows Table
CREATE TABLE "Follow" (
  id UUID PRIMARY KEY,
  followerId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  followeeId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  createdAt TIMESTAMP DEFAULT now(),
  UNIQUE (followerId, followeeId)
);

-- Indexes for performance
CREATE INDEX idx_follow_followerId ON "Follow"(followerId);
CREATE INDEX idx_follow_followeeId ON "Follow"(followeeId);
```

## Error Handling

The service implements comprehensive error handling:

| Error Code | HTTP Status | Description |
|-----------|------------|-------------|
| SELF_FOLLOW | 400 | User trying to follow themselves |
| DUPLICATE_FOLLOW | 409 | User already following the target user |
| USER_NOT_FOUND | 404 | One or both user IDs don't exist |
| FOLLOW_NOT_FOUND | 404 | Follow relationship doesn't exist |
| INVALID_INPUT | 400 | Validation error in request |
| INTERNAL_ERROR | 500 | Unexpected server error |

All errors return structured JSON responses:
```json
{
  "success": false,
  "message": "Meaningful error description",
  "code": "ERROR_CODE"
}
```

## Local Development

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (for PostgreSQL)
- npm or yarn

### Setup

1. **Clone the repository**
```bash
cd follow-service
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
cp .env.example .env
```

4. **Start PostgreSQL with Docker**
```bash
docker-compose up -d postgres
```

5. **Run migrations**
```bash
npm run prisma:migrate
```

6. **Start the service**
```bash
npm run dev
```

The service will be available at `http://localhost:3000`

### Database Operations

**Create new migration**
```bash
npm run prisma:migrate -- --name migration_name
```

**View database UI**
```bash
npm run prisma:studio
```

**Reset database**
```bash
npx prisma migrate reset
```

## Testing

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Generate coverage report
```bash
npm run test:coverage
```

### Test categories
- Unit tests for service business logic
- Integration tests for database interactions
- Error handling tests for edge cases

## Production Deployment

### Using Docker Compose (Full Stack)
```bash
docker-compose up -d
```

This will:
1. Build the Follow Service image
2. Start PostgreSQL database
3. Run database migrations automatically
4. Start the Follow Service

### Manual Docker Deployment

1. **Build image**
```bash
docker build -t follow-service:latest .
```

2. **Run container**
```bash
docker run -d \
  --name follow-service \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@db-host:5432/follow_service \
  --network microservices \
  follow-service:latest
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| NODE_ENV | Environment | development/production |
| PORT | Server port | 3000 |
| DATABASE_URL | PostgreSQL connection | postgresql://user:pass@host:port/db |

### Production Considerations

1. **Security**
   - Use environment variables for sensitive data
   - Implement JWT authentication (hook provided in middleware)
   - Enable HTTPS/TLS
   - Use strong database passwords

2. **Scaling**
   - Run multiple instances behind a load balancer
   - Use connection pooling for database (PGBouncer)
   - Implement caching for follower counts (Redis)
   - Use read replicas for follower list queries

3. **Monitoring**
   - Log all requests and errors
   - Monitor database query performance
   - Set up alerts for high error rates
   - Track API latency metrics

4. **Database**
   - Regular backups
   - Monitor connection pool usage
   - Tune indexes for query performance
   - Archive old follow history if needed

## Performance Characteristics

### Strengths
- **O(1) lookups** for follow relationship checks (using unique index)
- **Efficient pagination** for follower/following lists
- **Atomic operations** for follow/unfollow (no race conditions)
- **Horizontal scalability** (stateless design)

### Key Indexes
```sql
-- Unique constraint serves as index
ALTER TABLE "Follow" ADD CONSTRAINT follow_unique UNIQUE (followerId, followeeId);

-- Support queries by follower
CREATE INDEX idx_follow_followerId ON "Follow"(followerId);

-- Support queries by followee
CREATE INDEX idx_follow_followeeId ON "Follow"(followeeId);
```

## Design Decisions

### 1. Unique Constraint for Duplicate Prevention
We use a database-level unique constraint on `(followerId, followeeId)` rather than application-level checking because:
- Prevents race conditions in concurrent scenarios
- Guaranteed correctness even with multiple instances
- Database enforces it as a hard constraint

### 2. UUID for Primary Keys
- Better for distributed systems
- No auto-increment issues across shards
- Better for privacy (can't guess IDs)

### 3. Soft Deletes Not Used
- Hard deletes with CASCADE are appropriate for follows
- Reduces database bloat
- Archive separately if audit trail needed

### 4. Pagination with Offset/Limit
- Simple and straightforward
- Works well for UI pagination
- For very large scale, can migrate to cursor-based pagination

### 5. Service Isolation
- Follow Service doesn't directly manage user accounts
- Trusts user IDs provided (assumes validation at gateway)
- Decouples from user service changes

## Integration with GraphQL Gateway

The GraphQL Gateway calls this service via HTTP:

```typescript
// Example from GraphQL resolver
const response = await fetch('http://follow-service:3000/api/v1/follows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ followerId, followeeId })
});
```

The gateway:
- Handles authentication and user context
- Transforms GraphQL queries to REST calls
- Aggregates responses from multiple services
- Provides unified error handling to clients

## License

ISC

## Support

For issues or questions, refer to the main repository's issue tracker.

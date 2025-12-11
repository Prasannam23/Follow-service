# Follow Service - Technical Details & Development Guide

## Project Structure

```
follow-service/
├── src/
│   ├── server.ts                 # Server startup and graceful shutdown
│   ├── app.ts                    # Express app configuration
│   ├── routes.ts                 # API route definitions
│   ├── controllers/
│   │   └── follow.controller.ts  # HTTP request handlers
│   ├── services/
│   │   └── follow.service.ts     # Business logic (singleton)
│   ├── middleware/
│   │   ├── errorHandler.ts       # Error handling middleware
│   │   └── logging.ts            # Request logging middleware
│   ├── utils/
│   │   ├── validators.ts         # Zod validation schemas
│   │   └── errors.ts             # Error definitions and factory
│   ├── db/
│   │   └── prisma.ts             # Prisma client singleton
│   └── __tests__/
│       └── follow.service.spec.ts # Unit tests
├── prisma/
│   ├── schema.prisma             # Database schema definition
│   ├── migrations/               # Migration history
│   └── seed.ts                   # Database seeding script
├── dist/                         # Compiled JavaScript (generated)
├── node_modules/                 # Dependencies (generated)
├── .env                          # Environment variables (local)
├── .env.example                  # Example environment variables
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── jest.config.js                # Jest testing configuration
├── .eslintrc.json                # ESLint configuration
├── Dockerfile                    # Docker container definition
├── docker-compose.yml            # Docker Compose orchestration
├── README.md                     # Service overview
├── ARCHITECTURE.md               # Architecture documentation
└── TECHNICAL_DETAILS.md          # This file
```

## Installation & Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm 10+

### Local Development Setup

```bash
# 1. Install dependencies
cd follow-service
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your database URL

# 3. Run migrations
npm run prisma:migrate

# 4. Seed database with sample users
npm run seed

# 5. Start development server
npm run dev
```

## Environment Variables

```bash
# Database connection string
DATABASE_URL="postgresql://user:password@localhost:5432/follow_service"

# Server port (optional, default: 3000)
PORT=3000

# Node environment
NODE_ENV="development" # or "production"
```

## Available Scripts

### Development
```bash
# Start dev server with hot reload
npm run dev

# Watch mode tests
npm run test:watch

# Run linter
npm run lint
```

### Build & Production
```bash
# Compile TypeScript to JavaScript
npm run build

# Start production server (requires build first)
npm start

# Run production build and start
npm run build && npm start
```

### Database
```bash
# Create and apply new migration
npm run prisma:migrate

# Generate Prisma client (auto-run on install)
npm run prisma:generate

# Open Prisma Studio GUI
npm run prisma:studio

# Seed database with sample data
npm run seed
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Health Check
```http
GET /health

Response: 200 OK
{
  "status": "ok"
}
```

### Follow Operations

#### 1. Follow a User
```http
POST /follows
Content-Type: application/json

{
  "followerId": "uuid-of-follower",
  "followeeId": "uuid-of-user-to-follow"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User followed successfully",
  "data": {
    "id": "follow-relationship-uuid"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid UUID format or self-follow attempt
- `404 Not Found`: User doesn't exist
- `409 Conflict`: Already following this user

---

#### 2. Unfollow a User
```http
DELETE /follows
Content-Type: application/json

{
  "followerId": "uuid-of-follower",
  "followeeId": "uuid-of-user-to-unfollow"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User unfollowed successfully"
}
```

**Error Responses:**
- `404 Not Found`: Follow relationship doesn't exist

---

### User Operations

#### 3. Get All Users
```http
GET /users
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "username": "alice",
      "displayName": "Alice Wonder"
    },
    {
      "id": "22222222-2222-2222-2222-222222222222",
      "username": "bob",
      "displayName": "Bob Smith"
    },
    {
      "id": "33333333-3333-3333-3333-333333333333",
      "username": "carol",
      "displayName": "Carol Jones"
    }
  ]
}
```

---

### Follower/Following Operations

#### 4. Get User's Followers
```http
GET /users/:userId/followers?limit=20&offset=0
```

**Query Parameters:**
- `limit` (optional): Number of results (1-100, default: 20)
- `offset` (optional): Skip N records (default: 0)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "items": [
      {
        "id": "44444444-4444-4444-4444-444444444444",
        "username": "dave",
        "displayName": "Dave Wilson"
      }
    ],
    "limit": 20,
    "offset": 0
  }
}
```

---

#### 5. Get User's Following List
```http
GET /users/:userId/following?limit=20&offset=0
```

**Query Parameters:**
- `limit` (optional): Number of results (1-100, default: 20)
- `offset` (optional): Skip N records (default: 0)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 30,
    "items": [
      {
        "id": "22222222-2222-2222-2222-222222222222",
        "username": "bob",
        "displayName": "Bob Smith"
      }
    ],
    "limit": 20,
    "offset": 0
  }
}
```

---

### Count Operations

#### 6. Get Follower Count
```http
GET /users/:userId/followers/count
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 45
  }
}
```

---

#### 7. Get Following Count
```http
GET /users/:userId/following/count
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 30
  }
}
```

---

### Relationship Check

#### 8. Check if Following
```http
GET /follows/check?followerId=uuid1&followeeId=uuid2
```

**Query Parameters:**
- `followerId`: UUID of the potential follower
- `followeeId`: UUID of the potential followee

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isFollowing": true
  }
}
```

---

## Seed Script

The seed script initializes the database with sample data.

### Location
```
prisma/seed.ts
```

### Seeded Data

```typescript
// 3 predefined users
const alice = { username: 'alice', displayName: 'Alice Wonder' };
const bob = { username: 'bob', displayName: 'Bob Smith' };
const carol = { username: 'carol', displayName: 'Carol Jones' };

// Sample follow relationships
alice follows bob and carol
bob follows carol
```

### Running the Seed

```bash
npm run seed
```

### Seed Output Example
```
✓ Users seeded
✓ Initial follow relationships created
✓ Database seeding completed
```

### Re-seeding

```bash
# Delete all data and reseed
npx prisma migrate reset

# Or just clear and reseed
npx prisma db seed
```

## Database Schema Details

### Users Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique user identifier |
| `username` | VARCHAR(255) | NOT NULL, UNIQUE | Login username |
| `displayName` | VARCHAR(255) | NULLABLE | User's display name |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |

### Follows Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique follow relationship ID |
| `followerId` | UUID | NOT NULL, FK → User.id, ON DELETE CASCADE | User who follows |
| `followeeId` | UUID | NOT NULL, FK → User.id, ON DELETE CASCADE | User being followed |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | When relationship was created |

**Unique Constraint:**
```sql
UNIQUE(followerId, followeeId)
```
Prevents duplicate follow relationships.

**Check Constraint:**
```sql
CHECK(followerId != followeeId)
```
Prevents users from following themselves.

**Indexes:**
```sql
CREATE INDEX idx_follow_followerId ON "Follow"(followerId);
CREATE INDEX idx_follow_followeeId ON "Follow"(followeeId);
```

## Validation Schemas

### FollowRequestSchema
```typescript
{
  followerId: z.string().uuid('followerId must be a valid UUID'),
  followeeId: z.string().uuid('followeeId must be a valid UUID')
}
```

### PaginationSchema
```typescript
{
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0)
}
```

## Error Codes & Responses

### Error Code Reference

| Code | HTTP Status | Meaning |
|------|------------|---------|
| `SELF_FOLLOW` | 400 | User attempted to follow themselves |
| `USER_NOT_FOUND` | 404 | Referenced user doesn't exist |
| `DUPLICATE_FOLLOW` | 409 | Already following this user |
| `FOLLOW_NOT_FOUND` | 404 | Follow relationship doesn't exist |
| `INVALID_INPUT` | 400 | Input validation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Error Response Format

```json
{
  "success": false,
  "message": "User not found",
  "code": "USER_NOT_FOUND"
}
```

## Testing

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm test:watch

# With coverage
npm test:coverage
```

### Test Structure

```
src/__tests__/
└── follow.service.spec.ts    # Service business logic tests
```

### Example Test

```typescript
describe('FollowService', () => {
  const service = new FollowService();

  it('should successfully follow a user', async () => {
    const result = await service.followUser({
      followerId: 'user-1',
      followeeId: 'user-2'
    });
    expect(result).toHaveProperty('id');
  });

  it('should throw error on self-follow', async () => {
    await expect(
      service.followUser({
        followerId: 'user-1',
        followeeId: 'user-1'
      })
    ).rejects.toThrow();
  });
});
```

## Docker Build & Run

### Build Docker Image

```bash
docker build -t follow-service:latest .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@postgres:5432/follow_service" \
  follow-service:latest
```

### Docker Compose

```bash
docker compose up -d
```

## Code Quality

### Linting

```bash
npm run lint
```

ESLint rules enforce:
- No unused variables
- Proper TypeScript typing
- Consistent code style

### Type Checking

TypeScript compiler (`tsc`) ensures:
- All variables have types
- No implicit `any`
- Function parameters and returns properly typed

## Debugging

### Enable Debug Logging

```bash
# In development
DEBUG=* npm run dev
```

### Debug with VS Code

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Follow Service",
      "program": "${workspaceFolder}/follow-service/src/server.ts",
      "preLaunchTask": "tsc: build",
      "outFiles": ["${workspaceFolder}/follow-service/dist/**/*.js"]
    }
  ]
}
```

## Performance Tips

### Database Query Optimization
- Use pagination for large result sets
- Indexes on `followerId` and `followeeId` ensure fast lookups
- Prisma connection pooling reuses connections

### Caching Strategy (Future)
```typescript
// Cache follower counts in Redis
const cacheKey = `followers:${userId}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;

const count = await followService.getFollowerCount(userId);
await redis.setex(cacheKey, 3600, count);
return count;
```

### Connection Pool Configuration
```typescript
// In .env
DATABASE_URL="postgresql://...?pool_size=20&max_overflow=10"
```

## Troubleshooting

### Database Connection Issues
```
Error: connect ECONNREFUSED
```
**Solution**: Ensure PostgreSQL is running and DATABASE_URL is correct.

### Prisma Migration Issues
```
Error: Migration failed
```
**Solution**:
```bash
npx prisma migrate resolve --rolled-back
npx prisma migrate deploy
```

### Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution**:
```bash
# Kill process on port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev/)

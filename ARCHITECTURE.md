# Follow Service - Architecture & Design

## System Overview

The Follow Service is a dedicated microservice responsible for managing all follow/unfollow relationships in the system. It follows a clean, layered architecture pattern with clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                   │
│                    (GraphQL Gateway)                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Follow Service                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              HTTP/REST API Layer                            │ │
│  │  (Express Router + Controllers)                             │ │
│  └────────┬───────────────────────────────────────────────────┘ │
│           │                                                       │
│  ┌────────▼───────────────────────────────────────────────────┐ │
│  │        Business Logic Layer                                 │ │
│  │    (FollowService Class with Business Rules)               │ │
│  │    - Validation                                             │ │
│  │    - Error Handling                                         │ │
│  │    - Follow/Unfollow Logic                                  │ │
│  └────────┬───────────────────────────────────────────────────┘ │
│           │                                                       │
│  ┌────────▼───────────────────────────────────────────────────┐ │
│  │        Data Persistence Layer                               │ │
│  │     (Prisma ORM)                                            │ │
│  │    - Query Generation                                       │ │
│  │    - Transaction Management                                 │ │
│  └────────┬───────────────────────────────────────────────────┘ │
│           │                                                       │
└───────────┼───────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                           │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │    users     │  │    follows   │                             │
│  │              │  │              │                             │
│  │ - id (PK)    │  │ - id (PK)    │                             │
│  │ - username   │  │ - followerId │──┐                          │
│  │ - displayName│  │ - followeeId │──┼─→ FK to users            │
│  │ - createdAt  │  │ - createdAt  │  │                          │
│  └──────────────┘  └──────────────┘  └─→ Unique(followerId,    │
│                                           followeeId)           │
└─────────────────────────────────────────────────────────────────┘
```

## Layered Architecture

### 1. **Presentation Layer (REST API)**
- **File**: `src/routes.ts`, `src/controllers/follow.controller.ts`
- **Responsibility**: Handle HTTP requests and responses
- **Operations**:
  - Route definition and HTTP method mapping
  - Request validation and parsing
  - Response formatting and status codes
  - Error response handling

### 2. **Business Logic Layer (Service)**
- **File**: `src/services/follow.service.ts`
- **Responsibility**: Implement core business rules
- **Operations**:
  - User existence validation
  - Self-follow prevention
  - Duplicate follow detection
  - Follower/Following retrieval with pagination
  - Follow counts calculation
  - Relationship status checking

### 3. **Data Persistence Layer (ORM)**
- **File**: `src/db/prisma.ts`
- **Responsibility**: Database operations and queries
- **Operations**:
  - User and Follow record CRUD operations
  - Transaction management
  - Constraint enforcement
  - Query optimization

### 4. **Cross-Cutting Concerns**
- **Middleware**: Logging, Error Handling
- **Utilities**: Validation Schemas, Error Objects
- **Configuration**: Environment variables, Database connection

## Technology Stack

### Core Technologies

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | Node.js | 20+ | JavaScript runtime |
| **Language** | TypeScript | 5.3+ | Type-safe JavaScript |
| **Web Framework** | Express.js | 4.18+ | HTTP server & routing |
| **Database** | PostgreSQL | 16+ | Relational database |
| **ORM** | Prisma | 5.7+ | Database abstraction |
| **Validation** | Zod | 3.22+ | Schema validation |

### Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| ts-node-dev | 2.0+ | Development server with hot reload |
| Jest | 29.7+ | Unit testing framework |
| ts-jest | 29.1+ | Jest TypeScript support |
| ESLint | 8.56+ | Code linting |
| TypeScript ESLint | 6.16+ | TypeScript linting |

## Design Patterns

### 1. **Singleton Pattern**
```typescript
// Follow Service exported as singleton instance
export const followService = new FollowService();
```
Ensures single instance is used throughout the application.

### 2. **Factory Pattern (Implicit)**
```typescript
// Error creation factory
export const createError = (
  statusCode: number,
  message: string,
  code: string
): AppError => {
  return new AppError(statusCode, message, code);
};
```
Centralizes error object creation.

### 3. **Middleware Chain Pattern**
```typescript
app.use(express.json());
app.use(loggingMiddleware);
app.use('/api/v1', routes);
app.use(errorHandler);
```
Requests flow through middleware chain.

### 4. **Error Handling Pattern**
```typescript
// Custom error class
class AppError extends Error {
  constructor(public statusCode, public message, public code) {}
}

// Error factory
const createError = (...) => new AppError(...);

// Async error wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```
Consistent error handling across the service.

## Data Flow

### Follow User Flow
```
POST /api/v1/follows
  ↓
Controller validates input (Zod schema)
  ↓
Service.followUser(request)
  ├─ Check self-follow (throwable error)
  ├─ Verify both users exist (queries DB)
  ├─ Create follow relationship (unique constraint enforced by DB)
  └─ Return follow ID
  ↓
Controller formats response (201 Created)
  ↓
Client receives { success: true, data: { id: "..." } }
```

### Get Followers Flow
```
GET /api/v1/users/:userId/followers?limit=20&offset=0
  ↓
Controller validates params (Zod schema)
  ↓
Service.getFollowers(userId, pagination)
  ├─ Verify user exists
  ├─ Query total count
  ├─ Query with pagination
  └─ Extract follower details from joins
  ↓
Controller formats response
  ↓
Client receives { success: true, data: { total, items, ... } }
```

## Database Schema

### Users Table
```sql
CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL UNIQUE,
  displayName VARCHAR(255),
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### Follows Table
```sql
CREATE TABLE "Follow" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  followerId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  followeeId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  createdAt TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT follow_unique UNIQUE(followerId, followeeId),
  CONSTRAINT follow_no_self_follow CHECK(followerId != followeeId)
);

CREATE INDEX idx_follow_followerId ON "Follow"(followerId);
CREATE INDEX idx_follow_followeeId ON "Follow"(followeeId);
```

## Key Design Decisions

### 1. **REST over GraphQL for Service**
- **Why**: Direct service calls are simpler, faster
- **Benefit**: Reduces network hops when called from gateway
- **Tradeoff**: Gateway provides GraphQL abstraction to clients

### 2. **UUID for IDs**
- **Why**: Database-generated, universally unique, scalable across shards
- **Benefit**: No coordination needed for ID generation
- **Alternative**: Could use auto-increment (simpler but less scalable)

### 3. **Soft Constraints in Code + Hard Constraints in DB**
- **Why**: Defense in depth
- **Code Level**: Validates before database call (faster rejection)
- **DB Level**: Prevents invalid data even if code has bugs

### 4. **Pagination by Offset/Limit**
- **Why**: Simple, stateless, familiar to clients
- **Tradeoff**: Not ideal for large result sets (slower as offset grows)
- **Alternative**: Cursor-based pagination for better performance at scale

### 5. **Prisma ORM**
- **Why**: Type-safe, excellent DX, migrations built-in
- **Benefit**: Generates schemas, prevents SQL injection
- **Tradeoff**: Slight performance overhead vs. raw SQL

## Performance Considerations

### Database Indexes
```sql
-- Foreign key indexes for efficient joins
CREATE INDEX idx_follow_followerId ON "Follow"(followerId);
CREATE INDEX idx_follow_followeeId ON "Follow"(followeeId);

-- Composite index for lookups
CREATE UNIQUE INDEX idx_follow_composite ON "Follow"(followerId, followeeId);
```

### Query Optimization
- **Pagination**: Always limit results to prevent large transfers
- **Projection**: Select only needed columns
- **Joins**: Leverage relational data to fetch related users in single query

### Connection Pooling
```typescript
// Prisma handles connection pooling automatically
// Configurable via DATABASE_URL environment variable
```

## Security Considerations

### Input Validation
- All user inputs validated with Zod schemas
- Type checking at compile time with TypeScript
- Runtime validation prevents invalid data

### SQL Injection Prevention
- Prisma parameterizes all queries automatically
- No string concatenation in queries

### Rate Limiting
- Not implemented (should be added in gateway or load balancer)

### CORS
- Not restricted (handled by gateway or API gateway)

## Error Handling Strategy

### Error Types
```typescript
enum ErrorCode {
  SELF_FOLLOW = 'SELF_FOLLOW',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  DUPLICATE_FOLLOW = 'DUPLICATE_FOLLOW',
  FOLLOW_NOT_FOUND = 'FOLLOW_NOT_FOUND',
  INVALID_INPUT = 'INVALID_INPUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "User not found",
  "code": "USER_NOT_FOUND"
}
```

### Handling Strategy
1. **Validation Errors**: 400 Bad Request
2. **Not Found Errors**: 404 Not Found
3. **Conflict Errors**: 409 Conflict (duplicate follow)
4. **Server Errors**: 500 Internal Server Error

## Scalability & Deployment

### Horizontal Scaling
- Stateless design allows multiple instances
- Load balancer distributes requests
- All instances connect to same PostgreSQL database

### Database Scaling
- **Read Replicas**: Add read-only replicas for analytics
- **Sharding**: Partition follows by user ID if single DB becomes bottleneck
- **Connection Pooling**: Prisma manages connection pool efficiently

### Caching (Future)
- Cache follower/following counts in Redis
- Invalidate on follow/unfollow events
- Significant performance improvement for popular users

## Deployment Architecture

```
┌──────────────────────────────────────────────┐
│           API Gateway / Load Balancer         │
└──────────────────┬───────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │  Pod 1 │ │  Pod 2 │ │  Pod 3 │
    │ Follow │ │ Follow │ │ Follow │
    │Service │ │Service │ │Service │
    └────────┘ └────────┘ └────────┘
        │          │          │
        └──────────┼──────────┘
                   │
        ┌──────────▼──────────┐
        │    PostgreSQL DB    │
        │  (Primary + Read    │
        │   Replicas)         │
        └─────────────────────┘
```

## Development Workflow

1. **Code Changes**: TypeScript files in `src/`
2. **Compilation**: `npm run build` → `dist/`
3. **Local Testing**: `npm run dev` (with hot reload)
4. **Testing**: `npm test` (Jest with Prisma mock)
5. **Docker Build**: Multi-stage build with production optimization
6. **Deployment**: Container registry → Orchestration platform

## Monitoring & Observability

### Logging
- Console logging for startup and operations
- Structured logging ready (can be enhanced with Winston/Pino)

### Health Check
```
GET /health
Response: { "status": "ok" }
```

### Future Enhancements
- Request/response logging middleware
- Performance metrics collection
- Error tracking (Sentry)
- Distributed tracing (Jaeger)

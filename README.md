# NestJS User Management API

A full-stack microservices application built with NestJS, featuring JWT authentication, file uploads to S3/MinIO, balance transfers with Kafka events, and real-time WebSocket notifications.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client (HTTP / WS)                 │
└────────────────┬────────────────────────┬───────────────┘
                 │ REST                   │ WebSocket
                 ▼                        ▼
┌───────────────────────┐   ┌──────────────────────────────┐
│    user-service        │   │   notification-service        │
│    (port 3000)         │   │   (port 3001)                 │
│                        │   │                               │
│  Auth (JWT)            │   │  WebSocket Gateway            │
│  User CRUD             │──►│  Kafka Consumer               │
│  Avatar Upload (S3)    │   │  MongoDB persistence          │
│  Balance Transfer      │   │                               │
│  Bull Queue (Redis)    │   └──────────────────────────────┘
└───────────┬───────────┘
            │ Kafka event: transfer-completed
            ▼
┌─────────────────────────┐
│  Infrastructure          │
│  PostgreSQL  │  Redis    │
│  MinIO/S3    │  Kafka    │
│  MongoDB                 │
└─────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 (monorepo) |
| Language | TypeScript |
| Primary DB | PostgreSQL + TypeORM (migrations) |
| Caching | Redis (cache-manager) |
| Queue | Bull + Redis |
| File Storage | MinIO / AWS S3 |
| Messaging | Kafka (KraftMode, no ZooKeeper) |
| Notifications DB | MongoDB (Mongoose) |
| Auth | JWT (access + refresh tokens) |
| Real-time | Socket.IO WebSocket |
| Docs | Swagger / OpenAPI |
| Rate Limiting | @nestjs/throttler |

## Quick Start

### Prerequisites

- Node.js 20+
- Yarn
- Docker & Docker Compose

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd nest-user-api
yarn install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start infrastructure

```bash
docker-compose up -d
```

Wait for all services to be healthy (~15 seconds), then:

### 4. Create MinIO bucket

Open MinIO Console at **http://localhost:9001**, log in with your `MINIO_USER` / `MINIO_PASSWORD`, and create a bucket named `main` (or whatever you set in `S3_BUCKET_NAME`).

### 5. Run migrations

```bash
yarn migration:run
```

### 6. Start services

```bash
# Terminal 1 — user-service (REST API)
yarn start user-service

# Terminal 2 — notification-service (WebSocket + Kafka)
yarn start notification-service
```

## API Reference

Interactive docs available at **http://localhost:3000/docs** (Swagger UI).

### Authentication

> Auth endpoints are rate-limited to **5 requests per minute** per IP.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive tokens |
| POST | `/auth/refresh` | Refresh access token |

### Profile Management

> All endpoints below require `Authorization: Bearer <access_token>`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/profile/my` | Get your profile |
| GET | `/profile/users` | Paginated user list (`?page=1&limit=10`) |
| GET | `/profile/findByLogin` | Search users by login (`?search=alice`) |
| PATCH | `/profile/update` | Update your profile |
| DELETE | `/profile/delete` | Soft-delete your account |
| GET | `/profile/user/activity` | Active users with 3+ avatars (`?minAge=18&maxAge=40`) |

### Avatar Management

| Method | Endpoint | Description |
|---|---|---|
| POST | `/avatars/upload` | Upload avatar (JPEG/PNG, max 10MB, max 5 per user) |
| DELETE | `/avatars/delete/:id` | Soft-delete an avatar |
| GET | `/avatars/myAvatars` | List your active avatars |

### Balance & Transfers

| Method | Endpoint | Description |
|---|---|---|
| POST | `/transfer/send` | Transfer funds to another user |
| POST | `/balance-reset` | Manually trigger balance reset |

### WebSocket Notifications

Connect to `ws://localhost:3001?token=<access_token>`.

The server emits a `notification` event whenever you receive a transfer:

```json
{
  "message": "You received: 100 from alice",
  "data": {
    "fromUserId": "...",
    "fromUserLogin": "alice",
    "amount": 100,
    "transactionId": "txn_...",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Running Tests

```bash
# Unit tests
yarn test

# Unit tests with coverage
yarn test:cov

# E2E tests (requires running infrastructure)
yarn test:e2e
```

## Docker Build

```bash
# Build user-service
docker build -f Dockerfile.user-service -t nest-user-service .

# Build notification-service
docker build -f Dockerfile.notification-service -t nest-notification-service .
```

## Database Migrations

```bash
yarn migration:run      # Apply all pending migrations
yarn migration:revert   # Revert the last migration
yarn migration:generate # Generate a new migration from entity changes
```

## Project Structure

```
nest-user-api/
├── apps/
│   ├── user-service/          # REST API (port 3000)
│   │   └── src/
│   │       ├── auth/          # JWT auth (register, login, refresh)
│   │       ├── user/          # User CRUD, repository, caching
│   │       ├── avatar/        # File upload, S3 integration
│   │       ├── transfer/      # Balance transfers + Kafka producer
│   │       ├── balance-reset/ # Scheduled balance reset (Bull)
│   │       └── providers/s3/  # AWS S3 client adapter
│   └── notification-service/  # WebSocket + Kafka (port 3001)
│       └── src/notification/
│           ├── schemas/       # MongoDB notification schema
│           ├── guards/        # WS JWT auth guard
│           └── dto/           # Validation DTOs
├── libs/common/               # Shared: JwtPayload, CurrentUser decorator
├── db/
│   ├── data-source.ts         # TypeORM CLI config
│   └── migrations/            # Database migrations
├── test/                      # E2E tests
├── docker-compose.yml         # Full local infrastructure
├── Dockerfile.user-service
├── Dockerfile.notification-service
└── .env.example               # Environment variables template
```

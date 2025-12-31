# NestJS User Management API

A comprehensive user management system built with NestJS featuring authentication, file uploads, balance transfers, and
background job processing.

## Features:

### Authentication & Security.

- **JWT-based authentication** with access & refresh tokens
- **User registration** with email/username validation
- **Secure password hashing** using bcrypt
- **Token refresh mechanism** for seamless sessions

### User Management.

- **CRUD operations** for user profiles
- **Soft delete functionality** for user accounts
- **Advanced search** with pagination and filtering
- **Age-based filtering** with database indexes

### Avatar Management.

- **File upload** to MinIO/S3 storage (JPEG/PNG ≤10MB)
- **Custom validation** for file type and size
- **Soft delete for avatars** (max 5 active per user)
- **UUID-based file naming** for security

### Financial Features.

- **Balance system** with decimal precision (2 decimal places)
- **Secure money transfers** between users
- **Transaction support** with `typeorm-transactional`
- **Balance validation** (no negative balances, no self-transfers)

### Performance & Scalability.

- **Redis caching** for frequently accessed endpoints (30s TTL)
- **Background job processing** with Bull queues
- **Database indexing** for optimized queries
- **Scheduled tasks** for automated operations

### Developer Experience.

- **Complete Swagger/OpenAPI documentation**
- **Comprehensive logging** throughout all modules
- **ESLint + Prettier** with Husky pre-commit hooks
- **Docker-compose** for easy local development

## API Endpoints:

### Authentication.

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token

### Profile Management.

- `GET /profile/my` - Get current user profile
- `GET /profile/users` - Get users with pagination
- `GET /profile/findByLogin` - Search users by login
- `PATCH /profile/update` - Update user profile
- `DELETE /profile/delete` - Soft delete user
- `GET /profile/user/activity` - Get active users with avatars

### Avatar Management.

- `POST /avatars/upload` - Upload avatar
- `DELETE /avatars/delete/:id` - Soft delete avatar
- `GET /avatars/myAvatars` - Get user's avatars

### Balance Operations.

- `POST /transfer/send` - Transfer balance to another user
- `POST /balance-reset` - Reset all user balances (manual trigger)
# Buddy Script Backend

## Project Summary

Buddy Script is a social media backend API built with Node.js and TypeScript. The application provides a complete RESTful API for a social media platform featuring user authentication, posts with images, comments with nested replies, and a Facebook-style multi-reaction system. The system supports five reaction types (Like, Love, Haha, Care, Angry) with mandatory user tracking, cursor-based pagination, and comprehensive security features including JWT authentication and rate limiting.

## Technologies Used

### Core Framework
- Node.js: JavaScript runtime environment
- Express.js: Web application framework
- TypeScript: Type-safe JavaScript superset

### Database
- MongoDB: NoSQL database
- Mongoose: MongoDB object modeling for Node.js

### Authentication & Security
- JSON Web Token (JWT): Token-based authentication
- bcryptjs: Password hashing
- cookie-parser: Cookie parsing middleware
- express-rate-limit: Rate limiting middleware
- CORS: Cross-origin resource sharing

### File Upload & Storage
- Multer: Multipart/form-data handling
- Cloudinary: Cloud-based image storage and management

### Development Tools
- nodemon: Development server with auto-reload
- ts-node: TypeScript execution environment
- Prettier: Code formatter
- swagger-jsdoc: Swagger documentation generator
- swagger-ui-express: Interactive Swagger UI

## Folder Architecture

```
backend/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── index.ts               # Application entry point
│   ├── constants.ts           # Application constants and enums
│   ├── controllers/           # Request handlers
│   │   ├── user.controller.ts
│   │   ├── post.controller.ts
│   │   ├── comment.controller.ts
│   │   ├── like.controller.ts
│   │   └── healthcheck.controller.ts
│   ├── routes/                # API route definitions
│   │   ├── user.route.ts
│   │   ├── post.route.ts
│   │   ├── comment.route.ts
│   │   ├── like.route.ts
│   │   ├── healthcheck.route.ts
│   │   └── swagger.route.ts
│   ├── config/                # Configuration files
│   │   └── swagger.ts         # Swagger documentation configuration
│   ├── models/                # Database schemas
│   │   ├── user.model.ts
│   │   ├── post.model.ts
│   │   ├── comment.model.ts
│   │   ├── like.model.ts
│   │   └── types/
│   │       └── index.ts       # TypeScript interfaces
│   ├── middlewares/           # Custom middleware functions
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── multer.middleware.ts
│   ├── utils/                 # Utility functions
│   │   ├── AsyncHandler.ts
│   │   ├── AppError.ts
│   │   ├── AppResponse.ts
│   │   └── Cloudinary.ts
│   ├── db/                    # Database connection
│   │   └── index.ts
│   └── types/                 # TypeScript type definitions
│       └── index.ts
├── dist/                      # Compiled JavaScript output
├── public/                    # Static files
│   └── temp/                  # Temporary file storage
├── node_modules/              # Dependencies
├── package.json               # Project dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── API_DOCUMENTATION.md       # Complete API documentation
└── README.md                  # This file
```

## Nomenclature

### File Naming Conventions
- Controllers: `[resource].controller.ts` (e.g., `user.controller.ts`)
- Routes: `[resource].route.ts` (e.g., `user.route.ts`)
- Models: `[resource].model.ts` (e.g., `user.model.ts`)
- Middlewares: `[purpose].middleware.ts` (e.g., `auth.middleware.ts`)
- Utilities: `[Purpose].ts` (e.g., `AsyncHandler.ts`)

### Code Naming Conventions
- Variables and functions: camelCase (e.g., `getCurrentUser`, `userId`)
- Constants and enums: PascalCase (e.g., `ReactionType`, `Visibility`)
- Types and interfaces: PascalCase (e.g., `UserSchema`, `AuthenticatedRequest`)
- Database models: PascalCase singular (e.g., `User`, `Post`, `Comment`)

### API Endpoint Conventions
- Base path: `/api`
- Resource routes: `/api/[resource]` (e.g., `/api/users`, `/api/posts`)
- Nested resources: `/api/[parent]/[child]` (e.g., `/api/comments/post/:postId`)
- HTTP methods: GET (read), POST (create), PATCH (update), DELETE (remove)

## Scripts

### Development
```bash
npm run dev
```
Starts the development server with nodemon and ts-node. The server automatically restarts on file changes.

### Build
```bash
npm run build
```
Compiles TypeScript source files to JavaScript in the `dist/` directory.

### Production
```bash
npm start
```
Runs the compiled JavaScript from the `dist/` directory. Requires running `npm run build` first.

### Swagger Documentation
The API documentation is automatically available at `/api-docs` when the server is running. No additional command is needed to generate documentation as it is built-in.

## How to Run on Your Machine

### Prerequisites
- Node.js (version 16 or higher)
- npm (Node Package Manager)
- MongoDB database (local or cloud instance)
- Cloudinary account (for image storage)

### Installation Steps

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following environment variables:
```
PORT=8080
MONGODB_URL=mongodb://localhost:27017
CLIENT_URL=http://localhost:3000

ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

NODE_ENV=development
```

4. Ensure MongoDB is running:
   - For local MongoDB: Start your local MongoDB service
   - For cloud MongoDB: Use your MongoDB Atlas connection string in `MONGODB_URL`

5. Set up Cloudinary:
   - Create an account at cloudinary.com
   - Get your cloud name, API key, and API secret
   - Add them to your `.env` file

6. Generate secure tokens:
   - Use a secure random string generator for `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`
   - These should be long, random, and kept secret

7. Run the development server:
```bash
npm run dev
```

8. The server will start on `http://localhost:8080`
   - API base URL: `http://localhost:8080/api`
   - Health check: `http://localhost:8080/api`
   - Swagger Documentation: `http://localhost:8080/api-docs`

### Production Build

1. Build the project:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

### Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port number | No (defaults to 8080) |
| MONGODB_URL | MongoDB connection string | Yes |
| CLIENT_URL | Frontend application URL for CORS | Yes |
| ACCESS_TOKEN_SECRET | Secret key for JWT access tokens | Yes |
| REFRESH_TOKEN_SECRET | Secret key for JWT refresh tokens | Yes |
| ACCESS_TOKEN_EXPIRY | Access token expiration time | Yes |
| REFRESH_TOKEN_EXPIRY | Refresh token expiration time | Yes |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name | Yes |
| CLOUDINARY_API_KEY | Cloudinary API key | Yes |
| CLOUDINARY_API_SECRET | Cloudinary API secret | Yes |
| NODE_ENV | Environment mode (development/production) | No |

## API Documentation

### Interactive Swagger Documentation

The API includes interactive Swagger documentation that can be accessed when the server is running:

- **Swagger UI**: `http://localhost:8080/api-docs`

The Swagger UI provides:
- Complete API endpoint documentation
- Interactive testing interface
- Request/response schema definitions
- Authentication testing with JWT tokens
- Example requests and responses

### Static Documentation

For detailed API documentation including architecture, design patterns, and implementation details, refer to [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## Key Features

- User authentication with JWT tokens and refresh token rotation
- User registration with optional avatar upload
- Post creation with images and visibility settings (public/private)
- Cursor-based pagination for feeds and comments
- Multi-reaction system (Like, Love, Haha, Care, Angry) with user tracking
- Nested comments and replies
- Batch query optimization to prevent N+1 problems
- Rate limiting for API protection
- Comprehensive error handling
- Type-safe codebase with TypeScript

## Project Structure Principles

- Separation of concerns: Controllers handle business logic, routes define endpoints, models define data structures
- Middleware pattern: Authentication, error handling, and file upload are handled via middleware
- Async error handling: All async operations use AsyncHandler wrapper for consistent error handling
- Standardized responses: All API responses follow AppResponse format
- Type safety: Full TypeScript implementation with interfaces and types

## Security Features

- HTTP-only cookies for token storage
- Secure flag for cookies in production
- Password hashing with bcrypt
- JWT token verification
- Rate limiting per IP and user
- File type and size validation
- Authorization checks (users can only modify their own resources)
- CORS configuration for cross-origin requests

## Database Schema

The application uses MongoDB with the following main collections:
- Users: User accounts with authentication data
- Posts: User posts with content, images, and visibility settings
- Comments: Comments on posts with support for nested replies
- Likes: Reactions on posts and comments with reaction type tracking

## License

ISC


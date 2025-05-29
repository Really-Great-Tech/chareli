# Chareli Backend Server

A production-ready Express.js backend with TypeScript, PostgreSQL, and TypeORM.

## Features

- Express.js with TypeScript
- PostgreSQL database with TypeORM
- RESTful API architecture
- Error handling middleware
- Environment configuration
- Production-ready setup
- Swagger API documentation
- Comprehensive logging system
- CloudFront integration with signed cookies

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- AWS S3 bucket
- AWS CloudFront distribution (optional, for enhanced performance and security)

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Database Setup

1. Create a PostgreSQL database named `chareli_db` (or update the .env file with your database name)
2. Update the database configuration in the `.env` file

### Development

```bash
# Run in development mode
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── config/         # Configuration files
│   ├── config.ts   # Environment configuration
│   └── database.ts # Database connection setup
├── controllers/    # Request handlers
│   └── userController.ts # User CRUD operations
├── entities/       # TypeORM entities
│   └── User.ts     # User entity definition
├── middlewares/    # Express middlewares
│   ├── errorHandler.ts  # Error handling middleware
│   └── requestLogger.ts # HTTP request logging
├── migrations/     # Database migrations
│   └── *-CreateUserTable.ts # User table migration
├── routes/         # API routes
│   ├── index.ts    # Main router
│   └── userRoutes.ts # User routes
├── services/       # Business logic services
│   ├── s3.service.ts        # AWS S3 file operations
│   └── cloudfront.service.ts # CloudFront signed cookies
├── utils/          # Utility functions
│   └── logger.ts   # Winston logger configuration
├── app.ts          # Express app setup
└── index.ts        # Entry point
```

## CloudFront Integration

This application supports CloudFront with signed cookies for secure file access. This provides:

- **Better Performance**: CloudFront CDN delivers files faster globally
- **Security**: Signed cookies control access to files
- **Cost Efficiency**: Reduced S3 bandwidth costs
- **Scalability**: CloudFront handles high traffic loads

### How It Works

1. **File Upload**: Games uploaded to S3, only S3 key stored in database
2. **Game Request**: When users access `/games` or `/games/:id`:
   - Backend checks for valid CloudFront cookies
   - Sets new 1-day cookies if needed
   - Returns CloudFront URLs generated from S3 keys
3. **File Access**: Frontend uses CloudFront URLs, cookies authenticate access
4. **Security**: Files protected by CloudFront signed cookies, 1-day expiration

### CloudFront Setup

1. Create CloudFront distribution pointing to your S3 bucket
2. Configure trusted signers in CloudFront
3. Generate CloudFront key pair
4. Set environment variables (see below)

The system gracefully falls back to S3 URLs if CloudFront is not configured.

## Logging System

This project uses Winston for logging with the following features:

- **Multiple Log Levels**: error, warn, info, http, debug
- **Console Logging**: Colorized logs in development
- **File Logging**: 
  - `logs/all.log`: Contains all logs
  - `logs/error.log`: Contains only error logs
- **HTTP Request Logging**: Logs all HTTP requests with method, URL, status code, and response time
- **Error Logging**: Detailed error logging with stack traces

### Log Levels by Environment

- **Development**: All logs (debug level and above)
- **Production**: Only important logs (warn level and above)

## Database Migrations

This project uses TypeORM migrations to manage database schema changes. Migrations ensure that database changes are tracked in version control and can be applied consistently across different environments.

### Migration Commands

```bash
# Generate a migration based on entity changes
npm run migration:generate -- src/migrations/MigrationName

# Create an empty migration file
npm run migration:create -- src/migrations/MigrationName

# Run all pending migrations
npm run migration:run

# Revert the most recent migration
npm run migration:revert
```

### Migration Workflow

1. Update your entity files (e.g., User.ts)
2. Generate a migration: `npm run migration:generate -- src/migrations/AddNewFieldToUser`
3. Review the generated migration file in src/migrations/
4. Run the migration: `npm run migration:run`

## API Documentation

This project uses Swagger (OpenAPI) for API documentation and testing. The Swagger UI provides an interactive interface to explore and test the API endpoints without needing external tools like Postman.

### Accessing Swagger UI

When the server is running, you can access the Swagger documentation at:

```
http://localhost:5000/api-docs
```

### Features

- Interactive API documentation
- Test API endpoints directly from the browser
- Detailed request and response schemas
- Authentication support
- API endpoint grouping by tags

## API Endpoints

### Health Check
- `GET /api/health` - Check if the API is running

### User Endpoints
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update an existing user
- `DELETE /api/users/:id` - Delete a user

### Game Endpoints
- `GET /api/games` - Get all games (with CloudFront URLs and cookies)
- `GET /api/games/:id` - Get game by ID (with CloudFront URLs and cookies)
- `POST /api/games` - Create a new game
- `PUT /api/games/:id` - Update an existing game
- `DELETE /api/games/:id` - Delete a game

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Node environment
NODE_ENV=development
PORT=5000

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_database_password
DB_DATABASE=chareli_db

# JWT configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=2h
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_REFRESH_EXPIRATION=7d

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET=your-bucket-name
AWS_SIGNED_URL_EXPIRATION=3600

# CloudFront Configuration (optional, for secure file access with cookies)
CLOUDFRONT_DISTRIBUTION_DOMAIN=your-cloudfront-domain.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=your_cloudfront_key_pair_id
CLOUDFRONT_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\nYour_CloudFront_Private_Key_Here\n-----END RSA PRIVATE KEY-----

# Email service configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# Other configurations...
```

## File Storage Architecture

The application uses a clean file storage architecture:

- **Database**: Stores only S3 keys (file paths), not full URLs
- **S3**: Stores actual files (games, thumbnails)
- **CloudFront**: Serves files with signed cookie authentication
- **Dynamic URLs**: CloudFront URLs generated from S3 keys when needed

This approach provides:
- **Flexibility**: Easy to switch between S3 and CloudFront
- **Clean Database**: No hardcoded URLs in database
- **Security**: Cookie-based file access control
- **Performance**: CDN delivery for global users

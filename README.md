# Image Processing API

An  asynchronous image processing API built with Node.js, Express, and TypeScript. This API handles image uploads and processes them asynchronously using a queue-based architecture.

## Features

- Asynchronous image processing using BullMQ
- MongoDB for job storage
- Redis for job queue management
- File upload handling with Multer
- Image processing with Sharp
- Docker support for easy deployment
- Comprehensive error handling and validation

## Supported Image Formats

The API supports thumbnail creation for the following image formats:
- JPEG/JPG
- PNG
- GIF
- WebP
- BMP
- TIFF

## Prerequisites

- Node.js (v20 or higher)
- MongoDB
- Redis
- Docker (optional)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/tokiie/image-processing-api.git
cd image-processing-api
```

2. Install dependencies:
```bash
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your configuration values.

## Running the Application

### Development Mode

1. Start Redis and MongoDB (if running locally)
2. Run the development server:
```bash
yarn dev
```

### Docker Deployment

Build and run with Docker Compose:
```bash
docker-compose up --build
```

This will start:
- The API server on port 3000 (or as configured in .env)
- MongoDB container
- Redis container

## API Endpoints

### Create Image Processing Job

Creates a new image processing job for thumbnail generation.

```http
POST /api/image-processing/jobs
Content-Type: multipart/form-data
```

**Request Parameters:**
- `file` (required): The image file to process
- `userId` (required): ID of the user creating the job
- `options` (optional): JSON object with processing options
  - `width` (optional): Thumbnail width in pixels (default: 100)
  - `height` (optional): Thumbnail height in pixels (default: 100)
  - `quality` (optional): JPEG quality (0-100, default: 80)
  - `format` (optional): Output format (default: 'jpeg')

**Response (201 Created):**
```json
{
  "jobId": "64f7a8b9c0d1e2f3a4b5c6d7",
  "status": "processing",
  "originalFilename": "example.jpg"
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields or invalid image
- `500 Internal Server Error`: Server processing error

### Get Job Status

Retrieves the status and details of a specific job.

```http
GET /api/image-processing/jobs/:jobId
```

**Path Parameters:**
- `jobId` (required): The ID of the job to retrieve

**Response (200 OK):**
```json
{
  "jobId": "64f7a8b9c0d1e2f3a4b5c6d7",
  "userId": "user123",
  "originalFilename": "example.jpg",
  "resultImageUrl": "/uploads/thumbnails/user123/64f7a8b9c0d1e2f3a4b5c6d7_thumbnail.jpg",
  "jobType": "thumbnail",
  "options": {
    "width": 100,
    "height": 100,
    "quality": 80
  },
  "status": "completed",
  "progress": 100,
  "createdAt": "2024-03-07T12:00:00.000Z",
  "updatedAt": "2024-03-07T12:01:00.000Z",
  "queueInfo": "completed"
}
```

**Error Responses:**
- `404 Not Found`: Job not found or invalid job ID
- `500 Internal Server Error`: Server processing error

### Get User's Jobs

Retrieves all jobs for a specific user with pagination.

```http
GET /api/image-processing/users/:userId/jobs
```

**Path Parameters:**
- `userId` (required): The ID of the user whose jobs to retrieve

**Query Parameters:**
- `status` (optional): Filter by job status (processing, completed, failed)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 20)

**Response (200 OK):**
```json
{
  "jobs": [
    {
      "_id": "64f7a8b9c0d1e2f3a4b5c6d7",
      "userId": "user123",
      "originalImagePath": "uploads/original/example.jpg",
      "originalFilename": "example.jpg",
      "resultImageUrl": "/uploads/thumbnails/user123/64f7a8b9c0d1e2f3a4b5c6d7_thumbnail.jpg",
      "jobType": "thumbnail",
      "options": {
        "width": 100,
        "height": 100
      },
      "status": "completed",
      "progress": 100,
      "createdAt": "2024-03-07T12:00:00.000Z",
      "updatedAt": "2024-03-07T12:01:00.000Z"
    }
    // More jobs...
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

**Error Responses:**
- `500 Internal Server Error`: Server processing error

## Testing

The application includes comprehensive test suites for unit, integration, and API testing.

### Running Tests

To run all tests:
```bash
yarn test
```

To run tests with coverage:
```bash
yarn test:coverage
```

### Test Structure

- `tests/api.test.ts`: API integration tests
- `tests/controllers/`: Controller unit tests
- `tests/services/`: Service unit tests
- `tests/fileValidation.test.ts`: File validation tests

### Test Environment

Tests use:
- Jest as the test runner
- Supertest for API testing
- MongoDB Memory Server for database testing
- Mock implementations for external services

## Technical Architecture

The application uses a queue-based architecture to handle image processing asynchronously:

1. **API Server**: Handles HTTP requests and file uploads
2. **Queue**: Manages job processing with BullMQ and Redis
3. **Worker**: Processes images asynchronously using Sharp
4. **Storage**: MongoDB for jobs and filesystem for images

### Key Components

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic for image processing and queue management
- **Models**: Define database schemas and interactions
- **Workers**: Process jobs from the queue
- **Middleware**: Handle file uploads and validation

## Environment Variables

The application uses the following environment variables (see `.env.example` for defaults):

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development, test, production)
- `MONGO_URI`: MongoDB connection string
- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port
- `UPLOADS_DIR`: Directory for uploaded files
- `TEMP_DIR`: Directory for temporary files
- `WORKER_CONCURRENCY`: Number of concurrent worker processes

## Potential Enhancements

- User authentication and authorization
- Additional image processing options (resize, crop, filters)
- Webhook notifications for job completion
- Job expiration and cleanup
- Rate limiting and request validation
- API documentation with Swagger/OpenAPI

## License

Inchallah
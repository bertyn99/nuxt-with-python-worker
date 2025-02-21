# Nuxt with Python Worker Demo

This project demonstrates a full-stack application that processes PDF files using a Python worker and Nuxt.js. The application uses Redis and BullMQ for job queue management.

## Architecture

- **Frontend/API**: Nuxt.js application with a file upload endpoint
- **Queue**: Redis + BullMQ for job management
- **Worker**: Python script using BullMQ worker for PDF processing
- **Storage**: Local file storage (configurable)

## Features

- PDF file upload via API endpoint
- Asynchronous PDF processing using queue system
- PDF to Markdown conversion using pymupdf4llm
- Progress tracking during processing
- Docker support for Redis
- Live preview of converted Markdown content
- Toast notifications for operation status
- Progress bar for upload and processing status



## Prerequisites

- Node.js (v16+)
- Python 3.8+
- Docker and Docker Compose
- Redis (provided via Docker)

## Setup

1. **Install Dependencies**

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install bullmq pymupdf4llm redis

# with uv as package manager for python
uv sync
```

2. **Start Redis**

```bash
# Using Docker
docker compose up -d
```

3. **Start the Application**

```bash
# Start Nuxt application
npm run dev

# In a separate terminal, start the Python worker
python python/worker.py
```

## Usage

1. **Upload a PDF**

Send a POST request to `/api/upload` with a PDF file in the form data:

```bash
curl -X POST -F "file=@your-pdf-file.pdf" http://localhost:3000/api/upload
```

The API will return a job ID that you can use to track the processing status.

## Project Structure
├── app/ 
│ └── components/ 
│ └── FileUpload.vue # Main upload component 
├── server/ 
│ ├── api/ 
│ │ ├── upload.post.ts # File upload endpoint 
│ │ └── status/ 
│ │  └── [jobId].get.ts # SSE status endpoint 
│ └── utils/ 
│ └── queue.ts # BullMQ configuration 
├── python/ 
│ └── worker.py # Python worker └── dockerfile.dev # Redis configuration


### Key Components

1. Queue Configuration (
queue.ts
)
// BullMQ setup with:
- Redis connection configuration
- Job retry policies
- Event handling setup
  
2. **upload.post.ts**
- Handles file uploads
- Stores files locally
- Creates processing jobs in the queue
- Returns job ID for tracking

3. **worker.py**
- Listens for PDF processing jobs
- Converts PDFs to Markdown
- Reports progress during processing
- Handles errors and cleanup

4. **Status Tracking API ([jobId].get.ts)**
// Handles real-time updates via SSE:
- Job progress monitoring
- Processing status updates
- Result delivery
- Error handling



4. **dockerfile.dev**
- Configures Redis container
- Enables append-only file persistence
- Exposes Redis on port 6379

## Error Handling

The application includes error handling for:
- File not found errors
- Permission issues
- Processing failures
- Invalid file formats

## Development Notes

- Files are temporarily stored in `.data/file/` directory
- Progress updates are available through the BullMQ queue
- The worker can be gracefully shut down using SIGTERM or SIGINT signals

## Environment Variables

Make sure to set up the following environment variables:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
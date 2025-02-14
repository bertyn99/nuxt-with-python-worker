from bullmq import Worker, Job
import redis
import json
import time

# Redis connection settings
REDIS_CONNECTION = {
    'host': 'localhost',
    'port': 6379,
    'db': 0
}

async def process_pdf(job: Job):
    """Process PDF file and return results"""
    try:
        # Update progress
        await job.update_progress(0)
        
        # Get file data from job
        file_data = job.data.get('file')
        
        # Your PDF processing logic here
        # This is just a sample implementation
        for i in range(0, 100, 10):
            time.sleep(0.5)  # Simulate processing
            await job.update_progress(i)
        
        # Final progress update
        await job.update_progress(100)
        
        return {
            "message": "PDF processed successfully",
            "details": "Sample processing result"
        }
        
    except Exception as e:
        raise Exception(f"PDF processing failed: {str(e)}")

async def main():
    # Create worker
    worker = Worker(
        'pdf-processing',
        process_pdf,
        connection=REDIS_CONNECTION
    )
    
    print("Worker started. Waiting for jobs...")
    
    # Keep the worker running
    await worker.run()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
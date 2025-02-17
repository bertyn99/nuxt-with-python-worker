from bullmq import Worker, Job
import redis
import json
import time
import asyncio
import signal

# Redis connection settings
REDIS_CONNECTION = {
    'host': 'localhost',
    'port': 6379,
    'db': 0
}

async def process_pdf(job: Job, job_token: str):
    """Process PDF file and return results"""
    try:
        
        # Update progress
        await job.updateProgress(0)
        
        # Get file data from job
        file_data = job.data.get('file')
        
        # Your PDF processing logic here
        # This is just a sample implementation
        for i in range(0, 100, 10):
            time.sleep(6)  # Simulate processing
            await job.updateProgress(i)
        
        # Final progress update
        await job.updateProgress(100)
        
        return {
            "message": "PDF processed successfully",
            "details": "Sample processing result"
        }
        
    except Exception as e:
        raise Exception(f"PDF processing failed: {str(e)}")

async def main():
    # Create an event for graceful shutdown
    shutdown_event = asyncio.Event()

    def signal_handler(signal, frame):
        print("\nSignal received, shutting down...")
        shutdown_event.set()

    # Register signal handlers
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    # Create worker
    worker = Worker(
        'pdf-processing',
        process_pdf,
        {"connection": REDIS_CONNECTION}
    )
    
    """ worker.on('completed', (job: Job, returnvalue: any) => {
    
    })
     """
    print("Worker started. Waiting for jobs...")
    
    # Wait for shutdown signal
    await shutdown_event.wait()
    
    # Cleanup
    print("Cleaning up worker...")
    await worker.close()
    print("Worker shut down successfully.")

if __name__ == "__main__":
    asyncio.run(main())
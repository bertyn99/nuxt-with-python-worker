from bullmq import Worker, Job
import redis
import json
import time
import sys
import os
import re
import asyncio
import signal
from io import StringIO
import contextlib
import pymupdf4llm
from pathlib import Path


# Redis connection settings
REDIS_CONNECTION = {
    'host': 'localhost',
    'port': 6379,
    'db': 0
}

def parse_progress(log_string):
    """
    Parse progress from log string and return percentage
    Example input: "Processing input.pdf… [==================== ] (148/291)"
    """
    try:
        # Extract numbers using regex pattern matching (n/total) format
        pattern = r'\((\d+)/(\d+)\)'
        matches = re.findall(pattern, log_string)
        
        if matches:
            current, total = map(int, matches[0])
            # Calculate percentage and round to 2 decimal places
            percentage = (current / total) * 100
            return round(percentage, 2)
            
        # If no matches found in current line, return None
        return None
        
    except Exception as e:
        print(f"Error parsing progress: {str(e)}")
        return None

@contextlib.contextmanager
def capture_stdout():
    """Capture stdout output"""
    stdout = StringIO()
    old_stdout = sys.stdout
    sys.stdout = stdout
    try:
        yield stdout
    finally:
        sys.stdout = old_stdout


async def process_pdf(job: Job, job_token: str):
    """Process PDF file and return results"""
    try:
        
        # Update progress
        await job.updateProgress(0)
        
        # Get file data from job
        file_data = job.data.get('file')
        file_path= file_data['path']
       
        
        # Convert the relative path to absolute path
        original_path = file_data['path']
        
        # Preserve the original path structure (whether .data or data)
        clean_path = original_path
        if original_path.startswith('./'):
            clean_path = clean_path[2:]# Remove leading ./
        root_dir = Path(os.getcwd()).parent  # Go up one directory to project root
        absolute_path = root_dir / clean_path
        
        # Check if file exists
        if not os.path.exists(absolute_path):
            raise Exception(f"File not found at: {absolute_path}")
        
        ## For this example we will process only pdf file
    
        # Try to open the file to verify access
        try:
            with open(absolute_path, 'rb') as file:
                # Now use the absolute path for your PDF processing
                # Capture stdout during markdown conversion
                """  with capture_stdout() as output: """
                md_text = pymupdf4llm.to_markdown(absolute_path)
                    
                    # Get captured output and check for progress
                """    log_output = output.getvalue()
                    progress = parse_progress(log_output) """
                    
                    # Update job progress
                """  if progress > 0:
                        await job.updateProgress(progress) """
        
        except PermissionError:
            raise Exception(f"Permission denied accessing file: {absolute_path}")
        except IOError as e:
            raise Exception(f"Error reading file: {str(e)}")
        
        return json.dumps({
            "message": "PDF processed successfully",
            "details": md_text  
        })
        
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
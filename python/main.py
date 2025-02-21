from pathlib import Path
import os

def open_file():
    # Get project root directory
    root_dir = Path(os.getcwd()).parent
    
    # File path relative to project root
    file_path = './.data/file/courrier_arnold.pdf'
    
    # Clean the path (remove leading ./ if present)
    clean_path = file_path[2:]
    
    # Construct absolute path
    absolute_path = root_dir / clean_path
    
    print(f"Root directory: {root_dir}")
    print(f"Trying to open: {absolute_path}")
    
    # Check if file exists
    if not os.path.exists(absolute_path):
        print(f"Error: File not found at {absolute_path}")
        return
    
    try:
        # Open and read the file (in binary mode since it's a PDF)
        with open(absolute_path, 'rb') as file:
            content = file.read()
            print(f"Successfully opened file of size: {len(content)} bytes")
            return content
            
    except Exception as e:
        print(f"Error opening file: {str(e)}")
        return None

if __name__ == "__main__":
    content = open_file()
    if content:
        print("File opened successfully!")
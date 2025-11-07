#!/usr/bin/env python3
"""
Simple script to run the FastAPI backend locally
This solves the Docker-in-Docker issue on Windows
"""

import subprocess
import sys
import os

def main():
    print("="*50)
    print("  TechAssess Backend - Local Mode")
    print("="*50)
    print()

    # Change to backend directory
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    os.chdir(backend_dir)

    print("[*] Installing dependencies...")
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install",
            "fastapi", "uvicorn[standard]", "docker", "pydantic", "python-multipart",
            "--quiet"
        ], check=True)
        print("[+] Dependencies installed\n")
    except subprocess.CalledProcessError:
        print("[!] Failed to install dependencies")
        print("Try running: pip install -r requirements.txt")
        sys.exit(1)

    print("[*] Starting FastAPI server...")
    print("    Backend: http://localhost:8000")
    print("    API Docs: http://localhost:8000/docs")
    print()
    print("Press Ctrl+C to stop\n")

    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", "main:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload"
        ])
    except KeyboardInterrupt:
        print("\n\n[+] Server stopped")

if __name__ == "__main__":
    main()

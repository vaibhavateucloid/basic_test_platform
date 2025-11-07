# Windows Setup Guide

## The Problem

Docker-in-Docker doesn't work well on Windows. The backend running inside a Docker container can't access the host's Docker daemon to create code execution containers.

**Error**: `"docker":"disconnected"` when checking `/health`

## The Solution

Run the **backend locally on Windows** (not in Docker), which gives it direct access to Docker for code execution.

---

## Quick Setup (3 Steps)

### Step 1: Stop the Docker backend
```bash
docker stop techassess-api
```

### Step 2: Run backend locally
Open a **new terminal** and run:

```bash
# Method 1: Using Python script (Recommended)
python run_backend.py

# Method 2: Manual
cd backend
pip install fastapi uvicorn[standard] docker pydantic python-multipart
python main.py
```

### Step 3: Open the frontend

**Option A - Use Docker frontend:**
```bash
# Frontend is already running on Docker
# Just open: http://localhost:3000
```

**Option B - Open HTML directly:**
```bash
# Just double-click index.html
# or use: start index.html
```

---

## Testing

1. **Check backend is running:**
   Visit: http://localhost:8000/health

   Should show: `{"status":"healthy","docker":"connected"}` ✅

2. **Test the frontend:**
   - Open http://localhost:3000 (if using Docker frontend)
   - Or open `index.html` directly
   - Go to Python section
   - Write simple code:
     ```python
     def twoSum(nums, target):
         return [0, 1]
     ```
   - Click **"▶ Run Code"**
   - You should see output!

---

## Full Startup Process

### Terminal 1: Backend
```bash
cd C:\Users\vaibh\Documents\basic_test_platform
python run_backend.py
```

Leave this running. You'll see:
```
🚀 Starting FastAPI server...
   Backend: http://localhost:8000
   API Docs: http://localhost:8000/docs
```

### Terminal 2 (Optional): Frontend via Docker
```bash
docker start techassess-frontend
```

Or just open `index.html` in your browser!

---

## Why This Works

### Docker-in-Docker on Windows:
- ❌ Complex socket permissions
- ❌ Windows path translation issues
- ❌ Requires privileged mode
- ❌ Often doesn't work reliably

### Backend on Host:
- ✅ Direct Docker daemon access
- ✅ No socket permission issues
- ✅ Native Windows Docker integration
- ✅ Simpler and more reliable

---

## Alternative: Docker Desktop TCP API

If you really want to run everything in Docker, you can:

1. Open Docker Desktop Settings
2. Go to **General**
3. Enable: **"Expose daemon on tcp://localhost:2375 without TLS"**
4. Update `backend/main.py`:
   ```python
   docker_client = docker.DockerClient(base_url='tcp://host.docker.internal:2375')
   ```
5. Restart containers: `docker-compose up --build`

⚠️ **WARNING**: This exposes Docker API without authentication - only for development!

---

## Troubleshooting

### "pip install fails with pydantic-core error"
This is a Rust compilation issue on Windows.

**Solution**: Use pre-built wheels
```bash
pip install fastapi uvicorn docker pydantic python-multipart --only-binary=:all:
```

### "Port 8000 already in use"
```bash
# Find and stop the process
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# Or just use a different port
uvicorn main:app --port 8001
# Then update API_BASE_URL in script.js to http://localhost:8001
```

### "Docker not found when running backend"
Make sure Docker Desktop is running:
1. Check system tray for Docker icon
2. Run: `docker ps` to verify
3. If not running, start Docker Desktop

### "Code execution times out"
```bash
# Pull the Python image first
docker pull python:3.11-alpine
```

---

## Architecture

```
┌─────────────────────┐
│  Browser            │
│  (Frontend)         │
└────────┬────────────┘
         │ HTTP
         ↓
┌─────────────────────┐     ┌──────────────┐
│  FastAPI Backend    │────▶│  Docker      │
│  (Running on        │     │  Daemon      │
│   Windows Host)     │     │              │
└─────────────────────┘     └──────────────┘
                                    │
                                    ↓
                            ┌──────────────┐
                            │  Temp        │
                            │  Containers  │
                            │  (Python     │
                            │   execution) │
                            └──────────────┘
```

---

## Need Help?

1. Check backend is running: http://localhost:8000/health
2. Check Docker is running: `docker ps`
3. Check backend logs in the terminal where you ran `python run_backend.py`
4. Check browser console (F12) for JavaScript errors

**Still stuck?** Open an issue with:
- Error message
- Output of `docker ps`
- Output from backend terminal
- Browser console errors

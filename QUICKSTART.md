# Quick Start Guide

## Prerequisites

Before starting, ensure you have:
- ✅ **Docker** installed and running
- ✅ **Docker Compose** installed
- ✅ **Python 3.11+** (for local backend development)

Check Docker is running:
```bash
docker --version
docker ps
```

---

## Option 1: Using Docker Compose (Recommended - Easiest!)

This runs everything with one command.

### Step 1: Navigate to project directory
```bash
cd C:\Users\vaibh\Documents\basic_test_platform
```

### Step 2: Pull the Python image (first time only)
```bash
docker pull python:3.11-alpine
```

### Step 3: Start everything
```bash
docker-compose up --build
```

### Step 4: Access the application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### To Stop:
Press `Ctrl+C` or run:
```bash
docker-compose down
```

---

## Option 2: Run Frontend and Backend Separately

### Frontend (Simple - No Backend Needed for Testing)

Just open the file in your browser:
```bash
# Windows
start index.html

# Or manually open in browser
# Navigate to: C:\Users\vaibh\Documents\basic_test_platform\index.html
```

**Note:** Without backend, assessment submission will use local calculation (fallback mode).

---

### Backend (For Full Functionality)

#### Step 1: Install Python dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Step 2: Ensure Docker is running
```bash
docker ps
```

#### Step 3: Start the backend
```bash
python main.py
```

Backend will start at: http://localhost:8000

#### Step 4: Open frontend
In another terminal or just open in browser:
```bash
cd ..
start index.html
```

Or use a local server:
```bash
# Python
python -m http.server 3000

# Then visit: http://localhost:3000
```

---

## Option 3: Development Mode (Best for Making Changes)

### Terminal 1 - Backend with auto-reload:
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend with local server:
```bash
# In project root
python -m http.server 3000
```

Then visit: http://localhost:3000

---

## Troubleshooting

### Issue: "Docker service unavailable"
**Solution:**
- Make sure Docker Desktop is running
- On Windows: Check Docker Desktop icon in system tray
- Test: `docker ps` should not show errors

### Issue: "Port 8000 already in use"
**Solution:**
```bash
# Change port in docker-compose.yml or run:
uvicorn main:app --host 0.0.0.0 --port 8001
```
Then update `API_BASE_URL` in `script.js` to `http://localhost:8001`

### Issue: "CORS error" in browser
**Solution:** Backend already has CORS enabled. If you still see errors:
- Make sure backend is running
- Check browser console for exact error
- Verify API_BASE_URL in script.js matches backend URL

### Issue: Frontend can't connect to backend
**Solution:**
1. Check backend is running: Visit http://localhost:8000/health
2. Check API_BASE_URL in script.js (line 2)
3. Open browser dev tools (F12) > Console for errors

### Issue: "Permission denied" accessing Docker
**Solution (Linux/Mac):**
```bash
sudo usermod -aG docker $USER
# Then logout and login again
```

---

## Testing the Setup

### 1. Test Backend Health
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "docker": "connected"
}
```

### 2. Test Code Execution
```bash
curl -X POST http://localhost:8000/api/execute-python \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"print('Hello from Docker!')\"}"
```

Expected response:
```json
{
  "success": true,
  "output": "Hello from Docker!\n",
  "error": null
}
```

### 3. Test Frontend
Open http://localhost:3000 (or your index.html) and:
- Answer some MCQ questions
- Write Python code
- Answer SQL questions
- Submit assessment
- Check browser console (F12) for "Assessment submitted successfully"

---

## What's Running?

### With Docker Compose:
- **Frontend**: Nginx serving static files on port 3000
- **Backend**: FastAPI on port 8000
- **Code Sandbox**: Temporary Docker containers created on-demand for Python execution

### Manually:
- **Frontend**: Your browser opens index.html
- **Backend**: Python/uvicorn on port 8000
- **Code Sandbox**: Docker containers managed by backend

---

## Next Steps

1. **Customize Questions**: Edit `script.js` to modify MCQ/SQL questions
2. **Add Authentication**: Implement user login
3. **Database Integration**: Save submissions to PostgreSQL/MongoDB
4. **Deploy**: Use services like AWS, Heroku, or DigitalOcean

---

## Need Help?

- Check logs: `docker-compose logs -f`
- Backend logs: Terminal where backend is running
- Frontend logs: Browser console (F12)
- API documentation: http://localhost:8000/docs

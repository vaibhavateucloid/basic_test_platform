# TechAssess Backend API

FastAPI backend for the TechAssess platform with Docker-based code sandboxing.

## Features

- **Assessment Submission**: Receive and score MCQ, Python, and SQL answers
- **Code Execution**: Run Python code in isolated Docker containers with:
  - Memory limits (128MB)
  - CPU limits (50%)
  - Network disabled
  - 5-second timeout
- **CORS Support**: Allow requests from frontend

## API Endpoints

### `GET /`
Root endpoint with API information

### `GET /health`
Health check endpoint

### `POST /api/execute-python`
Execute Python code in a sandbox

**Request:**
```json
{
  "code": "print('Hello, World!')",
  "test_cases": []
}
```

**Response:**
```json
{
  "success": true,
  "output": "Hello, World!\n",
  "error": null
}
```

### `POST /api/submit-assessment`
Submit complete assessment

**Request:**
```json
{
  "mcq": {
    "1": 1,
    "2": 0,
    ...
  },
  "python": {
    "problem1": "def twoSum(nums, target): ...",
    "problem2": "def isPalindrome(s): ..."
  },
  "sql": {
    "1": "23:45",
    "2": "Charlie Davis",
    ...
  },
  "candidate_name": "John Doe",
  "candidate_email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Assessment submitted successfully",
  "scores": {
    "mcq": "8/10",
    "sql": "4/5",
    "total": "12/15"
  },
  "submission_id": 1234567890
}
```

### `POST /api/test-python`
Run Python code against test cases

**Request:**
```json
{
  "code": "def add(a, b): return a + b",
  "test_cases": [
    {
      "name": "Test 1",
      "test": "print(add(2, 3))",
      "expected": "5"
    }
  ]
}
```

**Response:**
```json
{
  "total_tests": 1,
  "passed": 1,
  "failed": 0,
  "results": [...]
}
```

## Requirements

- Python 3.11+
- Docker
- Docker socket access (`/var/run/docker.sock`)

## Installation

### Local Development

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Ensure Docker is running:
```bash
docker ps
```

3. Run the server:
```bash
python main.py
```

Server will start at `http://localhost:8000`

### Docker Deployment

Use docker-compose from the root directory:
```bash
cd ..
docker-compose up --build
```

## Security Considerations

### Code Sandboxing
Python code is executed in isolated Docker containers with:
- **Memory limit**: 128MB
- **CPU limit**: 50%
- **Network**: Disabled
- **Timeout**: 5 seconds
- **Auto-cleanup**: Containers removed after execution

### Production Recommendations
1. Add authentication/authorization
2. Rate limiting for code execution
3. Input validation and sanitization
4. Store submissions in a database
5. Add monitoring and logging
6. Use environment variables for configuration
7. Implement proper error handling
8. Add request size limits
9. Use HTTPS in production
10. Whitelist allowed origins for CORS

## Environment Variables

Create a `.env` file:
```bash
API_PORT=8000
DOCKER_MEMORY_LIMIT=128m
CODE_EXECUTION_TIMEOUT=5
```

## Testing

Test the API:

```bash
# Health check
curl http://localhost:8000/health

# Execute Python code
curl -X POST http://localhost:8000/api/execute-python \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"Hello, World!\")"}'

# Submit assessment
curl -X POST http://localhost:8000/api/submit-assessment \
  -H "Content-Type: application/json" \
  -d @test_submission.json
```

## Troubleshooting

### Docker Socket Permission Denied
If you get permission errors accessing Docker:
```bash
sudo chmod 666 /var/run/docker.sock
```

Or add your user to the docker group:
```bash
sudo usermod -aG docker $USER
```

### Port Already in Use
Change the port in docker-compose.yml or when running locally:
```bash
uvicorn main:app --host 0.0.0.0 --port 8001
```

## License

MIT

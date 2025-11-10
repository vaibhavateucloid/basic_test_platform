from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional, List
import json
import time
import pymysql
import os
import httpx

app = FastAPI(title="TechAssess API")

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Python Executor Service URL
PYTHON_EXECUTOR_URL = os.getenv('PYTHON_EXECUTOR_URL', 'http://localhost:8001')

# MySQL connection configuration
MYSQL_CONFIG = {
    'port': int(os.getenv('MYSQL_PORT', 3306)),
    'user': os.getenv('MYSQL_USER', 'techuser'),
    'password': os.getenv('MYSQL_PASSWORD', 'techpass'),
    'database': os.getenv('MYSQL_DATABASE', 'techassess'),
}

def get_mysql_connection():
    """Create and return a MySQL connection with retry logic"""
    # Try multiple hosts: Docker service name, localhost, 127.0.0.1
    hosts_to_try = [
        os.getenv('MYSQL_HOST', 'mysql'),  # Docker service name
        'localhost',                        # Local development
        '127.0.0.1',                       # Explicit localhost IP
        'mysql',                           # Fallback to Docker name
    ]

    last_error = None

    for host in hosts_to_try:
        try:
            print(f"Attempting MySQL connection to {host}:{MYSQL_CONFIG['port']}...")
            connection = pymysql.connect(
                host=host,
                port=MYSQL_CONFIG['port'],
                user=MYSQL_CONFIG['user'],
                password=MYSQL_CONFIG['password'],
                database=MYSQL_CONFIG['database'],
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )
            print(f"✓ MySQL connected successfully to {host}:{MYSQL_CONFIG['port']}")
            return connection
        except Exception as e:
            last_error = e
            print(f"✗ Failed to connect to {host}:{MYSQL_CONFIG['port']} - {e}")
            continue

    print(f"✗ All MySQL connection attempts failed. Last error: {last_error}")
    return None


# Request models
class PythonCodeRequest(BaseModel):
    code: str
    test_cases: Optional[list] = None


class SQLQueryRequest(BaseModel):
    query: str


class AssessmentSubmission(BaseModel):
    mcq: Dict[int, int]
    python: Dict[str, str]
    sql: Dict[int, str]
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    tab_switch_count: Optional[int] = 0


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "TechAssess API",
        "version": "1.0",
        "endpoints": {
            "health": "/health",
            "execute_python": "/api/execute-python",
            "submit_assessment": "/api/submit-assessment"
        }
    }


# Health check
@app.get("/health")
async def health_check():
    # Check MySQL connection
    mysql_status = "disconnected"
    try:
        conn = get_mysql_connection()
        if conn:
            conn.close()
            mysql_status = "connected"
    except:
        pass

    # Check Python Executor
    executor_status = "disconnected"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{PYTHON_EXECUTOR_URL}/health", timeout=2.0)
            if response.status_code == 200:
                executor_status = "connected"
    except:
        pass

    return {
        "status": "healthy",
        "mysql": mysql_status,
        "python_executor": executor_status
    }


# Execute Python code via executor service
@app.post("/api/execute-python")
async def execute_python(request: PythonCodeRequest):
    try:
        # Call the Python executor service
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{PYTHON_EXECUTOR_URL}/execute",
                json={
                    "code": request.code,
                    "test_cases": request.test_cases
                },
                timeout=30.0  # 30 second timeout for code execution
            )

            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Executor service error: {response.text}"
                )

    except httpx.TimeoutException:
        return {
            "success": False,
            "output": None,
            "error": "Code execution timeout exceeded",
            "test_mode": False
        }
    except httpx.RequestError as e:
        return {
            "success": False,
            "output": None,
            "error": f"Failed to connect to Python executor service: {str(e)}",
            "test_mode": False
        }
    except Exception as e:
        return {
            "success": False,
            "output": None,
            "error": str(e),
            "test_mode": False
        }


# Submit full assessment
@app.post("/api/submit-assessment")
async def submit_assessment(submission: AssessmentSubmission):
    try:
        # MCQ Scoring
        mcq_answers = {
            1: 1, 2: 1, 3: 0, 4: 2, 5: 2,
            6: 1, 7: 1, 8: 1, 9: 2, 10: 2
        }

        mcq_score = sum(1 for q_id, answer in submission.mcq.items()
                       if mcq_answers.get(q_id) == answer)

        # SQL Scoring
        sql_answers = {
            1: "23:45",
            2: "Charlie Davis",
            3: "customers, financial_records, salary_data",
            4: "Yes",
            5: "185.220.101.45"
        }

        sql_score = 0
        for q_id, answer in submission.sql.items():
            user_ans = answer.lower().strip()
            correct_ans = sql_answers.get(q_id, "").lower().strip()

            if user_ans == correct_ans:
                sql_score += 1
            elif q_id == 3:  # Special case for comma-separated values
                tables = ['customers', 'financial_records', 'salary_data']
                if all(t in user_ans for t in tables):
                    sql_score += 1

        # Store submission (in production, save to database)
        submission_data = {
            "candidate_name": submission.candidate_name,
            "candidate_email": submission.candidate_email,
            "mcq_score": mcq_score,
            "sql_score": sql_score,
            "python_code": submission.python,
            "total_score": mcq_score + sql_score,
            "max_score": 15,
            "tab_switch_count": submission.tab_switch_count,
            "violation_flag": submission.tab_switch_count > 5,  # Flag if more than 5 switches
            "timestamp": time.time()
        }

        # In production, save to database here
        print(f"\n{'='*50}")
        print(f"SUBMISSION RECEIVED")
        print(f"{'='*50}")
        print(f"Candidate: {submission.candidate_name or 'Anonymous'}")
        print(f"Email: {submission.candidate_email or 'N/A'}")
        print(f"MCQ Score: {mcq_score}/10")
        print(f"SQL Score: {sql_score}/5")
        print(f"Total Score: {mcq_score + sql_score}/15")
        print(f"Tab Switches: {submission.tab_switch_count}")
        if submission.tab_switch_count > 5:
            print(f"⚠️  WARNING: High number of tab switches detected!")
        print(f"{'='*50}\n")

        return {
            "success": True,
            "message": "Assessment submitted successfully",
            "scores": {
                "mcq": f"{mcq_score}/10",
                "sql": f"{sql_score}/5",
                "total": f"{mcq_score + sql_score}/15"
            },
            "submission_id": int(time.time())  # Mock ID
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Legacy endpoint removed - now using /api/execute-python with test_cases


# Execute SQL query in MySQL
@app.post("/api/execute-sql")
async def execute_sql(request: SQLQueryRequest):
    """
    Execute SQL query in MySQL database and return results
    """
    connection = None
    try:
        # Get MySQL connection
        connection = get_mysql_connection()
        if not connection:
            raise HTTPException(status_code=503, detail="MySQL database unavailable")

        query = request.query.strip()

        # Basic SQL injection protection - only allow SELECT statements
        if not query.lower().startswith('select'):
            return {
                "success": False,
                "error": "Only SELECT queries are allowed for security reasons",
                "results": [],
                "row_count": 0
            }

        # Execute query
        with connection.cursor() as cursor:
            cursor.execute(query)
            results = cursor.fetchall()
            row_count = len(results)

        return {
            "success": True,
            "error": None,
            "results": results,
            "row_count": row_count,
            "message": f"Query executed successfully. {row_count} row(s) returned."
        }

    except pymysql.Error as e:
        return {
            "success": False,
            "error": f"SQL Error: {str(e)}",
            "results": [],
            "row_count": 0
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error: {str(e)}",
            "results": [],
            "row_count": 0
        }
    finally:
        if connection:
            connection.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

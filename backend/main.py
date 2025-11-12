from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Optional, List
from datetime import datetime
import json
import time
import pymysql
import os
import httpx
import database

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

# Development mode flag
DEV_MODE = os.getenv('DEV_MODE', 'true').lower() == 'true'

# MySQL connection configuration
MYSQL_CONFIG = {
    'port': int(os.getenv('MYSQL_PORT', 3306)),
    'user': os.getenv('MYSQL_USER', 'techuser'),
    'password': os.getenv('MYSQL_PASSWORD', 'techpass'),
    'database': os.getenv('MYSQL_DATABASE', 'techassess'),
}

# MySQL candidate user configuration (read-only for production)
CANDIDATE_CONFIG = {
    'port': int(os.getenv('MYSQL_PORT', 3306)),
    'user': 'candidate_user',
    'password': 'candidatepass',
    'database': os.getenv('MYSQL_DATABASE', 'techassess'),
}

def get_mysql_connection(config=None):
    """Create and return a MySQL connection with retry logic"""
    if config is None:
        config = MYSQL_CONFIG

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
            print(f"Attempting MySQL connection to {host}:{config['port']} as {config['user']}...")
            connection = pymysql.connect(
                host=host,
                port=config['port'],
                user=config['user'],
                password=config['password'],
                database=config['database'],
                cursorclass=pymysql.cursors.DictCursor,
                connect_timeout=5
            )
            print(f"✓ MySQL connected successfully to {host}:{config['port']} as {config['user']}")
            return connection
        except Exception as e:
            last_error = e
            print(f"✗ Failed to connect to {host}:{config['port']} as {config['user']} - {e}")
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
    session_id: Optional[str] = None  # Now required for session-based submissions


class CandidateRegistration(BaseModel):
    candidate_name: str
    candidate_email: str
    exam_code: Optional[str] = None


class SessionStartRequest(BaseModel):
    pass  # No body needed, just triggers state change


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

        # Python Scoring - Execute code with test cases
        # Problem 1: Two Sum - expects a function twoSum(nums, target)
        problem1_tests = [
            {"name": "Test 1", "test": "print(twoSum([2, 7, 11, 15], 9))", "expected": "[0, 1]", "visible": False},
            {"name": "Test 2", "test": "print(twoSum([3, 2, 4], 6))", "expected": "[1, 2]", "visible": False},
            {"name": "Test 3", "test": "print(twoSum([3, 3], 6))", "expected": "[0, 1]", "visible": False}
        ]

        # Problem 2: String Palindrome - expects a function isPalindrome(s)
        problem2_tests = [
            {"name": "Test 1", "test": "print(isPalindrome('A man a plan a canal Panama'))", "expected": "True", "visible": False},
            {"name": "Test 2", "test": "print(isPalindrome('race a car'))", "expected": "False", "visible": False},
            {"name": "Test 3", "test": "print(isPalindrome('hello'))", "expected": "False", "visible": False}
        ]

        python_test_cases = {
            "problem1": problem1_tests,
            "problem2": problem2_tests
        }

        python_score = 0
        python_max_score = 10  # 2 problems × 5 points each
        python_results = {}

        for problem_id, code in submission.python.items():
            if not code or not code.strip():
                python_results[problem_id] = {"passed": 0, "total": 0, "points": 0}
                continue

            test_cases = python_test_cases.get(problem_id, [])
            if not test_cases:
                continue

            passed_count = 0
            try:
                # Execute code with test cases via executor service
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{PYTHON_EXECUTOR_URL}/execute",
                        json={"code": code, "test_cases": test_cases},
                        timeout=30.0
                    )

                    if response.status_code == 200:
                        result = response.json()
                        if result.get("test_mode"):
                            test_results = result.get("test_results", [])
                            passed_count = sum(1 for tr in test_results if tr.get("passed"))
                    else:
                        print(f"✗ Executor returned status {response.status_code}: {response.text}")
            except Exception as e:
                print(f"✗ Error executing {problem_id}: {str(e)}")
                passed_count = 0

            # Calculate points: 5 points per problem, distributed across test cases
            total_tests = len(test_cases)
            points_per_test = 5.0 / total_tests if total_tests > 0 else 0
            problem_points = round(passed_count * points_per_test, 2)
            python_score += problem_points

            python_results[problem_id] = {
                "passed": passed_count,
                "total": total_tests,
                "points": problem_points
            }

        python_score = round(python_score)  # Round to nearest integer

        # Store submission (in production, save to database)
        submission_data = {
            "candidate_name": submission.candidate_name,
            "candidate_email": submission.candidate_email,
            "mcq_score": mcq_score,
            "sql_score": sql_score,
            "python_score": python_score,
            "python_results": python_results,
            "python_code": submission.python,
            "total_score": mcq_score + sql_score + python_score,
            "max_score": 25,  # MCQ(10) + SQL(5) + Python(10)
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
        print(f"Python Score: {python_score}/10")
        for prob_id, result in python_results.items():
            print(f"  {prob_id}: {result['passed']}/{result['total']} tests passed ({result['points']} points)")
        print(f"Total Score: {mcq_score + sql_score + python_score}/25")
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
                "python": f"{python_score}/10",
                "total": f"{mcq_score + sql_score + python_score}/25"
            },
            "python_details": python_results,
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
    DEV_MODE: Uses root/techuser with full privileges
    PROD_MODE: Uses candidate_user with SELECT-only privileges
    """
    connection = None
    try:
        # Get MySQL connection with appropriate user
        # In dev mode: use root/techuser, in prod: use read-only candidate_user
        config = MYSQL_CONFIG if DEV_MODE else CANDIDATE_CONFIG
        connection = get_mysql_connection(config)
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


# ===== SESSION MANAGEMENT ENDPOINTS =====

@app.post("/api/register-candidate")
async def register_candidate(registration: CandidateRegistration, request: Request):
    """
    Register a new candidate and create a session
    Returns session_id and test URL
    """
    try:
        # Get IP address
        ip_address = request.client.host if request.client else None

        # Create session
        session_id = database.create_session(
            candidate_name=registration.candidate_name,
            candidate_email=registration.candidate_email,
            exam_code=registration.exam_code,
            ip_address=ip_address,
            duration_minutes=120  # 2 hours
        )

        return {
            "success": True,
            "session_id": session_id,
            "test_url": f"/test/{session_id}",
            "message": "Registration successful"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@app.get("/api/session/{session_id}")
async def get_session_info(session_id: str):
    """
    Get session information with real-time state
    Used for validation and displaying remaining time
    """
    try:
        session = database.get_session(session_id)

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Check if expired
        is_expired = database.is_session_expired(session)
        remaining_seconds = database.get_remaining_time(session)

        return {
            "success": True,
            "session": {
                "session_id": session['session_id'],
                "candidate_name": session['candidate_name'],
                "candidate_email": session['candidate_email'],
                "state": session['state'],
                "created_at": session['created_at'],
                "started_at": session['started_at'],
                "submitted_at": session['submitted_at'],
                "duration_minutes": session['duration_minutes'],
                "tab_switch_count": session['tab_switch_count'],
                "is_expired": is_expired,
                "remaining_seconds": remaining_seconds
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/session/{session_id}/start")
async def start_session(session_id: str):
    """
    Mark session as 'in_progress' when candidate starts the test
    """
    try:
        session = database.get_session(session_id)

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session['state'] == 'submitted':
            raise HTTPException(status_code=403, detail="Session already submitted")

        if database.is_session_expired(session):
            raise HTTPException(status_code=403, detail="Session has expired")

        # Update state to in_progress
        database.update_session_state(session_id, 'in_progress')

        return {
            "success": True,
            "message": "Session started",
            "state": "in_progress"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/session/{session_id}/update-tab-switches")
async def update_tab_switches(session_id: str, data: dict):
    """
    Update tab switch count for anti-cheating tracking
    """
    try:
        count = data.get('count', 0)
        database.update_tab_switches(session_id, count)

        return {
            "success": True,
            "tab_switch_count": count
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/session/{session_id}/save-progress")
async def save_session_progress(session_id: str, data: dict):
    """
    Save candidate's current progress (auto-save)
    Called periodically from frontend
    """
    try:
        # Validate session exists and not submitted
        session = database.get_session(session_id)

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session['state'] == 'submitted':
            raise HTTPException(status_code=400, detail="Cannot save progress - already submitted")

        # Save progress
        mcq_answers = data.get('mcq', {})
        python_code = data.get('python', {})
        sql_answers = data.get('sql', {})
        python_results = data.get('pythonResults', {})
        sql_queries = data.get('sqlQueries', {})
        sql_query_results = data.get('sqlQueryResults', {})

        # Debug logging
        print(f"📥 Received save-progress data:")
        print(f"   pythonResults: {len(python_results)} items - {list(python_results.keys())}")
        print(f"   sqlQueries: {len(sql_queries)} items - {list(sql_queries.keys())}")
        print(f"   sqlQueryResults: {len(sql_query_results)} items - {list(sql_query_results.keys())}")

        success = database.save_progress(session_id, mcq_answers, python_code, sql_answers,
                                        python_results, sql_queries, sql_query_results)

        if success:
            return {
                "success": True,
                "message": "Progress saved",
                "saved_at": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to save progress")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/session/{session_id}/progress")
async def get_session_progress(session_id: str):
    """
    Get saved progress for a session
    Called on page load to restore state
    """
    try:
        # Validate session exists
        session = database.get_session(session_id)

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Get progress
        progress = database.get_progress(session_id)

        if progress:
            return {
                "success": True,
                "progress": {
                    "mcq": progress['mcq_answers'],
                    "python": progress['python_code'],
                    "sql": progress['sql_answers'],
                    "pythonResults": progress.get('python_results', {}),
                    "sqlQueries": progress.get('sql_queries', {}),
                    "sqlQueryResults": progress.get('sql_query_results', {}),
                    "saved_at": progress['saved_at']
                }
            }
        else:
            # No progress saved yet
            return {
                "success": True,
                "progress": None
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/session/{session_id}/submit")
async def submit_session_assessment(session_id: str, submission: AssessmentSubmission):
    """
    Submit assessment for a specific session
    Modified version of /api/submit-assessment with session validation
    """
    try:
        # Validate session
        session = database.get_session(session_id)

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session['state'] == 'submitted':
            raise HTTPException(status_code=403, detail="Assessment already submitted for this session")

        if database.is_session_expired(session):
            # Allow submission even if expired (late submission)
            print(f"⚠️  Late submission for session {session_id}")

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

        # Python Scoring - Execute code with test cases
        # Problem 1: Two Sum - expects a function twoSum(nums, target)
        problem1_tests = [
            {"name": "Test 1", "test": "print(twoSum([2, 7, 11, 15], 9))", "expected": "[0, 1]", "visible": False},
            {"name": "Test 2", "test": "print(twoSum([3, 2, 4], 6))", "expected": "[1, 2]", "visible": False},
            {"name": "Test 3", "test": "print(twoSum([3, 3], 6))", "expected": "[0, 1]", "visible": False}
        ]

        # Problem 2: String Palindrome - expects a function isPalindrome(s)
        problem2_tests = [
            {"name": "Test 1", "test": "print(isPalindrome('A man a plan a canal Panama'))", "expected": "True", "visible": False},
            {"name": "Test 2", "test": "print(isPalindrome('race a car'))", "expected": "False", "visible": False},
            {"name": "Test 3", "test": "print(isPalindrome('hello'))", "expected": "False", "visible": False}
        ]

        python_test_cases = {
            "problem1": problem1_tests,
            "problem2": problem2_tests
        }

        python_score = 0
        python_max_score = 10  # 2 problems × 5 points each
        python_results = {}

        for problem_id, code in submission.python.items():
            if not code or not code.strip():
                python_results[problem_id] = {"passed": 0, "total": 0, "points": 0}
                continue

            test_cases = python_test_cases.get(problem_id, [])
            if not test_cases:
                continue

            passed_count = 0
            try:
                # Execute code with test cases via executor service
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{PYTHON_EXECUTOR_URL}/execute",
                        json={"code": code, "test_cases": test_cases},
                        timeout=30.0
                    )

                    if response.status_code == 200:
                        result = response.json()
                        if result.get("test_mode"):
                            test_results = result.get("test_results", [])
                            passed_count = sum(1 for tr in test_results if tr.get("passed"))
                    else:
                        print(f"✗ Executor returned status {response.status_code}: {response.text}")
            except Exception as e:
                print(f"✗ Error executing {problem_id}: {str(e)}")
                passed_count = 0

            # Calculate points: 5 points per problem, distributed across test cases
            total_tests = len(test_cases)
            points_per_test = 5.0 / total_tests if total_tests > 0 else 0
            problem_points = round(passed_count * points_per_test, 2)
            python_score += problem_points

            python_results[problem_id] = {
                "passed": passed_count,
                "total": total_tests,
                "points": problem_points
            }

        python_score = round(python_score)  # Round to nearest integer

        # Save submission to database
        submission_id = database.save_submission(
            session_id=session_id,
            mcq_answers=submission.mcq,
            python_code=submission.python,
            sql_answers=submission.sql,
            mcq_score=mcq_score,
            python_score=python_score,
            sql_score=sql_score,
            total_score=mcq_score + sql_score + python_score,
            python_results=python_results
        )

        # Update session state to submitted
        database.update_session_state(session_id, 'submitted')

        # Update tab switch count
        if submission.tab_switch_count:
            database.update_tab_switches(session_id, submission.tab_switch_count)

        # Print submission details
        print(f"\n{'='*50}")
        print(f"SUBMISSION RECEIVED - Session: {session_id}")
        print(f"{'='*50}")
        print(f"Candidate: {session['candidate_name']}")
        print(f"Email: {session['candidate_email']}")
        print(f"MCQ Score: {mcq_score}/10")
        print(f"SQL Score: {sql_score}/5")
        print(f"Python Score: {python_score}/10")
        for prob_id, result in python_results.items():
            print(f"  {prob_id}: {result['passed']}/{result['total']} tests passed ({result['points']} points)")
        print(f"Total Score: {mcq_score + sql_score + python_score}/25")
        print(f"Tab Switches: {submission.tab_switch_count}")
        if submission.tab_switch_count > 5:
            print(f"⚠️  WARNING: High number of tab switches detected!")
        print(f"{'='*50}\n")

        return {
            "success": True,
            "message": "Assessment submitted successfully",
            "submission_id": submission_id,
            "scores": {
                "mcq": f"{mcq_score}/10",
                "sql": f"{sql_score}/5",
                "python": f"{python_score}/10",
                "total": f"{mcq_score + sql_score + python_score}/25"
            },
            "python_details": python_results
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== ADMIN ENDPOINTS =====

@app.get("/api/admin/sessions")
async def get_all_sessions_admin(state: Optional[str] = None):
    """
    Get all sessions for admin dashboard
    Optional filter by state: not_started, in_progress, submitted
    """
    try:
        sessions = database.get_all_sessions(state_filter=state)

        # Enrich with submission data
        enriched_sessions = []
        for session in sessions:
            submission = database.get_submission(session['session_id'])
            session_data = {
                **session,
                "is_expired": database.is_session_expired(session),
                "remaining_seconds": database.get_remaining_time(session),
                "has_submission": submission is not None
            }
            if submission:
                session_data['scores'] = {
                    "mcq": submission['mcq_score'],
                    "python": submission['python_score'],
                    "sql": submission['sql_score'],
                    "total": submission['total_score']
                }
            enriched_sessions.append(session_data)

        return {
            "success": True,
            "total": len(enriched_sessions),
            "sessions": enriched_sessions
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/session/{session_id}")
async def get_session_details_admin(session_id: str):
    """
    Get detailed session information including submission
    For admin to review candidate's work
    """
    try:
        session_with_submission = database.get_session_with_submission(session_id)

        if not session_with_submission:
            raise HTTPException(status_code=404, detail="Session not found")

        return {
            "success": True,
            "data": session_with_submission
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

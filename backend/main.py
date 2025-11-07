from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
import docker
import json
import time

app = FastAPI(title="TechAssess API")

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Docker client
try:
    docker_client = docker.from_env()
except Exception as e:
    print(f"Warning: Docker not available: {e}")
    docker_client = None


# Request models
class PythonCodeRequest(BaseModel):
    code: str
    test_cases: Optional[list] = None


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
    docker_status = "connected" if docker_client else "disconnected"
    return {
        "status": "healthy",
        "docker": docker_status
    }


# Execute Python code in Docker sandbox
@app.post("/api/execute-python")
async def execute_python(request: PythonCodeRequest):
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker service unavailable")

    try:
        # Prepare the code
        code = request.code

        # Create a temporary container to run the code
        container = docker_client.containers.run(
            "python:3.11-alpine",
            command=["python", "-c", code],
            mem_limit="128m",  # Memory limit
            cpu_period=100000,
            cpu_quota=50000,   # 50% CPU
            network_disabled=True,  # No network access
            remove=True,
            detach=False,
            stdout=True,
            stderr=True
        )

        output = container.decode('utf-8')

        return {
            "success": True,
            "output": output,
            "error": None
        }

    except docker.errors.ContainerError as e:
        return {
            "success": False,
            "output": None,
            "error": e.stderr.decode('utf-8') if e.stderr else str(e)
        }
    except Exception as e:
        return {
            "success": False,
            "output": None,
            "error": str(e)
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


# Test Python code with test cases
@app.post("/api/test-python")
async def test_python(request: PythonCodeRequest):
    """
    Run Python code against test cases
    """
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker service unavailable")

    test_cases = request.test_cases or []
    results = []

    for test_case in test_cases:
        test_code = f"""
{request.code}

# Test case
{test_case.get('test', '')}
"""
        try:
            container = docker_client.containers.run(
                "python:3.11-alpine",
                command=["python", "-c", test_code],
                mem_limit="128m",
                cpu_period=100000,
                cpu_quota=50000,
                network_disabled=True,
                remove=True,
                detach=False,
                stdout=True,
                stderr=True
            )

            output = container.decode('utf-8').strip()
            expected = str(test_case.get('expected', '')).strip()

            results.append({
                "passed": output == expected,
                "expected": expected,
                "actual": output,
                "test": test_case.get('name', 'Test')
            })

        except Exception as e:
            results.append({
                "passed": False,
                "expected": test_case.get('expected', ''),
                "actual": None,
                "error": str(e),
                "test": test_case.get('name', 'Test')
            })

    passed = sum(1 for r in results if r.get('passed', False))

    return {
        "total_tests": len(results),
        "passed": passed,
        "failed": len(results) - passed,
        "results": results
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

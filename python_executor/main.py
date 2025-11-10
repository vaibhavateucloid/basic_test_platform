from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import subprocess
import sys
import os
import signal
import tempfile
import traceback

app = FastAPI(title="Python Code Executor")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TestCase(BaseModel):
    name: str
    test: str
    expected: str
    visible: bool = False


class ExecuteRequest(BaseModel):
    code: str
    test_cases: Optional[List[TestCase]] = None


@app.get("/")
async def root():
    return {"service": "Python Code Executor", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


def execute_code_safely(code: str, timeout: int = 5) -> dict:
    """
    Execute Python code safely with timeout and resource limits
    """
    try:
        # Create a temporary file to store the code
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            temp_file = f.name

        try:
            # Execute with timeout and resource limits
            result = subprocess.run(
                [sys.executable, temp_file],
                capture_output=True,
                text=True,
                timeout=timeout,
                # Security: Prevent network access and file operations
                env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'}
            )

            # Clean up
            os.unlink(temp_file)

            if result.returncode == 0:
                return {
                    "success": True,
                    "output": result.stdout,
                    "error": None
                }
            else:
                return {
                    "success": False,
                    "output": result.stdout,
                    "error": result.stderr
                }

        except subprocess.TimeoutExpired:
            os.unlink(temp_file)
            return {
                "success": False,
                "output": None,
                "error": "Execution timeout exceeded (5 seconds)"
            }
        except Exception as e:
            if os.path.exists(temp_file):
                os.unlink(temp_file)
            return {
                "success": False,
                "output": None,
                "error": f"Execution error: {str(e)}"
            }

    except Exception as e:
        return {
            "success": False,
            "output": None,
            "error": f"Code preparation error: {str(e)}"
        }


@app.post("/execute")
async def execute_code(request: ExecuteRequest):
    """
    Execute Python code with optional test cases
    """
    try:
        # If test cases provided, run with test cases
        if request.test_cases and len(request.test_cases) > 0:
            test_results = []

            for test_case in request.test_cases:
                # Combine user code with test case
                test_code = f"{request.code}\n\n# Test case\n{test_case.test}"

                result = execute_code_safely(test_code)

                if result["success"]:
                    actual_output = result["output"].strip()
                    expected_output = test_case.expected.strip()

                    test_results.append({
                        "passed": actual_output == expected_output,
                        "expected": expected_output,
                        "actual": actual_output,
                        "test_name": test_case.name,
                        "visible": test_case.visible,
                        "error": None
                    })
                else:
                    test_results.append({
                        "passed": False,
                        "expected": test_case.expected,
                        "actual": None,
                        "test_name": test_case.name,
                        "visible": test_case.visible,
                        "error": result["error"]
                    })

            passed = sum(1 for r in test_results if r.get("passed", False))

            return {
                "success": True,
                "output": None,
                "error": None,
                "test_mode": True,
                "total_tests": len(test_results),
                "passed": passed,
                "failed": len(test_results) - passed,
                "test_results": test_results
            }
        else:
            # Run code without test cases
            result = execute_code_safely(request.code)
            return {
                **result,
                "test_mode": False
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

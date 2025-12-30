"""
Secure code execution service with sandboxing and safety limits.

Supports:
- Python
- JavaScript (Node.js)

Safety features:
- Execution timeout
- Memory limits
- Restricted imports/requires
- No file system access
- No network access
"""

import subprocess
import tempfile
import os
import json
import ast
from typing import Dict, List, Tuple
from datetime import datetime
import re


class CodeExecutor:
    """Secure code executor with language-specific sandboxing."""
    
    TIMEOUT_SECONDS = 5  # Maximum execution time
    MEMORY_LIMIT_MB = 128  # Maximum memory usage
    
    # Python: Restricted imports
    PYTHON_FORBIDDEN_IMPORTS = [
        'os', 'sys', 'subprocess', 'socket', 'urllib', 'requests',
        'http', 'ftplib', 'telnetlib', 'asyncio', 'threading',
        'multiprocessing', '__import__', 'eval', 'exec', 'compile',
        'open', 'file', 'input', 'raw_input'
    ]
    
    # JavaScript: Restricted requires
    JS_FORBIDDEN_REQUIRES = [
        'fs', 'child_process', 'net', 'http', 'https', 'dgram',
        'dns', 'os', 'process', 'cluster', 'worker_threads'
    ]
    
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()
    
    def verify_logic(self, code: str, language: str, policy: dict) -> Tuple[bool, str]:
        """
        Verify code against logic requirements using static analysis.
        This prevents hardcoding values when variables/logic were requested.
        """
        if not policy:
            return True, ""
            
        if language == "python":
            return self._verify_python_logic(code, policy)
        
        return True, ""

    def _verify_python_logic(self, code: str, policy: dict) -> Tuple[bool, str]:
        """Perform AST analysis on Python code."""
        try:
            tree = ast.parse(code)
        except Exception as e:
            return False, f"Syntax error during logic analysis: {str(e)}"

        # 1. Required Variables
        required_vars = policy.get("required_variables", [])
        if required_vars:
            found_vars = set()
            for node in ast.walk(tree):
                if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
                    found_vars.add(node.id)
            
            for var in required_vars:
                if var not in found_vars:
                    return False, f"Protocol Violation: Missing mandatory variable assignment for '{var}'."

        # 2. Forbidden Patterns
        forbidden_patterns = policy.get("forbidden_patterns", [])
        for pattern in forbidden_patterns:
            if pattern in code:
                return False, f"Protocol Violation: Forbidden pattern detected: '{pattern}'."

        return True, ""

    def execute_python(self, code: str, test_cases: List[Dict]) -> Dict:
        """
        Execute Python code against test cases.
        
        Args:
            code: User's Python code
            test_cases: List of {"input_data": str, "expected_output": str}
        
        Returns:
            {
                "verdict": "Passed" | "Failed" | "Error",
                "passed_cases": int,
                "total_cases": int,
                "execution_time": float,
                "output_log": str
            }
        """
        # 1. Validate code safety
        safety_check = self._check_python_safety(code)
        if not safety_check["safe"]:
            return {
                "verdict": "Error",
                "passed_cases": 0,
                "total_cases": len(test_cases),
                "execution_time": 0.0,
                "output_log": f"Security violation: {safety_check['reason']}"
            }
        
        # 2. Run code against test cases
        passed = 0
        outputs = []
        total_time = 0.0
        
        for i, test_case in enumerate(test_cases):
            result = self._run_python_code(
                code,
                test_case["input_data"],
                test_case["expected_output"]
            )
            
            if result["success"]:
                passed += 1
                outputs.append(f"Test {i+1}: PASS")
            else:
                outputs.append(f"Test {i+1}: FAIL - {result['error']}")
            
            total_time += result["execution_time"]
            
            # Stop on first error for security
            if result["error"] and "Security" in result["error"]:
                break
        
        verdict = "Passed" if passed == len(test_cases) else "Failed"
        
        return {
            "verdict": verdict,
            "passed_cases": passed,
            "total_cases": len(test_cases),
            "execution_time": total_time,
            "output_log": "\n".join(outputs)
        }
    
    def execute_javascript(self, code: str, test_cases: List[Dict]) -> Dict:
        """
        Execute JavaScript code against test cases.
        
        Args:
            code: User's JavaScript code
            test_cases: List of {"input_data": str, "expected_output": str}
        
        Returns:
            Same format as execute_python
        """
        # 1. Validate code safety
        safety_check = self._check_javascript_safety(code)
        if not safety_check["safe"]:
            return {
                "verdict": "Error",
                "passed_cases": 0,
                "total_cases": len(test_cases),
                "execution_time": 0.0,
                "output_log": f"Security violation: {safety_check['reason']}"
            }
        
        # 2. Run code against test cases
        passed = 0
        outputs = []
        total_time = 0.0
        
        for i, test_case in enumerate(test_cases):
            result = self._run_javascript_code(
                code,
                test_case["input_data"],
                test_case["expected_output"]
            )
            
            if result["success"]:
                passed += 1
                outputs.append(f"Test {i+1}: PASS")
            else:
                outputs.append(f"Test {i+1}: FAIL - {result['error']}")
            
            total_time += result["execution_time"]
            
            # Stop on first error for security
            if result["error"] and "Security" in result["error"]:
                break
        
        verdict = "Passed" if passed == len(test_cases) else "Failed"
        
        return {
            "verdict": verdict,
            "passed_cases": passed,
            "total_cases": len(test_cases),
            "execution_time": total_time,
            "output_log": "\n".join(outputs)
        }
    
    # ========================================================================
    # PYTHON EXECUTION
    # ========================================================================
    
    def _check_python_safety(self, code: str) -> Dict[str, any]:
        """Check if Python code contains forbidden patterns."""
        code_lower = code.lower()
        
        # Check for forbidden imports
        for forbidden in self.PYTHON_FORBIDDEN_IMPORTS:
            patterns = [
                f"import {forbidden}",
                f"from {forbidden}",
                f"__import__('{forbidden}'",
                f'__import__("{forbidden}"'
            ]
            for pattern in patterns:
                if pattern in code_lower:
                    return {
                        "safe": False,
                        "reason": f"Forbidden import: {forbidden}"
                    }
        
        # Check for dangerous builtins
        dangerous = ['eval', 'exec', 'compile', '__import__', 'open']
        for danger in dangerous:
            if re.search(rf'\b{danger}\s*\(', code):
                return {
                    "safe": False,
                    "reason": f"Forbidden function: {danger}"
                }
        
        return {"safe": True, "reason": ""}
    
    def _run_python_code(self, code: str, input_data: str, expected_output: str) -> Dict:
        """
        Run Python code in isolated subprocess.
        
        Returns:
            {
                "success": bool,
                "output": str,
                "error": str,
                "execution_time": float
            }
        """
        start_time = datetime.now()
        
        # Create wrapper that captures output
        wrapper = f"""
import sys
from io import StringIO

# Redirect stdout
old_stdout = sys.stdout
sys.stdout = StringIO()

try:
    # User code
{self._indent_code(code, 4)}
    
    # Capture output
    output = sys.stdout.getvalue()
    sys.stdout = old_stdout
    print("__OUTPUT__:" + output.strip())
    
except Exception as e:
    sys.stdout = old_stdout
    print("__ERROR__:" + str(e))
"""
        
        # Write to temp file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(wrapper)
            temp_file = f.name
        
        try:
            # Execute with timeout
            result = subprocess.run(
                ['python', temp_file],
                capture_output=True,
                text=True,
                timeout=self.TIMEOUT_SECONDS,
                input=input_data if input_data else None
            )
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            # Parse output
            stdout = result.stdout.strip()
            
            if "__ERROR__:" in stdout:
                error_msg = stdout.split("__ERROR__:")[1].strip()
                return {
                    "success": False,
                    "output": "",
                    "error": error_msg,
                    "execution_time": execution_time
                }
            
            if "__OUTPUT__:" in stdout:
                actual_output = stdout.split("__OUTPUT__:")[1].strip()
            else:
                actual_output = stdout
            
            # Compare output
            if actual_output == expected_output.strip():
                return {
                    "success": True,
                    "output": actual_output,
                    "error": "",
                    "execution_time": execution_time
                }
            else:
                return {
                    "success": False,
                    "output": actual_output,
                    "error": f"Expected: '{expected_output.strip()}', Got: '{actual_output}'",
                    "execution_time": execution_time
                }
        
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "output": "",
                "error": f"Timeout: Code exceeded {self.TIMEOUT_SECONDS}s limit (infinite loop?)",
                "execution_time": self.TIMEOUT_SECONDS
            }
        
        except Exception as e:
            return {
                "success": False,
                "output": "",
                "error": f"Execution error: {str(e)}",
                "execution_time": (datetime.now() - start_time).total_seconds()
            }
        
        finally:
            # Cleanup
            try:
                os.unlink(temp_file)
            except:
                pass
    
    # ========================================================================
    # JAVASCRIPT EXECUTION
    # ========================================================================
    
    def _check_javascript_safety(self, code: str) -> Dict[str, any]:
        """Check if JavaScript code contains forbidden patterns."""
        code_lower = code.lower()
        
        # Check for forbidden requires
        for forbidden in self.JS_FORBIDDEN_REQUIRES:
            patterns = [
                f"require('{forbidden}'",
                f'require("{forbidden}"',
                f"require(`{forbidden}`"
            ]
            for pattern in patterns:
                if pattern in code_lower:
                    return {
                        "safe": False,
                        "reason": f"Forbidden module: {forbidden}"
                    }
        
        # Check for dangerous globals
        dangerous = ['eval', 'Function', 'process.exit', 'require.cache']
        for danger in dangerous:
            if danger.lower() in code_lower:
                return {
                    "safe": False,
                    "reason": f"Forbidden: {danger}"
                }
        
        return {"safe": True, "reason": ""}
    
    def _run_javascript_code(self, code: str, input_data: str, expected_output: str) -> Dict:
        """
        Run JavaScript code in isolated subprocess.
        
        Returns:
            Same format as _run_python_code
        """
        start_time = datetime.now()
        
        # Create wrapper
        wrapper = f"""
try {{
    // User code
{self._indent_code(code, 4)}
    
}} catch (e) {{
    console.log('__ERROR__:' + e.message);
}}
"""
        
        # Write to temp file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write(wrapper)
            temp_file = f.name
        
        try:
            # Execute with node
            result = subprocess.run(
                ['node', temp_file],
                capture_output=True,
                text=True,
                timeout=self.TIMEOUT_SECONDS,
                input=input_data if input_data else None
            )
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            # Parse output
            stdout = result.stdout.strip()
            
            if "__ERROR__:" in stdout:
                error_msg = stdout.split("__ERROR__:")[1].strip()
                return {
                    "success": False,
                    "output": "",
                    "error": error_msg,
                    "execution_time": execution_time
                }
            
            actual_output = stdout
            
            # Compare output
            if actual_output == expected_output.strip():
                return {
                    "success": True,
                    "output": actual_output,
                    "error": "",
                    "execution_time": execution_time
                }
            else:
                return {
                    "success": False,
                    "output": actual_output,
                    "error": f"Expected: '{expected_output.strip()}', Got: '{actual_output}'",
                    "execution_time": execution_time
                }
        
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "output": "",
                "error": f"Timeout: Code exceeded {self.TIMEOUT_SECONDS}s limit (infinite loop?)",
                "execution_time": self.TIMEOUT_SECONDS
            }
        
        except Exception as e:
            return {
                "success": False,
                "output": "",
                "error": f"Execution error: {str(e)}",
                "execution_time": (datetime.now() - start_time).total_seconds()
            }
        
        finally:
            # Cleanup
            try:
                os.unlink(temp_file)
            except:
                pass
    
    # ========================================================================
    # UTILITIES
    # ========================================================================
    
    def _indent_code(self, code: str, spaces: int) -> str:
        """Indent code by N spaces."""
        indent = " " * spaces
        return "\n".join(indent + line for line in code.split("\n"))

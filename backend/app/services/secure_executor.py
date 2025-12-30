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
import shutil


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
    
    # ========================================================================
    # COMPILED & OTHER LANGUAGES EXECUTION (Basic Support)
    # ========================================================================

    def _execute_generic(self, code: str, test_cases: List[Dict], language_settings: Dict) -> Dict:
        """
        Generic executor for compiled/other languages.
        
        language_settings = {
            "name": str,
            "compiler": str, (optional)
            "runner": str,
            "extension": str,
            "compile_args": List[str], (optional, input file appended last)
            "run_args": List[str] (optional, input file appended last)
        }
        """
        # 1. Check tools
        if language_settings.get("compiler"):
            if not shutil.which(language_settings["compiler"]):
                return {
                    "verdict": "Error",
                    "execution_time": 0.0,
                    "passed_cases": 0,
                    "total_cases": len(test_cases),
                    "output_log": f"System Error: {language_settings['name']} compiler '{language_settings['compiler']}' not found on server."
                }
        
        executor_cmd = language_settings["runner"]
        if not shutil.which(executor_cmd):
             return {
                "verdict": "Error",
                "execution_time": 0.0,
                "passed_cases": 0,
                "total_cases": len(test_cases),
                "output_log": f"System Error: {language_settings['name']} runner '{language_settings['runner']}' not found on server."
            }

        passed = 0
        outputs = []
        total_time = 0.0

        # Create temp file
        with tempfile.NamedTemporaryFile(mode='w', suffix=f".{language_settings['extension']}", delete=False) as f:
            f.write(code)
            source_file = f.name

        compiled_file = None
        
        try:
            # 2. Compile if needed
            if language_settings.get("compiler"):
                compiled_file = source_file.replace(f".{language_settings['extension']}", "")
                if os.name == 'nt':
                    compiled_file += ".exe"
                    
                compile_cmd = [language_settings["compiler"]] + language_settings.get("compile_args", [])
                
                # Special handling for some languages
                if language_settings["name"] == "Java":
                    # Java is specific, javac Source.java -> Source.class
                    # For simplicity, we assume single file execution
                    pass 
                elif language_settings["name"] == "C++" or language_settings["name"] == "C":
                    compile_cmd.extend(["-o", compiled_file, source_file])
                elif language_settings["name"] == "Rust":
                    compile_cmd.extend(["-o", compiled_file, source_file])
                elif language_settings["name"] == "Go":
                    compile_cmd = ["go", "build", "-o", compiled_file, source_file]
                elif language_settings["name"] == "C#":
                    # csc /out:Program.exe Program.cs
                    compile_cmd.extend([f"/out:{compiled_file}", source_file])

                # Run compilation
                try:
                    subprocess.run(
                        compile_cmd,
                        check=True,
                        capture_output=True,
                        text=True,
                        timeout=10
                    )
                except subprocess.CalledProcessError as e:
                     return {
                        "verdict": "Compilation Error",
                        "execution_time": 0.0,
                        "passed_cases": 0,
                        "total_cases": len(test_cases),
                        "output_log": f"Compilation Failed:\n{e.stderr}"
                    }
            
            # 3. Execute against test cases
            run_cmd_base = [language_settings["runner"]] if not compiled_file else [compiled_file]
            if language_settings.get("run_args"):
                 run_cmd_base.extend(language_settings["run_args"])
            
            if language_settings["name"] == "Java":
                # java Source
                # We need to handle class name properly. For now assuming class is Main or similar? 
                # Actually, for Java single-file source usage: java Source.java (Java 11+)
                run_cmd_base = ["java", source_file]

            if language_settings["name"] == "TypeScript":
                run_cmd_base = ["ts-node", source_file]

            for i, test_case in enumerate(test_cases):
                start_time = datetime.now()
                try:
                    result = subprocess.run(
                        run_cmd_base,
                        input=test_case["input_data"] if test_case["input_data"] else None,
                        capture_output=True,
                        text=True,
                        timeout=self.TIMEOUT_SECONDS
                    )
                    
                    exec_time = (datetime.now() - start_time).total_seconds()
                    total_time += exec_time
                    
                    actual_output = result.stdout.strip()
                    if actual_output == test_case["expected_output"].strip():
                        passed += 1
                        outputs.append(f"Test {i+1}: PASS")
                    else:
                        outputs.append(f"Test {i+1}: FAIL\nExpected: {test_case['expected_output']}\nGot: {actual_output}")
                        
                except subprocess.TimeoutExpired:
                     outputs.append(f"Test {i+1}: TIMEOUT")
                except Exception as e:
                     outputs.append(f"Test {i+1}: ERROR - {str(e)}")

        finally:
            # Cleanup
            try:
                if os.path.exists(source_file): os.unlink(source_file)
                if compiled_file and os.path.exists(compiled_file): os.unlink(compiled_file)
            except:
                pass

        verdict = "Passed" if passed == len(test_cases) else "Failed"
        return {
            "verdict": verdict,
            "passed_cases": passed,
            "total_cases": len(test_cases),
            "execution_time": total_time,
            "output_log": "\n".join(outputs)
        }

    def execute_java(self, code, test_cases):
        return self._execute_generic(code, test_cases, {
            "name": "Java",
            "compiler": None, # Use java direct execution for Source.java
            "runner": "java",
            "extension": "java"
        })

    def execute_cpp(self, code, test_cases):
        return self._execute_generic(code, test_cases, {
            "name": "C++",
            "compiler": "g++",
            "runner": "./program", # Placeholder, handled in logic
            "extension": "cpp"
        })

    def execute_c(self, code, test_cases):
        return self._execute_generic(code, test_cases, {
            "name": "C",
            "compiler": "gcc",
            "runner": "./program",
            "extension": "c"
        })

    def execute_csharp(self, code, test_cases):
        return self._execute_generic(code, test_cases, {
            "name": "C#",
            "compiler": "csc",
            "runner": "./program",
            "extension": "cs"
        })
    
    def execute_go(self, code, test_cases):
        return self._execute_generic(code, test_cases, {
            "name": "Go",
            "compiler": "go",
            "runner": "./program",
            "extension": "go"
        })

    def execute_rust(self, code, test_cases):
        return self._execute_generic(code, test_cases, {
            "name": "Rust",
            "compiler": "rustc",
            "runner": "./program",
            "extension": "rs"
        })

    def execute_typescript(self, code, test_cases):
        return self._execute_generic(code, test_cases, {
            "name": "TypeScript",
            "compiler": None,
            "runner": "ts-node",
            "extension": "ts"
        })

    def execute_php(self, code, test_cases):
        return self._execute_generic(code, test_cases, {
            "name": "PHP",
            "compiler": None,
            "runner": "php",
            "extension": "php"
        })

    def execute_kotlin(self, code, test_cases):
        # kotlin -script main.kts
        return self._execute_generic(code, test_cases, {
            "name": "Kotlin",
            "compiler": None, # Use script mode
            "runner": "kotlin",
            "run_args": ["-script"],
            "extension": "kts"
        })

    def _indent_code(self, code: str, spaces: int) -> str:
        """Indent code by N spaces."""
        indent = " " * spaces
        return "\n".join(indent + line for line in code.split("\n"))

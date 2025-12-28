import subprocess
import json
import tempfile
import os

class CodeExecutor:
    def __init__(self):
        pass

    def run_javascript(self, code, test_cases):
        # Construct a harness
        # Wrapper to handle inputs and logging
        harness = """
const { performance } = require('perf_hooks');

const run = () => {
    try {
        %s
        
        const testCases = %s;
        let passed = 0;
        const total = testCases.length;
        
        const start = performance.now();
        
        testCases.forEach((tc, index) => {
            try {
                // Parse args if they are JSON strings, or use directly
                // Assuming test_cases inputs are list of args
                const args = JSON.parse(tc.input_data); 
                const expected = JSON.parse(tc.expected_output);
                
                const result = solution(...args);
                
                // Deep equality check (simplistic for now)
                if (JSON.stringify(result) === JSON.stringify(expected)) {
                    passed++;
                } else {
                    console.error(`Case ${index} Failed. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(result)}`);
                }
            } catch (err) {
                console.error(`Case ${index} Error: ${err.message}`);
            }
        });
        
        const end = performance.now();
        console.log("METRICS::" + JSON.stringify({ passed, total, time: end - start }));
        
    } catch (e) {
        console.error("Runtime Error: " + e.message);
    }
};

run();
""" % (code, json.dumps(test_cases))

        return self._execute_process(["node", "-e", harness])

    def run_python(self, code, test_cases):
        harness = """
import json
import sys
import time
from typing import *

%s

def run():
    try:
        test_cases = %s
        passed = 0
        total = len(test_cases)
        
        start = time.time()
        
        for idx, tc in enumerate(test_cases):
            try:
                args = json.loads(tc['input_data'])
                expected = json.loads(tc['expected_output'])
                
                # Dynamic call assuming function is named 'solution'
                if 'solution' not in globals():
                     print(f"Case {idx} Error: Function 'solution' not found", file=sys.stderr)
                     continue

                result = solution(*args)
                
                # Basic equality check
                if result == expected:
                    passed += 1
                else:
                    print(f"Case {idx} Failed. Expected {expected}, got {result}", file=sys.stderr)
            except Exception as e:
                 print(f"Case {idx} Error: {e}", file=sys.stderr)
        
        end = time.time()
        print("METRICS::" + json.dumps({"passed": passed, "total": total, "time": (end - start) * 1000}))

    except Exception as e:
        print(f"Runtime Error: {e}", file=sys.stderr)

run()
""" % (code, json.dumps(test_cases))

        return self._execute_process(["python", "-c", harness])

    def _execute_process(self, command):
        try:
            result = subprocess.run(
                command, 
                capture_output=True, 
                text=True, 
                timeout=3 # 3 second timeout prevents infinite loops
            )
            
            stdout = result.stdout
            stderr = result.stderr
            
            # Parse our custom metrics
            verdict = "Failed"
            passed = 0
            total = 0
            time_ms = 0.0
            
            for line in stdout.splitlines():
                if line.startswith("METRICS::"):
                    metrics = json.loads(line.replace("METRICS::", ""))
                    passed = metrics["passed"]
                    total = metrics["total"]
                    time_ms = metrics["time"]
            
            if passed == total and total > 0:
                verdict = "Passed"
            elif result.returncode != 0:
                verdict = "Error"
            
            return {
                "verdict": verdict,
                "passed_cases": passed,
                "total_cases": total,
                "execution_time": time_ms,
                "output_log": stderr or stdout
            }
            
        except subprocess.TimeoutExpired:
            return {
                "verdict": "Error",
                "passed_cases": 0,
                "total_cases": 0,
                "execution_time": 3000,
                "output_log": "Time Limit Exceeded"
            }
        except Exception as e:
            return {
                "verdict": "Error",
                "passed_cases": 0,
                "total_cases": 0,
                "execution_time": 0,
                "output_log": str(e)
            }

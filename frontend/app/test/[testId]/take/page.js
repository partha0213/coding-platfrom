"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Send, Clock, AlertTriangle, Maximize } from 'lucide-react';
import FullScreenProctor from '@/components/FullScreenProctor';
import MonacoEditor from '@monaco-editor/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function TakeTest() {
    const router = useRouter();
    const params = useParams();
    const testId = params.testId;

    const [test, setTest] = useState(null);
    const [problems, setProblems] = useState([]);
    const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState("javascript");
    const [submitting, setSubmitting] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [userId, setUserId] = useState(null);
    const [lastResult, setLastResult] = useState(null);
    const [submittedProblems, setSubmittedProblems] = useState([]); // Track which problems are locked
    const [problemCodes, setProblemCodes] = useState({}); // Track code for each problem
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const initializeTest = async () => {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const uid = parseInt(user.id);
            setUserId(uid);
            await fetchTestData(uid);
        };
        initializeTest();
    }, [testId]);

    useEffect(() => {
        if (!test) return;
        const interval = setInterval(() => {
            const now = new Date();
            const end = new Date(test.end_time);
            const diff = end - now;
            if (diff <= 0) {
                clearInterval(interval);
                concludeTest(true);
            } else {
                setTimeLeft(diff);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [test]);

    const fetchTestData = async (uid) => {
        try {
            const testRes = await fetch(`${API_URL}/admin/tests`);
            const tests = await testRes.json();
            const currentTest = tests.find(t => t.id === parseInt(testId));
            setTest(currentTest);

            const token = localStorage.getItem("token");
            const problemsRes = await fetch(`${API_URL}/student/active-test`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await problemsRes.json();

            if (data.message) {
                alert(data.message);
                router.push("/tests");
                return;
            }

            if (data.active_test && data.active_test.problems) {
                setProblems(data.active_test.problems);
            }
        } catch (err) {
            console.error("Failed to fetch test data:", err);
        }
    };

    const runCode = async () => {
        if (!code.trim()) {
            alert("Please write some code before running");
            return;
        }
        setExecuting(true);
        setLastResult(null);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/execute`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    problem_id: problems[currentProblemIndex].id,
                    language: language,
                    code: code,
                    test_id: parseInt(testId)
                })
            });
            const result = await res.json();
            setLastResult(result);
        } catch (err) {
            console.error("Execution error:", err);
            setLastResult({ verdict: "Error", output_log: "Failed to connect to execution server." });
        } finally {
            setExecuting(false);
        }
    };

    const submitCode = async () => {
        if (!code.trim()) {
            alert("Please write some code before submitting");
            return;
        }
        setSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/execute`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    problem_id: problems[currentProblemIndex].id,
                    language: language,
                    code: code,
                    test_id: parseInt(testId)
                })
            });

            const result = await res.json();
            setLastResult(result);

            // Mark problem as submitted (lock it)
            setSubmittedProblems(prev => [...prev, currentProblem.id]);

            if (currentProblemIndex < problems.length - 1) {
                setTimeout(() => {
                    const nextIndex = currentProblemIndex + 1;
                    setCurrentProblemIndex(nextIndex);
                    setCode(problemCodes[problems[nextIndex].id] || problems[nextIndex].starter_codes?.[language] || "");
                    setLastResult(null);
                }, 1500);
            } else {
                await concludeTest(false);
            }
        } catch (err) {
            console.error("Submission error:", err);
            alert("Failed to submit code. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const concludeTest = async (isAuto = false) => {
        try {
            await markTestCompleted();

            if (isAuto) {
                alert("Time is up! Your test has been automatically submitted.");
            } else {
                alert("All problems submitted! Test completed. Redirecting to results...");
            }

            // Explicitly exit fullscreen to release the student
            if (document.fullscreenElement) {
                try {
                    await document.exitFullscreen();
                } catch (e) {
                    console.error("Failed to exit fullscreen:", e);
                }
            }

            // Update local storage for immediate UI feedback elsewhere
            const tid = parseInt(testId);
            const completedTests = JSON.parse(localStorage.getItem("completedTests") || "[]");
            if (!completedTests.includes(tid)) {
                completedTests.push(tid);
                localStorage.setItem("completedTests", JSON.stringify(completedTests));
            }

            // Redirect to results page
            router.push(`/test/${testId}/results`);
        } catch (err) {
            console.error("Error concluding test:", err);
            // Fallback redirect even if marking completed fails
            router.push(`/test/${testId}/results`);
        }
    };

    const markTestCompleted = async () => {
        try {
            const token = localStorage.getItem("token");
            await fetch(`${API_URL}/student/complete-test/${testId}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
        } catch (err) {
            console.error("Failed to mark test as completed:", err);
        }
    };

    const handleEditorDidMount = (editor, monaco) => {
        // 1. Block Context Menu
        editor.onContextMenu((e) => {
            e.event.preventDefault();
            e.event.stopPropagation();
        });

        // 2. Block Paste Command
        editor.addAction({
            id: 'paste-blocked',
            label: 'Paste Blocked',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV],
            precondition: null,
            keybindingContext: null,
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.5,
            run: () => {
                alert("Copy-pasting is blocked during the test. Please type your code manually.");
            }
        });

        // 3. Block Copy Command
        editor.addAction({
            id: 'copy-blocked',
            label: 'Copy Blocked',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC],
            run: () => { }
        });

        // 4. Block Cut Command
        editor.addAction({
            id: 'cut-blocked',
            label: 'Cut Blocked',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX],
            run: () => { }
        });

        // 5. Hard block onKeyDown for any missed cases
        editor.onKeyDown((e) => {
            const { ctrlKey, metaKey, keyCode } = e;
            if ((ctrlKey || metaKey) && (keyCode === monaco.KeyCode.KeyV || keyCode === monaco.KeyCode.KeyC || keyCode === monaco.KeyCode.KeyX)) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    };

    const formatTime = (ms) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!test || problems.length === 0) {
        return (
            <div className="h-screen w-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
                {/* Background atmosphere */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full"></div>

                <div className="max-w-md w-full relative z-10">
                    <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30 shadow-2xl shadow-blue-500/20">
                            <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Initializing Session</h2>
                        <div className="flex items-center justify-center gap-2 text-blue-400 font-bold uppercase tracking-widest text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Establishing Secure Link
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { label: "Proctoring Algorithms", desc: "Activating AI object detection & behavior monitoring" },
                            { label: "Environment Sync", desc: "Verifying browser integrity and fullscreen protocols" },
                            { label: "Test Vault", desc: "Decrypting assessment challenges and starter code" }
                        ].map((item, idx) => (
                            <div key={idx}
                                className="glass-morphism-dark p-5 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700"
                                style={{ animationDelay: `${(idx + 1) * 200}ms` }}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-black text-slate-200 uppercase tracking-widest">{item.label}</span>
                                    <span className="text-[9px] font-bold text-blue-400 uppercase">Active</span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    <p className="text-center mt-12 text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">
                        CodeVault Terminal v4.0.2
                    </p>
                </div>
            </div>
        );
    }

    const currentProblem = problems[currentProblemIndex];

    return (
        <div className="h-screen bg-slate-50 text-slate-900 flex flex-col overflow-hidden select-none"
            onPaste={(e) => {
                e.preventDefault();
                alert("Paste is restricted globally during this test.");
            }}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
        >
            <FullScreenProctor
                isEnabled={true}
                userId={userId}
                problemId={currentProblem.id}
                testId={parseInt(testId)}
                onViolation={(violation) => console.log("Violation:", violation)}
                onKickOut={(message) => {
                    alert(message);
                    router.push('/tests');
                }}
                onFullscreenChange={(fs) => setIsFullscreen(fs)}
            />

            {/* Strict Fullscreen Enforced Lockout Overlay */}
            {!isFullscreen && (
                <div className="fixed inset-0 z-[999] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-white rounded-3xl p-10 max-w-lg shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-8 mx-auto">
                            <Maximize size={48} className="text-rose-600 animate-pulse" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Fullscreen Required</h2>
                        <p className="text-slate-600 mb-10 leading-relaxed text-lg">
                            To maintain test integrity, this exam must be conducted in <span className="font-black text-slate-900">enforced full-screen mode</span>. All navigation and external shortcuts are disabled.
                        </p>
                        <button
                            onClick={() => {
                                const elem = document.documentElement;
                                if (elem.requestFullscreen) elem.requestFullscreen();
                                else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
                                else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-900/40 active:scale-95"
                        >
                            Enter Enforced Mode
                        </button>
                        <p className="mt-6 text-slate-400 text-sm font-bold uppercase tracking-widest">
                            CodeVault Security Protocol v2.4
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-xl font-black text-slate-900">{test.title}</h1>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                        <span className="font-bold text-blue-600 uppercase">Problem {currentProblemIndex + 1}/{problems.length}</span>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] uppercase">{currentProblem.difficulty}</span>
                    </p>
                </div>
                {timeLeft && (
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-5 py-2 rounded-2xl border font-bold ${timeLeft < 600000
                            ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
                            : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                            }`}>
                            <Clock size={16} className={timeLeft < 600000 ? 'text-rose-600' : 'text-blue-600'} />
                            <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-5/12 border-r border-slate-200 overflow-y-auto p-8 bg-white">
                    <h2 className="text-3xl font-black mb-6 text-slate-900 leading-tight">{currentProblem.title || "Loading..."}</h2>
                    <div className="prose prose-slate max-w-none mb-10 select-none pointer-events-none">
                        <div className="bg-slate-50 rounded-2xl p-6 text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100 shadow-inner">
                            {currentProblem.description || "No description provided."}
                        </div>
                    </div>
                    <div className="flex gap-4 mt-auto">
                        <button
                            onClick={() => {
                                const prevIndex = Math.max(0, currentProblemIndex - 1);
                                setCurrentProblemIndex(prevIndex);
                                setCode(problemCodes[problems[prevIndex].id] || problems[prevIndex].starter_codes?.[language] || "");
                                setLastResult(null);
                            }}
                            disabled={currentProblemIndex === 0}
                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-300 text-slate-700 py-3 rounded-2xl font-bold transition-all shadow-sm"
                        >
                            <ChevronLeft size={18} /> Previous
                        </button>
                        <button
                            onClick={() => {
                                const nextIndex = Math.min(problems.length - 1, currentProblemIndex + 1);
                                setCurrentProblemIndex(nextIndex);
                                setCode(problemCodes[problems[nextIndex].id] || problems[nextIndex].starter_codes?.[language] || "");
                                setLastResult(null);
                            }}
                            disabled={currentProblemIndex === problems.length - 1}
                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-300 text-slate-700 py-3 rounded-2xl font-bold transition-all shadow-sm"
                        >
                            Next <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                <div className="w-7/12 flex flex-col bg-[#1e1e1e]">
                    <div className="bg-[#2d2d2d] border-b border-white/5 px-6 py-3 flex justify-between items-center">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-[#3d3d3d] text-white px-4 py-2 rounded-xl font-bold text-sm outline-none border border-white/10"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                        </select>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={runCode}
                                disabled={executing || submitting}
                                className="flex items-center gap-2 bg-[#3d3d3d] hover:bg-[#4a4a4a] text-white px-6 py-2.5 rounded-xl font-bold text-sm border border-white/10"
                            >
                                {executing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Zap size={16} className="text-amber-400" />}
                                {executing ? "Compiling..." : "Run Code"}
                            </button>
                            <button
                                onClick={submitCode}
                                disabled={submitting || executing || submittedProblems.includes(currentProblem.id)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-black text-sm shadow-lg shadow-blue-900/40 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send size={16} />}
                                {submittedProblems.includes(currentProblem.id) ? "Problem Submitted" : (currentProblemIndex === problems.length - 1 ? "Finish & Submit Test" : "Submit & Next")}
                            </button>
                        </div>
                    </div>

                    <div
                        className="flex-1 relative"
                        onContextMenu={(e) => e.preventDefault()}
                        onCopy={(e) => e.preventDefault()}
                        onPaste={(e) => {
                            e.preventDefault();
                            alert("Copy-pasting is blocked during the test. Please type your code.");
                        }}
                        onCut={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            alert("Drag and drop is disabled during the test.");
                        }}
                    >
                        <MonacoEditor
                            height="100%"
                            language={language}
                            theme="vs-dark"
                            value={code}
                            onMount={handleEditorDidMount}
                            onChange={(value) => {
                                const newCode = value || "";
                                setCode(newCode);
                                setProblemCodes(prev => ({ ...prev, [currentProblem.id]: newCode }));
                            }}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 16,
                                lineNumbers: "on",
                                automaticLayout: true,
                                padding: { top: 20 },
                                contextmenu: false,
                                readOnly: submittedProblems.includes(currentProblem.id)
                            }}
                        />
                    </div>

                    <div className={`transition-all duration-300 ${lastResult ? 'h-48' : 'h-10'} bg-[#121212] border-t border-white/10 flex flex-col`}>
                        <div className="px-6 py-2 flex items-center justify-between border-b border-white/5 bg-[#1a1a1a]">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                <TerminalIcon size={12} /> Execution Status
                            </span>
                            {lastResult && (
                                <span className={`text-[10px] font-black uppercase tracking-widest ${lastResult.verdict === "Passed" ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {lastResult.verdict === "Passed" ? "Execution Successful" : "Test Cases Failed"}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
                            {lastResult ? (
                                <div className={lastResult.verdict === "Passed" ? 'text-emerald-400' : 'text-rose-400'}>
                                    <pre className="whitespace-pre-wrap">
                                        {lastResult.verdict === "Passed"
                                            ? "Your code has been executed successfully against the proctored test cases."
                                            : "Errors or mismatches detected during execution. Please review your logic."}
                                    </pre>
                                </div>
                            ) : (
                                <span className="text-white/20 italic text-xs">Waiting for execution...</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center gap-3 shadow-inner">
                <AlertTriangle className="text-blue-600" size={18} />
                <span className="text-xs text-slate-600 font-medium">
                    Proctoring active. Multiple tab switches or camera violations will lead to automatic disqualification.
                </span>
            </div>
        </div>
    );
}

function Zap({ size, className }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
}

function TerminalIcon({ size, className }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>;
}

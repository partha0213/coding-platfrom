"use client";
import { useEffect, useState, useCallback } from "react";
import SecureEditor from "@/components/SecureEditor";
import { executeCode } from "@/services/api";
import {
    Play, CheckCircle, XCircle, AlertOctagon,
    Maximize, ArrowLeft, Target, Terminal,
    ChevronRight, Info, Zap, ShieldCheck
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function ProblemSolvingPage({ params }) {
    const { id } = params;
    const { user } = useAuth();
    const [problem, setProblem] = useState(null);
    const [language, setLanguage] = useState("javascript");
    const [code, setCode] = useState("");
    const [result, setResult] = useState(null);
    const [running, setRunning] = useState(false);
    const [allPassed, setAllPassed] = useState(false);
    const router = useRouter();

    // Anti-Cheat State
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [tabSwitches, setTabSwitches] = useState(0);
    const [isReviewMode, setIsReviewMode] = useState(false);

    const fetchProblem = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/problems/${id}`);
            const data = await res.json();

            const starters = typeof data.starter_codes === 'string'
                ? JSON.parse(data.starter_codes)
                : data.starter_codes;

            setProblem({ ...data, starter_codes: starters });
            if (!code) setCode(starters[language] || "");
        } catch (err) {
            console.error("Failed to fetch problem:", err);
        }
    }, [id, language, code]);

    useEffect(() => {
        fetchProblem();
        if (user) {
            fetch(`${API_URL}/student/submission/${user.id}/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.code) {
                        setCode(data.code);
                        setResult(data);
                        setIsReviewMode(true);
                    }
                })
                .catch(console.error);
        }
    }, [fetchProblem, user, id]);

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        if (problem?.starter_codes) {
            setCode(problem.starter_codes[newLang] || "");
        }
    };

    // Tab Switch Tracker
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setTabSwitches(prev => prev + 1);
                // In a real app, send this to backend
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    const runCode = async () => {
        setRunning(true);
        setResult(null);
        setAllPassed(false);
        try {
            const res = await executeCode(id, code, language);
            setResult(res);
            if (res.verdict === 'Passed') {
                setAllPassed(true);
            }
        } catch (err) {
            console.error(err);
            setResult({ verdict: "Error", output_log: "Failed to reach execution server." });
        } finally {
            setRunning(false);
        }
    };

    const nextProblemId = parseInt(id) + 1;

    const handleNext = async () => {
        // Try to see if next problem exists
        try {
            const res = await fetch(`${API_URL}/problems/${nextProblemId}`);
            if (res.ok) {
                router.push(`/problem/${nextProblemId}`);
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            router.push('/dashboard');
        }
    };

    const enterFullScreen = () => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullScreen(true);
            }).catch(console.error);
        }
    };

    if (!problem) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Initializing Environment...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            {/* Header */}
            <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between shrink-0 shadow-sm z-50">
                <div className="flex items-center gap-6">
                    <Link href="/problems" className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all border border-transparent hover:border-slate-100">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-extrabold text-slate-900 leading-tight">{problem.title}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md ${problem.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600' : problem.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                                {problem.difficulty}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {id}</span>
                            {tabSwitches > 0 && (
                                <span className="text-[10px] bg-red-50 text-red-600 font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <AlertOctagon size={10} /> {tabSwitches} SIG-FLAGS
                                </span>
                            )}
                            {isReviewMode && (
                                <span className="text-[10px] bg-emerald-50 text-emerald-600 font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <ShieldCheck size={10} /> REVIEWING PREVIOUS SOLUTION
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {!isFullScreen && (
                        <button
                            onClick={enterFullScreen}
                            className="bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                        >
                            <Maximize size={14} /> Audit Mode
                        </button>
                    )}

                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        {['javascript', 'python'].map((lang) => (
                            <button
                                key={lang}
                                onClick={() => handleLanguageChange(lang)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all tracking-widest ${language === lang ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                {lang === 'javascript' ? 'JS' : 'PY'}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={runCode}
                        disabled={running}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-md active:scale-95 ${running ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}`}
                    >
                        {running ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-100 rounded-full animate-spin"></div> : <Play size={16} fill="white" />}
                        {running ? 'Executing' : 'Run Suite'}
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Description */}
                <div className="w-1/3 border-r border-slate-200 bg-white overflow-y-auto p-10 space-y-8">
                    <section>
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3 ml-0.5">Mission Briefing</h2>
                        <div className="text-slate-600 leading-relaxed font-medium prose prose-slate max-w-none">
                            {problem.description}
                        </div>
                    </section>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Domain</div>
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                <ShieldCheck size={14} className="text-blue-500" /> {problem.category}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</div>
                            <div className="text-xs font-bold text-emerald-600 flex items-center gap-2">
                                <Zap size={14} className="text-emerald-500" /> Operational
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-blue-50/30 rounded-2xl border border-blue-100">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2 flex items-center gap-2">
                            <Info size={14} /> Intelligence Note
                        </h4>
                        <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                            Submitting optimized code improves your performance metrics. Ensure time complexity is adhered to.
                        </p>
                    </div>
                </div>

                {/* Right: Code & Output */}
                <div className="flex-1 flex flex-col bg-slate-100">
                    <div className="flex-1 p-4 overflow-hidden">
                        <div className="h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50 relative">
                            <div className="absolute top-4 right-6 z-10 text-[10px] font-black uppercase tracking-widest text-slate-300 bg-white/20 backdrop-blur-sm px-2 py-1 rounded border border-slate-100">
                                Protected Sandbox
                            </div>
                            <SecureEditor
                                language={language}
                                code={code}
                                setCode={setCode}
                            />
                        </div>
                    </div>

                    <div className="h-1/3 p-4 pt-0">
                        <div className="h-full bg-slate-900 rounded-2xl overflow-hidden flex flex-col shadow-2xl shadow-black/20">
                            <div className="px-6 py-3 border-b border-white/5 bg-black/40 flex items-center justify-between">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <Terminal size={12} /> Console Output
                                </div>
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/20"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/20"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/20"></div>
                                </div>
                            </div>
                            <div className="flex-1 p-6 font-mono text-sm overflow-y-auto bg-black/20 text-slate-100">
                                {result ? (
                                    <div className="space-y-4">
                                        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${result.verdict === 'Passed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                                                {result.verdict === 'Passed' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                                {result.verdict}
                                            </div>
                                            {allPassed && (
                                                <button
                                                    onClick={handleNext}
                                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95 animate-in zoom-in-95 duration-200"
                                                >
                                                    Next Mission <ChevronRight size={12} />
                                                </button>
                                            )}
                                        </div>

                                        {result.output_log && (
                                            <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-slate-400 text-xs leading-relaxed">
                                                <pre className="whitespace-pre-wrap">{result.output_log}</pre>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                                <div className="text-[10px] text-slate-500 uppercase font-black mb-1">Runtime</div>
                                                <div className="text-white font-bold">{result.execution_time?.toFixed(2)}ms</div>
                                            </div>
                                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                                <div className="text-[10px] text-slate-500 uppercase font-black mb-1">Scoring</div>
                                                <div className="text-white font-bold">{result.passed_cases}/{result.total_cases}</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center gap-3 opacity-20">
                                        <Terminal size={32} />
                                        <span className="text-xs font-black uppercase tracking-widest italic">// System Idle...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

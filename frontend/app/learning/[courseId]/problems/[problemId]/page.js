"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchProblem, submitSolution } from "@/services/api";
import SecureEditor from "@/components/SecureEditor";
import AdvancedLoading from "@/components/AdvancedLoading";
import { CheckCircle2, XCircle, AlertCircle, Play, ChevronRight, Loader2, BookOpen, Trophy } from "lucide-react";

export default function ProblemViewPage() {
    const { courseId, problemId } = useParams();
    const router = useRouter();

    const [problem, setProblem] = useState(null);
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // 1. Load Problem with Access Check
    const loadProblem = async () => {
        try {
            const data = await fetchProblem(problemId);
            setProblem(data);
            if (!code) setCode(data.starter_code || "");
            setLoading(false);
        } catch (err) {
            // Defensive: Redirect to roadmap if access is denied (403)
            if (err.message?.toLowerCase().includes("access denied") || err.message?.toLowerCase().includes("locked")) {
                router.push(`/learning/${courseId}?error=locked`);
            } else {
                setError(err.message);
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProblem();

        // Sync on tab focus/visibility change (Phase 9: Final Hardening)
        const handleFocus = () => {
            if (document.visibilityState === 'visible') {
                loadProblem();
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleFocus);
        };
    }, [problemId, courseId, router]);

    // 2. Submit Solution with Stepwise Progression
    const handleSubmit = async () => {
        if (!code.trim() || submitting) return;

        setSubmitting(true);
        setResult(null);
        setError(null);

        try {
            console.log(`[Telemetry] Submission attempt: Step ${problem?.step_number}, Problem ${problemId}`);
            const data = await submitSolution(problemId, code);
            setResult(data);

            if (data.success) {
                console.log(`[Telemetry] Submission SUCCESS: Step ${problem?.step_number}`);
            } else {
                console.log(`[Telemetry] Submission FAILED: Step ${problem?.step_number}, Cases: ${data.execution?.passed_cases}/${data.execution?.total_cases}`);
            }

        } catch (err) {
            console.error(`[Telemetry] Submission ERROR: ${err.message}`);
            if (err.message?.includes("attempts") || err.message?.includes("429")) {
                setError("Too many attempts. Review your code before retrying.");
            } else {
                setError(err.message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
            <AdvancedLoading
                title="Initializing Learning Step"
                items={[
                    "Securing code environment...",
                    "Syncing progression state...",
                    "Verifying problem metadata...",
                    "Preparing execution sandbox..."
                ]}
            />
        </div>
    );

    if (error && !problem) return (
        <div className="max-w-xl mx-auto mt-20 p-8 bg-white border border-red-100 rounded-[2.5rem] shadow-2xl text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-3xl font-black text-slate-900">Step Inaccessible</h1>
            <p className="text-slate-500 mt-4 leading-relaxed">{error}</p>
            <button
                onClick={() => router.push(`/learning/${courseId}`)}
                className="mt-8 px-8 py-4 bg-black text-white rounded-2xl font-bold hover:scale-105 transition-transform"
            >
                Return to Roadmap
            </button>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            {/* Header: Progress & Title */}
            <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-6">
                    <Link href={`/learning/${courseId}`} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
                        <span className="text-slate-900 font-black">←</span>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-black text-slate-900">{problem.title}</h1>
                            {problem.access_status === "completed" && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-tighter rounded-md border border-green-200">
                                    Completed
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Step {problem.step_number} of {problem.total_steps || "?"}
                        </p>
                    </div>
                </div>

                <div className="flex-1 max-w-md mx-12 hidden md:block">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-600 transition-all duration-1000"
                            style={{ width: `${(problem.step_number / (problem.total_steps || 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || problem.access_status === "completed"}
                        className={`
                            flex items-center gap-2 px-8 py-3 rounded-2xl font-black transition-all
                            ${submitting ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}
                            ${problem.access_status === "completed"
                                ? 'bg-green-50 text-green-600 cursor-default grayscale opacity-50'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200'}
                        `}
                    >
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                        {submitting ? 'Evaluating...' : problem.access_status === "completed" ? "You've mastered this step" : 'Run & Submit'}
                    </button>
                </div>
            </header>

            {/* Main Content: Split Screen */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left: Problem Description */}
                <div className="w-1/3 bg-white border-r border-slate-200 overflow-y-auto p-10 prose prose-slate max-w-none animate-in fade-in slide-in-from-left-4 duration-700">
                    <h2 className="text-2xl font-black mb-6">Objective</h2>
                    <div className="text-slate-700 leading-relaxed space-y-4">
                        {problem.description.split('\n').map((para, i) => (
                            <p key={i}>{para}</p>
                        ))}
                    </div>

                    {result && !result.success && (
                        <div className="mt-12 p-6 bg-red-50 border border-red-100 rounded-3xl animate-in zoom-in-95">
                            <div className="flex items-center gap-2 text-red-700 font-black mb-3">
                                <AlertCircle size={20} /> Evaluation Failed
                            </div>
                            <pre className="text-xs text-red-600 bg-white/50 p-4 rounded-xl border border-red-100 overflow-x-auto">
                                {result.execution?.output || result.execution?.output_log || "Check your code logic and try again."}
                            </pre>
                            <p className="text-xs text-red-400 mt-3 font-bold uppercase tracking-tighter">
                                Passed: {result.execution?.passed_cases || 0} / {result.execution?.total_cases || 0}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right: Coding Environment */}
                <div className="flex-1 flex flex-col p-6 gap-6 relative animate-in fade-in slide-in-from-right-4 duration-700">
                    <div className="flex-1 relative rounded-[2rem] overflow-hidden border border-slate-200 shadow-2xl group">
                        <SecureEditor
                            code={code}
                            setCode={setCode}
                            readOnly={problem.access_status === "completed" || submitting}
                            language={problem.editor_language || "javascript"}
                        />
                        {(problem.access_status === "completed" || submitting) && (
                            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 bg-black/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/20">
                                {submitting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} className="text-green-400" />}
                                {submitting ? 'Locked for Submission' : 'Read Only · Completed'}
                            </div>
                        )}
                    </div>

                    {/* Result Footer Overlay (Success State Transformation) */}
                    {result?.success && (
                        <div className="absolute inset-4 z-50 bg-white/95 backdrop-blur-xl rounded-[3rem] p-12 border-4 border-green-500/20 shadow-[0_0_100px_rgba(34,197,94,0.3)] animate-in zoom-in-95 duration-500 flex flex-col items-center justify-center text-center">
                            <div className="w-32 h-32 bg-green-500 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-3 shadow-2xl shadow-green-200">
                                <CheckCircle2 size={72} className="text-white" />
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 mb-6">Step {problem.step_number} Mastered!</h2>
                            <p className="text-xl text-slate-500 mb-12 max-w-md font-medium leading-relaxed">
                                Phenomenal work. You've verified your logic and the system has unlocked the next module for you.
                            </p>
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={() => router.push(`/learning/${courseId}`)}
                                    className="px-16 py-6 bg-black text-white rounded-[2rem] font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20"
                                >
                                    Proceed to Road Map
                                </button>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                    Next step is now available
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-600 text-white p-4 rounded-2xl flex items-center justify-between font-bold animate-in fade-in slide-in-from-bottom-4 shadow-xl">
                            <div className="flex items-center gap-3">
                                <AlertCircle /> {error}
                            </div>
                            <button onClick={() => setError(null)} className="text-white/50 hover:text-white">✕</button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

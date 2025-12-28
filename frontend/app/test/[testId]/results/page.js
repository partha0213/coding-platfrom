"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Trophy, CheckCircle2, XCircle, Clock, Code,
    TrendingUp, AlertTriangle, Eye, ArrowLeft,
    ChevronDown, ChevronUp, Award
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import MonacoEditor from '@monaco-editor/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function TestResults() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const testId = params.testId;

    const [test, setTest] = useState(null);
    const [results, setResults] = useState(null);
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSubmission, setExpandedSubmission] = useState(null);

    useEffect(() => {
        if (testId && user?.id) {
            fetchResults();
        } else if (user === null && !loading) {
            // No user found, maybe redirect or handled by AuthContext
        }
    }, [testId, user]);

    const fetchResults = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!user?.id) return;

            const res = await fetch(`${API_URL}/student/test-results/${user.id}/${testId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.error) {
                console.error(data.error);
                return;
            }

            setTest(data.test);
            setResults(data.results);
            setViolations(data.violations);

        } catch (err) {
            console.error("Failed to fetch results:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-full bg-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-full bg-white text-slate-900 flex">
            <div className="w-full max-w-7xl px-8 py-6 mx-auto min-w-[1024px]">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <button
                            onClick={() => router.push('/tests')}
                            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-4 transition-colors font-medium"
                        >
                            <ArrowLeft size={18} />
                            Back to Assessments
                        </button>
                        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3 flex-wrap">
                            {test?.title || "Assessment Results"}
                            <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                                Completed
                            </span>
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex items-center justify-between overflow-hidden relative min-h-[200px]">
                        <div className="relative z-10">
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Overall Score</p>
                            <div className="text-7xl font-black text-blue-600 leading-none mb-4">
                                {results?.score}%
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <Award className="text-blue-500" size={20} />
                                <span className="font-semibold">
                                    {results?.solvedProblems} out of {results?.totalProblems} Problems Solved
                                </span>
                            </div>
                        </div>
                        <div className="hidden sm:block opacity-10 scale-150">
                            <Trophy size={200} className="text-blue-600" />
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-blue-50 to-transparent pointer-events-none"></div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-slate-900 relative overflow-hidden min-h-[200px]">
                        <div className="relative z-10 space-y-6">
                            <div>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Performance</p>
                                <p className="text-2xl font-black text-blue-600">Clean Session</p>
                                <p className="text-slate-400 text-xs font-medium">No serious violations detected</p>
                            </div>
                            <div className="pt-4 border-t border-slate-100">
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Status</p>
                                <p className="text-xl font-bold flex items-center gap-2 text-slate-900">
                                    <CheckCircle2 size={20} className="text-emerald-500" />
                                    Verified Result
                                </p>
                            </div>
                        </div>
                        <ShieldCheck size={120} className="absolute -bottom-8 -right-8 text-blue-600/10" />
                    </div>
                </div>

                <div className="space-y-4 mb-6">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <Code className="text-blue-600" size={24} />
                        Detailed Analysis
                    </h2>

                    {results?.submissions.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
                            <p className="text-slate-400 font-medium italic">No submissions found for this test.</p>
                        </div>
                    ) : (
                        results?.submissions.map((sub) => (
                            <div
                                key={sub.id}
                                className={`bg-white border transition-all duration-300 rounded-3xl overflow-hidden ${expandedSubmission === sub.id ? 'ring-2 ring-blue-500 border-transparent shadow-xl' : 'border-slate-200 shadow-sm'
                                    }`}
                            >
                                <div
                                    className="p-6 cursor-pointer flex items-center justify-between"
                                    onClick={() => setExpandedSubmission(expandedSubmission === sub.id ? null : sub.id)}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${sub.verdict === "Passed" ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                            }`}>
                                            {sub.verdict === "Passed" ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900">{sub.problem_title}</h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${sub.verdict === "Passed" ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                    {sub.verdict}
                                                </span>
                                                <span className="text-slate-400 text-sm flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {sub.is_latest && (
                                                    <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold">LATEST</span>
                                                )}
                                                {!sub.is_test_submission && (
                                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">Run Only</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-lg font-black text-slate-900">
                                                {sub.passed_cases}/{sub.total_cases}
                                            </p>
                                            <p className="text-slate-400 text-xs font-bold uppercase">Test Cases</p>
                                        </div>
                                        {expandedSubmission === sub.id ? <ChevronUp size={24} className="text-blue-600" /> : <ChevronDown size={24} className="text-slate-400" />}
                                    </div>
                                </div>

                                {expandedSubmission === sub.id && (
                                    <div className="border-t border-slate-100 bg-white p-6 space-y-6">
                                        {sub.error_message && (
                                            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
                                                <p className="text-rose-700 font-bold flex items-center gap-2 mb-2 text-sm uppercase tracking-wider">
                                                    <Terminal size={14} />
                                                    Execution Details / Error Message
                                                </p>
                                                <pre className="text-rose-600 text-sm whitespace-pre-wrap font-mono leading-relaxed italic">
                                                    {sub.error_message}
                                                </pre>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-slate-500 font-bold flex items-center gap-2 mb-3 text-xs uppercase tracking-wider">
                                                <Code size={14} />
                                                Your Implementation
                                            </p>
                                            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-[300px]">
                                                <MonacoEditor
                                                    height="100%"
                                                    language="javascript"
                                                    theme="light"
                                                    value={sub.code}
                                                    options={{
                                                        readOnly: true,
                                                        minimap: { enabled: false },
                                                        fontSize: 14,
                                                        automaticLayout: true,
                                                        padding: { top: 16 }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                        <AlertTriangle className="text-blue-600" size={22} />
                        Proctoring Validation
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {violations.map((v) => (
                            <div key={v.type} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">
                                    {v.type.replace('_', ' ')}
                                </span>
                                <span className={`text-sm font-black ${v.count === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {v.count === 0 ? 'NOT DETECTED' : `${v.count} VIOLATIONS`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ShieldCheck({ size, className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}

function Terminal({ size, className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
    );
}

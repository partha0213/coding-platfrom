"use client";
import React, { useState } from 'react';
import FullScreenProctor from '@/components/FullScreenProctor';
import { Shield, Timer, ChevronRight } from 'lucide-react';

export default function ProctoredTestPage() {
    const [testStarted, setTestStarted] = useState(false);
    const [violations, setViolations] = useState([]);

    const handleViolation = (v) => {
        setViolations(prev => [...prev, { ...v, time: new Date().toLocaleTimeString() }]);
    };

    if (!testStarted) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                        <Shield size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Proctored Assessment</h1>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        This assessment requires <span className="font-bold text-slate-800">Fullscreen Mode</span>.
                        Tab switching or exiting fullscreen will be logged as a violation.
                    </p>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 text-sm font-medium text-slate-700 p-3 bg-slate-50 rounded-xl">
                            <Timer size={18} className="text-blue-500" />
                            60 Minutes Duration
                        </div>
                    </div>

                    <button
                        onClick={() => setTestStarted(true)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all group"
                    >
                        Start Assessment
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8">
            <FullScreenProctor isEnabled={true} onViolation={handleViolation} />

            <Header timeLeft="59:45" />

            <main className="max-w-4xl mx-auto mt-12">
                <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 min-h-[400px]">
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">Question 1: Algorithm Design</h2>
                    <p className="text-xl text-slate-600 mb-12 leading-relaxed">
                        Implement a function that finds the longest palindromic substring in a given string.
                    </p>

                    <div className="p-6 bg-slate-900 rounded-2xl text-slate-300 font-mono text-sm">
                        {"// Solution placeholder for proctored mode demonstration"}
                    </div>
                </div>

                {violations.length > 0 && (
                    <div className="mt-8 p-6 bg-red-50 border border-red-100 rounded-2xl">
                        <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                            <Shield size={16} />
                            Violation Log (Real-time Proctoring)
                        </h3>
                        <div className="space-y-2">
                            {violations.map((v, i) => (
                                <div key={i} className="text-xs text-red-600 font-medium">
                                    [{v.time}] {v.type === 'TAB_SWITCH' ? 'Tab Switched/Minimized' : 'Exited Fullscreen'}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function Header({ timeLeft }) {
    return (
        <header className="flex items-center justify-between py-4 border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <Shield size={20} />
                </div>
                <div>
                    <h1 className="text-sm font-bold text-slate-900">Coding Certification Test</h1>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Live Proctoring Active</p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl font-mono font-bold text-slate-700">
                    <Timer size={16} className="text-slate-500" />
                    {timeLeft}
                </div>
                <button className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm">
                    Submit Test
                </button>
            </div>
        </header>
    );
}

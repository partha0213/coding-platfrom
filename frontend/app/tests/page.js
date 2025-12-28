"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Calendar, Trophy, CheckCircle2, Lock, Play, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function StudentTests() {
    const router = useRouter();
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTest, setActiveTest] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            fetchTests();
        }
    }, [user]);

    const fetchTests = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/tests`);
            const data = await res.json();

            // Fetch enrollments from backend
            const enrollmentRes = await fetch(`${API_URL}/student/enrollments/${user.id}`);
            const enrollments = await enrollmentRes.json();
            const completedTestIds = enrollments
                .filter(e => e.status === "COMPLETED")
                .map(e => e.test_id);

            const now = new Date();
            const categorized = data.map(test => {
                const start = new Date(test.start_time);
                const end = new Date(test.end_time);

                // Allow start 5 minutes before actual start time
                const BUFFER_MS = 5 * 60 * 1000;
                const canStartEarly = now >= (start.getTime() - BUFFER_MS) && now < start;
                const isLive = now >= start && now <= end;
                const isCompleted = now > end || completedTestIds.includes(test.id);
                const isUpcoming = now < (start.getTime() - BUFFER_MS);
                const isSubmitted = completedTestIds.includes(test.id);

                let status = 'upcoming';
                if (isCompleted) status = 'completed';
                else if (isSubmitted) status = 'submitted';
                else if (isLive || canStartEarly) status = 'active';

                return {
                    ...test,
                    status,
                    isLive,
                    canStartEarly,
                    isSubmitted,
                    start,
                    end
                };
            });

            setTests(categorized);
            setActiveTest(categorized.find(t => t.status === 'active'));
        } catch (err) {
            console.error("Failed to fetch tests:", err);
        } finally {
            setLoading(false);
        }
    };

    const startTest = (testId) => {
        router.push(`/test/${testId}/consent`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-10">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                            <Trophy className="text-white" size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900">Scheduled Tests</h1>
                            <p className="text-slate-500 font-medium text-sm mt-1">View and attend proctored assessments</p>
                        </div>
                    </div>
                </div>

                {/* Active Test Alert */}
                {activeTest && (
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-3xl mb-8 shadow-xl animate-pulse">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <div className="font-black text-lg">{activeTest.canStartEarly ? 'Join the Prep Room!' : 'Test in Progress!'}</div>
                                    <div className="text-emerald-100 text-sm">{activeTest.title}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => startTest(activeTest.id)}
                                className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-all flex items-center gap-2"
                            >
                                <Play size={18} />
                                Start Test
                            </button>
                        </div>
                    </div>
                )}

                {/* Tests Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tests.map((test) => (
                        <div
                            key={test.id}
                            className={`bg-white rounded-3xl border-2 p-6 shadow-lg transition-all ${test.status === 'active'
                                ? 'border-emerald-400 shadow-emerald-200'
                                : test.status === 'upcoming'
                                    ? 'border-blue-200 shadow-blue-100'
                                    : 'border-slate-200 shadow-slate-100'
                                }`}
                        >
                            {/* Status Badge */}
                            <div className="flex justify-between items-start mb-4">
                                <span
                                    className={`text-xs font-black uppercase px-3 py-1 rounded-full ${test.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : test.status === 'upcoming'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-slate-100 text-slate-600'
                                        }`}
                                >
                                    {test.canStartEarly ? '🟡 Starting Soon' : test.status === 'active' ? '🟢 Live Now' : test.status === 'upcoming' ? '⏰ Upcoming' : '✅ Completed'}
                                </span>
                                {test.status === 'completed' && (
                                    <CheckCircle2 className="text-emerald-600" size={20} />
                                )}
                            </div>

                            {/* Test Info */}
                            <h3 className="text-xl font-black text-slate-900 mb-3">{test.title}</h3>

                            <div className="space-y-2 text-sm mb-6">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Calendar size={16} className="text-slate-400" />
                                    <span className="font-medium">
                                        {test.start.toLocaleDateString()} • {test.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Clock size={16} className="text-slate-400" />
                                    <span className="font-medium">
                                        Ends: {test.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            {/* Action Button */}
                            {test.status === 'active' && (
                                <button
                                    onClick={() => startTest(test.id)}
                                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <Play size={18} />
                                    {test.canStartEarly ? 'Join & Setup' : 'Start Test'}
                                </button>
                            )}

                            {test.status === 'submitted' && (
                                <button
                                    disabled
                                    className="w-full bg-blue-100 text-blue-700 py-3 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Clock size={18} />
                                    Waiting for Results
                                </button>
                            )}

                            {test.status === 'upcoming' && (
                                <button
                                    disabled
                                    className="w-full bg-slate-100 text-slate-400 py-3 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Lock size={18} />
                                    Not Yet Available
                                </button>
                            )}

                            {test.status === 'completed' && (
                                <button
                                    onClick={() => router.push(`/test/${test.id}/results`)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all"
                                >
                                    View Results
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {tests.length === 0 && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trophy className="text-slate-400" size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">No Tests Available</h3>
                        <p className="text-slate-500">Your instructor hasn't scheduled any tests yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

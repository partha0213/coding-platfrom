"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Calendar, Trophy, CheckCircle2, Lock, Play, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AdvancedLoading from '@/components/AdvancedLoading';

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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
                <AdvancedLoading
                    title="Scanning Assessment Archives"
                    items={[
                        "Authenticating credentials...",
                        "Retrieving scheduled operations...",
                        "Updating eligibility status..."
                    ]}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-10">
            <div className="max-w-6xl mx-auto">
                <main className="max-w-6xl mx-auto">
                    <header className="mb-12 glass-morphism p-10 rounded-[40px] border border-white/60 shadow-premium group relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors"></div>
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform duration-500">
                                <Trophy className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black mb-2 text-slate-900 tracking-tighter">
                                    Scheduled <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 italic">Assessments</span>
                                </h1>
                                <div className="flex items-center gap-3">
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] opacity-70">Proctored Environment & Eligibility Registry</p>
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-8 relative z-10 px-8 py-4 bg-white/40 rounded-3xl border border-white/60 shadow-inner">
                            <div className="text-left md:text-right">
                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Upcoming Ops</div>
                                <div className="font-black text-slate-900 text-xl tracking-tight">{tests.filter(t => t.status === 'upcoming').length} Active</div>
                            </div>
                            <div className="w-px h-10 bg-slate-200/50 hidden md:block"></div>
                            <div className="text-left md:text-right">
                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Verified Clear</div>
                                <div className="font-black text-emerald-600 text-xl tracking-tight">{tests.filter(t => t.status === 'completed' || t.status === 'submitted').length} Done</div>
                            </div>
                        </div>
                    </header>

                    {/* Active Test Alert */}
                    {activeTest && (
                        <div className="bg-slate-900 rounded-[32px] p-1 mb-12 shadow-2xl overflow-hidden relative group animate-in slide-in-from-top-10 duration-1000">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-transparent to-blue-500/20 animate-pulse"></div>
                            <div className="relative bg-slate-950/40 backdrop-blur-xl m-0.5 rounded-[30px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 relative">
                                        <div className="absolute inset-0 bg-emerald-400/20 blur-xl animate-pulse"></div>
                                        <AlertCircle size={28} className="relative z-10" />
                                    </div>
                                    <div className="text-center md:text-left">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="font-black text-xl text-white tracking-tight">{activeTest.canStartEarly ? 'Join Preparation Hub' : 'Operation Live'}</div>
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                                        </div>
                                        <div className="text-slate-400 font-bold uppercase tracking-widest text-[11px] leading-relaxed">
                                            {activeTest.title}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => startTest(activeTest.id)}
                                    className="w-full md:w-auto px-10 py-5 rounded-[22px] bg-emerald-500 text-white font-black uppercase tracking-[0.25em] text-[12px] hover:bg-emerald-400 transition-all hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 group/btn"
                                >
                                    <Play size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                    Start Operational Check
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tests Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sticky top-0">
                        {tests.map((test) => (
                            <div
                                key={test.id}
                                className={`glass-morphism rounded-[32px] border-2 p-10 shadow-premium transition-all duration-700 group relative overflow-hidden flex flex-col justify-between min-h-[320px] ${test.status === 'active'
                                    ? 'border-emerald-400/50 bg-emerald-500/[0.02]'
                                    : test.status === 'upcoming'
                                        ? 'border-blue-400/30'
                                        : 'border-white/60'
                                    }`}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent -mr-12 -mt-12 rounded-full"></div>

                                <div>
                                    <div className="flex justify-between items-start mb-8">
                                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-sm animate-in fade-in duration-1000 font-black uppercase tracking-[0.2em] text-[10px]
                                        ${test.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                test.status === 'upcoming' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    'bg-slate-100 text-slate-500 border-slate-200'}`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${test.status === 'active' ? 'bg-emerald-500 animate-pulse' : test.status === 'upcoming' ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                                            {test.status}
                                        </div>
                                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest tabular-nums italic py-1.5">
                                            ID-OPS: {1000 + test.id}
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-blue-600 transition-colors duration-500 leading-tight">
                                        {test.title}
                                    </h3>

                                    <div className="space-y-4 mb-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100/50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all duration-500">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Deployment Window</div>
                                                <div className="text-sm font-bold text-slate-600">{test.start.toLocaleDateString('en-GB')} • {test.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100/50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all duration-500">
                                                <Clock size={18} />
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Operation Endurance</div>
                                                <div className="text-sm font-bold text-slate-600">Concludes at {test.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    disabled={test.status === 'upcoming'}
                                    onClick={() => {
                                        if (test.status === 'completed') router.push(`/test/${test.id}/results`);
                                        else startTest(test.id);
                                    }}
                                    className={`w-full py-5 rounded-[22px] flex items-center justify-center gap-3 text-[12px] font-black uppercase tracking-[0.25em] transition-all duration-500 border group/btn
                                    ${test.status === 'active'
                                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-premium hover:bg-emerald-500 hover:-translate-y-1 hover:shadow-emerald-200'
                                            : test.status === 'completed' || test.status === 'submitted'
                                                ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'}`}
                                >
                                    {test.isSubmitted ? (
                                        <> <CheckCircle2 size={18} className="text-emerald-500" /> Results Pending </>
                                    ) : test.status === 'completed' ? (
                                        <> <Trophy size={18} className="text-amber-500" /> View Session Verdict </>
                                    ) : test.status === 'active' ? (
                                        <> <Play size={18} /> Initiate Protocol </>
                                    ) : (
                                        <> <Lock size={18} className="opacity-40" /> Locked </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>

                    {tests.length === 0 && (
                        <div className="text-center py-32 glass-morphism rounded-[32px] border border-white/60 mt-12">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Calendar size={32} className="text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">No Active Assignments</h3>
                            <p className="text-slate-500 font-medium">Coordinate with your administrator for assessment access.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

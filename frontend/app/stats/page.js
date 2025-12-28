"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    BarChart3,
    Trophy,
    Zap,
    Target,
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    TrendingUp,
    Layout,
    FileText
} from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function MyStats() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ solved_count: 0, streak: 0, strike_rate: 0, total_attempts: 0, mastery_level: 'Pioneer' });
    const [submissions, setSubmissions] = useState([]);
    const [analytics, setAnalytics] = useState({ category_mastery: [], heatmap: [], milestones: [] });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                try {
                    const statsRes = await fetch(`${API_URL}/student/stats/${user.id}`);
                    const statsData = await statsRes.json();
                    setStats(statsData);

                    const subRes = await fetch(`${API_URL}/student/submissions/${user.id}`);
                    const subData = await subRes.json();
                    setSubmissions(subData);

                    const analyticsRes = await fetch(`${API_URL}/student/analytics/${user.id}`);
                    const analyticsData = await analyticsRes.json();
                    setAnalytics(analyticsData);

                    const historyRes = await fetch(`${API_URL}/student/test-history/${user.id}`);
                    const historyData = await historyRes.json();
                    setHistory(historyData);
                } catch (err) {
                    console.error("Failed to fetch statistics:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Aggregating Metrics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-10">
            <main className="max-w-6xl mx-auto space-y-10">
                <header className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Performance Analytics</h1>
                        <p className="text-slate-500 font-medium">Detailed breakdown of your coding journey and skill mastery.</p>
                    </div>
                    <div className="flex bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Real-time Syncing</span>
                    </div>
                </header>

                {/* Hero Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatBox
                        icon={<Trophy className="text-amber-500" />}
                        label="Mastery Level"
                        value={stats.mastery_level || "Pioneer"}
                        sub="Current Standing"
                        color="bg-amber-50 border-amber-100"
                    />
                    <StatBox
                        icon={<Zap className="text-orange-500" />}
                        label="Daily Streak"
                        value={`${stats.streak} Days`}
                        sub="Highest: 5"
                        color="bg-orange-50 border-orange-100"
                    />
                    <StatBox
                        icon={<Target className="text-blue-500" />}
                        label="Mission Success"
                        value={`${((1 - stats.strike_rate) * 100).toFixed(0)}%`}
                        sub="Average Passed Cases"
                        color="bg-blue-50 border-blue-100"
                    />
                    <StatBox
                        icon={<BarChart3 className="text-indigo-500" />}
                        label="Total Submissions"
                        value={stats.total_attempts}
                        sub="Execution Logs"
                        color="bg-indigo-50 border-indigo-100"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left: Detailed Charts Area */}
                    <div className="lg:col-span-2 space-y-10">
                        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <TrendingUp className="text-blue-600" size={20} /> Skill Progression
                                </h2>
                                <div className="text-[10px] bg-slate-100 px-3 py-1 rounded-full font-black text-slate-500 tracking-widest uppercase">
                                    All Domains
                                </div>
                            </div>

                            {/* Category Progress from Backend */}
                            <div className="space-y-6">
                                {analytics.category_mastery.length === 0 ? (
                                    <p className="text-slate-400 italic text-sm text-center py-10">Solve your first problem to unlock category insights.</p>
                                ) : (
                                    analytics.category_mastery.map((cat, idx) => {
                                        const colors = ["bg-blue-500", "bg-indigo-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500"];
                                        return (
                                            <ProgressBar
                                                key={cat.label || idx}
                                                label={cat.label || "General Topics"}
                                                progress={cat.progress || 0}
                                                color={colors[idx % colors.length]}
                                            />
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Student Test History */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <FileText className="text-blue-600" size={18} /> Test Participation History
                                </h2>
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{history.length} Tests Completed</span>
                            </div>
                            <div className="p-8">
                                {history.length === 0 ? (
                                    <div className="text-center py-10">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <FileText size={24} />
                                        </div>
                                        <p className="text-slate-400 italic text-sm">No scheduled tests completed yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {history.map((test) => (
                                            <Link key={test.test_id} href={`/test/${test.test_id}/results`}>
                                                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all group">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{test.title}</h4>
                                                        <div className={`text-lg font-black ${test.score >= 70 ? 'text-emerald-500' : test.score >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                            {Math.round(test.score)}%
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                        <div className="text-slate-400 flex items-center gap-1.5">
                                                            <Calendar size={12} /> {new Date(test.completed_at).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-100">
                                                            {test.solved}/{test.total} Solved
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent History Table */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Clock className="text-slate-400" size={18} /> Global Submission Log
                                </h2>
                                <button className="text-[10px] font-black uppercase text-blue-600 tracking-widest hover:underline">Download CSV</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                                            <th className="px-8 py-4 font-black">Problem</th>
                                            <th className="px-8 py-4 font-black">Verdict</th>
                                            <th className="px-8 py-4 font-black">Score</th>
                                            <th className="px-8 py-4 font-black">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {submissions.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="text-center py-20 text-slate-400 italic">No activity recorded yet.</td>
                                            </tr>
                                        ) : (
                                            submissions.map((s) => (
                                                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="text-sm font-bold text-slate-800">{s.problem_title}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">ID: {s.problem_id}</div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${s.verdict === 'Passed' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {s.verdict === 'Passed' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                                            {s.verdict}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="text-xs font-extrabold text-slate-700">{s.passed_cases}/{s.total_cases}</span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="text-xs font-medium text-slate-500">{new Date(s.submitted_at).toLocaleDateString()}</div>
                                                        <div className="text-[10px] text-slate-300">{new Date(s.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right: Sidebar Stats */}
                    <div className="space-y-8">
                        {/* Weekly Activity Heatmap (Mockup) */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                <Calendar size={16} /> Activity Heatmap
                            </h3>
                            <div className="grid grid-cols-7 gap-2">
                                {analytics.heatmap.length === 0 ? (
                                    Array.from({ length: 28 }).map((_, i) => (
                                        <div key={i} className="aspect-square rounded-md bg-slate-50 border border-slate-100"></div>
                                    ))
                                ) : (
                                    analytics.heatmap.map((day, i) => (
                                        <div
                                            key={i}
                                            className={`aspect-square rounded-md border border-slate-100 transition-colors
                                                ${day.level === 3 ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]' :
                                                    day.level === 2 ? 'bg-blue-400' :
                                                        day.level === 1 ? 'bg-blue-200' : 'bg-slate-50'}`}
                                            title={`${day.date}: ${day.count} submissons`}
                                        ></div>
                                    ))
                                )}
                            </div>
                            <div className="mt-4 flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                                <span>Less</span>
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-sm bg-slate-50"></div>
                                    <div className="w-2 h-2 rounded-sm bg-blue-100"></div>
                                    <div className="w-2 h-2 rounded-sm bg-blue-300"></div>
                                    <div className="w-2 h-2 rounded-sm bg-blue-500"></div>
                                </div>
                                <span>More</span>
                            </div>
                        </div>

                        {/* Recent Badges / Unlockables */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-slate-900 relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Layout size={80} className="text-blue-600" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-6">Milestone Unlocks</h3>
                            <div className="space-y-6">
                                {analytics.milestones.map((m, i) => (
                                    <Badge
                                        key={i}
                                        icon={m.icon}
                                        name={m.name}
                                        desc={m.desc}
                                        active={m.active}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="p-8 bg-blue-600 rounded-3xl text-white text-center shadow-xl shadow-blue-600/30">
                            <h4 className="text-lg font-bold mb-2">Next Challenge</h4>
                            <p className="text-blue-100 text-sm mb-6 opacity-90">Continue your streak and earn +50 XP today.</p>
                            <Link href="/problems">
                                <button className="w-full bg-white text-blue-600 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition-colors">
                                    Execute Mission
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatBox({ icon, label, value, sub, color }) {
    return (
        <div className={`p-6 rounded-3xl border ${color} shadow-sm transition-transform hover:scale-[1.02] duration-300`}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white rounded-xl shadow-inner border border-slate-100/50">
                    {icon}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
            </div>
            <div className="text-3xl font-extrabold text-slate-800 mb-1">{value}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight opacity-70">{sub}</div>
        </div>
    );
}

function ProgressBar({ label, progress, color }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700 uppercase tracking-widest">
                <span>{label}</span>
                <span>{progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                <div
                    className={`h-full ${color} transition-all duration-1000 ease-out`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
}

function Badge({ icon, name, desc, active }) {
    return (
        <div className={`flex items-center gap-4 ${active ? 'opacity-100' : 'opacity-30 grayscale'}`}>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-xl shadow-inner border border-blue-100">
                {icon}
            </div>
            <div>
                <div className="text-xs font-bold text-slate-900">{name}</div>
                <div className="text-[10px] text-blue-600 uppercase tracking-tighter font-medium">{desc}</div>
            </div>
        </div>
    );
}

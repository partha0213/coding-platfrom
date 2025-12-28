"use client";
import React, { useEffect, useState, use } from 'react';
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
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function UserStats() {
    const { id } = useParams();
    const { user: adminUser } = useAuth();
    const [stats, setStats] = useState({ solved_count: 0, streak: 0, strike_rate: 0, total_attempts: 0 });
    const [submissions, setSubmissions] = useState([]);
    const [analytics, setAnalytics] = useState({ category_mastery: [], heatmap: [], milestones: [] });
    const [targetUser, setTargetUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id && id !== "undefined") {
            const fetchData = async () => {
                try {
                    // Fetch profile info for name
                    const profileRes = await fetch(`${API_URL}/admin/leaderboard`); // We can find user in leaderboard for now
                    const leaderboard = await profileRes.json();
                    const found = leaderboard.find(u => u.id === parseInt(id));
                    setTargetUser(found);

                    const statsRes = await fetch(`${API_URL}/student/stats/${id}`);
                    const statsData = await statsRes.json();
                    setStats(statsData);

                    const subRes = await fetch(`${API_URL}/student/submissions/${id}`);
                    const subData = await subRes.json();
                    setSubmissions(subData);

                    const analyticsRes = await fetch(`${API_URL}/student/analytics/${id}`);
                    const analyticsData = await analyticsRes.json();

                    if (analyticsData.milestones) {
                        const streakMilestone = analyticsData.milestones.find(m => m.name === "Hot Streak");
                        if (streakMilestone) streakMilestone.active = statsData.streak >= 3;
                    }

                    setAnalytics(analyticsData);
                } catch (err) {
                    console.error("Failed to fetch user statistics:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing User Vault...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-10">
            <main className="max-w-6xl mx-auto space-y-10">
                <header className="flex justify-between items-end mb-12">
                    <div>
                        <Link href="/admin" className="flex items-center gap-2 text-blue-600 font-black uppercase text-[10px] tracking-widest mb-4 hover:translate-x-[-4px] transition-transform">
                            <ArrowLeft size={14} /> Back to Command Center
                        </Link>
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">User Intelligence</h1>
                        <p className="text-slate-500 font-medium">Monitoring profile: <span className="text-blue-600 font-bold">@{targetUser?.username || `User ${id}`}</span></p>
                    </div>
                    <div className="flex bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Observation Mode</span>
                    </div>
                </header>

                {/* Hero Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatBox
                        icon={<Trophy className="text-amber-500" />}
                        label="Mastery Level"
                        value={stats.solved_count > 10 ? "Expert" : stats.solved_count > 5 ? "Advanced" : "Pioneer"}
                        sub="Relative Ranking"
                        color="bg-amber-50 border-amber-100"
                    />
                    <StatBox
                        icon={<Zap className="text-orange-500" />}
                        label="Current Streak"
                        value={`${stats.streak} Days`}
                        sub="Engagement Level"
                        color="bg-orange-50 border-orange-100"
                    />
                    <StatBox
                        icon={<Target className="text-blue-500" />}
                        label="Success Rate"
                        value={`${((1 - stats.strike_rate) * 100).toFixed(0)}%`}
                        sub="Execution Quality"
                        color="bg-blue-50 border-blue-100"
                    />
                    <StatBox
                        icon={<BarChart3 className="text-indigo-500" />}
                        label="Total Attempts"
                        value={stats.total_attempts}
                        sub="System Activity"
                        color="bg-indigo-50 border-indigo-100"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-10">
                        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                                <TrendingUp className="text-blue-600" size={20} /> Domain Breakdown
                            </h2>
                            <div className="space-y-6">
                                {(!analytics?.category_mastery || analytics.category_mastery.length === 0) ? (
                                    <p className="text-slate-400 italic text-sm text-center py-10">No problem data recorded for this user.</p>
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

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Clock className="text-slate-400" size={18} /> Detailed Execution Log
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                                            <th className="px-8 py-4">Problem</th>
                                            <th className="px-8 py-4">Verdict</th>
                                            <th className="px-8 py-4">Score</th>
                                            <th className="px-8 py-4">Submitted</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {submissions?.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="text-center py-10 text-slate-400 italic">No activity recorded.</td>
                                            </tr>
                                        ) : (
                                            submissions.map((s) => (
                                                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="text-sm font-bold text-slate-800">{s.problem_title}</div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${s.verdict === 'Passed' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {s.verdict}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="text-xs font-extrabold text-slate-700">{s.passed_cases}/{s.total_cases}</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-xs text-slate-500">
                                                        {new Date(s.submitted_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                <Calendar size={16} /> Activity History
                            </h3>
                            <div className="grid grid-cols-7 gap-2">
                                {analytics?.heatmap?.map((day, i) => (
                                    <div
                                        key={i}
                                        className={`aspect-square rounded-md border border-slate-100 transition-colors
                                            ${day.level === 3 ? 'bg-blue-600' : day.level === 2 ? 'bg-blue-400' : day.level === 1 ? 'bg-blue-200' : 'bg-slate-50'}`}
                                        title={`${day.date}: ${day.count} submissons`}
                                    ></div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                            <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-6">Badges Earned</h3>
                            <div className="space-y-6">
                                {analytics?.milestones?.map((m, i) => (
                                    <Badge key={i} icon={m.icon} name={m.name} desc={m.desc} active={m.active} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatBox({ icon, label, value, sub, color }) {
    return (
        <div className={`p-6 rounded-3xl border ${color} shadow-sm`}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white rounded-xl shadow-inner">{icon}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
            </div>
            <div className="text-3xl font-extrabold text-slate-800 mb-1">{value}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{sub}</div>
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
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    );
}

function Badge({ icon, name, desc, active }) {
    return (
        <div className={`flex items-center gap-4 ${active ? 'opacity-100' : 'opacity-20 grayscale'}`}>
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl">{icon}</div>
            <div>
                <div className="text-xs font-bold">{name}</div>
                <div className="text-[10px] text-blue-300 uppercase font-medium">{desc}</div>
            </div>
        </div>
    );
}

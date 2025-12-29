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
    ArrowLeft,
    Activity,
    Shield
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AdvancedLoading from '@/components/AdvancedLoading';

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
                    const profileRes = await fetch(`${API_URL}/admin/leaderboard`);
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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
                <AdvancedLoading
                    title="Personnel Analysis"
                    items={[
                        "Accessing intelligence vault...",
                        "Analyzing competency matrix...",
                        "Retrieving deployment history..."
                    ]}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-10">
            <main className="max-w-7xl mx-auto space-y-12">
                <header className="glass-morphism p-10 rounded-[40px] border border-white/60 shadow-premium group relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>

                    <div className="flex items-center gap-6 relative z-10">
                        <Link href="/admin" className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:shadow-xl transition-all border border-slate-100 group/back">
                            <ArrowLeft size={24} className="group-hover/back:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Personnel <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Analysis</span></h1>
                            <div className="flex items-center gap-3">
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] opacity-70">Strategic Monitoring: <span className="text-blue-600">@{targetUser?.username || `NODE-${id}`}</span></p>
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex bg-slate-900/5 px-6 py-3 rounded-2xl border border-white/60 items-center gap-4 relative z-10">
                        <Activity size={18} className="text-blue-600" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Observation Alpha-4 Active</span>
                    </div>
                </header>

                {/* Hero Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <AdminStatCard
                        label="Mastery Status"
                        value={stats.solved_count > 10 ? "ELITE" : stats.solved_count > 5 ? "VETERAN" : "OPERATIVE"}
                        icon={<Trophy size={20} />}
                        sub="Relative Influence"
                        color="amber"
                    />
                    <AdminStatCard
                        label="Operational Streak"
                        value={`${stats.streak} DAYS`}
                        icon={<Zap size={20} />}
                        sub="Engagement Cycle"
                        color="orange"
                    />
                    <AdminStatCard
                        label="Precision Rate"
                        value={`${((1 - stats.strike_rate) * 100).toFixed(0)}%`}
                        icon={<Target size={20} />}
                        sub="Execution Quality"
                        color="blue"
                    />
                    <AdminStatCard
                        label="Request Volume"
                        value={stats.total_attempts}
                        icon={<BarChart3 size={20} />}
                        sub="System Throughput"
                        color="indigo"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">
                        <div className="glass-morphism p-10 rounded-[40px] border border-white/60 shadow-premium">
                            <h2 className="text-xl font-black text-slate-900 mb-10 flex items-center gap-4 tracking-tight">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                    <TrendingUp size={20} />
                                </div>
                                Competency Matrix
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                {(!analytics?.category_mastery || analytics.category_mastery.length === 0) ? (
                                    <p className="col-span-2 text-slate-400 italic text-[10px] font-black uppercase tracking-[0.2em] text-center py-10">No protocol data recorded</p>
                                ) : (
                                    analytics.category_mastery.map((cat, idx) => (
                                        <div key={idx} className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{cat.label || "General Sector"}</span>
                                                <span className="text-lg font-black text-slate-900 tracking-tighter">{cat.progress || 0}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-900/5 rounded-full overflow-hidden border border-white/60">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all duration-1000"
                                                    style={{ width: `${cat.progress || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="glass-morphism rounded-[32px] border border-white/60 shadow-premium overflow-hidden group">
                            <div className="px-10 py-8 border-b border-white/40 bg-slate-900/5 flex justify-between items-center">
                                <h2 className="text-xl font-black text-slate-900 flex items-center gap-4 tracking-tight">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900/10 flex items-center justify-center text-slate-900">
                                        <Clock size={20} />
                                    </div>
                                    Execution Archive
                                </h2>
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 bg-white/40 px-5 py-2 rounded-full border border-white/60 shadow-sm">
                                    Recent Deployments
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-white/40 bg-white/20">
                                            <th className="px-10 py-5">Mission Objective</th>
                                            <th className="px-10 py-5">Protocol Verdict</th>
                                            <th className="px-10 py-5">Validation</th>
                                            <th className="px-10 py-5 text-right">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/20">
                                        {submissions?.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center py-20 text-slate-400 italic font-black uppercase tracking-[0.2em]">No mission logs found</td></tr>
                                        ) : (
                                            submissions.map((s) => (
                                                <tr key={s.id} className="hover:bg-white/40 transition-all duration-300 group/row">
                                                    <td className="px-10 py-6">
                                                        <div className="text-sm font-black text-slate-900 tracking-tight group-hover/row:text-blue-600 transition-colors uppercase">{s.problem_title}</div>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm flex items-center gap-2 w-fit ${s.verdict === 'Passed' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-red-600 text-white border-red-400'}`}>
                                                            {s.verdict === 'Passed' && <div className="w-1 h-1 rounded-full bg-white opacity-40"></div>}
                                                            {s.verdict}
                                                        </span>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-sm font-black text-slate-900 tracking-tighter">{s.passed_cases}</div>
                                                            <div className="text-[10px] font-black text-slate-400 uppercase">/ {s.total_cases}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6 text-right">
                                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(s.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-12">
                        <div className="glass-morphism p-10 rounded-[40px] border border-white/60 shadow-premium">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-4">
                                <Calendar size={16} className="text-blue-600" /> Operational Heatmap
                            </h3>
                            <div className="grid grid-cols-7 gap-2.5">
                                {analytics?.heatmap?.map((day, i) => (
                                    <div
                                        key={i}
                                        className={`aspect-square rounded-lg border border-white/60 transition-all duration-500 hover:scale-110 cursor-help shadow-sm
                                            ${day.level === 3 ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' :
                                                day.level === 2 ? 'bg-blue-400' :
                                                    day.level === 1 ? 'bg-blue-200' : 'bg-white/40'}`}
                                        title={`${day.date}: ${day.count} deployments`}
                                    ></div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl border border-slate-800 group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-colors"></div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-10 pb-6 border-b border-white/10 flex items-center gap-3">
                                <Shield size={16} /> Earned Merit Badges
                            </h3>
                            <div className="space-y-8">
                                {analytics?.milestones?.map((m, i) => (
                                    <div key={i} className={`flex items-center gap-6 transition-all duration-500 ${m.active ? 'opacity-100 scale-100' : 'opacity-20 grayscale scale-95'}`}>
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-2xl group-hover:rotate-6 transition-transform">
                                            {m.icon}
                                        </div>
                                        <div>
                                            <div className="text-sm font-black tracking-tight text-white mb-1 uppercase">{m.name}</div>
                                            <div className="text-[9px] text-blue-300 font-black uppercase tracking-widest opacity-60">{m.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function AdminStatCard({ label, value, icon, sub, color }) {
    const colorMap = {
        blue: "text-blue-600 bg-blue-500/10",
        indigo: "text-indigo-600 bg-indigo-500/10",
        amber: "text-amber-600 bg-amber-500/10",
        emerald: "text-emerald-600 bg-emerald-500/10",
        orange: "text-orange-600 bg-orange-500/10",
    };

    return (
        <div className="glass-morphism p-8 rounded-[40px] border border-white/60 shadow-premium group hover:scale-[1.02] transition-all duration-500 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 opacity-5 pointer-events-none ${colorMap[color].split(' ')[1]}`}></div>
            <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-500 ${colorMap[color]}`}>
                    {icon}
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
                    <div className="w-8 h-1 bg-slate-900/5 rounded-full ml-auto"></div>
                </div>
            </div>
            <div className="relative">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{value}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">{sub}</p>
            </div>
        </div>
    );
}

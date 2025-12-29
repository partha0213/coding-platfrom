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
    FileText,
    Flag,
    Shield,
    Flame,
    ChevronRight,
    Award
} from 'lucide-react';
import Link from 'next/link';

import AdvancedLoading from '@/components/AdvancedLoading';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function MyStats() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ solved_count: 0, steps_mastered: 0, streak: 0, strike_rate: 0, total_attempts: 0, mastery_level: 'Pioneer' });
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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
                <AdvancedLoading
                    title="Aggregating Performance Metrics"
                    items={[
                        "Calculating mastery progression...",
                        "Generating activity heatmaps...",
                        "Indexing submission logs..."
                    ]}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-10">
            <main className="max-w-6xl mx-auto space-y-10">
                <header className="mb-12 glass-morphism p-10 rounded-[40px] border border-white/60 shadow-premium group relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors"></div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform duration-500">
                            <BarChart3 className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black mb-2 text-slate-900 tracking-tighter">
                                Performance <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 italic">Intelligence</span>
                            </h1>
                            <div className="flex items-center gap-3">
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] opacity-70">Strategic Mastery Registry & Tactical Metrics</p>
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-8 relative z-10 px-8 py-4 bg-white/40 rounded-3xl border border-white/60 shadow-inner">
                        <div className="text-left md:text-right">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Intelligence</div>
                            <div className="font-black text-slate-900 text-xl tracking-tight">Real-time</div>
                        </div>
                        <div className="w-px h-10 bg-slate-200/50 hidden md:block"></div>
                        <div className="text-left md:text-right">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Success Rate</div>
                            <div className="font-black text-emerald-600 text-xl tracking-tight">{((1 - stats.strike_rate) * 100).toFixed(0)}%</div>
                        </div>
                    </div>
                </header>

                {/* Hero Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatBox
                        icon={<Award className="text-indigo-500" />}
                        label="Steps Mastered"
                        value={stats.steps_mastered}
                        sub="Course Progress"
                        color="bg-indigo-50 border-indigo-100"
                    />
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
                        sub="Execution Consistency"
                        color="bg-orange-50 border-orange-100"
                    />
                    <StatBox
                        icon={<BarChart3 className="text-blue-500" />}
                        label="Total attempts"
                        value={stats.total_attempts}
                        sub="Global Logs"
                        color="bg-blue-50 border-blue-100"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left: Detailed Charts Area */}
                    <div className="lg:col-span-2 space-y-10">
                        <div className="glass-morphism rounded-[32px] border border-white/60 p-8 shadow-premium group">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                        <TrendingUp size={20} />
                                    </div>
                                    Skill Progression
                                </h2>
                                <div className="text-[10px] bg-slate-900/5 px-4 py-1.5 rounded-full font-black text-slate-500 tracking-[0.2em] uppercase">
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
                        <div className="glass-morphism rounded-[32px] border border-white/60 shadow-premium overflow-hidden group">
                            <div className="px-8 py-6 border-b border-white/40 bg-slate-900/5 flex justify-between items-center">
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 tracking-tight">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                        <FileText size={18} />
                                    </div>
                                    Operations History
                                </h2>
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{history.length} Tests Completed</span>
                            </div>
                            <div className="p-8">
                                {history.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="w-16 h-16 bg-slate-100/50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                                            <FileText size={32} />
                                        </div>
                                        <p className="text-slate-400 font-bold italic text-sm">No scheduled tests completed yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {history.map((test) => (
                                            <Link key={test.test_id} href={`/test/${test.test_id}/results`}>
                                                <div className="p-6 rounded-[24px] border border-white/60 bg-white/40 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group/card">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <h4 className="font-black text-slate-900 group-hover/card:text-blue-600 transition-colors tracking-tight">{test.title}</h4>
                                                        <div className={`text-xl font-black ${test.score >= 70 ? 'text-emerald-500' : test.score >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                            {Math.round(test.score)}%
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                        <div className="text-slate-400 flex items-center gap-1.5 opacity-60">
                                                            <Calendar size={12} /> {new Date(test.completed_at).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-slate-500 bg-white/60 px-3 py-1.5 rounded-xl border border-white/40 shadow-sm">
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
                        <div className="glass-morphism rounded-[32px] border border-white/60 shadow-premium overflow-hidden group">
                            <div className="px-8 py-6 border-b border-white/40 bg-slate-900/5 flex justify-between items-center">
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 tracking-tight">
                                    <div className="w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-600">
                                        <Clock size={18} />
                                    </div>
                                    Mission Logs
                                </h2>
                                <button className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em] hover:underline bg-white/40 px-4 py-1.5 rounded-full border border-white/60">Export Registry</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-white/40 bg-white/20">
                                            <th className="px-8 py-5">Operation</th>
                                            <th className="px-8 py-5">Verdict</th>
                                            <th className="px-8 py-5">Precision</th>
                                            <th className="px-8 py-5">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/20">
                                        {submissions.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="text-center py-24 text-slate-400 font-bold italic">No active missions recorded.</td>
                                            </tr>
                                        ) : (
                                            submissions.map((s) => (
                                                <tr key={s.id} className="hover:bg-white/40 transition-all duration-300 group/row">
                                                    <td className="px-8 py-6">
                                                        <div className="text-sm font-black text-slate-900 tracking-tight group-hover/row:text-blue-600 transition-colors">{s.problem_title}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic whitespace-nowrap">
                                                            {s.type === 'LEARNING' ? '\ud83d\udcd6 Learning Step' : '\ud83d\udd01 Test Mission'}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] ${s.verdict === 'Passed' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {s.verdict === 'Passed' ? <CheckCircle2 size={14} className="animate-pulse" /> : <XCircle size={14} />}
                                                            {s.verdict}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="px-3 py-1 rounded-lg bg-slate-900/5 border border-slate-900/5 inline-block">
                                                            <span className="text-[11px] font-black text-slate-700 tracking-tighter">
                                                                {s.type === 'LEARNING' ? 'Mastery Verified' : `${s.passed_cases}/${s.total_cases} Units`}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="text-[11px] font-black text-slate-500 tracking-tight">{new Date(s.submitted_at).toLocaleDateString('en-GB')}</div>
                                                        <div className="text-[10px] text-slate-300 font-bold italic">{new Date(s.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
                        {/* Weekly Activity Heatmap */}
                        <div className="glass-morphism rounded-[32px] border border-white/60 p-8 shadow-premium group">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                                    <Calendar size={16} />
                                </div>
                                Personnel Activity Registry
                            </h3>
                            <div className="grid grid-cols-7 gap-2.5">
                                {analytics.heatmap.length === 0 ? (
                                    Array.from({ length: 28 }).map((_, i) => (
                                        <div key={i} className="aspect-square rounded-lg bg-slate-900/5 animate-pulse"></div>
                                    ))
                                ) : (
                                    analytics.heatmap.map((day, i) => (
                                        <div
                                            key={i}
                                            className={`aspect-square rounded-lg border border-white transition-all duration-500 hover:scale-110 hover:z-10
                                                ${day.level === 3 ? 'bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]' :
                                                    day.level === 2 ? 'bg-blue-400' :
                                                        day.level === 1 ? 'bg-blue-200' : 'bg-slate-900/5'}`}
                                            title={`${day.date}: ${day.count} deployments`}
                                        ></div>
                                    ))
                                )}
                            </div>
                            <div className="mt-6 flex justify-between text-[9px] text-slate-400 font-black uppercase tracking-widest opacity-60">
                                <span>Minimum Scope</span>
                                <div className="flex gap-1.5 items-center">
                                    <div className="w-2 h-2 rounded-sm bg-slate-900/5"></div>
                                    <div className="w-2 h-2 rounded-sm bg-blue-200"></div>
                                    <div className="w-2 h-2 rounded-sm bg-blue-400"></div>
                                    <div className="w-2 h-2 rounded-sm bg-blue-600"></div>
                                </div>
                                <span>High Activity</span>
                            </div>
                        </div>

                        {/* Recent Badges / Unlockables */}
                        <div className="glass-morphism border border-white/60 rounded-[32px] p-8 text-slate-900 relative overflow-hidden shadow-premium group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                <Award size={100} className="text-blue-600" />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-8">Intelligence Milestones</h3>
                            <div className="space-y-6 relative z-10">
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

                        <div className="p-10 bg-slate-900 rounded-[32px] text-white text-center shadow-premium relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 group-hover:opacity-40 transition-opacity"></div>
                            <h4 className="text-xl font-black mb-2 relative z-10 tracking-tight">Active Operation</h4>
                            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-8 opacity-90 relative z-10 leading-relaxed">Expand your proficiency matrix <br /> with a new deployment.</p>
                            <Link href="/problems">
                                <button className="w-full bg-white text-slate-900 py-4 rounded-[20px] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-blue-600 hover:text-white transition-all duration-500 shadow-xl relative z-10 flex items-center justify-center gap-2">
                                    Initiate Mission <ChevronRight size={14} />
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
        <div className={`p-8 rounded-[32px] border-2 border-white bg-white/40 backdrop-blur-xl shadow-premium transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 group relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent -mr-10 -mt-10 rounded-full"></div>
            <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl shadow-inner border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${color}`}>
                    {React.cloneElement(icon, { size: 24 })}
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-blue-600 transition-colors">{label}</div>
            </div>
            <div className="text-4xl font-black text-slate-900 mb-2 tracking-tighter tabular-nums">{value}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                {sub}
            </div>
        </div>
    );
}

function ProgressBar({ label, progress, color }) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${color}`}></div>
                    {label}
                </div>
                <span className="tabular-nums">{progress}% Proficiency</span>
            </div>
            <div className="h-3 bg-slate-900/5 rounded-full p-0.5 border border-white/40 shadow-inner overflow-hidden">
                <div
                    className={`h-full ${color} transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] rounded-full relative group`}
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
            </div>
        </div>
    );
}

function Badge({ icon, name, desc, active }) {
    // Icon mapping for premium Lucide icons
    const iconMap = {
        '🏁': <Flag size={20} />,
        '🏆': <Trophy size={20} />,
        '🛡️': <Shield size={20} />,
        '🔥': <Flame size={20} />,
        '✨': <Zap size={20} />,
        'default': <Award size={20} />
    };

    const displayIcon = iconMap[icon] || iconMap['default'];

    return (
        <div className={`flex items-center gap-5 transition-all duration-500 group/item ${active ? 'opacity-100 translate-x-1' : 'opacity-30 grayscale blur-[1px]'}`}>
            <div className={`w-14 h-14 rounded-2xl bg-white/60 border border-white/80 flex items-center justify-center shadow-lg transition-all duration-500 group-hover/item:rotate-6 group-hover/item:scale-110
                ${active ? 'text-blue-600 shadow-blue-500/10' : 'text-slate-400 shadow-sm'}`}>
                {displayIcon}
            </div>
            <div>
                <div className="text-sm font-black text-slate-900 tracking-tight">{name}</div>
                <div className="text-[10px] text-blue-600/60 uppercase tracking-widest font-black italic mt-0.5">{desc}</div>
            </div>
        </div>
    );
}

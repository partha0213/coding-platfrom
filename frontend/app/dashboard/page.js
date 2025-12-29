"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Zap, Target, BookOpen, ChevronRight, Play, Code, CheckCircle, Trophy, Calendar, Clock } from 'lucide-react';
import AdvancedLoading from '@/components/AdvancedLoading';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function Dashboard() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState({ solved_count: 0, steps_mastered: 0, streak: 0, strike_rate: 0, mastery_level: 'Pioneer' });
    const [submissions, setSubmissions] = useState([]);
    const [upcomingTests, setUpcomingTests] = useState([]);
    const [tip, setTip] = useState("Maintaining a high integrity score helps you stand out.");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Courses (Learning Hub)
                const coursesRes = await fetch(`${API_URL}/learning/courses`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const coursesData = await coursesRes.json();
                setCourses(coursesData);

                // Fetch Upcoming Tests
                const testsRes = await fetch(`${API_URL}/admin/tests`);
                const testsData = await testsRes.json();
                const now = new Date();
                const BUFFER_MS = 5 * 60 * 1000;

                const upcoming = testsData
                    .filter(test => new Date(test.end_time) > now)
                    .map(test => {
                        const start = new Date(test.start_time);
                        const canStartEarly = now >= (start.getTime() - BUFFER_MS) && now < start;
                        const isLive = now >= start && now <= new Date(test.end_time);
                        return { ...test, canStartEarly, isLive };
                    })
                    .filter(test => test.isLive || test.canStartEarly || (new Date(test.start_time) > now))
                    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                    .slice(0, 2);

                setUpcomingTests(upcoming);

                if (user) {
                    // Fetch Stats
                    const statsRes = await fetch(`${API_URL}/student/stats/${user.id}`);
                    const statsData = await statsRes.json();
                    setStats(statsData);

                    // Fetch Submissions
                    const submissionsRes = await fetch(`${API_URL}/student/submissions/${user.id}`);
                    const submissionsData = await submissionsRes.json();
                    setSubmissions(submissionsData);

                    // Fetch Tip
                    const tipRes = await fetch(`${API_URL}/student/tip`);
                    const tipData = await tipRes.json();
                    setTip(tipData.tip);
                }
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
                <AdvancedLoading
                    title="Assembling Your Dashboard"
                    items={[
                        "Syncing performance metrics...",
                        "Loading recommended missions...",
                        "Updating intelligence feed..."
                    ]}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-10">
                <header className="mb-12 glass-morphism p-10 rounded-[40px] border border-white/60 shadow-premium group relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>
                    <div className="relative z-10">
                        <h1 className="text-4xl font-black mb-3 text-slate-900 tracking-tighter">
                            Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 italic">{user?.username || 'Student'}</span>
                        </h1>
                        <div className="flex items-center gap-3">
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] opacity-70">Strategic Dashboard & Performance Metrics</p>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex gap-8 relative z-10 px-8 py-4 bg-white/40 rounded-3xl border border-white/60 shadow-inner">
                        <div className="text-left md:text-right">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Current Standing</div>
                            <div className="font-black text-blue-600 text-xl tracking-tight">{stats.mastery_level || 'Pioneer'}</div>
                        </div>
                        <div className="w-px h-10 bg-slate-200/50 hidden md:block"></div>
                        <div className="text-left md:text-right">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Streak</div>
                            <div className="font-black text-emerald-600 text-xl tracking-tight">{stats.streak || 0} Days</div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left: Stats & Problems */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <StatCard icon={<Zap className="text-orange-500" />} label="Momentum" value={`${stats.streak} Days`} desc="Current Streak" />
                            <StatCard icon={<Target className="text-blue-500" />} label="Capability" value={stats.mastery_level} desc="Intel Index" />
                            <StatCard icon={<Trophy className="text-emerald-500" />} label="Mastery" value={stats.steps_mastered} desc="Total Steps Passed" />
                        </div>

                        {/* Resume Learning */}
                        <div className="glass-morphism rounded-[32px] border border-white/40 p-10 shadow-premium group">
                            <h2 className="text-2xl font-black mb-8 text-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <BookOpen size={22} />
                                    </div>
                                    Resume Learning
                                </div>
                                <Link href="/learning" className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 hover:text-blue-600">View All Courses</Link>
                            </h2>
                            <div className="flex flex-col gap-6">
                                {courses.length === 0 ? <p className="text-slate-400 italic">No courses started yet. Head to the learning hub to begin.</p> :
                                    courses.filter(c => c.progress?.is_started).slice(0, 3).map((c) => {
                                        return (
                                            <div key={c.id} className="flex items-center justify-between p-6 rounded-[24px] border bg-white/40 border-white/60 hover:border-indigo-300 hover:bg-white/80 hover:shadow-xl hover:translate-x-1 transition-all duration-500">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs">
                                                        {c.editor_language.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-lg text-slate-800 tracking-tight">{c.language} Mastery</div>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${c.progress.percentage_complete}%` }}></div>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.progress.percentage_complete}% Complete</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Link href={`/learning/${c.id}`}>
                                                    <button className="px-8 py-3 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-600/20">
                                                        Resume <ChevronRight size={14} />
                                                    </button>
                                                </Link>
                                            </div>
                                        );
                                    })
                                }
                                {courses.filter(c => c.progress?.is_started).length === 0 && courses.length > 0 && (
                                    <div className="p-10 border-2 border-dashed border-slate-200 rounded-[32px] text-center">
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-4">You haven't started any courses yet</p>
                                        <Link href="/learning">
                                            <button className="px-8 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Explore Hub</button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Upcoming Tests & Submission History */}
                    <div className="space-y-6">
                        {/* Upcoming Tests */}
                        {upcomingTests.length > 0 && (
                            <div className="glass-morphism border border-white/60 rounded-[32px] p-8 text-slate-900 shadow-premium relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-colors"></div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm shadow-blue-500/10">
                                        <Trophy size={18} />
                                    </div>
                                    <h3 className="font-black text-lg tracking-tight">Active Operations</h3>
                                </div>
                                <div className="space-y-4">
                                    {upcomingTests.map(test => {
                                        const startDate = new Date(test.start_time);
                                        const timeUntil = startDate - new Date();
                                        const daysUntil = Math.floor(timeUntil / (1000 * 60 * 60 * 24));
                                        const hoursUntil = Math.floor((timeUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                                        return (
                                            <div key={test.id} className={`rounded-2xl p-5 border transition-all duration-500 ${test.canStartEarly || test.isLive ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-transparent text-white shadow-lg shadow-blue-500/20' : 'bg-white/40 border-white/60 hover:border-blue-200'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="font-bold tracking-tight">{test.title}</div>
                                                    {(test.canStartEarly || test.isLive) && (
                                                        <div className="flex items-center gap-1.5 bg-white/20 px-2 py-0.5 rounded-lg backdrop-blur-md">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-white">Live</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`text-[10px] flex items-center gap-2 mb-4 font-bold uppercase tracking-wider ${test.canStartEarly || test.isLive ? 'text-blue-100' : 'text-slate-400'}`}>
                                                    <Calendar size={12} />
                                                    {startDate.toLocaleDateString()} • {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>

                                                {test.canStartEarly || test.isLive ? (
                                                    <Link href={`/test/${test.id}/consent`}>
                                                        <button className="w-full bg-white text-blue-600 hover:bg-blue-50 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
                                                            Enter Arena
                                                        </button>
                                                    </Link>
                                                ) : (
                                                    <div className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl inline-flex items-center gap-2 font-black uppercase tracking-widest border border-slate-200/50">
                                                        <Clock size={12} />
                                                        t-{daysUntil}d {hoursUntil}h
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <Link href="/tests">
                                    <button className="w-full mt-6 bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10">
                                        Intelligence Archive
                                    </button>
                                </Link>
                            </div>
                        )}
                        <div className="glass-morphism border border-white/60 rounded-[32px] p-8 shadow-premium h-fit sticky top-24 ring-1 ring-black/[0.02]">
                            <h2 className="text-lg font-black mb-8 flex items-center gap-3 text-slate-800">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-500/10">
                                    <Play size={16} />
                                </div>
                                Logged Activity
                            </h2>

                            <div className="flex flex-col gap-6">
                                {submissions.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 opacity-50">
                                            <Play size={24} />
                                        </div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest italic">Silent System</p>
                                    </div>
                                ) : (
                                    submissions.slice(0, 8).map((s) => (
                                        <div key={s.id} className="group cursor-pointer">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="text-[13px] font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors truncate max-w-[150px]">{s.problem_title}</div>
                                                <div className={`text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md ${s.verdict === 'Passed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                    {s.verdict}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    {s.type === 'LEARNING' ? <BookOpen size={10} className="text-indigo-400" /> : <Trophy size={10} className="text-amber-400" />}
                                                    <span>{s.type === 'LEARNING' ? 'Learning Step' : 'Test Mission'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 opacity-60">
                                                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                                    <span>{new Date(s.submitted_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-slate-900 shadow-sm ring-4 ring-slate-100/50">
                            <h3 className="text-xs font-black uppercase tracking-widest mb-3 text-blue-600 opacity-80">Platform Tip</h3>
                            <p className="text-sm font-medium leading-relaxed">
                                {tip}
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ icon, label, value, desc }) {
    return (
        <div className="glass-morphism p-8 rounded-[40px] border border-white/60 flex items-start justify-between shadow-premium hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="relative z-10">
                <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{label}</div>
                <div className="text-4xl font-black text-slate-900 leading-tight mb-2 tracking-tighter">{value}</div>
                {desc && <div className="text-[10px] text-blue-600 font-black uppercase tracking-tight bg-blue-50/50 px-2.5 py-1 rounded-lg inline-block">{desc}</div>}
            </div>
            <div className="relative z-10 p-5 bg-white rounded-3xl border border-white shadow-xl shadow-blue-500/5 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-12 transition-all duration-500">
                {icon}
            </div>
        </div>
    )
}

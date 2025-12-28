"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Zap, Target, BookOpen, ChevronRight, Play, Code, CheckCircle, Trophy, Calendar, Clock } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function Dashboard() {
    const { user } = useAuth();
    const [problems, setProblems] = useState([]);
    const [stats, setStats] = useState({ solved_count: 0, streak: 0, strike_rate: 0, mastery_level: 'Pioneer' });
    const [submissions, setSubmissions] = useState([]);
    const [upcomingTests, setUpcomingTests] = useState([]);
    const [tip, setTip] = useState("Maintaining a high integrity score helps you stand out.");

    useEffect(() => {
        // Fetch Problems
        fetch(`${API_URL}/problems`).then(res => res.json()).then(setProblems).catch(console.error);

        // Fetch Upcoming Tests
        fetch(`${API_URL}/admin/tests`).then(res => res.json()).then(data => {
            const now = new Date();
            const BUFFER_MS = 5 * 60 * 1000;

            const upcoming = data
                .filter(test => new Date(test.end_time) > now) // Filter out clearly finished tests
                .map(test => {
                    const start = new Date(test.start_time);
                    const canStartEarly = now >= (start.getTime() - BUFFER_MS) && now < start;
                    const isLive = now >= start && now <= new Date(test.end_time);

                    return { ...test, canStartEarly, isLive };
                })
                .filter(test => test.isLive || test.canStartEarly || (new Date(test.start_time) > now)) // Keep live, early, or upcoming
                .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                .slice(0, 2);

            setUpcomingTests(upcoming);
        }).catch(console.error);

        if (user) {
            // Fetch Stats for current user
            fetch(`${API_URL}/student/stats/${user.id}`).then(res => res.json()).then(setStats).catch(console.error);

            // Fetch Submissions
            fetch(`${API_URL}/student/submissions/${user.id}`).then(res => res.json()).then(setSubmissions).catch(console.error);

            // Fetch Random Tip
            fetch(`${API_URL}/student/tip`).then(res => res.json()).then(data => setTip(data.tip)).catch(console.error);
        }
    }, [user]);

    return (
        <div className="min-h-screen bg-white text-slate-900">
            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-10">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold mb-2 text-slate-900">Welcome back, <span className="text-blue-600">{user?.username || 'Student'}</span></h1>
                    <p className="text-slate-500">Pick up where you left off and level up your skills.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left: Stats & Problems */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <StatCard icon={<Zap className="text-orange-500" />} label="Daily Streak" value={`${stats.streak} Days`} />
                            <StatCard icon={<Target className="text-blue-600" />} label="Mastery Level" value={stats.mastery_level} />
                            <StatCard icon={<BookOpen className="text-green-600" />} label="Strike Rate" value={`${(stats.strike_rate * 100).toFixed(0)}%`} desc="Lower is better" />
                        </div>

                        {/* Problem List */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                            <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                                <Code size={20} className="text-blue-600" /> Recommended Problems
                            </h2>
                            <div className="flex flex-col gap-4">
                                {problems.length === 0 ? <p className="text-slate-400 italic">Finding the best problems for you...</p> :
                                    problems.map((p) => {
                                        const isSolved = submissions.some(s => s.problem_id === p.id && s.verdict === 'Passed');
                                        return (
                                            <div key={p.id} className={`flex items-center justify-between p-5 border rounded-xl transition group shadow-sm shadow-slate-200/50 
                                                ${isSolved ? 'bg-emerald-50/20 border-emerald-100 hover:border-emerald-300' : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'}`}>
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-3 h-3 rounded-full ${isSolved ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : p.difficulty === 'Hard' ? 'bg-red-500' : p.difficulty === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="font-bold text-slate-800 group-hover:text-blue-600 transition">{p.title}</div>
                                                            {isSolved && (
                                                                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                                    <CheckCircle size={10} /> Mastered
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">{p.category} • {p.difficulty}</div>
                                                    </div>
                                                </div>
                                                <Link href={`/problem/${p.id}`}>
                                                    <button className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm
                                                        ${isSolved ? 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600' : 'bg-white border-slate-200 hover:bg-blue-600 hover:text-white text-slate-700'}
                                                    `}>
                                                        {isSolved ? 'Review' : 'Solve'} <ChevronRight size={14} />
                                                    </button>
                                                </Link>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        </div>
                    </div>

                    {/* Right: Upcoming Tests & Submission History */}
                    <div className="space-y-6">
                        {/* Upcoming Tests */}
                        {upcomingTests.length > 0 && (
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 text-slate-900 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <Trophy size={20} className="text-blue-600" />
                                    <h3 className="font-bold text-lg">Upcoming Tests</h3>
                                </div>
                                <div className="space-y-3">
                                    {upcomingTests.map(test => {
                                        const startDate = new Date(test.start_time);
                                        const timeUntil = startDate - new Date();
                                        const daysUntil = Math.floor(timeUntil / (1000 * 60 * 60 * 24));
                                        const hoursUntil = Math.floor((timeUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                                        return (
                                            <div key={test.id} className={`rounded-xl p-4 border transition-all ${test.canStartEarly || test.isLive ? 'bg-blue-50/50 border-blue-200 ring-4 ring-blue-50' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="font-bold">{test.title}</div>
                                                    {(test.canStartEarly || test.isLive) && (
                                                        <span className="text-[9px] font-black uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-md animate-pulse">
                                                            Live Now
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-slate-500 flex items-center gap-2 mb-3">
                                                    <Calendar size={14} />
                                                    {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>

                                                {test.canStartEarly || test.isLive ? (
                                                    <Link href={`/test/${test.id}/consent`}>
                                                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all">
                                                            Join Now
                                                        </button>
                                                    </Link>
                                                ) : (
                                                    <div className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full inline-flex items-center gap-1">
                                                        <Clock size={12} />
                                                        Starts in {daysUntil}d {hoursUntil}h
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <Link href="/tests">
                                    <button className="w-full mt-4 bg-slate-50 text-slate-600 py-2 rounded-xl font-bold hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-200">
                                        View All Tests
                                    </button>
                                </Link>
                            </div>
                        )}
                        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm h-fit sticky top-24">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                                <Play size={18} className="text-blue-600" /> Recent Activity
                            </h2>

                            <div className="flex flex-col gap-5">
                                {submissions.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400">
                                        <p className="text-sm italic">No recent activity detected.</p>
                                    </div>
                                ) : (
                                    submissions.slice(0, 8).map((s) => (
                                        <div key={s.id} className="border-l-2 border-slate-100 pl-5 py-0.5 relative">
                                            <div className={`absolute left-[-5px] top-2 w-2 h-2 rounded-full ${s.verdict === 'Passed' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-red-500 shadow-lg shadow-red-500/20'}`}></div>
                                            <div className="flex justify-between items-start">
                                                <div className="text-sm font-bold text-slate-700 truncate max-w-[140px]">{s.problem_title}</div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${s.verdict === 'Passed' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {s.verdict}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-1 flex justify-between font-medium">
                                                <span>{new Date(s.submitted_at).toLocaleDateString()}</span>
                                                <span>{s.passed_cases}/{s.total_cases} cases</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-slate-900 shadow-sm">
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-start justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">{label}</div>
                <div className="text-2xl font-extrabold text-slate-900">{value}</div>
                {desc && <div className="text-[10px] text-slate-400 font-medium mt-2">{desc}</div>}
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                {icon}
            </div>
        </div>
    )
}

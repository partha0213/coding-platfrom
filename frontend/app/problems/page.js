"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, Code, Trophy, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function ProblemsList() {
    const [problems, setProblems] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const { user } = useAuth();

    useEffect(() => {
        fetch(`${API_URL}/problems`)
            .then(res => res.json())
            .then(data => {
                setProblems(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });

        if (user) {
            fetch(`${API_URL}/student/submissions/${user.id}`)
                .then(res => res.json())
                .then(setSubmissions)
                .catch(console.error);
        }
    }, [user]);

    const filteredProblems = problems.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-white text-slate-900">
            <main className="max-w-6xl mx-auto p-10">
                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-3 text-slate-900">Explore Problems</h1>
                        <p className="text-slate-500 font-medium">Master your skills across different domains and difficulties.</p>
                    </div>
                </header>

                <div className="flex flex-col gap-8">
                    {/* Search Bar */}
                    <div className="relative group max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition" size={20} />
                        <input
                            type="text"
                            placeholder="Search by title or category..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-12 py-4 focus:border-blue-500 outline-none transition shadow-sm font-medium text-slate-700"
                        />
                    </div>

                    {/* Problems Table/Grid */}
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50">
                        <div className="grid grid-cols-12 px-8 py-5 bg-white text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                            <div className="col-span-6">Problem Title</div>
                            <div className="col-span-3 text-center">Difficulty</div>
                            <div className="col-span-3 text-right">Commitment</div>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {loading ? (
                                <div className="p-16 text-center text-slate-400 italic font-medium">Sourcing problems from the vault...</div>
                            ) : filteredProblems.length === 0 ? (
                                <div className="p-16 text-center text-slate-400 italic font-medium">No challenges match your search criteria.</div>
                            ) : (
                                filteredProblems.map((p) => {
                                    const isSolved = submissions.some(s => s.problem_id === p.id && s.verdict === 'Passed');
                                    return (
                                        <div key={p.id} className={`grid grid-cols-12 px-8 py-6 items-center transition group border-l-4 ${isSolved ? 'border-l-emerald-500 bg-emerald-50/10' : 'border-l-transparent hover:bg-blue-50/30'}`}>
                                            <div className="col-span-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="font-extrabold text-lg text-slate-800 group-hover:text-blue-600 transition tracking-tight">{p.title}</div>
                                                    {isSolved && (
                                                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 shadow-sm animate-in fade-in duration-500">
                                                            <CheckCircle size={10} /> Mastered
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{p.category}</div>
                                            </div>
                                            <div className="col-span-3 flex justify-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                                                    ${p.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                        p.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                            'bg-red-50 text-red-600 border border-red-100'}
                                                `}>
                                                    {p.difficulty}
                                                </span>
                                            </div>
                                            <div className="col-span-3 flex justify-end">
                                                <Link href={`/problem/${p.id}`}>
                                                    <button className={`px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all shadow-sm border
                                                        ${isSolved ? 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600' : 'bg-white border-slate-200 hover:bg-blue-600 hover:text-white text-slate-700'}
                                                    `}>
                                                        {isSolved ? 'Review Challenge' : 'Solve Challenge'} <ChevronRight size={14} />
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

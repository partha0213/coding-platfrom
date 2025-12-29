"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
    Plus,
    ArrowLeft,
    Edit3,
    Trash2,
    Settings,
    ChevronUp,
    ChevronDown,
    Save,
    Play,
    CheckCircle2,
    Clock,
    Layout,
    Type,
    FileText,
    Code as CodeIcon,
    Beaker
} from 'lucide-react';
import AdvancedLoading from '@/components/AdvancedLoading';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function CourseStepManagement() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isReordering, setIsReordering] = useState(false);

    useEffect(() => {
        fetchCourseDetails();
    }, [courseId]);

    const fetchCourseDetails = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_URL}/admin/learning/courses/${courseId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setCourse(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleReorder = async (problemId, direction) => {
        const currentIndex = course.problems.findIndex(p => p.id === problemId);
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (newIndex < 0 || newIndex >= course.problems.length) return;

        const updatedProblems = [...course.problems];
        const [movedItem] = updatedProblems.splice(currentIndex, 1);
        updatedProblems.splice(newIndex, 0, movedItem);

        // Map to new step numbers
        const mappings = updatedProblems.map((p, idx) => ({
            problem_id: p.id,
            new_step: idx + 1
        }));

        setIsReordering(true);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_URL}/admin/learning/courses/${courseId}/reorder`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ mappings })
            });
            if (res.ok) {
                fetchCourseDetails();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsReordering(false);
        }
    };

    const handleDeleteStep = async (problemId) => {
        if (!confirm("Permanently decommission this step? This may break user progression records.")) return;

        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_URL}/admin/learning/problems/${problemId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                fetchCourseDetails();
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to delete step");
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
                <AdvancedLoading
                    title="Analyzing Course Nodes"
                    items={[
                        "Fetching sequential protocols...",
                        "Mapping mastery pathways...",
                        "Verifying step dependencies..."
                    ]}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-10">
            <header className="max-w-6xl mx-auto mb-12 glass-morphism p-10 rounded-[40px] border border-white/60 shadow-premium group relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>

                <div className="flex items-center gap-6 relative z-10">
                    <Link href="/admin/problems" className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:shadow-xl transition-all border border-slate-100 group/back">
                        <ArrowLeft size={24} className="group-hover/back:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 italic">Mastery Path</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">ID: {course.id}</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{course.language} <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 shrink-0">Blueprint</span></h1>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
                    <Link href={`/admin/create-problem?courseId=${courseId}&step=${course.problems.length + 1}`}>
                        <button className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all shadow-2xl hover:bg-blue-600 active:scale-95 group/btn">
                            <Plus size={18} className="group-hover/btn:rotate-90 transition-transform" /> Add Step {course.problems.length + 1}
                        </button>
                    </Link>
                </div>
            </header>

            <main className="max-w-6xl mx-auto space-y-6">
                {course.problems.length === 0 ? (
                    <div className="glass-morphism p-24 rounded-[40px] border border-white/60 shadow-premium text-center">
                        <Layout className="mx-auto text-slate-200 mb-6" size={64} />
                        <h3 className="text-xl font-black text-slate-900 uppercase italic">Sequential Gap Detected</h3>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2 mb-8">This module has no active learning nodes defined.</p>
                        <Link href={`/admin/create-problem?courseId=${courseId}&step=1`}>
                            <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]">Initialize Step 1</button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {course.problems.map((problem, idx) => (
                            <div
                                key={problem.id}
                                className="glass-morphism bg-white/80 border border-white rounded-[32px] p-8 flex items-center gap-8 group hover:shadow-xl transition-all duration-500 overflow-hidden relative"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/5 transition-colors"></div>

                                {/* Step Indicator */}
                                <div className="relative shrink-0 flex flex-col items-center gap-2">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step</div>
                                    <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-2xl group-hover:scale-110 transition-transform">
                                        {problem.step_number}
                                    </div>
                                    <div className="flex flex-col gap-1 mt-2">
                                        <button
                                            disabled={idx === 0 || isReordering}
                                            onClick={() => handleReorder(problem.id, 'up')}
                                            className="p-1 hover:text-blue-600 disabled:opacity-20 transition-colors"
                                        >
                                            <ChevronUp size={16} />
                                        </button>
                                        <button
                                            disabled={idx === course.problems.length - 1 || isReordering}
                                            onClick={() => handleReorder(problem.id, 'down')}
                                            className="p-1 hover:text-blue-600 disabled:opacity-20 transition-colors"
                                        >
                                            <ChevronDown size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Content Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-black text-slate-900 truncate tracking-tight">{problem.title}</h3>
                                        <span className="px-3 py-1 bg-slate-100 text-[8px] font-black uppercase tracking-widest rounded-full text-slate-400 shrink-0">ID: {problem.id}</span>
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium line-clamp-2 leading-relaxed max-w-2xl">
                                        {problem.description}
                                    </p>

                                    <div className="flex items-center gap-6 mt-6">
                                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            <CodeIcon size={12} className="text-slate-300" /> Starter Code:
                                            <span className={problem.starter_code ? 'text-emerald-500' : 'text-slate-300'}>
                                                {problem.starter_code ? 'Configured' : 'Missing'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            <Beaker size={12} className="text-slate-300" /> Solution Logic:
                                            <span className={problem.solution_code ? 'text-emerald-500' : 'text-slate-300'}>
                                                {problem.solution_code ? 'Verified' : 'Missing'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 relative z-10">
                                    <Link href={`/admin/create-problem?edit=${problem.id}&courseId=${courseId}`}>
                                        <button className="p-4 bg-slate-50 hover:bg-white hover:text-blue-600 rounded-2xl border border-slate-100 hover:border-blue-100 transition-all hover:shadow-lg active:scale-95 text-slate-400 group/edit">
                                            <Edit3 size={20} className="group-hover/edit:rotate-12 transition-transform" />
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => handleDeleteStep(problem.id)}
                                        className="p-4 bg-slate-50 hover:bg-white hover:text-red-500 rounded-2xl border border-slate-100 hover:border-red-100 transition-all hover:shadow-lg active:scale-95 text-slate-400"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <footer className="max-w-6xl mx-auto mt-12 p-8 border-t border-slate-200 flex justify-between items-center text-slate-400">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                    <Activity size={14} className="text-emerald-500" /> Node Status: Operational
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Synchronized with Central Intelligence Registry
                </div>
            </footer>
        </div>
    );
}

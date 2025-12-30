"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Code,
    Edit3,
    Trash2,
    Plus,
    ArrowLeft,
    AlertCircle,
    CheckCircle2,
    Layout,
    ArrowRight,
    Search,
    Shield,
    Terminal,
    BookOpen,
    Users,
    Layers,
    Activity,
    Settings,
    ChevronRight,
    X,
    Save
} from 'lucide-react';
import AdvancedLoading from '@/components/AdvancedLoading';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function CourseManagement() {
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newCourse, setNewCourse] = useState({ language: '', editor_language: 'python' });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_URL}/admin/learning/courses`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            // Sort by Language then Level Order
            data.sort((a, b) => {
                if (a.language === b.language) {
                    return (a.level_order || 0) - (b.level_order || 0);
                }
                return a.language.localeCompare(b.language);
            });
            setCourses(data);
        } catch (err) {
            console.error("Failed to fetch courses:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_URL}/admin/learning/courses`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(newCourse)
            });
            if (res.ok) {
                setIsCreateModalOpen(false);
                setNewCourse({ language: '', editor_language: 'python' });
                fetchCourses();
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to create course");
            }
        } catch (err) {
            console.error(err);
            alert("Error creating course");
        } finally {
            setIsCreating(false);
        }
    };

    const toggleCourseStatus = async (courseId, currentStatus) => {
        const token = localStorage.getItem("token");
        const action = currentStatus ? 'deactivate' : 'activate';
        try {
            const res = await fetch(`${API_URL}/admin/learning/courses/${courseId}/${action}`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                fetchCourses();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
                <AdvancedLoading
                    title="Accessing Intelligence Core"
                    items={[
                        "Loading learning modules...",
                        "Synchronizing course registries...",
                        "Verifying curriculum integrity..."
                    ]}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-10">
            <header className="max-w-7xl mx-auto mb-12 glass-morphism p-10 rounded-[40px] border border-white/60 shadow-premium group relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>

                <div className="flex items-center gap-6 relative z-10">
                    <Link href="/admin" className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:shadow-xl transition-all border border-slate-100 group/back">
                        <ArrowLeft size={24} className="group-hover/back:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Curriculum <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 uppercase">Manager</span></h1>
                        <div className="flex items-center gap-3">
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] opacity-70">Sequential Learning Paths & Intelligence Modules</p>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all shadow-2xl hover:bg-blue-600 active:scale-95 group/btn"
                    >
                        <Plus size={18} className="group-hover/btn:rotate-90 transition-transform" /> Deploy New Module
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                {courses.length === 0 ? (
                    <div className="glass-morphism p-32 rounded-[40px] border border-white/60 shadow-premium text-center">
                        <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                            <BookOpen size={40} />
                        </div>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Curriculum Void</p>
                        <p className="text-slate-500 font-medium text-sm mb-10 max-w-xs mx-auto opacity-70 uppercase tracking-widest text-[9px] font-black">No learning modules have been deployment to the grid.</p>
                        <button onClick={() => setIsCreateModalOpen(true)} className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] border border-slate-200 shadow-xl hover:bg-slate-900 hover:text-white transition-all active:scale-95">
                            Deploy Initial Module
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courses.map((course, idx) => (
                            <div
                                key={course.id}
                                className="group relative bg-white border border-slate-200 rounded-[32px] p-8 hover:border-blue-500/50 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ${course.editor_language === 'python' ? 'bg-indigo-600 text-white' :
                                        course.editor_language === 'javascript' ? 'bg-amber-400 text-slate-900' :
                                            'bg-slate-900 text-white'
                                        }`}>
                                        {course.editor_language.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-colors ${course.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                        }`}>
                                        {course.is_active ? 'Active' : 'Offline'}
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-tighter">
                                    {course.language}
                                </h3>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-6 ${course.level === 'Beginner' ? 'text-emerald-500' :
                                    course.level === 'Intermediate' ? 'text-amber-500' :
                                        'text-rose-500'
                                    }`}>
                                    {course.level || 'Standard'} Tier
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                            <Layers size={10} /> Nodes
                                        </div>
                                        <div className="text-xl font-black text-slate-900">{course.problem_count} Steps</div>
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                            <Users size={10} /> Units
                                        </div>
                                        <div className="text-xl font-black text-slate-900">{course.user_count}</div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Link href={`/admin/problems/${course.id}`} className="flex-1">
                                        <button className="w-full bg-slate-900 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-slate-900/10">
                                            <Settings size={12} /> Manage Steps
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => toggleCourseStatus(course.id, course.is_active)}
                                        className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-all active:scale-95 ${course.is_active ? 'bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200' : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700'
                                            }`}
                                    >
                                        <Activity size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Course Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[40px] shadow-premium border border-white/20 overflow-hidden scale-in-center">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Deploy New Module</h3>
                                <button onClick={() => setIsCreateModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateCourse} className="space-y-8">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Language Designation</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="E.G. ADVANCED PYTHON"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 font-bold transition-all text-sm"
                                        value={newCourse.language}
                                        onChange={(e) => setNewCourse({ ...newCourse, language: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Editor Engine</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 font-bold transition-all text-sm appearance-none cursor-pointer"
                                        value={newCourse.editor_language}
                                        onChange={(e) => setNewCourse({ ...newCourse, editor_language: e.target.value })}
                                    >
                                        <option value="python">Python 3.x</option>
                                        <option value="javascript">JavaScript (Node.js)</option>
                                    </select>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="flex-1 px-8 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] border border-slate-100 transition-all active:scale-95"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="flex-1 px-8 py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] border border-slate-900 shadow-xl shadow-slate-900/10 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {isCreating ? 'Synchronizing...' : <><Save size={16} /> Deploy</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

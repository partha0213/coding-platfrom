"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCourses } from "@/services/api";
import AdvancedLoading from "@/components/AdvancedLoading";
import { BookOpen, ChevronRight, Zap, Target, Trophy } from "lucide-react";

export default function CourseListPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadCourses = async () => {
            try {
                const data = await fetchCourses();
                setCourses(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        loadCourses();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center p-10">
            <AdvancedLoading
                title="Scanning Learning Hub"
                items={[
                    "Retrieving available courses...",
                    "Syncing your progress...",
                    "Initializing language modules...",
                    "Preparing learning sandbox..."
                ]}
            />
        </div>
    );

    if (error) return (
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-red-50 rounded-xl border border-red-100">
            <h2 className="text-red-800 font-bold text-xl">Initialization Error</h2>
            <p className="text-red-600 mt-2">{error}</p>
            <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
                Retry
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Cinematic Hero Section */}
            <div className="bg-slate-900 pt-32 pb-24 px-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent)]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.1),transparent)]"></div>
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <nav className="flex items-center gap-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                        <span className="w-8 h-px bg-blue-500"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Intelligence Wing</span>
                    </nav>

                    <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter mb-6 animate-in fade-in slide-in-from-left-8 duration-700">
                        Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Core</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl font-medium leading-relaxed animate-in fade-in slide-in-from-left-12 duration-1000">
                        A strictly sequential, stepwise learning journey designed to transform students into architects of code. No shortcuts, only mastery.
                    </p>

                    <div className="mt-12 flex items-center gap-8 animate-in fade-in zoom-in-95 duration-1000 delay-300">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-12 h-12 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-[10px] font-black text-slate-500">
                                        U-{0 + i}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            <span className="text-white">1.2k+</span> Operatives Training Now
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto py-24 px-8">
                <div className="flex items-center justify-between mb-16">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.4em] flex items-center gap-4">
                        Available Operations <span className="w-12 h-px bg-slate-200"></span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {courses.map((course, idx) => (
                        <Link
                            key={course.id}
                            href={`/learning/${course.id}`}
                            className="group relative bg-white border border-slate-200 rounded-[32px] p-10 hover:border-blue-500/50 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
                            style={{ animationDelay: `${idx * 150}ms` }}
                        >
                            {/* Course Identity */}
                            <div className="flex justify-between items-start mb-12">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg ${course.editor_language === 'python' ? 'bg-indigo-600 text-white shadow-indigo-200' :
                                        course.editor_language === 'javascript' ? 'bg-amber-400 text-slate-900 shadow-amber-100' :
                                            'bg-slate-900 text-white'
                                    }`}>
                                    {course.editor_language.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-blue-500 transition-colors">
                                    Encrypted Module
                                </div>
                            </div>

                            <h3 className="text-3xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                {course.language}
                            </h3>
                            <p className="text-sm text-slate-400 font-medium mb-12 leading-relaxed">
                                Sequential mastery of {course.language} core concepts through {course.progress.total_steps} mission-critical steps.
                            </p>

                            {/* Progress Section */}
                            <div className="space-y-4 pt-8 border-t border-slate-50">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    <span>Sync Status</span>
                                    <span className="text-slate-900">{course.progress.percentage_complete}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-50 shadow-inner">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${course.progress.percentage_complete === 100 ? 'bg-emerald-500' : 'bg-slate-900'
                                            }`}
                                        style={{ width: `${course.progress.percentage_complete}%` }}
                                    ></div>
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Step {course.progress.current_step} <span className="opacity-30">/</span> {course.progress.total_steps}
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                        <span className="text-[9px] font-black uppercase tracking-widest">
                                            {course.progress.current_step > course.progress.total_steps ? "Review" : "Deploy"}
                                        </span>
                                        <ChevronRight size={12} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {courses.length === 0 && (
                    <div className="text-center py-32 bg-white rounded-[48px] border-2 border-dashed border-slate-200 shadow-premium">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                            <BookOpen size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-sm">Archiving New Intelligence...</p>
                        <p className="text-slate-400 text-xs mt-2">New courses are being deployed to the hub. Check back soon.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

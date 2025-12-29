"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchCourseProblems } from "@/services/api";
import AdvancedLoading from "@/components/AdvancedLoading";
import { BookOpen, Map, Loader2 } from "lucide-react";

export default function CourseRoadmapPage() {
    const { courseId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadRoadmap = async () => {
            try {
                const result = await fetchCourseProblems(courseId);
                setData(result);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        loadRoadmap();
    }, [courseId]);

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center p-10">
            <AdvancedLoading
                title="Building Learning Roadmap"
                items={[
                    "Mapping curriculum nodes...",
                    "Analyzing your mastery path...",
                    "Preparing interactive modules...",
                    "Syncing secure state..."
                ]}
            />
        </div>
    );

    if (error) return (
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-red-50 rounded-xl border border-red-100">
            <h2 className="text-red-800 font-bold text-xl">Access Blocked</h2>
            <p className="text-red-600 mt-2">{error}</p>
            <Link
                href="/learning"
                className="inline-block mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-black transition"
            >
                Back to Courses
            </Link>
        </div>
    );

    const { course, progress, problems } = data;

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <nav className="mb-8">
                <Link href="/learning" className="text-slate-500 hover:text-black font-medium flex items-center gap-2">
                    ← Back to all courses
                </Link>
            </nav>

            <header className="mb-12 bg-black text-white p-10 rounded-[3rem] shadow-xl">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="px-4 py-1.5 bg-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest rounded-full border border-indigo-500/30">
                            Roadmap
                        </span>
                        <h1 className="text-4xl font-extrabold mt-4">{course.language} Mastery</h1>
                        <p className="text-slate-400 mt-2 max-w-md">
                            Follow the sequential steps to master {course.language} syntax and problem solving.
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-5xl font-black text-indigo-500">
                            {Math.round((progress.completed_steps / progress.total_steps) * 100)}%
                        </div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-tighter mt-1">
                            Completed
                        </div>
                    </div>
                </div>
            </header>

            <div className="relative space-y-0 pb-20">
                {problems.map((problem, index) => {
                    const isLocked = problem.access_status === "locked";
                    const isCompleted = problem.access_status === "completed";
                    const isCurrent = problem.access_status === "current";
                    const isLast = index === problems.length - 1;

                    return (
                        <div key={problem.id} className="relative group">
                            {/* Connector Line */}
                            {!isLast && (
                                <div className={`
                                    stepper-connector
                                    ${isCompleted ? 'stepper-connector-completed' : ''}
                                    ${isCurrent ? 'stepper-connector-active' : ''}
                                `} />
                            )}

                            <div className="flex gap-8 mb-12 items-start">
                                {/* Step Indicator */}
                                <div className={`
                                    step-circle
                                    ${isCompleted ? 'step-circle-completed' : ''}
                                    ${isCurrent ? 'step-circle-current' : ''}
                                    ${isLocked ? 'step-circle-locked' : ''}
                                `}>
                                    {isCompleted ? '✓' : problem.step_number}
                                </div>

                                {/* Content Card */}
                                <Link
                                    href={isLocked ? "#" : `/learning/${courseId}/problems/${problem.id}`}
                                    className={`
                                        flex-1 p-8 rounded-[2.5rem] border transition-all duration-300 relative
                                        ${isLocked
                                            ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
                                            : 'bg-white border-slate-200 hover:border-black hover:translate-x-2'
                                        }
                                        ${isCurrent ? 'ring-2 ring-black border-transparent shadow-2xl' : ''}
                                        ${isCompleted ? 'border-green-100 shadow-sm' : ''}
                                    `}
                                    onClick={(e) => isLocked && e.preventDefault()}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full
                                                    ${isCompleted ? 'bg-green-100 text-green-700' : ''}
                                                    ${isCurrent ? 'bg-black text-white' : ''}
                                                    ${isLocked ? 'bg-slate-200 text-slate-500' : ''}
                                                `}>
                                                    {problem.access_status}
                                                </span>
                                                {isCurrent && (
                                                    <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                                )}
                                            </div>
                                            <h3 className={`font-black text-2xl mb-1 ${isLocked ? 'text-slate-400' : 'text-slate-900'}`}>
                                                {problem.title}
                                            </h3>
                                            <p className="text-slate-500 font-medium max-w-md">
                                                {isLocked ? `Complete Step ${index} to unlock this module` : isCompleted ? "You've mastered this step" : "Master this step to progress"}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 mt-2">
                                            {isLocked ? (
                                                <div className="p-4 bg-slate-100 rounded-2xl text-slate-400">
                                                    🔒
                                                </div>
                                            ) : (
                                                <div className={`p-4 rounded-2xl transition-colors
                                                    ${isCompleted ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-900 group-hover:bg-black group-hover:text-white'}
                                                `}>
                                                    →
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Locked Overlay Hint */}
                                    {isLocked && (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/40 backdrop-blur-[1px] rounded-[2.5rem]">
                                            <div className="bg-black text-white px-6 py-2 rounded-xl text-xs font-black shadow-xl">
                                                LOCKED · COMPLETE STEP {index}
                                            </div>
                                        </div>
                                    )}
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

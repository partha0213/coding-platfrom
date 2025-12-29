"use client";

import { useEffect, useState } from "react";
import { fetchAdminCourses, fetchAdminCourseDetail, deleteProblem, reorderSteps } from "@/services/api";
import { AlertTriangle, Trash2, ArrowUpCircle, RefreshCcw, Save, ShieldAlert, CheckCircle } from "lucide-react";

export default function AdminLearningDashboard() {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    // Destructive State Management
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteProblemId, setDeleteProblemId] = useState(null);
    const [deletionForce, setDeletionForce] = useState(false);
    const [deletionImpact, setDeletionImpact] = useState(null);

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const data = await fetchAdminCourses();
            setCourses(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleSelectCourse = async (courseId) => {
        setLoading(true);
        try {
            const data = await fetchAdminCourseDetail(courseId);
            setSelectedCourse(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteProblem(deleteProblemId, deletionForce);
            setMessage({ type: 'success', text: "Step deleted successfully." });
            setDeleteProblemId(null);
            handleSelectCourse(selectedCourse.id); // Refresh
        } catch (err) {
            if (err.message.includes("force")) {
                setDeletionImpact(err.message);
            } else {
                setError(err.message);
            }
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <div className="p-10 animate-pulse text-slate-400">Loading Management Data...</div>;

    return (
        <div className="p-10 max-w-7xl mx-auto min-h-screen bg-slate-50">
            <header className="mb-10 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-slate-900">Learning Admin</h1>
                    <p className="text-slate-500 font-medium">Manage stepwise courses and problem sequences.</p>
                </div>
                <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 flex items-center gap-2 font-black text-xs uppercase tracking-widest">
                    <ShieldAlert size={14} /> Higher Privileged Area
                </div>
            </header>

            <div className="grid grid-cols-12 gap-8">
                {/* 1. Course Sidebar */}
                <aside className="col-span-3 space-y-4">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Select Course</h2>
                    {courses.map(course => (
                        <button
                            key={course.id}
                            onClick={() => handleSelectCourse(course.id)}
                            className={`w-full text-left p-6 rounded-3xl border transition-all ${selectedCourse?.id === course.id ? 'bg-black border-black text-white shadow-xl' : 'bg-white border-slate-200 hover:border-black text-slate-900'}`}
                        >
                            <div className="font-black text-lg">{course.language}</div>
                            <div className={`text-xs ${selectedCourse?.id === course.id ? 'text-slate-400' : 'text-slate-500'}`}>
                                {course.editor_language} • {course.is_active ? 'Active' : 'Inactive'}
                            </div>
                        </button>
                    ))}
                </aside>

                {/* 2. Problem Sequence Management */}
                <main className="col-span-9">
                    {!selectedCourse ? (
                        <div className="h-96 flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-400">
                            <ArrowUpCircle size={48} className="mb-4 opacity-10" />
                            <p className="font-bold">Select a course to begin management</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">{selectedCourse.language} Sequence</h2>
                                    <p className="text-slate-500 text-sm">Drag-and-drop support coming soon. Use the mapping API for now.</p>
                                </div>
                                <div className="flex gap-3 text-xs font-bold text-slate-400">
                                    <span>Total: {selectedCourse.statistics.total_problems}</span>
                                    <span>Enrolled: {selectedCourse.statistics.total_users}</span>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {selectedCourse.problems.map((problem) => (
                                    <div key={problem.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                        <div className="flex items-center gap-6">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-900 text-sm border border-slate-200">
                                                {problem.step_number}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{problem.title}</h3>
                                                <p className="text-xs text-slate-500 max-w-sm truncate">{problem.description}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2.5 text-slate-400 hover:text-black hover:bg-slate-100 rounded-xl transition-all">
                                                <Save size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDeleteProblemId(problem.id);
                                                    setDeletionForce(false);
                                                    setDeletionImpact(null);
                                                }}
                                                className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* HIGH RISK MODAL: DELETION */}
            {deleteProblemId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
                    <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mb-8 rotate-3 mx-auto">
                            <Trash2 size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 text-center mb-4">Destructive Action</h2>
                        <p className="text-slate-500 text-center mb-10 leading-relaxed">
                            Deleting a step creates a gap in the progression sequence. This might confuse users currently solving this course.
                        </p>

                        {deletionImpact ? (
                            <div className="mb-10 p-6 bg-red-600 text-white rounded-3xl shadow-xl shadow-red-200">
                                <div className="flex items-center gap-2 font-black mb-2">
                                    <AlertTriangle size={20} /> Progression Conflict
                                </div>
                                <p className="text-sm font-bold opacity-90">{deletionImpact}</p>
                                <div className="mt-6 flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="force"
                                        checked={deletionForce}
                                        onChange={(e) => setDeletionForce(e.target.checked)}
                                        className="w-6 h-6 rounded-lg border-white bg-transparent accent-white"
                                    />
                                    <label htmlFor="force" className="text-sm font-black uppercase tracking-tight">I understand and want to override</label>
                                </div>
                            </div>
                        ) : null}

                        <div className="flex gap-4">
                            <button
                                onClick={() => setDeleteProblemId(null)}
                                className="flex-1 py-4 bg-slate-100 text-slate-900 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deletionImpact && !deletionForce || isDeleting}
                                className={`flex-1 py-4 rounded-2xl font-black text-white transition-all shadow-lg ${deletionImpact ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-slate-800'}`}
                            >
                                {isDeleting ? "Processing..." : deletionImpact ? "Force Delete" : "Confirm Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NOTIFICATIONS */}
            {message && (
                <div className="fixed bottom-10 right-10 z-50 flex items-center gap-3 bg-slate-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl animate-in slide-in-from-right-10 duration-500">
                    <CheckCircle className="text-green-400" />
                    <span className="font-bold">{message.text}</span>
                </div>
            )}
        </div>
    );
}

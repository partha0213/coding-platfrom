"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Code,
    Edit,
    Trash2,
    Plus,
    ArrowLeft,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function ProblemManagement() {
    const router = useRouter();
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => {
        fetchProblems();
    }, []);

    const fetchProblems = async () => {
        try {
            const res = await fetch(`${API_URL}/problems`);
            const data = await res.json();
            setProblems(data);
        } catch (err) {
            console.error("Failed to fetch problems:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_URL}/problems/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                setProblems(problems.filter(p => p.id !== id));
                setDeleteId(null);
            } else {
                alert("Failed to delete problem");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting problem");
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'Hard': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-10">
            <header className="max-w-7xl mx-auto mb-12 flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-6">
                    <Link href="/admin" className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-blue-600 border border-slate-100">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Problem Management</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Manage, edit, and organize all challenges</p>
                    </div>
                </div>
                <Link href="/admin/create-problem">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                        <Plus size={20} /> Create New
                    </button>
                </Link>
            </header>

            <main className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="bg-white p-20 rounded-3xl border border-slate-200 shadow-sm text-center">
                        <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-400 font-medium">Loading challenges...</p>
                    </div>
                ) : problems.length === 0 ? (
                    <div className="bg-white p-20 rounded-3xl border border-slate-200 shadow-sm text-center">
                        <Code className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-400 font-medium">No problems created yet.</p>
                        <Link href="/admin/create-problem">
                            <button className="mt-6 bg-blue-50 hover:bg-blue-100 text-blue-600 px-6 py-3 rounded-xl font-bold transition-all">
                                Create Your First Problem
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="px-8 py-4 text-left">ID</th>
                                    <th className="px-8 py-4 text-left">Title</th>
                                    <th className="px-8 py-4 text-left">Category</th>
                                    <th className="px-8 py-4 text-left">Difficulty</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {problems.map((problem) => (
                                    <tr key={problem.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 text-slate-500 font-bold text-sm">#{problem.id}</td>
                                        <td className="px-8 py-5">
                                            <div className="font-bold text-slate-800">{problem.title}</div>
                                            <div className="text-xs text-slate-400 truncate max-w-md mt-1">{problem.description?.substring(0, 80)}...</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                                                {problem.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${getDifficultyColor(problem.difficulty)}`}>
                                                {problem.difficulty}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/admin/create-problem?edit=${problem.id}`}>
                                                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                                        <Edit size={18} />
                                                    </button>
                                                </Link>
                                                <button
                                                    onClick={() => setDeleteId(problem.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Delete Problem?</h3>
                                <p className="text-sm text-slate-500 mt-1">This action cannot be undone</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteId)}
                                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";
import { useEffect, useState } from 'react';
import {
    Users,
    AlertTriangle,
    Trash2,
    Edit3,
    ChevronRight,
    X,
    Save,
    Plus,
    Info,
    ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function AdminDashboard() {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [problems, setProblems] = useState([]);
    const [globalStats, setGlobalStats] = useState({ total_users: 0, total_problems: 0, total_submissions: 0, pass_rate: 0 });
    const [activeTab, setActiveTab] = useState('leaderboard');
    const [tests, setTests] = useState([]);

    // Management States
    const [editingProblem, setEditingProblem] = useState(null);
    const [deletingProblemId, setDeletingProblemId] = useState(null);
    const [filterMyProblems, setFilterMyProblems] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
        fetch(`${API_URL}/admin/leaderboard`).then(res => res.json()).then(setLeaderboard).catch(console.error);
        fetch(`${API_URL}/problems`).then(res => res.json()).then(setProblems).catch(console.error);
        fetch(`${API_URL}/admin/global-stats`).then(res => res.json()).then(setGlobalStats).catch(console.error);
        fetch(`${API_URL}/admin/tests`).then(res => res.json()).then(setTests).catch(console.error);
    };

    const handleDelete = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_URL}/problems/${deletingProblemId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                setProblems(problems.filter(p => p.id !== deletingProblemId));
                setDeletingProblemId(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_URL}/problems/${editingProblem.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(editingProblem)
            });
            if (res.ok) {
                setEditingProblem(null);
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const startEditing = async (id) => {
        const res = await fetch(`${API_URL}/problems/${id}`);
        const data = await res.json();
        setEditingProblem(data);
    };

    const filteredProblems = filterMyProblems
        ? problems.filter(p => p.creator_id === user?.id)
        : problems;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-10 max-w-7xl mx-auto">
            <header className="mb-10 flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
                <div>
                    <h1 className="text-3xl font-extrabold mb-2 text-slate-900">Command Center</h1>
                    <p className="text-slate-500 font-medium">Monitor performance and manage contents.</p>
                </div>
                <div className="flex gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'leaderboard' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Participants
                    </button>
                    <button
                        onClick={() => setActiveTab('tests')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'tests' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Scheduled Tests
                    </button>
                </div>
            </header>

            {/* Global Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <AdminStatCard label="Total Students" value={globalStats.total_users} icon={<Users size={18} />} color="blue" />
                <AdminStatCard label="Live Challenges" value={globalStats.total_problems} icon={<Edit3 size={18} />} color="indigo" />
                <AdminStatCard label="Global Submits" value={globalStats.total_submissions} icon={<Save size={18} />} color="amber" />
                <AdminStatCard label="Success Rate" value={`${globalStats.pass_rate}%`} icon={<ShieldAlert size={18} />} color="emerald" />
            </div>

            {activeTab === 'leaderboard' ? (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/40">
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                        <h3 className="font-extrabold text-slate-800 flex items-center gap-2"><Users size={20} className="text-blue-600" /> Active Participants</h3>
                    </div>

                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/50 text-slate-400 uppercase font-black tracking-widest text-[10px] border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5">Rank</th>
                                <th className="px-8 py-5">Identity</th>
                                <th className="px-8 py-5">Role</th>
                                <th className="px-8 py-5 text-right">Solved</th>
                                <th className="px-8 py-5 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {leaderboard.length === 0 ? (
                                <tr><td colSpan="5" className="p-16 text-center text-slate-400 italic font-medium">No system data available.</td></tr>
                            ) : (
                                leaderboard.map((p, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-8 py-6 font-black text-slate-300 group-hover:text-blue-400 transition">#{idx + 1}</td>
                                        <td className="px-8 py-6">
                                            <div className="font-extrabold text-slate-800">{p.username}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{p.email}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${p.role === 'ADMIN' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {p.role}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-blue-600">{p.solved}</td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3 font-bold">
                                                <Link href={`/admin/user/${p.id}`} className="text-[10px] uppercase tracking-widest text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors">
                                                    View Stats
                                                </Link>
                                                <div className="flex items-center gap-2 text-[10px] text-emerald-500">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Stable
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/40">
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                        <h3 className="font-extrabold text-slate-800 flex items-center gap-2"><Edit3 size={20} className="text-blue-600" /> Scheduled Tests</h3>
                        <Link href="/admin/create-test">
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg active:scale-95">
                                Create New Test
                            </button>
                        </Link>
                    </div>

                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/50 text-slate-400 uppercase font-black tracking-widest text-[10px] border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5">Test Title</th>
                                <th className="px-8 py-5">Schedule</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tests.length === 0 ? (
                                <tr><td colSpan="4" className="p-16 text-center text-slate-400 italic font-medium">No tests scheduled yet.</td></tr>
                            ) : (
                                tests.map((test, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="font-extrabold text-slate-800">{test.title}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {test.id}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-xs font-bold text-slate-600">{new Date(test.start_time).toLocaleString()}</div>
                                            <div className="text-[10px] text-slate-400 font-medium">to {new Date(test.end_time).toLocaleString()}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${test.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' :
                                                    test.status === 'UPCOMING' ? 'bg-blue-100 text-blue-600' :
                                                        'bg-slate-100 text-slate-500'
                                                }`}>
                                                {test.status === 'ACTIVE' ? 'Live Now' :
                                                    test.status === 'UPCOMING' ? 'Upcoming' :
                                                        'Expired'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            {test.status === 'EXPIRED' ? (
                                                <Link href={`/admin/tests/${test.id}/results`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-lg active:scale-95">
                                                    View Results <ChevronRight size={14} />
                                                </Link>
                                            ) : (
                                                <button disabled className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                                                    Results Pending
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal */}
            {editingProblem && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-10 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-white/20 scale-in-center">
                        <header className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Modify Challenge</h2>
                                <p className="text-slate-500 text-sm font-medium">Updating resource ID: {editingProblem.id}</p>
                            </div>
                            <button onClick={() => setEditingProblem(null)} className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all text-slate-400 hover:text-slate-900">
                                <X size={24} />
                            </button>
                        </header>
                        <form className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar" onSubmit={handleUpdate}>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Problem Title</label>
                                    <input
                                        type="text"
                                        value={editingProblem.title}
                                        onChange={(e) => setEditingProblem({ ...editingProblem, title: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 font-bold transition"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Description</label>
                                    <textarea
                                        rows={5}
                                        value={editingProblem.description}
                                        onChange={(e) => setEditingProblem({ ...editingProblem, description: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 font-medium transition resize-none leading-relaxed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Difficulty</label>
                                    <select
                                        value={editingProblem.difficulty}
                                        onChange={(e) => setEditingProblem({ ...editingProblem, difficulty: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 font-bold appearance-none cursor-pointer"
                                    >
                                        <option>Easy</option>
                                        <option>Medium</option>
                                        <option>Hard</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Category</label>
                                    <select
                                        value={editingProblem.category}
                                        onChange={(e) => setEditingProblem({ ...editingProblem, category: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 font-bold appearance-none cursor-pointer"
                                    >
                                        <option>Arrays</option>
                                        <option>Strings</option>
                                        <option>Recursion</option>
                                        <option>Graphs</option>
                                        <option>Dynamic Programming</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex gap-4">
                                <Info className="text-blue-500 shrink-0" size={20} />
                                <div className="text-xs text-blue-800 font-medium leading-relaxed">
                                    <strong>System Notice:</strong> Test cases and starter codes can be updated in the full editor. Currently modifying core metadata and ranking parameters.
                                </div>
                            </div>
                        </form>
                        <footer className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                            <button
                                onClick={() => setEditingProblem(null)}
                                className="px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                <Save size={16} /> Sync Changes
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {/* Custom Delete Warning Dialog */}
            {deletingProblemId && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden p-10 text-center scale-in-center border-t-4 border-red-500">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 shadow-inner">
                            <ShieldAlert size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Destructive Action</h2>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10">
                            You are about to delete resource <span className="text-red-600 font-bold font-mono">#{deletingProblemId}</span>. This will purge all associated test cases and submission history. This action <span className="text-red-600 font-bold italic">cannot</span> be undone.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleDelete}
                                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                            >
                                Purge Permanently
                            </button>
                            <button
                                onClick={() => setDeletingProblemId(null)}
                                className="w-full bg-white text-slate-500 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-200 hover:bg-slate-50 transition-all"
                            >
                                Negative, Abort
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AdminStatCard({ label, value, icon, color }) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100"
    };

    return (
        <div className={`p-6 rounded-3xl border ${colorClasses[color]} bg-white shadow-sm flex flex-col gap-3 transition-transform hover:scale-[1.02] duration-300`}>
            <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                <div className={`p-2 rounded-xl bg-white shadow-inner border border-slate-100`}>
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-black text-slate-800 tracking-tight">{value}</div>
        </div>
    );
}

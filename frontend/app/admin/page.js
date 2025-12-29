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
    ShieldAlert,
    BarChart3,
    Layout,
    Clock,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AdvancedLoading from '@/components/AdvancedLoading';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function AdminDashboard() {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [problems, setProblems] = useState([]);
    const [globalStats, setGlobalStats] = useState({ total_users: 0, total_problems: 0, total_submissions: 0, pass_rate: 0 });
    const [activeTab, setActiveTab] = useState('leaderboard');
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Management States
    const [editingProblem, setEditingProblem] = useState(null);
    const [deletingProblemId, setDeletingProblemId] = useState(null);
    const [filterMyProblems, setFilterMyProblems] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            await Promise.all([
                fetch(`${API_URL}/admin/leaderboard`).then(res => res.json()).then(setLeaderboard),
                fetch(`${API_URL}/problems`).then(res => res.json()).then(setProblems),
                fetch(`${API_URL}/admin/global-stats`).then(res => res.json()).then(setGlobalStats),
                fetch(`${API_URL}/admin/tests`).then(res => res.json()).then(setTests)
            ]);
        } catch (err) {
            console.error("Failed to fetch admin data:", err);
        } finally {
            setLoading(false);
        }
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

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
                <AdvancedLoading
                    title="Accessing Command Center"
                    items={[
                        "Syncing personnel registry...",
                        "Loading operational protocols...",
                        "Updating global diagnostics..."
                    ]}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-10">
            <header className="max-w-7xl mx-auto mb-12 glass-morphism p-10 rounded-[40px] border border-white/60 shadow-premium group relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform duration-500">
                        <BarChart3 className="text-white" size={28} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black mb-2 text-slate-900 tracking-tighter">Command <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 italic">Center</span></h1>
                        <div className="flex items-center gap-3">
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] opacity-70">Strategic Oversight & Resource Management</p>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 bg-slate-900/5 p-2 rounded-[24px] border border-white/40 shadow-inner relative z-10">
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeTab === 'leaderboard' ? 'bg-white text-slate-900 shadow-xl scale-[1.05] border border-white' : 'text-slate-400 hover:text-slate-600 px-8'}`}
                    >
                        Personnel
                    </button>
                    <button
                        onClick={() => setActiveTab('tests')}
                        className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${activeTab === 'tests' ? 'bg-white text-slate-900 shadow-xl scale-[1.05] border border-white' : 'text-slate-400 hover:text-slate-600 px-8'}`}
                    >
                        Operations
                    </button>
                </div>
            </header>

            {/* Global Stats Overview */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                <AdminStatCard label="Personnel" value={globalStats.total_users} icon={<Users size={20} />} sub="Enrolled Intelligence" color="blue" />
                <AdminStatCard label="Challenges" value={globalStats.total_problems} icon={<Layout size={20} />} sub="Active Protocol Bank" color="indigo" />
                <AdminStatCard label="Deployments" value={globalStats.total_submissions} icon={<Save size={20} />} sub="Global Request Logs" color="amber" />
                <AdminStatCard label="Precision" value={`${globalStats.pass_rate}%`} icon={<ShieldAlert size={20} />} sub="Fleet Validation Avg" color="emerald" />
            </div>

            <main className="max-w-7xl mx-auto">
                {activeTab === 'leaderboard' ? (
                    <div className="glass-morphism rounded-[32px] border border-white/60 shadow-premium overflow-hidden group">
                        <div className="px-10 py-8 border-b border-white/40 bg-slate-900/5 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-4 tracking-tight">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                    <Users size={20} />
                                </div>
                                Personnel Registry
                            </h3>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-white/40 px-5 py-2 rounded-full border border-white/60">
                                Active Intelligence Nodes
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-white/40 bg-white/20">
                                        <th className="px-10 py-5">Designation</th>
                                        <th className="px-10 py-5">Identity Profile</th>
                                        <th className="px-10 py-5">Clearance</th>
                                        <th className="px-10 py-4 text-center">Mastery</th>
                                        <th className="px-10 py-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/20">
                                    {leaderboard.length === 0 ? (
                                        <tr><td colSpan="5" className="p-24 text-center text-slate-400 italic font-black uppercase tracking-[0.2em]">No system activity detected</td></tr>
                                    ) : (
                                        leaderboard.map((p, idx) => (
                                            <tr key={idx} className="hover:bg-white/40 transition-all duration-300 group/row">
                                                <td className="px-10 py-7">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-xl group-hover/row:scale-110 group-hover/row:rotate-3 transition-transform">
                                                        #{idx + 1}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-7">
                                                    <div className="font-black text-slate-900 tracking-tight group-hover/row:text-blue-600 transition-colors">{p.username}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{p.email}</div>
                                                </td>
                                                <td className="px-10 py-7">
                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${p.role === 'ADMIN' ? 'bg-blue-600 text-white border-blue-400' : 'bg-white/60 text-slate-500 border-white'}`}>
                                                        {p.role}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-7 text-center">
                                                    <div className="inline-flex flex-col items-center">
                                                        <div className="text-xl font-black text-slate-900 tracking-tighter">{p.solved}</div>
                                                        <div className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest">Solutions</div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-7 text-right">
                                                    <div className="flex items-center justify-end gap-6">
                                                        <Link href={`/admin/user/${p.id}`}>
                                                            <button className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 bg-white hover:bg-slate-900 hover:text-white px-5 py-2.5 rounded-xl border border-white shadow-lg transition-all active:scale-95 flex items-center gap-2">
                                                                Profile <ArrowRight size={14} />
                                                            </button>
                                                        </Link>
                                                        <div className="hidden lg:flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-500">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Link Established
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="glass-morphism rounded-[32px] border border-white/60 shadow-premium overflow-hidden group">
                        <div className="px-10 py-8 border-b border-white/40 bg-slate-900/5 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-4 tracking-tight">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                    <Clock size={20} />
                                </div>
                                Operation Protocols
                            </h3>
                            <Link href="/admin/create-test">
                                <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition shadow-xl active:scale-95 flex items-center gap-3">
                                    <Plus size={16} /> Finalize Protocol
                                </button>
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-white/40 bg-white/20">
                                        <th className="px-10 py-5">Mission Objective</th>
                                        <th className="px-10 py-5">Schedule Window</th>
                                        <th className="px-10 py-5">Operational Status</th>
                                        <th className="px-10 py-5 text-right">Analysis</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/20">
                                    {tests.length === 0 ? (
                                        <tr><td colSpan="4" className="p-24 text-center text-slate-400 italic font-black uppercase tracking-[0.2em]">No operations scheduled</td></tr>
                                    ) : (
                                        tests.map((test, idx) => (
                                            <tr key={idx} className="hover:bg-white/40 transition-all duration-300 group/row">
                                                <td className="px-10 py-7">
                                                    <div className="font-black text-slate-900 tracking-tight group-hover/row:text-blue-600 transition-colors">{test.title}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">REF-ID: {String(test.id).substring(0, 8)}</div>
                                                </td>
                                                <td className="px-10 py-7">
                                                    <div className="flex items-center gap-3 text-slate-600 mb-1">
                                                        <Clock size={12} className="text-blue-600" />
                                                        <span className="text-xs font-black tracking-tight">{new Date(test.start_time).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-6">Termination: {new Date(test.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td className="px-10 py-7">
                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm flex items-center gap-2 w-fit ${test.status === 'ACTIVE' ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/20' :
                                                        test.status === 'UPCOMING' ? 'bg-blue-600 text-white border-blue-400 shadow-blue-500/20' :
                                                            'bg-white/60 text-slate-500 border-white shadow-none'
                                                        }`}>
                                                        {test.status === 'ACTIVE' && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
                                                        {test.status === 'ACTIVE' ? 'Live Deployment' :
                                                            test.status === 'UPCOMING' ? 'Pre-Flight' :
                                                                'Mission Expired'}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-7 text-right">
                                                    {test.status === 'EXPIRED' ? (
                                                        <Link href={`/admin/tests/${test.id}/results`} className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl active:scale-95">
                                                            View Intel <ArrowRight size={14} />
                                                        </Link>
                                                    ) : (
                                                        <button disabled className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/40 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border border-white cursor-not-allowed">
                                                            Awaiting Data
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Edit Modal */}
            {
                editingProblem && (
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
                )
            }

            {/* Custom Delete Warning Dialog */}
            {
                deletingProblemId && (
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
                )
            }
        </div >
    );
}

function AdminStatCard({ label, value, icon, sub, color }) {
    const colorClasses = {
        blue: "text-blue-600",
        indigo: "text-indigo-600",
        amber: "text-amber-600",
        emerald: "text-emerald-600"
    };

    return (
        <div className={`p-8 rounded-[40px] glass-morphism border border-white/60 shadow-premium flex flex-col gap-6 transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent -mr-12 -mt-12 rounded-full"></div>
            <div className="flex justify-between items-start relative z-10">
                <div className={`p-4 rounded-2xl bg-white border border-white shadow-xl shadow-slate-900/5 group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 ${colorClasses[color]}`}>
                    {icon}
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">{label}</div>
            </div>
            <div>
                <div className={`text-4xl font-black tracking-tighter tabular-nums mb-1 relative z-10 ${colorClasses[color]}`}>{value}</div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60 flex items-center gap-2">
                    <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                    {sub}
                </div>
            </div>
        </div>
    );
}

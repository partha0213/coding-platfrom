"use client";
import { useEffect, useState } from 'react';
import {
    Users,
    ChevronLeft,
    Download,
    ShieldAlert,
    Search,
    Filter,
    ArrowUpDown,
    CheckCircle2,
    XCircle,
    AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function AdminTestResults({ params }) {
    const testId = params.testId;
    const [testData, setTestData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        if (testId) {
            fetchResults();
        }
    }, [testId]);

    const fetchResults = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/test-results/${testId}`);
            const data = await res.json();
            setTestData(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await fetch(`${API_URL}/admin/test-results/${testId}/export`);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `test_${testId}_results.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
        }
        setExporting(false);
    };

    const filteredResults = testData?.results?.filter(r =>
        r.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Fetching Test Intel...</p>
                </div>
            </div>
        );
    }

    if (!testData || testData.error) {
        return (
            <div className="min-h-screen w-full bg-white p-10 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 text-red-500">
                    <ShieldAlert size={40} />
                </div>
                <h1 className="text-2xl font-black text-slate-800 mb-2">Test Not Found</h1>
                <p className="text-slate-500 mb-8 font-medium">The requested test data could not be retrieved.</p>
                <Link href="/admin">
                    <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs">
                        Return to Command Center
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 p-10 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <Link href="/admin" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-xs uppercase tracking-widest mb-4 transition-colors group">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{testData.test.title}</h1>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                            <Users size={14} /> {testData.total_students} Students Participating
                        </div>
                        <div className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-lg font-black uppercase tracking-widest">
                            ID: {testData.test.id}
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                >
                    <Download size={16} /> {exporting ? 'Exporting...' : 'Export Results (.csv)'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-blue-600 text-white p-8 rounded-[32px] shadow-2xl shadow-blue-500/20">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Average Score</div>
                    <div className="text-5xl font-black mb-1">
                        {Math.round(testData.avg_score || 0)}%
                    </div>
                    <div className="text-xs font-bold opacity-80">Overall platform performance</div>
                </div>
                <div className="bg-slate-900 text-white p-8 rounded-[32px] shadow-2xl shadow-slate-900/20">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Total Submissions</div>
                    <div className="text-5xl font-black mb-1">
                        {testData.total_submissions || 0}
                    </div>
                    <div className="text-xs font-bold opacity-60">Code executions during test</div>
                </div>
                <div className="bg-emerald-600 text-white p-8 rounded-[32px] shadow-2xl shadow-emerald-500/20">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Tests Completed</div>
                    <div className="text-5xl font-black mb-1">
                        {testData.total_completed || 0}
                    </div>
                    <div className="text-xs font-bold opacity-80">Students who finished test</div>
                </div>
                <div className="bg-rose-600 text-white p-8 rounded-[32px] shadow-2xl shadow-rose-500/20">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total Violations</div>
                    <div className="text-5xl font-black mb-1">
                        {testData.total_violations || 0}
                    </div>
                    <div className="text-xs font-bold opacity-80">Proctoring alerts triggered</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white border border-slate-200 rounded-[40px] shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <h3 className="text-xl font-black text-slate-800">Student Standings</h3>
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Find student by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 pl-14 pr-6 py-4 rounded-2xl outline-none focus:border-blue-600 font-bold transition-all shadow-sm shadow-slate-100"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-400 uppercase font-black tracking-widest text-[10px] border-y border-slate-100">
                            <tr>
                                <th className="px-10 py-6">Identity</th>
                                <th className="px-10 py-6">Solved</th>
                                <th className="px-10 py-6">Score</th>
                                <th className="px-10 py-6">Integrity</th>
                                <th className="px-10 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredResults.length > 0 ? (
                                filteredResults.map((result, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black border border-slate-200 group-hover:bg-white group-hover:border-blue-200 transition-colors">
                                                    {result.username.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">{result.username}</div>
                                                    <div className="text-xs font-bold text-slate-400">{result.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 font-black text-slate-600 text-xs">
                                                {result.solved} / {result.total_problems}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className={`text-2xl font-black ${result.score >= 70 ? 'text-emerald-500' : result.score >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                {Math.round(result.score)}%
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            {result.violations > 0 ? (
                                                <div className="flex items-center gap-2 text-rose-500 font-black text-xs uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 animate-pulse">
                                                    <ShieldAlert size={16} /> {result.violations} Violations
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                                                    <CheckCircle2 size={16} /> Clean Record
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <Link href={`/admin/user/${result.user_id}`} className="inline-flex items-center gap-2 py-3 px-6 bg-white border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm active:scale-95">
                                                Examine Profile
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-10 py-20 text-center">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <Users size={32} />
                                        </div>
                                        <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">No students found matches the search criteria.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

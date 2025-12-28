"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Plus, Trash2, ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function CreateProblem() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        difficulty: "Easy",
        category: "Arrays",
        starter_codes: {
            javascript: "function solution() {\n  // your code here\n}",
            python: "def solution():\n    # your code here\n    pass"
        },
        test_cases: [
            { input_data: "", expected_output: "", is_hidden: false }
        ]
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`${API_URL}/problems/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    test_cases: formData.test_cases.filter(tc => tc.input_data)
                })
            });

            if (res.ok) {
                router.push('/admin');
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail || 'Failed to create'}`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addTestCase = () => {
        setFormData({
            ...formData,
            test_cases: [...formData.test_cases, { input_data: "", expected_output: "", is_hidden: false }]
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-10">
            <header className="max-w-5xl mx-auto mb-12 flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-6">
                    <Link href="/admin" className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-blue-600 border border-transparent hover:border-slate-100">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Craft New Challenge</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Design a unique problem for the platform.</p>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                    <Save size={20} /> {loading ? "Ingesting..." : "Deploy Problem"}
                </button>
            </header>

            <form className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10" onSubmit={handleSubmit}>
                {/* Left: Metadata */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="space-y-8 bg-white p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5 ml-1">Problem Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:border-blue-500 outline-none transition text-slate-800 font-bold placeholder:font-normal"
                                placeholder="e.g. Invert a Binary Tree"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5 ml-1">Mission Briefing</label>
                            <textarea
                                rows={8}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:border-blue-500 outline-none transition resize-none font-medium text-slate-700 leading-relaxed"
                                placeholder="Clearly explain the logic, constraints, and edge cases..."
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5 ml-1">Starter Solution (JS)</label>
                                <textarea
                                    rows={10}
                                    value={formData.starter_codes.javascript}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        starter_codes: { ...formData.starter_codes, javascript: e.target.value }
                                    })}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 focus:border-blue-500 outline-none transition resize-none font-mono text-sm text-emerald-400/90 shadow-inner"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5 ml-1">Starter Solution (Python)</label>
                                <textarea
                                    rows={10}
                                    value={formData.starter_codes.python}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        starter_codes: { ...formData.starter_codes, python: e.target.value }
                                    })}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 focus:border-blue-500 outline-none transition resize-none font-mono text-sm text-blue-400/90 shadow-inner"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 bg-white p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Test Scenarios</h3>
                                <p className="text-xs text-slate-400 font-medium">Define inputs and expected results for verification.</p>
                            </div>
                            <button
                                type="button"
                                onClick={addTestCase}
                                className="text-xs bg-slate-50 hover:bg-blue-50 text-blue-600 px-4 py-2 rounded-xl flex items-center gap-2 font-black uppercase tracking-widest border border-slate-200 hover:border-blue-200 transition-all"
                            >
                                <Plus size={14} /> Add Scenario
                            </button>
                        </div>

                        <div className="space-y-6">
                            {formData.test_cases.map((tc, idx) => (
                                <div key={idx} className="group relative bg-slate-50/50 p-6 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 hover:bg-white hover:border-blue-100 transition-all">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Input Sequence</label>
                                        <input
                                            type="text"
                                            value={tc.input_data}
                                            onChange={(e) => {
                                                const newCases = [...formData.test_cases];
                                                newCases[idx].input_data = e.target.value;
                                                setFormData({ ...formData, test_cases: newCases });
                                            }}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none text-sm font-mono text-slate-600 shadow-sm"
                                            placeholder="[2, 7, 11, 15], 9"
                                        />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Expected Payload</label>
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                value={tc.expected_output}
                                                onChange={(e) => {
                                                    const newCases = [...formData.test_cases];
                                                    newCases[idx].expected_output = e.target.value;
                                                    setFormData({ ...formData, test_cases: newCases });
                                                }}
                                                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none text-sm font-mono text-slate-600 shadow-sm"
                                                placeholder="[0, 1]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newCases = formData.test_cases.filter((_, i) => i !== idx);
                                                    setFormData({ ...formData, test_cases: newCases });
                                                }}
                                                className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Settings */}
                <div className="space-y-8">
                    <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 sticky top-10">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800 mb-8 pb-4 border-b border-slate-100">Configuration</h3>
                        <div className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Complexity Class</label>
                                <select
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 font-bold text-slate-800 transition shadow-sm appearance-none cursor-pointer"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23cbd5e1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '1.5rem' }}
                                >
                                    <option>Easy</option>
                                    <option>Medium</option>
                                    <option>Hard</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Target Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 font-bold text-slate-800 transition shadow-sm appearance-none cursor-pointer"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23cbd5e1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '1.5rem' }}
                                >
                                    <option>Arrays</option>
                                    <option>Strings</option>
                                    <option>Recursion</option>
                                    <option>Graphs</option>
                                    <option>Dynamic Programming</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-12 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-4">
                            <Info className="text-blue-500 shrink-0" size={20} />
                            <div className="text-xs text-blue-800 font-medium leading-relaxed">
                                <strong>System Note:</strong> Input data must be valid JSON fragments representable as function arguments.
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

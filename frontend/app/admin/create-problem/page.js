"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Plus, Trash2, ArrowLeft, Info, Terminal, Shield, Cpu, Activity, Layout, Layers, Beaker } from 'lucide-react';
import Link from 'next/link';
import AdvancedLoading from '@/components/AdvancedLoading';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function CreateProblem() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(false);
    const [courseId, setCourseId] = useState(null);
    const [editId, setEditId] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        difficulty: "Medium",
        category: "General",
        step_number: 1,
        starter_code: "def solution():\n    # your code here\n    pass",
        solution_code: "def solution():\n    return True",
        test_cases: [
            { input_data: "", expected_output: "", is_hidden: false }
        ]
    });

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const edit = urlParams.get('edit');
        const cId = urlParams.get('courseId');
        const step = urlParams.get('step');

        if (cId) setCourseId(cId);
        if (step) setFormData(prev => ({ ...prev, step_number: parseInt(step) }));

        if (edit) {
            setEditId(edit);
            fetchProblem(edit);
        }
    }, []);

    const fetchProblem = async (id) => {
        setInitLoading(true);
        const token = localStorage.getItem("token");
        try {
            // Using the learning admin view which includes solution_code
            const res = await fetch(`${API_URL}/admin/learning/problems/${id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) {
                // Fallback to general problem endpoint if not a sequence problem
                const resOld = await fetch(`${API_URL}/problems/${id}`);
                const dataOld = await resOld.json();
                setFormData({
                    ...dataOld,
                    starter_code: dataOld.starter_codes?.python || "",
                    solution_code: "" // Old model didn't have this
                });
                return;
            }
            const data = await res.json();

            // Fetch test cases as well
            const tcRes = await fetch(`${API_URL}/admin/learning/problems/${id}/test-cases`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const test_cases = await tcRes.json();

            setFormData({
                ...data,
                test_cases: test_cases.length > 0 ? test_cases : [{ input_data: "", expected_output: "", is_hidden: false }]
            });
        } catch (err) {
            console.error("Failed to fetch problem for editing:", err);
        } finally {
            setInitLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem("token");

        try {
            let res;
            if (editId) {
                // Update existing
                res = await fetch(`${API_URL}/admin/learning/problems/${editId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: formData.title,
                        description: formData.description,
                        starter_code: formData.starter_code,
                        solution_code: formData.solution_code
                    })
                });
            } else if (courseId) {
                // Create in course
                res = await fetch(`${API_URL}/admin/learning/courses/${courseId}/problems`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        step_number: formData.step_number,
                        title: formData.title,
                        description: formData.description,
                        starter_code: formData.starter_code,
                        solution_code: formData.solution_code
                    })
                });
            } else {
                alert("Course context missing. Problems must be associated with a course.");
                setLoading(false);
                return;
            }

            if (res.ok) {
                const problemData = await res.json();
                const problemId = editId || problemData.id;

                // Sync Test Cases
                await syncTestCases(problemId);

                router.push(courseId ? `/admin/problems/${courseId}` : '/admin/problems');
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail || 'Failed to sync protocol'}`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const syncTestCases = async (problemId) => {
        const token = localStorage.getItem("token");
        // For simplicity, we delete existing and re-add if editing
        // Or in a real app, do a diff. 
        // Let's just add new ones for now if create, or handle simply.
        const validTestCases = formData.test_cases.filter(tc => tc.expected_output);

        for (const tc of validTestCases) {
            if (tc.id) continue; // Skip already existing for now to avoid duplicates (simplification)
            await fetch(`${API_URL}/admin/learning/problems/${problemId}/test-cases`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(tc)
            });
        }
    };

    const addTestCase = () => {
        setFormData({
            ...formData,
            test_cases: [...formData.test_cases, { input_data: "", expected_output: "", is_hidden: false }]
        });
    };

    if (initLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
                <AdvancedLoading
                    title="Mission Architect"
                    items={[
                        "Retrieving protocol blueprint...",
                        "Decoding logic matrices...",
                        "Preparing architect interface..."
                    ]}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-10">
            <header className="max-w-5xl mx-auto mb-12 glass-morphism p-10 rounded-[40px] border border-white/60 shadow-premium group relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>

                <div className="flex items-center gap-6 relative z-10">
                    <button onClick={() => router.back()} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:shadow-xl transition-all border border-slate-100 group/back">
                        <ArrowLeft size={24} className="group-hover/back:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Step <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Architect</span></h1>
                        <div className="flex items-center gap-3">
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] opacity-70">Sequential Learning Node Configuration</p>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 w-full md:w-auto">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all shadow-2xl hover:bg-blue-600 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none group/save"
                    >
                        <Save size={18} className="group-hover/save:scale-110 transition-transform" /> {loading ? "SYNCHRONIZING..." : "FINALIZE & DEPLOY"}
                    </button>
                </div>
            </header>

            <form className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10" onSubmit={handleSubmit}>
                {/* Left: Metadata */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="space-y-10 glass-morphism p-10 rounded-[40px] border border-white/60 shadow-premium group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover/panel:bg-blue-500/10 transition-colors"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                    <Shield size={20} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight italic uppercase">Curriculum Node Blueprint</h3>
                            </div>

                            <div className="space-y-10">
                                <div className="grid grid-cols-3 gap-8">
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Step Designation (Title)</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-white/40 border border-white/60 rounded-2xl px-8 py-5 focus:border-blue-500 outline-none transition text-slate-900 font-black text-lg placeholder:font-bold placeholder:text-slate-300 shadow-inner"
                                            placeholder="E.G. VARIABLE ALLOCATION..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Sequence #</label>
                                        <input
                                            type="number"
                                            disabled={!!editId}
                                            value={formData.step_number}
                                            onChange={(e) => setFormData({ ...formData, step_number: parseInt(e.target.value) })}
                                            className="w-full bg-white/40 border border-white/60 rounded-2xl px-8 py-5 focus:border-blue-500 outline-none transition text-slate-900 font-black text-lg shadow-inner disabled:opacity-50"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Mission Intelligence briefing</label>
                                    <textarea
                                        rows={8}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-white/40 border border-white/60 rounded-2xl px-8 py-5 focus:border-blue-500 outline-none transition resize-none font-bold text-slate-700 leading-relaxed placeholder:text-slate-300 shadow-inner"
                                        placeholder="Provide logical instructions, constraints, and objective criteria..."
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <div className="flex items-center justify-between mb-4 px-1">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Starter Code (Blueprint)</label>
                                            <Terminal size={14} className="text-slate-300" />
                                        </div>
                                        <textarea
                                            rows={12}
                                            value={formData.starter_code}
                                            onChange={(e) => setFormData({ ...formData, starter_code: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-3xl px-8 py-6 focus:border-blue-500 outline-none transition resize-none font-mono text-xs text-blue-400 shadow-2xl leading-relaxed"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-4 px-1">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Expected Master Script (Solution)</label>
                                            <Cpu size={14} className="text-slate-300" />
                                        </div>
                                        <textarea
                                            rows={12}
                                            value={formData.solution_code}
                                            onChange={(e) => setFormData({ ...formData, solution_code: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-3xl px-8 py-6 focus:border-blue-500 outline-none transition resize-none font-mono text-xs text-emerald-400 shadow-2xl leading-relaxed"
                                            placeholder="Enter the golden solution for system validation..."
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-morphism p-10 rounded-[40px] border border-white/60 shadow-premium group relative">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase italic">Validation Vectors</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Automated Intelligence Testing</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={addTestCase}
                                className="bg-white hover:bg-slate-900 hover:text-white text-slate-900 px-6 py-3 rounded-2xl flex items-center gap-3 font-black uppercase tracking-[0.2em] text-[10px] border border-slate-200 shadow-xl transition-all active:scale-95 group/add"
                            >
                                <Plus size={16} className="group-hover/add:rotate-90 transition-transform" /> Add Vector
                            </button>
                        </div>

                        <div className="space-y-6">
                            {formData.test_cases.map((tc, idx) => (
                                <div key={idx} className="group relative glass-morphism p-8 rounded-3xl border border-white/40 grid grid-cols-1 md:grid-cols-2 gap-8 hover:border-blue-400/40 transition-all duration-300">
                                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-xl border border-white/20">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Input Stream</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={tc.input_data}
                                                onChange={(e) => {
                                                    const newCases = [...formData.test_cases];
                                                    newCases[idx].input_data = e.target.value;
                                                    setFormData({ ...formData, test_cases: newCases });
                                                }}
                                                className="w-full bg-slate-900/5 border border-white/60 rounded-xl px-6 py-4 focus:border-blue-500 outline-none text-xs font-mono text-slate-700 shadow-inner"
                                                placeholder="[Input params or generic triggers]"
                                            />
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">Result Signature</label>
                                        <div className="flex gap-4">
                                            <input
                                                type="text"
                                                value={tc.expected_output}
                                                onChange={(e) => {
                                                    const newCases = [...formData.test_cases];
                                                    newCases[idx].expected_output = e.target.value;
                                                    setFormData({ ...formData, test_cases: newCases });
                                                }}
                                                className="flex-1 bg-slate-900/5 border border-white/60 rounded-xl px-6 py-4 focus:border-blue-500 outline-none text-xs font-mono text-slate-700 shadow-inner"
                                                placeholder="Expected return or stdout"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newCases = formData.test_cases.filter((_, i) => i !== idx);
                                                    setFormData({ ...formData, test_cases: newCases });
                                                }}
                                                className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-white rounded-xl transition-all border border-transparent hover:border-red-100 hover:shadow-xl group/del"
                                            >
                                                <Trash2 size={20} className="group-hover/del:scale-110 transition-transform" />
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
                    <div className="glass-morphism p-10 rounded-[40px] border border-white/60 shadow-premium sticky top-10">
                        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/40">
                            <Layers size={20} className="text-blue-600" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Module Context</h3>
                        </div>

                        <div className="space-y-10">
                            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 mb-8">
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Info size={10} /> Associated Course ID
                                </div>
                                <div className="text-2xl font-black text-slate-900 tabular-nums"># {courseId || "UNLINKED"}</div>
                            </div>

                            <div className="p-8 bg-blue-600/5 rounded-3xl border border-blue-100 flex flex-col gap-4">
                                <div className="flex items-center gap-3 text-blue-600">
                                    <Beaker size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-900">Architect Guidance</span>
                                </div>
                                <div className="text-[10px] text-blue-900 font-bold leading-relaxed uppercase tracking-widest opacity-70">
                                    Sequence integrity is critical. Ensure step numbers follow the logical mastery path to prevent user progression deadlocks.
                                </div>
                            </div>

                            <div className="pt-10 flex flex-col gap-4">
                                <Link href={courseId ? `/admin/problems/${courseId}` : '/admin/problems'} className="w-full">
                                    <button className="w-full bg-white text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] border border-slate-100 hover:border-slate-200 transition-all">
                                        Discard Draft
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Clock,
    Calendar,
    Save,
    ArrowLeft,
    AlertCircle,
    CheckCircle2,
    Trophy,
    Code,
    Plus,
    Trash2,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import AdvancedLoading from '@/components/AdvancedLoading';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function CreateTest() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [step, setStep] = useState(1); // 1: Test Details, 2: Add Problems, 3: Review

    const [testData, setTestData] = useState({
        title: "",
        start_time: "",
        end_time: ""
    });

    const [problems, setProblems] = useState([]);
    const [currentProblem, setCurrentProblem] = useState({
        title: "",
        description: "",
        difficulty: "Medium",
        category: "General",
        starter_codes: { javascript: "// Write your solution here", python: "# Write your solution here" },
        test_cases: [{ input_data: "", expected_output: "", is_hidden: false }]
    });

    const addTestCase = () => {
        setCurrentProblem({
            ...currentProblem,
            test_cases: [...currentProblem.test_cases, { input_data: "", expected_output: "", is_hidden: false }]
        });
    };

    const removeTestCase = (index) => {
        setCurrentProblem({
            ...currentProblem,
            test_cases: currentProblem.test_cases.filter((_, i) => i !== index)
        });
    };

    const updateTestCase = (index, field, value) => {
        const updated = [...currentProblem.test_cases];
        updated[index][field] = value;
        setCurrentProblem({ ...currentProblem, test_cases: updated });
    };

    const saveProblem = async () => {
        if (!currentProblem.title || !currentProblem.description) {
            alert("Please fill in problem title and description");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/admin/test-problems`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentProblem)
            });

            const data = await res.json();

            if (data.id) {
                setProblems([...problems, { ...currentProblem, id: data.id }]);
                // Reset current problem
                setCurrentProblem({
                    title: "",
                    description: "",
                    difficulty: "Medium",
                    category: "General",
                    starter_codes: { javascript: "// Write your solution here", python: "# Write your solution here" },
                    test_cases: [{ input_data: "", expected_output: "", is_hidden: false }]
                });
            }
        } catch (err) {
            console.error("Failed to create problem:", err);
            alert("Error creating problem");
        }
    };

    const removeProblem = (index) => {
        setProblems(problems.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (problems.length === 0) {
            alert("Please add at least one problem to the test");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/admin/tests`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...testData,
                    problem_ids: problems.map(p => p.id)
                })
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => router.push('/admin'), 2000);
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail || 'Failed to schedule test'}`);
            }
        } catch (err) {
            console.error(err);
            alert("Connection error. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    if (loading && step === 1) { // Optional: show if initializing
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
                <AdvancedLoading
                    title="Operation Scheduler"
                    items={[
                        "Initializing temporal engine...",
                        "Preparing tactical parameters...",
                        "Securing proctoring link..."
                    ]}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-10">
            <header className="max-w-6xl mx-auto mb-12 glass-morphism p-10 rounded-[40px] border border-white/60 shadow-premium group relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>

                <div className="flex items-center gap-6 relative z-10">
                    <Link href="/admin" className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:shadow-xl transition-all border border-slate-100 group/back">
                        <ArrowLeft size={24} className="group-hover/back:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Operation <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Scheduler</span></h1>
                        <div className="flex items-center gap-3">
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] opacity-70">Step {step} of 3: <span className="text-blue-600">{step === 1 ? "TEMPORAL LOGISTICS" : step === 2 ? "RESOURCE ALLOCATION" : "FINAL BRIEFING"}</span></p>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/5 p-2 rounded-2xl border border-white/60 relative z-10">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all duration-500 ${step >= s ? 'bg-slate-900 text-white shadow-lg scale-110' : 'text-slate-400 opacity-40'}`}>
                            {s}
                        </div>
                    ))}
                </div>
            </header>

            <main className="max-w-6xl mx-auto">
                <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                    {success && (
                        <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">Test Published!</h2>
                            <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-[10px]">Proctoring enabled. Redirecting...</p>
                        </div>
                    )}

                    {/* Step 1: Test Details */}
                    {step === 1 && (
                        <div className="space-y-12">
                            <div className="group">
                                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">
                                    Operation Designation
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={testData.title}
                                        onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                                        className="w-full bg-white/40 border border-white/60 rounded-2xl px-8 py-5 focus:border-blue-500 outline-none transition text-slate-900 font-black text-lg placeholder:font-bold placeholder:text-slate-300 shadow-inner pl-16"
                                        placeholder="e.g. ALPHA-STRIKE ASSESSMENT 2024"
                                    />
                                    <Trophy className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600 opacity-40" size={24} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="group">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">
                                        Commencement Window
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="datetime-local"
                                            required
                                            value={testData.start_time}
                                            onChange={(e) => setTestData({ ...testData, start_time: e.target.value })}
                                            className="w-full bg-white/40 border border-white/60 rounded-2xl px-8 py-5 focus:border-blue-500 outline-none transition text-slate-900 font-black shadow-inner pl-16"
                                        />
                                        <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600 opacity-40" size={24} />
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 ml-1">
                                        Termination Window
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="datetime-local"
                                            required
                                            value={testData.end_time}
                                            onChange={(e) => setTestData({ ...testData, end_time: e.target.value })}
                                            className="w-full bg-white/40 border border-white/60 rounded-2xl px-8 py-5 focus:border-blue-500 outline-none transition text-slate-900 font-black shadow-inner pl-16"
                                        />
                                        <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600 opacity-40" size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t border-slate-100">
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!testData.title || !testData.start_time || !testData.end_time}
                                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 transition-all shadow-2xl hover:bg-blue-600 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none group/next"
                                >
                                    Initialize Resource Allocation
                                    <ChevronRight size={18} className="group-hover/next:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Add Problems */}
                    {step === 2 && (
                        <div className="space-y-10">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                                            <Code size={18} />
                                        </div>
                                        Mission Inventory ({problems.length})
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Populating the tactical test matrix</p>
                                </div>
                            </div>

                            {/* Saved Problems */}
                            {problems.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {problems.map((prob, idx) => (
                                        <div key={idx} className="bg-slate-900/5 border border-white/60 rounded-2xl p-6 flex justify-between items-center group/item hover:bg-white transition-all duration-300">
                                            <div className="flex items-center gap-5">
                                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg">
                                                    #{idx + 1}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 tracking-tight text-sm uppercase">{prob.title}</div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{prob.difficulty}</span>
                                                        <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{prob.test_cases.length} SCENARIOS</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeProblem(idx)}
                                                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Current Problem Form */}
                            <div className="bg-slate-900 rounded-[32px] p-10 space-y-8 shadow-2xl relative overflow-hidden group/form">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover/form:bg-blue-500/10 transition-colors"></div>

                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400">
                                        <Plus size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-white tracking-tight">Configure New Mission</h4>
                                        <p className="text-[10px] text-blue-400/60 font-black uppercase tracking-[0.2em]">Live protocol generation</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Designation</label>
                                        <input
                                            type="text"
                                            placeholder="Mission Name..."
                                            value={currentProblem.title}
                                            onChange={(e) => setCurrentProblem({ ...currentProblem, title: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-black text-white placeholder:text-slate-600 focus:border-blue-500 outline-none transition"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Complexity</label>
                                        <select
                                            value={currentProblem.difficulty}
                                            onChange={(e) => setCurrentProblem({ ...currentProblem, difficulty: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-black text-white focus:border-blue-500 outline-none cursor-pointer appearance-none"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='4' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '1rem' }}
                                        >
                                            <option className="bg-slate-900">Easy</option>
                                            <option className="bg-slate-900">Medium</option>
                                            <option className="bg-slate-900">Hard</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2 relative z-10">
                                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Briefing Source</label>
                                    <textarea
                                        placeholder="Define the mission objectives and constraints..."
                                        value={currentProblem.description}
                                        onChange={(e) => setCurrentProblem({ ...currentProblem, description: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-slate-300 placeholder:text-slate-600 focus:border-blue-500 outline-none min-h-32 resize-none"
                                    />
                                </div>

                                {/* Test Cases */}
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-6">
                                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Validation Scenarios</label>
                                        <button
                                            onClick={addTestCase}
                                            className="text-[9px] bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-white/10 transition-all"
                                        >
                                            <Plus size={14} /> Add Scenario
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {currentProblem.test_cases.map((tc, idx) => (
                                            <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-5 relative group/tc">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">SCENARIO #{idx + 1}</span>
                                                    {currentProblem.test_cases.length > 1 && (
                                                        <button
                                                            onClick={() => removeTestCase(idx)}
                                                            className="text-slate-600 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <input
                                                            type="text"
                                                            placeholder="Input Stream"
                                                            value={tc.input_data}
                                                            onChange={(e) => updateTestCase(idx, 'input_data', e.target.value)}
                                                            className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-xs font-mono text-blue-300 placeholder:text-slate-700 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="text"
                                                            placeholder="Expected Payload"
                                                            value={tc.expected_output}
                                                            onChange={(e) => updateTestCase(idx, 'expected_output', e.target.value)}
                                                            className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-xs font-mono text-emerald-400 placeholder:text-slate-700 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <label className="flex items-center gap-3 mt-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={tc.is_hidden}
                                                        onChange={(e) => updateTestCase(idx, 'is_hidden', e.target.checked)}
                                                        className="w-4 h-4 rounded-lg bg-white/5 border-white/10 checked:bg-blue-600 transition-all"
                                                    />
                                                    Classified Scenario
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={saveProblem}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-blue-500/20 transition-all active:scale-95 relative z-10"
                                >
                                    Commit Mission to Inventory
                                </button>
                            </div>

                            <div className="flex justify-between pt-6 border-t border-slate-100">
                                <button
                                    onClick={() => setStep(1)}
                                    className="bg-slate-50 border border-slate-200 text-slate-400 px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 transition-all hover:bg-white hover:text-slate-900"
                                >
                                    <ChevronLeft size={18} />
                                    Prior Phase
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={problems.length === 0}
                                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-4 transition-all shadow-2xl hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none group/next"
                                >
                                    Final Tactical Briefing
                                    <ChevronRight size={18} className="group-hover/next:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {step === 3 && (
                        <div className="space-y-12 animate-in fade-in duration-500">
                            <div className="bg-slate-900/5 border border-white/60 rounded-[32px] p-10 relative overflow-hidden group/summary">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover/summary:bg-blue-500/10 transition-colors"></div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-3">
                                    <Shield size={16} className="text-blue-600" /> Operational Overview
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 relative z-10">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Designation</p>
                                        <p className="text-lg font-black text-slate-900 tracking-tight">{testData.title}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Resource Count</p>
                                        <p className="text-lg font-black text-slate-900 tracking-tight">{problems.length} Mission Protocols</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Start Window</p>
                                        <p className="text-sm font-black text-slate-700">{new Date(testData.start_time).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">End Window</p>
                                        <p className="text-sm font-black text-slate-700">{new Date(testData.end_time).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-200 rounded-[32px] p-8 flex gap-6 items-start">
                                <AlertCircle className="text-amber-600 shrink-0" size={24} />
                                <div className="text-[10px] text-amber-900 font-bold leading-relaxed uppercase tracking-[0.1em]">
                                    <strong className="block mb-2 text-amber-600">Proctoring Protocol Alpha Active:</strong>
                                    High-fidelity proctoring will be enforced. Biometric monitoring, environmental analysis, and systemic locks will be engaged for all personnel during this operation. Deployment is permanent once initialized.
                                </div>
                            </div>

                            <div className="flex justify-between pt-6 border-t border-slate-100">
                                <button
                                    onClick={() => setStep(2)}
                                    className="bg-slate-50 border border-slate-200 text-slate-400 px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 transition-all hover:bg-white hover:text-slate-900"
                                >
                                    <ChevronLeft size={18} />
                                    Adjust Strategy
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 transition-all shadow-2xl hover:bg-blue-600 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none group/save"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <Save size={18} className="group-hover/save:scale-110 transition-transform" />
                                    )}
                                    {loading ? "INITIALIZING DEPLOYMENT..." : "COMMIT & DEPLOY OPERATION"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

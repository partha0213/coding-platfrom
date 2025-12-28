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

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-10">
            <header className="max-w-6xl mx-auto mb-12 flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-6">
                    <Link href="/admin" className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-blue-600 border border-slate-100">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Proctored Test</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Step {step} of 3: {step === 1 ? "Test Details" : step === 2 ? "Add Problems" : "Review & Publish"}</p>
                    </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 hidden md:block">
                    <Clock className="text-blue-500" size={24} />
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
                        <div className="space-y-8">
                            <div className="group">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5 ml-1">
                                    Test Title
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={testData.title}
                                        onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:bg-white focus:border-blue-500 outline-none transition text-slate-800 font-bold pl-14"
                                        placeholder="e.g. Mid-Term Assessment 2024"
                                    />
                                    <Trophy className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="group">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5 ml-1">
                                        Start Time
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="datetime-local"
                                            required
                                            value={testData.start_time}
                                            onChange={(e) => setTestData({ ...testData, start_time: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:bg-white focus:border-blue-500 outline-none transition text-slate-800 font-bold pl-14"
                                        />
                                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5 ml-1">
                                        End Time
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="datetime-local"
                                            required
                                            value={testData.end_time}
                                            onChange={(e) => setTestData({ ...testData, end_time: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:bg-white focus:border-blue-500 outline-none transition text-slate-800 font-bold pl-14"
                                        />
                                        <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!testData.title || !testData.start_time || !testData.end_time}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 transition-all disabled:bg-slate-200 disabled:text-slate-400"
                                >
                                    Next: Add Problems
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Add Problems */}
                    {step === 2 && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-black">Problems for this Test ({problems.length})</h3>
                            </div>

                            {/* Saved Problems */}
                            {problems.length > 0 && (
                                <div className="space-y-3">
                                    {problems.map((prob, idx) => (
                                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-slate-800">{prob.title}</div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {prob.difficulty} • {prob.category} • {prob.test_cases.length} test cases
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeProblem(idx)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Current Problem Form */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-8 space-y-6">
                                <h4 className="text-lg font-black text-blue-900 flex items-center gap-2">
                                    <Code size={20} />
                                    Add New Problem
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <input
                                        type="text"
                                        placeholder="Problem Title"
                                        value={currentProblem.title}
                                        onChange={(e) => setCurrentProblem({ ...currentProblem, title: e.target.value })}
                                        className="bg-white border border-blue-200 rounded-xl px-4 py-3 font-bold text-slate-800 placeholder:text-slate-400 focus:border-blue-500 outline-none"
                                    />

                                    <select
                                        value={currentProblem.difficulty}
                                        onChange={(e) => setCurrentProblem({ ...currentProblem, difficulty: e.target.value })}
                                        className="bg-white border border-blue-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:border-blue-500 outline-none"
                                    >
                                        <option>Easy</option>
                                        <option>Medium</option>
                                        <option>Hard</option>
                                    </select>
                                </div>

                                <textarea
                                    placeholder="Problem Description (supports markdown)"
                                    value={currentProblem.description}
                                    onChange={(e) => setCurrentProblem({ ...currentProblem, description: e.target.value })}
                                    className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 outline-none min-h-32"
                                />

                                {/* Test Cases */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-xs font-black uppercase text-blue-900">Test Cases</label>
                                        <button
                                            onClick={addTestCase}
                                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-bold flex items-center gap-1"
                                        >
                                            <Plus size={14} /> Add Case
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {currentProblem.test_cases.map((tc, idx) => (
                                            <div key={idx} className="bg-white border border-blue-200 rounded-xl p-4">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-xs font-black uppercase text-slate-400">Test Case {idx + 1}</span>
                                                    {currentProblem.test_cases.length > 1 && (
                                                        <button
                                                            onClick={() => removeTestCase(idx)}
                                                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Input"
                                                        value={tc.input_data}
                                                        onChange={(e) => updateTestCase(idx, 'input_data', e.target.value)}
                                                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Expected Output"
                                                        value={tc.expected_output}
                                                        onChange={(e) => updateTestCase(idx, 'expected_output', e.target.value)}
                                                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                                                    />
                                                </div>
                                                <label className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                                                    <input
                                                        type="checkbox"
                                                        checked={tc.is_hidden}
                                                        onChange={(e) => updateTestCase(idx, 'is_hidden', e.target.checked)}
                                                        className="rounded"
                                                    />
                                                    Hidden test case
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={saveProblem}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-all"
                                >
                                    Save Problem to Test
                                </button>
                            </div>

                            <div className="flex justify-between">
                                <button
                                    onClick={() => setStep(1)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 transition-all"
                                >
                                    <ChevronLeft size={20} />
                                    Back
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={problems.length === 0}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 transition-all disabled:bg-slate-200 disabled:text-slate-400"
                                >
                                    Review & Publish
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {step === 3 && (
                        <div className="space-y-8">
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                <h3 className="text-xs font-black uppercase text-slate-400 mb-4">Test Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div><strong>Title:</strong> {testData.title}</div>
                                    <div><strong>Start:</strong> {new Date(testData.start_time).toLocaleString()}</div>
                                    <div><strong>End:</strong> {new Date(testData.end_time).toLocaleString()}</div>
                                    <div><strong>Problems:</strong> {problems.length}</div>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex gap-4 items-start">
                                <AlertCircle className="text-red-600 shrink-0" size={20} />
                                <div className="text-xs text-red-800 font-medium leading-relaxed">
                                    <strong>Proctoring Active:</strong> Camera monitoring, object detection, fullscreen lock, and violation logging will be enabled for this test. Students must accept T&C before starting.
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <button
                                    onClick={() => setStep(2)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 transition-all"
                                >
                                    <ChevronLeft size={20} />
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 transition-all disabled:bg-slate-400"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <Save size={20} />
                                    )}
                                    {loading ? "Publishing..." : "Publish Test"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

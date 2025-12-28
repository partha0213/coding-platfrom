"use client";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(username, password);
        } catch (err) {
            setError("Invalid username or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 selection:bg-blue-100 selection:text-blue-900">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-10 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 opacity-50"></div>

                <div className="relative">
                    <div className="flex justify-center mb-8">
                        <img src="/logo.png" alt="CodeVault" className="w-32 h-32 object-contain" />
                    </div>

                    <h2 className="text-3xl font-extrabold text-center text-slate-900 mb-2 tracking-tight">CodeVault</h2>
                    <p className="text-center text-slate-500 font-medium mb-10">Sign in to resume your progress.</p>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm mb-6 text-center font-bold animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Identity Tag</label>
                            <input
                                type="text"
                                required
                                placeholder="Username"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:border-blue-500 outline-none transition-all placeholder:font-normal placeholder:text-slate-400"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Key</label>
                            <div className="relative group/pass">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:border-blue-500 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 pr-12"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none mt-2 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : "Initialize Login"}
                        </button>
                    </form>

                    <div className="text-center mt-10 text-sm font-medium text-slate-500 border-t border-slate-100 pt-8">
                        No active credentials? <Link href="/signup" className="text-blue-600 font-bold hover:underline underline-offset-4">Register Account</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

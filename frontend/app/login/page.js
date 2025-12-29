"use client";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import AuthBackground from "@/components/AuthBackground";
import Logo from "@/components/Logo";

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
        <div className="min-h-screen relative flex items-center justify-center p-6 selection:bg-blue-100 selection:text-blue-900">
            <AuthBackground />

            <div className="w-full max-w-sm bg-white/60 backdrop-blur-2xl border-2 border-white/80 rounded-[40px] p-10 shadow-2xl shadow-blue-900/10 relative z-10 overflow-hidden group">
                {/* Decorative spotlight effect */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700"></div>

                <div className="relative">
                    <div className="flex justify-center mb-8">
                        <Logo className="w-20 h-20" />
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">Code<span className="text-blue-600">Vault</span></h2>
                        <div className="flex items-center justify-center gap-2">
                            <span className="h-px w-6 bg-slate-200"></span>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Security Terminal v4.0</p>
                            <span className="h-px w-6 bg-slate-200"></span>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-5 rounded-2xl text-xs mb-8 text-center font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="space-y-2">
                            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 ml-2">Identity Tag</label>
                            <input
                                type="text"
                                required
                                placeholder="USERNAME"
                                className="w-full bg-white/50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:font-black placeholder:text-slate-300 uppercase tracking-widest text-[10px]"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 ml-2">Access Key</label>
                            <div className="relative group/pass">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-white/50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 font-bold focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:font-normal placeholder:text-slate-300 pr-14 text-sm"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-blue-600 text-white font-black uppercase tracking-[0.3em] text-[10px] py-5 rounded-2xl transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none mt-2 flex items-center justify-center gap-4 group/btn"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    INITIALIZE LOGIN
                                    <ShieldCheck size={16} className="group-hover/btn:rotate-12 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-10 pt-6 border-t border-slate-200/50">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 whitespace-pre">N O  A C T I V E  C R E D E N T I A L S ?</p>
                        <Link href="/signup" className="text-blue-600 font-black uppercase tracking-widest text-[10px] hover:text-slate-900 transition-colors py-2 px-4 bg-blue-50 rounded-xl">Register Account</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

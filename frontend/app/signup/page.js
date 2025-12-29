"use client";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import { UserPlus, Eye, EyeOff, ShieldCheck, Fingerprint } from "lucide-react";
import { useRouter } from "next/navigation";
import AuthBackground from "@/components/AuthBackground";
import Logo from "@/components/Logo";

export default function SignupPage() {
    const { signup } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
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
            await signup(email, username, password);
            router.push("/login?registered=true");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-6 selection:bg-blue-100 selection:text-blue-900">
            <AuthBackground />

            <div className="w-full max-w-sm bg-white/60 backdrop-blur-2xl border-2 border-white/80 rounded-[40px] p-10 shadow-2xl shadow-blue-900/10 relative z-10 overflow-hidden group">
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 blur-[60px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700"></div>

                <div className="relative">
                    <div className="flex justify-center mb-8">
                        <Logo className="w-20 h-20" />
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">Initialize <span className="text-blue-600">Identity</span></h2>
                        <div className="flex items-center justify-center gap-2">
                            <span className="h-px w-6 bg-slate-200"></span>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Personnel Registry v2.4</p>
                            <span className="h-px w-6 bg-slate-200"></span>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-5 rounded-2xl text-xs mb-8 text-center font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="space-y-1.5">
                            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 ml-2">Communication Link (Email)</label>
                            <input
                                type="email"
                                required
                                placeholder="EMAIL@PROTOCOL.COM"
                                className="w-full bg-white/50 border-2 border-slate-100 rounded-2xl px-6 py-3.5 text-slate-900 font-bold focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:font-black placeholder:text-slate-300 uppercase tracking-widest text-[10px]"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 ml-2">Callsign (Username)</label>
                            <input
                                type="text"
                                required
                                placeholder="UNIQUE_HANDLE"
                                className="w-full bg-white/50 border-2 border-slate-100 rounded-2xl px-6 py-3.5 text-slate-900 font-bold focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:font-black placeholder:text-slate-300 uppercase tracking-widest text-[10px]"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 ml-2">Secure Key</label>
                            <div className="relative group/pass">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-white/50 border-2 border-slate-100 rounded-2xl px-6 py-3.5 text-slate-900 font-bold focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:font-normal placeholder:text-slate-300 pr-14 text-sm"
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
                                    REGISTER PROTOCOL
                                    <Fingerprint size={16} className="group-hover/btn:scale-110 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-10 pt-6 border-t border-slate-200/50">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 whitespace-pre">E X I S T I N G  I D E N T I T Y ?</p>
                        <Link href="/login" className="text-blue-600 font-black uppercase tracking-widest text-[10px] hover:text-slate-900 transition-colors py-2 px-4 bg-blue-50 rounded-xl">Initialize Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

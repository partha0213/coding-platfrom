"use client";
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    Code,
    BarChart3,
    ShieldCheck,
    PlusCircle,
    LogOut,
    BrainCircuit,
    User,
    Clock,
    ChevronDown,
    Trophy
} from 'lucide-react';
import Logo from '@/components/Logo';

export default function Sidebar() {
    const { user, logout, loading } = useAuth();
    const pathname = usePathname();

    const [showLogoutPopup, setShowLogoutPopup] = useState(false);
    const popupRef = useRef(null);

    // Close popup on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setShowLogoutPopup(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Hide sidebar on auth pages
    const isAuthPage = pathname === '/login' || pathname === '/signup';
    if (isAuthPage) return null;

    // Show skeleton if loading
    if (loading) {
        return (
            <aside className="w-64 bg-slate-50 border-r border-slate-200 h-full flex flex-col pt-8 animate-pulse shrink-0">
                <div className="px-6 mb-10 h-8 bg-slate-200/50 rounded-lg w-2/3"></div>
                <div className="flex-1 px-4 space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-slate-200/30 rounded-xl"></div>)}
                </div>
            </aside>
        );
    }

    // If no user and not loading (guest/unauthenticated), show guest links
    if (!user) {
        return (
            <aside className="w-64 bg-white border-r border-slate-200 h-full flex flex-col pt-8 shadow-xl shadow-slate-200/50 shrink-0 z-40">
                <div className="px-6 mb-10 flex items-center gap-3">
                    <Logo className="w-12 h-12" />
                    <span className="text-xl font-black text-blue-600 tracking-tight">CodeVault</span>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <Link href="/login" className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-blue-50 text-blue-600 font-bold text-sm transition-all hover:bg-blue-100">
                        <User size={18} /> Sign In
                    </Link>
                    <Link href="/signup" className="flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-500 hover:bg-slate-50 font-bold text-sm transition-all">
                        <PlusCircle size={18} /> Register
                    </Link>
                </nav>

                {/* System Info Bottom */}
                <div className="p-6 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-[9px] uppercase tracking-widest mb-3">
                        System Status
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        Operational
                    </div>
                </div>
            </aside>
        );
    }

    const studentLinks = [
        { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Problems', href: '/learning', icon: <Code size={20} /> },
        { name: 'Tests', href: '/tests', icon: <Trophy size={20} /> },
        { name: 'My Stats', href: '/stats', icon: <BarChart3 size={20} /> },
    ];

    const adminLinks = [
        { name: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={20} /> },
        { name: 'Management', href: '/admin/problems', icon: <PlusCircle size={20} /> },
        { name: 'Create Test', href: '/admin/create-test', icon: <Clock size={20} /> },
    ];

    return (
        <aside className="w-64 glass-morphism h-full flex flex-col pt-8 shrink-0 z-40 border-r border-white/40 ring-1 ring-black/[0.02]">
            <div className="px-6 mb-10 flex items-center gap-3 group px-8">
                <div className="w-14 h-14 bg-white/40 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-premium group-hover:scale-110 transition-all duration-500 border border-white/60 overflow-hidden relative">
                    <Logo className="w-10 h-10 relative z-10 group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-blue-800 to-blue-600 tracking-tight leading-none">
                        CodeVault
                    </span>
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mt-1 opacity-70">Security Core</span>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
                {/* Main Menu (Students Only) */}
                {user.role === 'STUDENT' && (
                    <div className="animate-in slide-in-from-left-2 duration-300">
                        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4 px-2">Main Menu</div>
                        <div className="space-y-1">
                            {studentLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl group relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                                        ${pathname === link.href
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/20 translate-x-1'
                                            : 'text-slate-500 hover:text-blue-600 hover:bg-white/60 hover:translate-x-1 border border-transparent'}
                                    `}
                                >
                                    <span className={`${pathname === link.href ? 'text-white' : 'text-slate-400 group-hover:text-blue-600 transition-colors'}`}>
                                        {link.icon}
                                    </span>
                                    <span className="font-semibold text-sm">{link.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Admin Management (Admins Only) */}
                {user.role === 'ADMIN' && (
                    <div className="animate-in slide-in-from-left-2 duration-300">
                        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4 px-2 flex items-center gap-2">
                            Admin Control
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        </div>
                        <div className="space-y-1">
                            {adminLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl group relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                                        ${pathname === link.href
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/20 translate-x-1'
                                            : 'text-slate-500 hover:text-blue-600 hover:bg-white/60 hover:translate-x-1 border border-transparent'}
                                    `}
                                >
                                    <span className={`${pathname === link.href ? 'text-white' : 'text-slate-400 group-hover:text-blue-600 transition-colors'}`}>
                                        {link.icon}
                                    </span>
                                    <span className="font-semibold text-sm">{link.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </nav>

            <div
                className="p-6 border-t border-white/20 bg-white/30 relative"
                ref={popupRef}
                onMouseEnter={() => setShowLogoutPopup(true)}
                onMouseLeave={() => setShowLogoutPopup(false)}
            >
                {/* Logout Popup */}
                {showLogoutPopup && (
                    <div className="absolute bottom-full left-0 right-0 pb-4 z-50 px-4">
                        <div className="glass-morphism rounded-[24px] border border-white/40 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-6 py-4 rounded-[20px] text-slate-600 hover:text-red-600 hover:bg-red-50/50 transition-all duration-300"
                            >
                                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                    <LogOut size={16} />
                                </div>
                                <span className="font-bold text-sm">Terminate Session</span>
                            </button>
                        </div>
                    </div>
                )}

                <button
                    className={`w-full flex items-center gap-3 p-3 rounded-[24px] bg-white/60 border transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group
                        ${showLogoutPopup ? 'border-blue-400 ring-8 ring-blue-500/5 shadow-xl -translate-y-1' : 'border-white/40 shadow-sm'}
                    `}
                >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                        {user.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 text-left overflow-hidden">
                        <div className="text-xs font-black text-slate-900 truncate">{user.username}</div>
                        <div className="text-[9px] text-blue-600 font-black uppercase tracking-widest mt-0.5 opacity-60">
                            Secure {user.role}
                        </div>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-500 ${showLogoutPopup ? 'rotate-180' : ''}`} />
                </button>

                <div className="mt-6 flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 group cursor-help">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse"></div>
                        <span className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest">Encrypted</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter tabular-nums">v2.4.9_PRM</span>
                </div>
            </div>
        </aside>
    );
}

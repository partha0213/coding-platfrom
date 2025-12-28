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
                <div className="px-6 mb-10 flex items-center gap-2">
                    <img src="/logo.png" alt="CodeVault" className="w-20 h-20 object-contain" />
                    <span className="text-xl font-bold text-blue-600 tracking-tight">CodeVault</span>
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
        { name: 'Problems', href: '/problems', icon: <Code size={20} /> },
        { name: 'Tests', href: '/tests', icon: <Trophy size={20} /> },
        { name: 'My Stats', href: '/stats', icon: <BarChart3 size={20} /> },
    ];

    const adminLinks = [
        { name: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={20} /> },
        { name: 'Management', href: '/admin/problems', icon: <PlusCircle size={20} /> },
        { name: 'Create Test', href: '/admin/create-test', icon: <Clock size={20} /> },
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-200 h-full flex flex-col pt-8 shadow-xl shadow-slate-200/50 shrink-0 z-40">
            <div className="px-6 mb-10 flex items-center gap-2">
                <img src="/logo.png" alt="CodeVault" className="w-20 h-20 object-contain" />
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
                    CodeVault
                </span>
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
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                                        ${pathname === link.href
                                            ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm'
                                            : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 border border-transparent'}
                                    `}
                                >
                                    <span className={`${pathname === link.href ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600 transition-colors'}`}>
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
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                                        ${pathname === link.href
                                            ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm'
                                            : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 border border-transparent'}
                                    `}
                                >
                                    <span className={`${pathname === link.href ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600 transition-colors'}`}>
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
                className="p-4 border-t border-slate-100 bg-slate-50/50 relative"
                ref={popupRef}
                onMouseEnter={() => setShowLogoutPopup(true)}
                onMouseLeave={() => setShowLogoutPopup(false)}
            >
                {/* Logout Popup */}
                {showLogoutPopup && (
                    <div className="absolute bottom-full left-0 right-0 pb-2 z-50">
                        <div className="mx-4 p-2 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                            >
                                <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-sm">Sign Out</span>
                            </button>
                        </div>
                    </div>
                )}

                <button
                    className={`w-full flex items-center gap-3 p-3 rounded-xl bg-white border transition-all duration-200 hover:shadow-md hover:border-blue-200 group
                        ${showLogoutPopup ? 'border-blue-300 ring-4 ring-blue-50 shadow-md' : 'border-slate-200'}
                    `}
                >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 group-hover:scale-105 transition-transform">
                        {user.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 text-left overflow-hidden">
                        <div className="text-xs font-bold text-slate-800 truncate">{user.username}</div>
                        <div className="text-[10px] text-blue-500 font-bold uppercase tracking-tight">{user.role}</div>
                    </div>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${showLogoutPopup ? 'rotate-180' : ''}`} />
                </button>

                <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest px-2.5 py-1 bg-emerald-50 rounded-lg">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></div>
                            Stable
                        </div>
                        <div className="text-[9px] font-bold text-slate-300 uppercase tracking-tight">v2.4.0-Live</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}

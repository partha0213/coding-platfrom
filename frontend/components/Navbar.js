"use client";
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, LogOut, Code, BarChart3, ShieldCheck } from 'lucide-react';

export default function Navbar() {
    const { user, loading } = useAuth();
    const pathname = usePathname();

    // Hide navbar on auth pages
    const isAuthPage = pathname === '/login' || pathname === '/signup';
    if (isAuthPage) return null;

    if (pathname.startsWith('/problem/')) return null;

    return (
        <header className="h-16 border-b border-slate-200 bg-white/70 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-40">
            <div className="flex items-center gap-4 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                System Status: <span className="text-emerald-500 flex items-center gap-1 ml-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Operational</span>
            </div>

            <div className="flex items-center gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Stable Connection
                </div>
            </div>
        </header>
    );
}

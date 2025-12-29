"use client";
import React from 'react';
import Logo from './Logo';

export default function AdvancedLoading({ title = "Loading System", items = ["Decrypting database records...", "Synchronizing user session...", "Finalizing secure link..."] }) {
    return (
        <div className="w-full h-[60vh] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background atmosphere */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full"></div>

            <div className="max-w-md w-full relative z-10 text-center">
                <div className="mb-10 animate-in fade-in zoom-in duration-1000">
                    <div className="w-16 h-16 bg-white/40 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/60 shadow-xl relative group overflow-hidden p-2">
                        <Logo className="w-full h-full" animate={true} />
                        <div className="absolute inset-0 border-2 border-blue-600/10 border-t-blue-600 rounded-2xl animate-spin pointer-events-none"></div>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">{title}</h2>
                    <div className="flex items-center justify-center gap-2 text-blue-500 font-bold uppercase tracking-widest text-[9px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        Initializing Interface
                    </div>
                </div>

                <div className="space-y-3 max-w-xs mx-auto">
                    {items.map((item, idx) => (
                        <div key={idx}
                            className="bg-white/40 backdrop-blur-md px-4 py-3 rounded-xl border border-white/60 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700 text-left"
                            style={{ animationDelay: `${(idx + 1) * 150}ms` }}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{item}</span>
                                <div className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="mt-10 text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] italic opacity-50">
                    CodeVault Encryption Active
                </p>
            </div>
        </div>
    );
}

"use client";
import React from 'react';

/**
 * CodeVault Zenith Core Logo
 * A hyper-fidelity SVG masterpiece featuring:
 * - Multi-stage mechanical rotations
 * - Holographic shimmer using advanced SVG filters
 * - 3D Beveled glass effect
 * - Micro-circuitry orbital trails
 */
export default function Logo({ className = "w-12 h-12", animate = true }) {
    return (
        <div className={`relative flex items-center justify-center ${className} perspective-1000`}>
            {/* The Main SVG Container */}
            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]"
            >
                {/* Advanced Filters for Glass and Light */}
                <defs>
                    <filter id="glass-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                        <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
                        <feFlood floodColor="#3B82F6" floodOpacity="0.8" result="color" />
                        <feComposite in="color" in2="offsetBlur" operator="in" result="shadow" />
                        <feMerge>
                            <feMergeNode in="shadow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <linearGradient id="zenith-gradient" x1="0" y1="0" x2="100" y2="100">
                        <stop offset="0%" stopColor="#60A5FA" />
                        <stop offset="50%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#1E4ED8" />
                    </linearGradient>

                    <linearGradient id="hologram-shift" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="transparent" />
                        <stop offset="100%" stopColor="white" stopOpacity="0.2" />
                    </linearGradient>

                    <radialGradient id="core-ignition" cx="50" cy="50" r="30">
                        <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Orbital Circuit Ring 1 - Fast */}
                <circle
                    cx="50"
                    cy="50"
                    r="47"
                    stroke="url(#zenith-gradient)"
                    strokeWidth="0.5"
                    strokeDasharray="1 15"
                    className={animate ? "animate-[spin_8s_linear_infinite]" : ""}
                />

                {/* Orbital Circuit Ring 2 - Slow Counter */}
                <circle
                    cx="50"
                    cy="50"
                    r="43"
                    stroke="#3B82F6"
                    strokeWidth="0.3"
                    strokeDasharray="40 10"
                    className={`opacity-20 ${animate ? "animate-[spin_25s_linear_infinite_reverse]" : ""}`}
                />

                {/* Beveled Outer Shield Frame */}
                <path
                    d="M50 4L88 21V50C88 77 66 92 50 96C34 92 12 77 12 50V21L50 4Z"
                    fill="#0F172A"
                    stroke="url(#zenith-gradient)"
                    strokeWidth="1.5"
                    filter="url(#glass-glow)"
                />

                {/* Internal Prism Geometry */}
                <path
                    d="M50 12L80 26V50C80 68 64 82 50 87C36 82 20 68 20 50V26L50 12Z"
                    fill="url(#core-ignition)"
                    className="opacity-50"
                />

                {/* LOGO MARK: THE NEON V-CORE */}
                {/* Represents 'Code' and 'Security' in a single futuristic glyph */}

                {/* Left Coding Prism */}
                <path
                    d="M34 44L28 50L34 56"
                    stroke="white"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_10px_rgba(255,255,255,1)]"
                />

                {/* Right Coding Prism */}
                <path
                    d="M66 44L72 50L66 56"
                    stroke="white"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_10px_rgba(255,255,255,1)]"
                />

                {/* The Central Vault Axis */}
                <path
                    d="M50 30V70"
                    stroke="url(#zenith-gradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className={animate ? "animate-pulse" : ""}
                />

                {/* The 'Bit' Connector */}
                <circle
                    cx="50"
                    cy="50"
                    r="4"
                    fill="white"
                    className="drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                />

                {/* Holographic Reflection Surface */}
                <path
                    d="M50 4L88 21V50C88 77 66 92 50 96C34 92 12 77 12 50V21L50 4Z"
                    fill="url(#hologram-shift)"
                    className={`pointer-events-none ${animate ? "animate-pulse" : ""}`}
                />
            </svg>

            {/* Hyper-Glow Atmospheric Layer */}
            {animate && (
                <>
                    <div className="absolute inset-0 bg-blue-500/30 blur-[40px] rounded-full -z-10 animate-pulse"></div>
                    <div className="absolute inset-0 border border-blue-400/20 rounded-full scale-[1.2] -z-10 animate-ping opacity-20 duration-[3s]"></div>
                </>
            )}

            {/* Flare Trace */}
            {animate && (
                <div
                    className="absolute w-[200%] h-[1px] bg-white/40 blur-[4px] -rotate-45 -z-10 opacity-0 animate-[pulse_5s_infinite]"
                    style={{ left: '-50%', top: '50%' }}
                ></div>
            )}
        </div>
    );
}

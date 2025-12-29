"use client";
import React from 'react';

const codeSnippets = [
    "function", "async", "await", "import", "const", "class", "return", "export",
    "{}", "=>", "[]", "||", "&&", "===", "++", "??",
    "git commit", "api.v1", "npm start", "sudo", "chmod", "docker", "k8s"
];

export default function AuthBackground() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-transparent">
            {/* Base Mesh Gradient Layer */}
            <div className="absolute inset-0 mesh-gradient-bg opacity-30"></div>

            {/* Cyber Grid System */}
            <div className="absolute inset-0 cyber-grid opacity-50 animate-grid-scroll"></div>

            {/* Atmospheric Pulsations */}
            <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full animate-pulse-glow"></div>
            <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-indigo-500/15 blur-[150px] rounded-full animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

            {/* Floating Code Rain Fragments */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 15 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute text-[12px] font-mono font-black text-blue-600/40 whitespace-nowrap animate-code-float"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 15}s`,
                            animationDuration: `${10 + Math.random() * 20}s`
                        }}
                    >
                        {codeSnippets[i % codeSnippets.length]}
                    </div>
                ))}
            </div>

            {/* Matrix Scanline Profile */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-15">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scanline"></div>
            </div>

            {/* Subtle Noise Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>
        </div>
    );
}

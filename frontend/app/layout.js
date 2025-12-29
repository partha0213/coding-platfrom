"use client";
import "./globals.css";
import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";
import { AuthProvider } from "../context/AuthContext";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
    const pathname = usePathname();
    const isTakeRoute = pathname?.includes('/take') || pathname?.includes('/consent');
    const isResultsRoute = pathname?.includes('/results');

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <title>CodeVault | Premium Assessment Platform</title>
                <link rel="icon" href="/favicon.ico" />
            </head>
            <body className={inter.className} suppressHydrationWarning>
                <AuthProvider>
                    {isTakeRoute ? (
                        <main className={pathname?.includes('/take')
                            ? "w-screen h-screen overflow-hidden bg-white"
                            : "w-screen min-h-screen overflow-y-auto bg-white"
                        }>
                            {children}
                        </main>
                    ) : (
                        <div className="flex h-screen bg-transparent overflow-hidden relative">
                            {/* Texture Overlay */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0"></div>

                            <Sidebar />

                            <main className={`flex-1 relative custom-scrollbar z-10 ${isResultsRoute ? 'overflow-auto flex' : 'overflow-y-auto'
                                }`}>
                                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-[-1]"></div>
                                {children}
                            </main>
                        </div>
                    )}
                </AuthProvider>
            </body>
        </html>
    );
}

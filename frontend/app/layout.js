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
                        <div className="flex h-screen bg-white overflow-hidden">
                            <Sidebar />
                            <main className={`flex-1 relative custom-scrollbar bg-white ${isResultsRoute ? 'overflow-auto flex' : 'overflow-y-auto'
                                }`}>
                                {children}
                            </main>
                        </div>
                    )}
                </AuthProvider>
            </body>
        </html>
    );
}

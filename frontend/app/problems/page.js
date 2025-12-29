"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdvancedLoading from "@/components/AdvancedLoading";

export default function ProblemsRedirect() {
    const router = useRouter();
    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace("/learning");
        }, 1500); // Give time for the scanning effect
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-10">
            <AdvancedLoading
                title="Redirecting to Learning Hub"
                items={[
                    "Scanning legacy archives...",
                    "Migrating session data...",
                    "Establishing secure link...",
                    "Redirecting to Intelligence Core..."
                ]}
            />
        </div>
    );
}

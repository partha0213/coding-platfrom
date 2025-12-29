"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdvancedLoading from "@/components/AdvancedLoading";

export default function ProblemDetailRedirect() {
    const router = useRouter();
    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace("/learning");
        }, 1500);
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-10">
            <AdvancedLoading
                title="Migrating Legacy Link"
                items={[
                    "Resolving mission coordinates...",
                    "Checking authorization status...",
                    "Redirecting to Roadmap..."
                ]}
            />
        </div>
    );
}

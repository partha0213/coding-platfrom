"use client";
import { usePathname } from "next/navigation";

export default function TestLayout({ children }) {
    const pathname = usePathname();
    const isTakePage = pathname?.includes('/take');

    return (
        <div className={isTakePage
            ? "h-screen w-screen overflow-hidden bg-slate-900"
            : "min-h-screen w-screen overflow-y-auto overflow-x-hidden bg-slate-900"
        }>
            {children}
        </div>
    );
}

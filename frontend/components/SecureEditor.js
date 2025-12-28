"use client";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { CopyX, AlertTriangle } from "lucide-react";

export default function SecureEditor({ code, setCode, language = "javascript" }) {
    const monaco = useMonaco();
    const editorRef = useRef(null);
    const [warnings, setWarnings] = useState([]);
    const [locked, setLocked] = useState(false);

    // 1. Configure Editor on Mount
    const handleEditorDidMount = (editor, monacoInstance) => {
        editorRef.current = editor;

        // A. Disable Context Menu
        editor.updateOptions({
            contextmenu: false,
            quickSuggestions: false,
            snippetSuggestions: "none",
            suggestOnTriggerCharacters: false,
        });

        // B. Block Paste & Copy
        editor.onKeyDown((e) => {
            // Block Ctrl+V (Paste) and Ctrl+C (Copy)
            if ((e.ctrlKey || e.metaKey) && (e.keyCode === 52 || e.keyCode === 33)) {
                e.preventDefault();
                e.stopPropagation();
                addWarning("Copy/Paste is disabled. Type it out to learn!");
            }
        });

        // C. Detect Paste Event (Web API layer)
        // The visual editor might still capture paste if not blocked at container level
        // This is a second line of defense
        const domNode = editor.getDomNode();
        if (domNode) {
            domNode.addEventListener('paste', (e) => {
                e.preventDefault();
                addWarning("Paste attempt blocked.");
            }, true);
        }
    };

    const addWarning = (msg) => {
        setWarnings(prev => [...prev.slice(-2), msg]); // Keep last 3
        setTimeout(() => setWarnings(prev => prev.slice(1)), 3000);
    };

    return (
        <div className="relative h-full w-full border border-slate-200 rounded-2xl overflow-hidden bg-white">
            {/* Warnings Overlay */}
            <div className="absolute top-4 right-6 z-50 flex flex-col gap-2">
                {warnings.map((w, i) => (
                    <div key={i} className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 shadow-sm">
                        <AlertTriangle size={14} />
                        {w}
                    </div>
                ))}
            </div>

            <Editor
                height="100%"
                defaultLanguage={language}
                language={language}
                theme="light"
                value={code}
                onChange={(value, event) => {
                    // D. Detect Bulk Changes (Suspicious)
                    // Simple heuristic: if change length > 10 chars and it's not a generic 'insert', flag it.
                    // Note: event.changes[0].text is the inserted text.
                    if (event.changes.length > 0) {
                        const change = event.changes[0];
                        if (change.text.length > 10 && !change.text.includes("\n")) {
                            // console.log("Suspicious bulk type");
                            // In production, send this to backend telemetry
                        }
                    }
                    setCode(value);
                }}
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                }}
            />
        </div>
    );
}

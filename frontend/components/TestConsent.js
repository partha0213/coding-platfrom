"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, CameraOff, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function TestConsent({ testId, testTitle, onConsent }) {
    const router = useRouter();
    const [agreed, setAgreed] = useState(false);
    const [cameraVerified, setCameraVerified] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [testing, setTesting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [testStartTime, setTestStartTime] = useState(null);
    const [isStartingSoon, setIsStartingSoon] = useState(false);

    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const API_URL = "http://localhost:8000/api/v1";

    useEffect(() => {
        const fetchTestDetails = async () => {
            try {
                const res = await fetch(`${API_URL}/admin/tests`);
                const tests = await res.json();
                const currentTest = tests.find(t => t.id === parseInt(testId));
                if (currentTest) {
                    setTestStartTime(new Date(currentTest.start_time));
                }
            } catch (err) {
                console.error("Failed to fetch test details:", err);
            }
        };
        fetchTestDetails();
    }, [testId]);

    useEffect(() => {
        if (!testStartTime) return;

        const timer = setInterval(() => {
            const now = new Date();
            const diff = testStartTime - now;

            if (diff > 0) {
                setTimeLeft(diff);
                setIsStartingSoon(true);
            } else {
                setTimeLeft(null);
                setIsStartingSoon(false);
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [testStartTime]);

    const formatTimeLeft = (ms) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const testCamera = async () => {
        setTesting(true);
        setCameraError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
                audio: false
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setCameraVerified(true);

                // Stop after 3 seconds
                setTimeout(() => {
                    if (streamRef.current) {
                        streamRef.current.getTracks().forEach(track => track.stop());
                    }
                }, 3000);
            }
        } catch (err) {
            console.error("Camera test failed:", err);
            setCameraError(err.message);
            setCameraVerified(false);
        } finally {
            setTesting(false);
        }
    };

    const handleProceed = () => {
        if (agreed && cameraVerified) {
            onConsent?.();
        }
    };

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center p-6">
            <div className="max-w-3xl w-full bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black">Proctored Assessment</h1>
                            <p className="text-blue-100 text-sm font-medium mt-1">{testTitle}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">
                    {/* Terms & Conditions */}
                    <div>
                        <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                            <AlertCircle className="text-amber-400" size={20} />
                            Terms & Conditions
                        </h3>
                        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700 max-h-64 overflow-y-auto space-y-3 text-sm text-slate-300">
                            <p>By proceeding with this assessment, you acknowledge and agree to the following:</p>

                            <div className="space-y-2">
                                <p><strong className="text-white">1. Camera Monitoring:</strong> Your camera will be active throughout the test. Video feed will be monitored for prohibited items and suspicious behavior.</p>

                                <p><strong className="text-white">2. Object Detection:</strong> AI-powered object detection will identify phones, tablets, books, and other prohibited items in your workspace.</p>

                                <p><strong className="text-white">3. Fullscreen Lock:</strong> You must remain in fullscreen mode. Tab switches and window changes will be logged as violations.</p>

                                <p><strong className="text-white">4. Behavior Logging:</strong> All violations (tab switches, prohibited objects, camera blocks) are recorded and visible to administrators.</p>

                                <p><strong className="text-white">5. Academic Integrity:</strong> Any violation may result in test disqualification and academic penalties.</p>

                                <p><strong className="text-white">6. Data Privacy:</strong> Camera feed is processed locally. Only violation logs and timestamps are stored on the server.</p>
                            </div>
                        </div>

                        <label className="flex items-center gap-3 mt-4 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="w-5 h-5 rounded border-2 border-slate-600 bg-slate-700 checked:bg-blue-600 checked:border-blue-600 cursor-pointer"
                            />
                            <span className="text-sm font-medium group-hover:text-white transition-colors">
                                I have read and agree to the terms and conditions
                            </span>
                        </label>
                    </div>

                    {/* Camera Verification */}
                    <div>
                        <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                            <Camera className="text-emerald-400" size={20} />
                            Camera Verification
                        </h3>

                        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700">
                            {!cameraVerified ? (
                                <div className="text-center">
                                    <div className="w-24 h-24 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
                                        {testing ? (
                                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <CameraOff className="text-slate-600" size={40} />
                                        )}
                                    </div>
                                    <p className="text-slate-400 mb-4">Click below to test your camera</p>

                                    {cameraError && (
                                        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-4 text-red-300 text-sm">
                                            <strong>Error:</strong> {cameraError}
                                        </div>
                                    )}

                                    <button
                                        onClick={testCamera}
                                        disabled={testing}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:bg-slate-700 disabled:text-slate-500"
                                    >
                                        {testing ? "Testing Camera..." : "Test Camera"}
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="w-24 h-24 mx-auto mb-4 bg-emerald-900/30 rounded-full flex items-center justify-center border-4 border-emerald-600">
                                        <CheckCircle2 className="text-emerald-400" size={40} />
                                    </div>
                                    <p className="text-emerald-400 font-bold text-lg">Camera Verified</p>
                                    <p className="text-slate-400 text-sm mt-2">Your camera is working properly</p>
                                </div>
                            )}

                            {/* Hidden video element for camera test */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-4 rounded-xl font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleProceed}
                            disabled={!agreed || !cameraVerified || isStartingSoon}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold transition-all disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isStartingSoon ? (
                                <>
                                    <span>Starts in {formatTimeLeft(timeLeft)}</span>
                                </>
                            ) : (
                                !agreed ? "Please Accept Terms" : !cameraVerified ? "Please Verify Camera" : "Start Assessment →"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

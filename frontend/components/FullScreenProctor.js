"use client";
import React, { useEffect, useState, useRef } from 'react';
import { AlertCircle, Maximize, Camera, CameraOff, ShieldAlert } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function FullScreenProctor({ onViolation, isEnabled, userId, problemId, testId, onKickOut, onFullscreenChange }) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [tabSwitches, setTabSwitches] = useState(0);
    const [objectDetectionCount, setObjectDetectionCount] = useState(0);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [detections, setDetections] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [debugDetection, setDebugDetection] = useState("Initializing...");

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const modelRef = useRef(null);
    const detectionIntervalRef = useRef(null);
    const lastViolationRef = useRef({}); // For cooldown
    const [modelLoaded, setModelLoaded] = useState(false);


    // Initialize camera, load object detection model, and enter fullscreen
    useEffect(() => {
        if (!isEnabled) return;

        const initialize = async () => {
            try {
                // Removed auto-enter fullscreen as it requires user gesture and causes false violations
                await startCamera();
                await loadObjectDetectionModel();
            } catch (err) {
                console.error("Initialization error:", err);
            }
        };

        initialize();

        return () => {
            stopCamera();
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current);
            }
        };
    }, [isEnabled]);

    // Fullscreen and tab switch monitoring
    useEffect(() => {
        if (!isEnabled) return;

        const triggerKickOut = (reason) => {
            logViolation('KICKED_OUT', 'CRITICAL', reason);
            // Mark as DISQUALIFIED on backend
            fetch(`${API_URL}/student/disqualify-test/${testId}?user_id=${userId}`, {
                method: 'POST'
            }).catch(e => console.error("Failed to disqualify:", e));
            onKickOut?.(reason);
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                const newCount = tabSwitches + 1;
                setTabSwitches(newCount);
                addWarning(`Tab switch #${newCount}`);
                logViolation('TAB_SWITCH', 'HIGH', `Tab switch detected (count: ${newCount})`);
                onViolation?.({ type: 'TAB_SWITCH', count: newCount });

                // Kick out after 2 tab switches
                if (newCount >= 2) {
                    triggerKickOut('You have been removed from the exam due to multiple tab switches (2 violations).');
                }
            }
        };

        const handleFullscreenChange = () => {
            const isFS = !!document.fullscreenElement;
            setIsFullscreen(prev => {
                if (prev === true && isFS === false) {
                    addWarning('Fullscreen exited');
                    logViolation('EXIT_FULLSCREEN', 'HIGH', 'Student exited fullscreen mode');
                    onViolation?.({ type: 'EXIT_FULLSCREEN' });
                }
                onFullscreenChange?.(isFS);
                return isFS;
            });
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [isEnabled, onViolation, tabSwitches]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: "user"
                },
                audio: false
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setCameraActive(true);
                setCameraError(null);
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            setCameraError("Camera blocked");
            addWarning('Camera access blocked');
            logViolation('CAMERA_BLOCKED', 'HIGH', 'Camera access was denied or blocked');
            onViolation?.({ type: 'CAMERA_BLOCKED', error: err.message });
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    const loadObjectDetectionModel = async () => {
        try {
            if (typeof window !== 'undefined') {
                const [tf, cocoSsd] = await Promise.all([
                    import('@tensorflow/tfjs'),
                    import('@tensorflow-models/coco-ssd')
                ]);

                await tf.ready();
                // Try to use webgl for better performance
                if (tf.getBackend() !== 'webgl') {
                    await tf.setBackend('webgl').catch(() => console.log("WebGL not available, using default"));
                }

                console.log("TFJS Ready. Backend:", tf.getBackend());

                const model = await cocoSsd.load();
                modelRef.current = model;
                setModelLoaded(true);
                console.log("Object detection model loaded successfully.");
                startObjectDetection();
            }
        } catch (err) {
            console.error("Failed to load detection model:", err);
            setModelLoaded(false);
        }
    };

    const startObjectDetection = () => {
        detectionIntervalRef.current = setInterval(async () => {
            if (modelRef.current && videoRef.current && videoRef.current.readyState === 4) {
                try {
                    const predictions = await modelRef.current.detect(videoRef.current, 10, 0.35); // Lowered threshold to 0.35
                    processPredictions(predictions);
                } catch (err) {
                    console.error("Detection error:", err);
                }
            }
        }, 1000); // Increased frequency to 1 second
    };

    const processPredictions = (predictions) => {
        // COCO-SSD might use different class names, so we check multiple variations
        const prohibitedObjects = [
            'cell phone',
            'phone',
            'mobile',
            'iphone',
            'smartphone',
            'cellphone',
            'handphone',
            'laptop',
            'computer',
            'book',
            'notebook',
            'tv',
            'remote',
            'tablet',
            'calculator'
        ];

        // Debug: Log and show all detections
        if (predictions.length > 0) {
            const topPred = predictions[0];
            setDebugDetection(`${topPred.class} (${Math.round(topPred.score * 100)}%)`);
            console.log('AI Detected:', predictions.map(p => `${p.class}: ${Math.round(p.score * 100)}%`));
        } else {
            setDebugDetection("Scanning...");
        }

        const personCount = predictions.filter(pred => pred.class.toLowerCase() === 'person').length;

        const detectedProhibited = predictions.filter(pred => {
            const className = pred.class.toLowerCase();
            return prohibitedObjects.some(obj => className.includes(obj));
        });

        // Check for violations independently
        if (personCount > 1) {
            const now = Date.now();
            if (!lastViolationRef.current['MULTIPLE_PERSONS'] || now - lastViolationRef.current['MULTIPLE_PERSONS'] > 5000) {
                lastViolationRef.current['MULTIPLE_PERSONS'] = now;
                const newCount = objectDetectionCount + 1;
                setObjectDetectionCount(newCount);
                setDetections([{ class: `${personCount} persons detected`, score: 1 }]);
                addWarning(`Multiple persons detected (${personCount})`);
                logViolation('MULTIPLE_PERSONS', 'HIGH', `${personCount} persons detected in frame`);
                onViolation?.({ type: 'MULTIPLE_PERSONS', count: personCount, detectionCount: newCount });

                if (newCount >= 2) {
                    logViolation('KICKED_OUT', 'CRITICAL', `Kicked: 2 person detections`);
                    onKickOut?.('Exam terminated: Multiple persons detected twice.');
                }
                setTimeout(() => setDetections([]), 5000);
            }
        }

        if (detectedProhibited.length > 0) {
            const now = Date.now();
            if (!lastViolationRef.current['OBJECT_DETECTED'] || now - lastViolationRef.current['OBJECT_DETECTED'] > 5000) {
                lastViolationRef.current['OBJECT_DETECTED'] = now;
                const newCount = objectDetectionCount + 1;
                setObjectDetectionCount(newCount);
                const objectNames = detectedProhibited.map(d => d.class).join(', ');
                setDetections(detectedProhibited);
                addWarning(`Prohibited: ${objectNames}`);
                logViolation('OBJECT_DETECTED', 'HIGH', `Detected: ${objectNames}`);
                onViolation?.({ type: 'OBJECT_DETECTED', objects: detectedProhibited, detectionCount: newCount });

                if (newCount >= 2) {
                    triggerKickOut('Exam terminated: Prohibited objects detected twice.');
                }
                setTimeout(() => setDetections([]), 5000);
            }
        }
    };

    const addWarning = (message) => {
        const newWarning = { message, time: new Date().toLocaleTimeString() };
        setWarnings(prev => [...prev.slice(-2), newWarning]);
    };

    const logViolation = async (eventType, severity, details) => {
        try {
            const token = localStorage.getItem("token");
            await fetch(`${API_URL}/student/log-behavior`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: userId,
                    problem_id: problemId,
                    test_id: testId,
                    event_type: eventType,
                    severity: severity,
                    details: details
                })
            });
        } catch (err) {
            console.error("Failed to log violation:", err);
        }
    };

    const enterFullscreen = async () => {
        try {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                // Safari support
                await elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
                // IE11 support
                await elem.msRequestFullscreen();
            }
        } catch (err) {
            // Removed warning for failed programmatic requests as they are expected to fail without user gesture
            console.warn("Fullscreen request failed (likely missing user gesture):", err);
        }
    };

    if (!isEnabled) return null;

    return (
        <>
            {/* Proctoring Control Panel - REPOSITIONED TO TOP CENTER */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-full pointer-events-none">
                <div className="flex flex-col gap-2 pointer-events-auto items-center">
                    {!isFullscreen && (
                        <button
                            onClick={enterFullscreen}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold shadow-lg animate-pulse"
                        >
                            <Maximize size={18} />
                            Enter Fullscreen to Continue
                        </button>
                    )}

                    {tabSwitches > 0 && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-lg ${tabSwitches >= 2 ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-500 text-white'
                            }`}>
                            <AlertCircle size={18} />
                            Tab Switches: {tabSwitches}/2 {tabSwitches >= 2 && '- KICKED OUT!'}
                        </div>
                    )}

                    {objectDetectionCount > 0 && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-lg ${objectDetectionCount >= 2 ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-500 text-white'
                            }`}>
                            <AlertCircle size={18} />
                            Object Violations: {objectDetectionCount}/2 {objectDetectionCount >= 2 && '- KICKED OUT!'}
                        </div>
                    )}

                    {detections.length > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold shadow-lg animate-pulse">
                            <ShieldAlert size={18} />
                            Prohibited Object Detected!
                        </div>
                    )}

                    {warnings.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 max-w-xs">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldAlert className="text-red-600" size={16} />
                                <span className="text-xs font-black uppercase text-red-600">Recent Violations</span>
                            </div>
                            {warnings.map((w, i) => (
                                <div key={i} className="text-xs text-red-800 py-1 border-t border-red-100 first:border-0">
                                    <span className="font-bold">{w.time}</span> - {w.message}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Camera Feed */}
            <div className="fixed bottom-4 right-4 z-[100] bg-slate-900 rounded-xl border-2 border-slate-700 shadow-2xl overflow-hidden">
                <div className="bg-slate-800 px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {cameraActive ? (
                            <span className={`text-[10px] font-black uppercase tracking-tighter ${detections.length > 0 ? 'text-rose-400' : 'text-blue-200 opacity-60'}`}>
                                {debugDetection}
                            </span>
                        ) : (
                            <span className="text-[10px] font-black uppercase tracking-tighter text-rose-400">
                                Camera Blocked
                            </span>
                        )}
                    </div>
                    <div className={`w-2 h-2 rounded-full ${detections.length > 0 ? 'bg-rose-500 animate-ping' : (modelLoaded ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500')} `}></div>
                </div>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-56 h-42 object-contain bg-slate-950"
                />
            </div>

            {/* Camera Error Alert */}
            {cameraError && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] bg-red-600 text-white p-6 rounded-2xl shadow-2xl max-w-md animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-red-700 rounded-full flex items-center justify-center">
                            <CameraOff size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-lg">Camera Access Required</h3>
                            <p className="text-red-100 text-sm">Proctoring cannot continue without camera</p>
                        </div>
                    </div>
                    <button
                        onClick={startCamera}
                        className="w-full bg-white text-red-600 py-3 rounded-xl font-bold hover:bg-red-50 transition-all"
                    >
                        Grant Camera Access
                    </button>
                </div>
            )}
        </>
    );
}

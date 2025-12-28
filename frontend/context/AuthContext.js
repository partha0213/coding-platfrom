"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext();
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const refreshToken = async () => {
        const rt = localStorage.getItem("refresh_token");
        if (!rt) return null;

        try {
            const res = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: rt })
            });

            if (!res.ok) throw new Error("Refresh failed");

            const data = await res.json();
            localStorage.setItem("token", data.access_token);
            document.cookie = `token=${data.access_token}; path=/; max-age=1800; SameSite=Strict`;
            return data.access_token;
        } catch (err) {
            console.error("Token refresh failed:", err);
            return null;
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            if (typeof window === "undefined") {
                setLoading(false);
                return;
            }

            let token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.status === 401) {
                    // Try refreshing
                    const newToken = await refreshToken();
                    if (newToken) {
                        const retryRes = await fetch(`${API_URL}/auth/me`, {
                            headers: { Authorization: `Bearer ${newToken}` }
                        });
                        if (retryRes.ok) {
                            const userData = await retryRes.json();
                            const normalizedUser = {
                                ...userData,
                                role: userData.role?.toUpperCase() || 'STUDENT'
                            };
                            localStorage.setItem("user", JSON.stringify(normalizedUser));
                            setUser(normalizedUser);
                            setLoading(false);
                            return;
                        }
                    }
                    throw new Error("Unauthorized");
                }

                if (res.ok) {
                    const userData = await res.json();
                    const normalizedUser = {
                        ...userData,
                        role: userData.role?.toUpperCase() || 'STUDENT'
                    };
                    localStorage.setItem("user", JSON.stringify(normalizedUser));
                    setUser(normalizedUser);
                } else {
                    throw new Error("Profile fetch failed");
                }
            } catch (err) {
                console.error("Auth check failed:", err);
                localStorage.removeItem("token");
                localStorage.removeItem("refresh_token");
                document.cookie = "token=; path=/; max-age=0";
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (username, password) => {
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData
        });

        if (!res.ok) throw new Error("Login failed");

        const data = await res.json();
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);

        // Set cookie for middleware access
        document.cookie = `token=${data.access_token}; path=/; max-age=1800; SameSite=Strict`;

        const profileRes = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${data.access_token}` }
        });
        const profile = await profileRes.json();

        // Normalize role
        const normalizedUser = {
            ...profile,
            role: profile.role?.toUpperCase() || 'STUDENT'
        };
        localStorage.setItem("user", JSON.stringify(normalizedUser));
        setUser(normalizedUser);

        if (normalizedUser.role?.toUpperCase() === "ADMIN") router.push("/admin");
        else router.push("/dashboard");
    };

    const signup = async (email, username, password) => {
        const res = await fetch(`${API_URL}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, username, password })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Signup failed");
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        document.cookie = "token=; path=/; max-age=0";
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

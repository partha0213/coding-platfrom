const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const getHeader = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
};

async function request(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            ...getHeader(),
            ...options.headers
        }
    });

    // Global Error Handling
    if (res.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
        throw new Error("Session expired. Please login again.");
    }

    if (res.status === 403) {
        const data = await res.json();
        throw new Error(data.detail || "Access denied. Complete previous steps first.");
    }

    if (res.status === 413) {
        throw new Error("Code too large. Must be under 64KB.");
    }

    if (res.status === 429) {
        const data = await res.json();
        throw new Error(data.detail || "Too many attempts. Please wait.");
    }

    if (res.status >= 500) {
        throw new Error("Server error. Our executor might be under heavy load. Please try again in a moment.");
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Request failed" }));
        throw new Error(data.detail || "Something went wrong");
    }

    return res.json();
}

/**
 * Learning Platform Endpoints (Stepwise)
 */

export async function fetchCourses() {
    return request("/learning/courses");
}

export async function fetchCourseProblems(courseId) {
    return request(`/learning/courses/${courseId}/problems`);
}

export async function fetchProblem(problemId) {
    return request(`/learning/problems/${problemId}`);
}

export async function submitSolution(problemId, code) {
    return request(`/learning/problems/${problemId}/submit`, {
        method: "POST",
        body: JSON.stringify({ code }),
    });
}

/**
 * Learning Admin Endpoints
 */

export async function fetchAdminCourses() {
    return request("/admin/learning/courses");
}

export async function fetchAdminCourseDetail(courseId) {
    return request(`/admin/learning/courses/${courseId}`);
}

export async function deleteProblem(problemId, force = false) {
    return request(`/admin/learning/problems/${problemId}?force=${force}`, {
        method: "DELETE"
    });
}

export async function reorderSteps(courseId, mappings) {
    return request(`/admin/learning/courses/${courseId}/reorder`, {
        method: "POST",
        body: JSON.stringify({ mappings })
    });
}

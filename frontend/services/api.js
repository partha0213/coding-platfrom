const API_URL = "http://localhost:8000/api/v1";

export async function fetchProblem(id) {
    const res = await fetch(`${API_URL}/problems/${id}`);
    if (!res.ok) throw new Error("Failed to load problem");
    return res.json();
}

export async function executeCode(problemId, code, language = "javascript") {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/execute/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ problem_id: parseInt(problemId), code, language }),
    });
    return res.json();
}

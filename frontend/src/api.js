// Single source of truth for backend communication.
// All frontend API calls go through this module (per architecture rules).
// Endpoints follow PRD section 8: /api/todos, PATCH for completion toggles.

const BASE_URL = import.meta.env.VITE_API_URL ? `https://${import.meta.env.VITE_API_URL}` : "https://sreetct-claudetodo-backend.onrender.com";

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Request failed: ${response.status} ${detail}`);
  }

  // 204 No Content (DELETE) has no body to parse.
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function fetchTodos() {
  return request("/api/todos");
}

export function createTodo(title, category) {
  return request("/api/todos", {
    method: "POST",
    body: JSON.stringify({ title, category }),
  });
}

export function updateTodo(id, { completed }) {
  return request(`/api/todos/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
}

export function deleteTodo(id) {
  return request(`/api/todos/${id}`, {
    method: "DELETE",
  });
}

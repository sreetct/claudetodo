import { useEffect, useState } from "react";
import {
  fetchTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from "./api.js";
import "./App.css";

const CATEGORIES = ["All", "Shopping", "Work", "Personal"];

function App() {
  const [todos, setTodos] = useState([]);
  const [draft, setDraft] = useState("");
  const [draftCategory, setDraftCategory] = useState("Personal");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refresh the list from the server.
  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTodos();
      setTodos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Load todos on mount.
  useEffect(() => {
    refresh();
  }, []);

  async function handleAdd(event) {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;
    try {
      await createTodo(title, draftCategory);
      setDraft("");
      setDraftCategory("Personal");
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggle(todo) {
    try {
      await updateTodo(todo.id, { completed: !todo.completed });
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(todo) {
    try {
      await deleteTodo(todo.id);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  const visible =
    filter === "All" ? todos : todos.filter((t) => t.category === filter);

  const remaining = todos.filter((t) => !t.completed).length;

  return (
    <main className="app">
      <h1>ClaudeTodo</h1>

      <form className="add-form" onSubmit={handleAdd}>
        <input
          className="add-input"
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="What needs to be done?"
          aria-label="New todo title"
        />
        <select
          className="category-select"
          value={draftCategory}
          onChange={(event) => setDraftCategory(event.target.value)}
          aria-label="New todo category"
        >
          {CATEGORIES.filter((c) => c !== "All").map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button className="add-button" type="submit">Add</button>
      </form>

      <div className="filters" role="tablist" aria-label="Filter todos by category">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={filter === c}
            className={`filter-pill${filter === c ? " is-active" : ""}`}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      <p className="count">
        {loading && "Loading…"}
        {!loading && `${remaining} of ${todos.length} remaining`}
      </p>

      <ul className="todo-list">
        {visible.map((todo) => (
          <li key={todo.id} className={`todo-item${todo.completed ? " is-done" : ""}`}>
            <label className="todo-label">
              <input
                className="todo-checkbox"
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggle(todo)}
              />
              <span className="todo-title">{todo.title}</span>
            </label>
            <span className="todo-category" data-category={todo.category}>{todo.category}</span>
            <button
              className="delete-button"
              type="button"
              onClick={() => handleDelete(todo)}
              aria-label={`Delete "${todo.title}"`}
            >
              Delete
            </button>
          </li>
        ))}
        {!loading && visible.length === 0 && (
          <li className="empty">No todos here — add one above.</li>
        )}
      </ul>
    </main>
  );
}

export default App;
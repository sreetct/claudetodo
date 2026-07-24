# ClaudeTodo — Product Requirements Document

**Status:** Draft
**Last updated:** 2026-07-20

## 1. Overview

ClaudeTodo is a lightweight task-management application that lets users create, complete, and delete todos. The goal is a clean, responsive single-page app backed by a small REST API — minimal scope, fast, and dependable.

## 2. Goals & Non-Goals

**Goals**
- Let users create, view, complete, and delete todos.
- Provide a responsive web UI with near-instant feedback.
- Persist todos so they survive page refreshes.

**Non-Goals**
- No user accounts or authentication (single-user, local first).
- No due dates, tags, priorities, or subtasks in v1.
- No offline mode or sync across devices.

## 3. Users & Personas

A single end user managing their own task list on a personal machine. No roles or permissions.

## 4. User Stories

1. As a user, I can create a new todo with a text title.
2. As a user, I can see all my todos in a list.
3. As a user, I can mark a todo as complete, and toggle it back to incomplete.
4. As a user, I can delete a todo.
5. As a user, my todos persist when I reload the page.

## 5. Functional Requirements

| ID | Requirement |
|----|-------------|
| F1 | Create a todo from a text input. Empty titles are rejected. |
| F2 | List all todos, newest first. |
| F3 | Toggle a todo's completed state via a checkbox. |
| F4 | Delete a todo via a per-item button, with a confirm step. |
| F5 | Show a count of remaining (incomplete) todos. |
| F6 | Persist todos server-side; reload returns the same list. |

## 6. Non-Functional Requirements

- **Performance:** UI actions feel instant (< 100ms client feedback); API responses < 200ms p95 on local data.
- **Reliability:** Deleting or completing never silently fails; errors surface to the user.
- **Compatibility:** Works in current Chrome, Firefox, Edge, and Safari. Responsive down to 360px width.
- **Maintainability:** Small, typed surface on both ends; documented endpoints.

## 7. Tech Stack

- **Frontend:** React + Vite, TypeScript. No UI framework required; plain CSS is fine.
- **Backend:** Python FastAPI, served via Uvicorn.
- **Storage:** SQLite (via SQLAlchemy) — sufficient for single-user local persistence.
- **Transport:** JSON over HTTP, REST.

## 8. API Design

Base URL: `http://localhost:8000`

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|-------|
| `GET` | `/api/todos` | — | `Todo[]` | List all todos, newest first |
| `POST` | `/api/todos` | `{ "title": string }` | `Todo` (201) | Reject empty title (400) |
| `PATCH` | `/api/todos/{id}` | `{ "completed": boolean }` | `Todo` | Toggle completion |
| `DELETE` | `/api/todos/{id}` | — | `204` | 404 if missing |

**Todo resource:**
```json
{ "id": 1, "title": "Buy groceries", "completed": false, "created_at": "2026-07-20T12:00:00Z" }
```

## 9. UI / UX

- One screen: input + add button at top, list below.
- Each row: checkbox, title, delete button.
- Completed todos are visually de-emphasized (strikethrough + muted).
- Remaining-count line above or below the list.
- Delete shows a lightweight confirm (e.g., browser confirm or inline undo).

## 10. Data Model

Single table `todos`:

| Column | Type | Notes |
|--------|------|-------|
| `id` | Integer PK | Auto-increment |
| `title` | String | Non-empty |
| `completed` | Boolean | Default `false` |
| `created_at` | DateTime | UTC, set on creation |

## 11. Out of Scope for v1

Accounts, due dates, tags, search, filtering, drag-to-reorder, multi-device sync, dark mode (nice-to-have, not required).

## 12. Acceptance Criteria

- All six functional requirements work end-to-end in the browser.
- Reloading the page shows the same todo list.
- Empty-title submit is blocked with a visible message.
- Deleting asks for confirmation and removes the row.
- App starts with `npm run dev` (frontend) and `uvicorn main:app` (backend) per the README.
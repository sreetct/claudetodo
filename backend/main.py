from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import Boolean, Column, DateTime, Integer, String, create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

app = FastAPI(title="ClaudeTodo API", version="1.0.0")

# Allow the Vite dev server (and common dev ports) to call the API.
# Tighten `allow_origins` for production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database setup (SQLite, per PRD section 7) -----------------------------
DATABASE_URL = "sqlite:///./claudetodo.db"
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # required for SQLite + FastAPI
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


CATEGORIES = ("Shopping", "Work", "Personal")


class TodoModel(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    completed = Column(Boolean, nullable=False, default=False)
    category = Column(String, nullable=False, default="Personal")
    created_at = Column(DateTime, nullable=False)


Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Schemas ---------------------------------------------------------------
class Todo(BaseModel):
    id: int
    title: str
    completed: bool
    category: str
    created_at: str  # ISO 8601 UTC with Z suffix, per PRD section 8


class TodoCreate(BaseModel):
    title: str
    category: str = "Personal"


class TodoUpdate(BaseModel):
    completed: bool  # PRD section 8: PATCH body is { "completed": boolean }


def serialize(todo: TodoModel) -> Todo:
    return Todo(
        id=todo.id,
        title=todo.title,
        completed=todo.completed,
        category=todo.category,
        created_at=todo.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
    )


# --- Routes ----------------------------------------------------------------
@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/todos", response_model=list[Todo])
def list_todos(db: Session = Depends(get_db)) -> list[Todo]:
    # Newest first (highest id first), per PRD F2.
    todos = db.query(TodoModel).order_by(TodoModel.id.desc()).all()
    return [serialize(t) for t in todos]


@app.post("/api/todos", response_model=Todo, status_code=201)
def create_todo(payload: TodoCreate, db: Session = Depends(get_db)) -> Todo:
    # PRD F1 / section 8: reject empty title with 400.
    if not payload.title or not payload.title.strip():
        raise HTTPException(status_code=400, detail="title must not be empty")
    category = payload.category if payload.category in CATEGORIES else "Personal"
    todo = TodoModel(
        title=payload.title.strip(),
        completed=False,
        category=category,
        created_at=datetime.now(timezone.utc),
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return serialize(todo)


@app.patch("/api/todos/{todo_id}", response_model=Todo)
def update_todo(todo_id: int, payload: TodoUpdate, db: Session = Depends(get_db)) -> Todo:
    todo = db.query(TodoModel).filter(TodoModel.id == todo_id).first()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    todo.completed = payload.completed
    db.commit()
    db.refresh(todo)
    return serialize(todo)


@app.delete("/api/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: int, db: Session = Depends(get_db)) -> None:
    todo = db.query(TodoModel).filter(TodoModel.id == todo_id).first()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(todo)
    db.commit()

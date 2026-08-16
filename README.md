# 🚀 SyncRoom

A modern, real-time collaborative workspace and ephemeral chat application built with **FastAPI**, **PostgreSQL**, **WebSockets**, and **Vite + React + TypeScript**.

SyncRoom allows users to create temporary or persistent rooms, manage participant access with locked waiting rooms, stream messages in real-time with WebSockets, and automatically migrate host privileges when a room owner disconnects.

---

## ✨ Features

- 🔐 **Authentication & Authorization**: Secure JWT-based auth (access & refresh tokens) with user profile management.
- ⚡ **Real-Time WebSockets**: Sub-millisecond message delivery, live typing indicators, and instant participant state updates.
- ⏳ **Ephemeral Rooms & TTL Sweeps**: Custom Time-To-Live (TTL) room auto-expiration and cleanup.
- 👑 **Automatic Host Migration**: Seamless host reassignment and grace periods when the host disconnects or leaves the room.
- 🚪 **Locked Rooms & Waiting Room Flow**: Host approval system allowing room owners to accept or deny join requests.
- 💬 **Live Chat Features**: Real-time messaging, message editing, message deletion, and rich message history.
- 📊 **Dashboard & Room History**: Track active sessions, joined rooms, and past room transcripts.
- 🐳 **Dockerized Setup**: Multi-container Docker Compose configuration for PostgreSQL, pgAdmin, and FastAPI.

---

## 🛠️ Tech Stack

### **Backend**
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Async Python)
- **Database**: [PostgreSQL 16](https://www.postgresql.org/) + `asyncpg` + [SQLAlchemy 2.0](https://www.sqlalchemy.org/)
- **Migrations**: [Alembic](https://alembic.sqlalchemy.org/)
- **Authentication**: `PyJWT` + `Passlib` (Argon2 / Bcrypt)
- **Real-Time**: Native FastAPI WebSockets

### **Frontend**
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Routing**: `React Router v7`
- **Styling**: Modern CSS Tokens & Custom Component Library

### **Infrastructure**
- **Containerization**: Docker & Docker Compose
- **Database Admin**: pgAdmin 4

---

## 📁 Project Structure

```text
SyncRoom/
├── app/                        # FastAPI Backend Application
│   ├── api/                    # REST API endpoints (v1)
│   │   ├── deps.py             # Dependency injections & JWT auth guards
│   │   └── v1/                 # Endpoints (auth, rooms, users, dashboard)
│   ├── core/                   # Security, config, storage, & auth core
│   ├── db/                     # Database repositories & models
│   ├── models/                 # Pydantic & SQLAlchemy data models
│   ├── services/               # Business logic (room service, host migration, TTL sweep)
│   ├── websockets/             # WebSocket router & connection managers
│   └── main.py                 # FastAPI application entry point
├── alembic/                    # Database migration scripts
├── frontend/                   # React + TypeScript Frontend (Vite)
│   ├── src/
│   │   ├── components/         # UI components & room views
│   │   ├── features/           # Zustand stores & state hooks
│   │   ├── pages/              # Screen views (Dashboard, Room, Profile, etc.)
│   │   ├── services/           # API & WebSocket client connections
│   │   └── app/                # Router & App providers
│   ├── index.html
│   └── package.json
├── docker-compose.yaml         # Docker Compose configuration
├── Dockerfile                  # FastAPI Docker container build
├── .env.example                # Template for environment configuration
└── requirements.txt            # Python dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Python](https://www.python.org/) (3.11+ if running backend outside Docker)

---

### 1. Environment Configuration

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

Ensure mandatory variables are filled in `.env`:

```env
POSTGRES_USER=syncroom
POSTGRES_PASSWORD=devpassword123
POSTGRES_DB=syncroom

PGADMIN_EMAIL=admin@syncroom.local
PGADMIN_PASSWORD=adminpassword123

DATABASE_URL=postgresql+asyncpg://syncroom:devpassword123@localhost:5432/syncroom

JWT_SECRET=your_super_secret_jwt_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

CORS_ORIGINS="*"
```

---

### 2. Running Backend & Database with Docker

Start PostgreSQL, pgAdmin, and the FastAPI backend:

```bash
docker compose up -d --build
```

Apply database migrations:

```bash
docker compose exec backend alembic upgrade head
```

The backend services will be available at:
- **FastAPI API & Docs**: `http://localhost:8000/docs`
- **pgAdmin**: `http://localhost:5050`
- **PostgreSQL**: `localhost:5432`

---

### 3. Running the Frontend

Navigate to the `frontend/` directory, install dependencies, and start the development server:

```bash
cd frontend
npm install
npm run dev
```

The application will be running at `http://localhost:5173`.

---

## ⚙️ Development Commands

### **Database Migrations**
To create a new migration after modifying database models:

```bash
docker compose exec backend alembic revision --autogenerate -m "describe_migration"
docker compose exec backend alembic upgrade head
```

### **Running Tests**
Run the backend test suite inside the container or locally:

```bash
pytest
```

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

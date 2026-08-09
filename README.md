# SyncRoom

## Running locally

The backend, database, and database-admin tools are fully containerized using Docker Compose.

1. **Start the stack**
   ```bash
   docker compose up -d --build
   ```
   This will bring up Postgres, pgAdmin, and the FastAPI backend.

2. **Run database migrations**
   ```bash
   docker compose exec backend alembic upgrade head
   ```

3. **Watch the backend logs**
   ```bash
   docker compose logs -f backend
   ```

4. **Stop the stack**
   - **Stop while preserving data**: `docker compose down`
   - **Stop and wipe data**: `docker compose down -v`

## Running the frontend locally

To run the frontend locally, you can open `frontend/index.html` with the Live Server VS Code extension, or run `python -m http.server 5500` from inside the `frontend/` folder. Confirm the backend's `allow_origins` in `app/main.py` includes whatever port you're using.

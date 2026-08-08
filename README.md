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

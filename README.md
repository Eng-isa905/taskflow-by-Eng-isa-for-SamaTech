# TaskFlow by Sama Tech Engineering & Technology

**TaskFlow** is a bilingual Arabic/English project and task management system prototype developed by **Sama Tech Engineering & Technology** to demonstrate practical full-stack development capabilities for business clients. This repository describes the product and its current prototype scope; it does not claim real customers, production adoption, or measured business outcomes.

## Project Overview

TaskFlow provides a branded interface for project administration, server-backed authentication, and role-aware project operations. The interface supports Arabic (RTL) and English (LTR), with a language toggle that remembers the selection between pages. The product name remains TaskFlow.

## Business Use Case

Sama Tech can use TaskFlow as an internal demonstration and present it to prospective clients as an example of custom administrative software. The initial use case focuses on keeping project ownership, status, and date information in one simple view. Real project data is entered by the operator; demo projects are not silently seeded into the database.

## Features

- Arabic and English interfaces for the landing page, login, initial administrator setup, profile/access view, and project management, including automatic RTL/LTR layout switching.
- First-admin setup uses a locally configured one-time token; no fixed password is embedded in source code.
- Password hashes use `bcryptjs`; sessions are stored in SQLite and protected with HTTP-only cookies, CSRF validation, and login throttling.
- Roles: `admin`, `manager`, and `member`; server-side checks protect both the user directory and project operations.
- Project list with search and status filtering.
- Create, view, update, and delete projects (deletion is Admin-only).
- Project fields: generated reference, name, description, status, owner, start date, due date, and timestamps.
- Project summaries and completion percentages are derived from database records. Completion is calculated from completed tasks if tasks exist; it stays at 0% when a project has no tasks.
- Responsive visual identity using charcoal and green CSS variables.
- Docker Compose, health check, non-root container, and persistent named volume.

## Technology Stack

- Front end: HTML5, CSS3, Vanilla JavaScript, Fetch API.
- Back end: Node.js, Express 5, REST API.
- Database: SQLite with `better-sqlite3`.
- Authentication: `bcryptjs`, `express-session`, and a SQLite-backed session store.
- Runtime: Docker and Docker Compose.

## Application Architecture

- `server.js`: HTTP server, baseline security headers, sessions, CSRF, static hosting, health endpoint, and route registration.
- `routes/auth.js`: login, logout, current session, and first administrator setup.
- `routes/admin.js`: Admin-only user directory endpoint.
- `routes/projects.js`: protected project list, project details, create/update/delete, filtering, and validation.
- `middleware/auth.js`: current-user and role enforcement.
- `db.js`: schema initialization and database configuration.
- `public/`: Arabic/English HTML, CSS, browser JavaScript, and the persistent language selector.
- `tests/`: automated tests for authentication, schema, migration, and project role/CRUD behavior.

## Database Schema

The existing schema contains `users`, `projects`, and `tasks`, plus `schema_migrations`, `http_sessions`, and `auth_login_attempts`. Project ownership and creator fields refer to `users`. Tasks belong to projects and are configured with `ON DELETE CASCADE` so deleting a project removes its dependent tasks. The prototype has not added a separate migration because project fields already existed in the second-stage schema.

## REST API

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Runtime and database health |
| GET | `/api/auth/me` | Session-aware | Current user and capabilities |
| POST | `/api/auth/login` | Public + CSRF | Create authenticated session |
| POST | `/api/auth/logout` | Auth session + CSRF | End session |
| GET | `/api/projects` | Authenticated | List projects; supports `q` and `status` query parameters |
| GET | `/api/projects/:id` | Authenticated | Project and associated task summary |
| GET | `/api/projects/users` | Admin, Manager | Active users for project ownership assignment |
| POST | `/api/projects` | Admin, Manager | Create project |
| PUT | `/api/projects/:id` | Admin, Manager | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project and dependent tasks |

State-changing requests use the CSRF token supplied by `/api/auth/csrf`. SQL operations use prepared statements, and user-controlled fields are validated on the server.

## Docker Setup

The project expects the public host port to be `3001` so it does not conflict with another local application on port `3000`. The app still listens on port `3000` inside its container.

```powershell
# Keep your existing .env and named volume.
docker compose config
docker compose up -d --build
docker compose ps
Invoke-RestMethod http://localhost:3001/api/health
```

The Compose file uses the named volume `taskflow_data` mounted at `/app/data`. `docker compose down` does not delete the volume. Do not use `docker compose down -v` if the local database must be preserved.

## Environment Variables

Copy `.env.example` to `.env` for a fresh setup and set strong random values for `SESSION_SECRET` and `SETUP_TOKEN`. Do not overwrite an existing `.env` during upgrades.

- `HOST_PORT`: host-facing port (default `3001`).
- `PORT`: port inside the container (default `3000`).
- `DB_PATH`: database file path (default `/app/data/taskflow.sqlite`).
- `SESSION_SECRET`: strong secret for signing session cookies.
- `SETUP_TOKEN`: random one-time token required before creating the first admin.
- `COOKIE_SECURE`: set `true` when the app is served over HTTPS.
- `TRUST_PROXY`: enable only when deployed behind a trusted proxy.

## Security

The prototype includes password hashing, server-side sessions, HTTP-only cookies, `SameSite=Strict`, CSRF checks on state-changing API requests, login throttling, content security headers, role enforcement on the server, request body size limits, and parameterized SQL. This is a showcase prototype, not a formal security certification. Review deployment settings before exposing it to a public network.

## Testing

Run the test suite in an environment with the package dependencies installed:

```powershell
npm install
npm test
```

On a Docker image that includes the `tests/` directory, you can also use:

```powershell
docker compose exec taskflow npm test
```

Tests use temporary SQLite databases for authentication, schema, migration, and project checks. Test results must be confirmed by running the commands in the target environment; they are not implied by the existence of test files.

## Screenshots

Place genuine screenshots captured from the running application in `screenshots/`. No fictional customer logos, testimonials, or endorsements are included.

- `screenshots/landing-ar.png` — Arabic product landing page.
- `screenshots/landing-en.png` — English product landing page.
- `screenshots/projects-ar.png` / `screenshots/projects-en.png` — Project list and filters in both languages.
- `screenshots/project-details-ar.png` / `screenshots/project-details-en.png` — Project details in both languages.

## Known Limitations

- Task creation and editing are not yet available in this stage; project progress uses tasks that exist in the database and otherwise shows 0%.
- Full dashboard analytics, Chart.js visualizations, notifications, file attachments, and user management screens are not implemented yet.
- The prototype is single-organization by design; it does not implement multi-tenancy.
- Deleting a project also deletes its associated tasks due to the schema's cascade relationship.
- No demo projects or usage statistics are seeded automatically.

## Future Improvements

- Task CRUD, assignment, and workflow controls.
- Dashboard analytics and Chart.js visualizations.
- User management UI and profile settings.
- Exportable project reports and notifications.
- Optional customer-specific branding and a reviewed multi-tenant architecture if the business requires it.

## License and Attribution

Developed by **Sama Tech Engineering & Technology** as a product prototype for demonstrating customized software solutions. No client endorsement or commercial deployment is claimed.

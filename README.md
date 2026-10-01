# The Expertise Wins

> [The Expertise Wins on Telegram](https://t.me/+D_jIXFB807E0NmRk)

The Expertise Wins is a monorepo containing a sports-tip CLI, an Express/Prisma API, and a Next.js frontend. The CLI currently writes local JSON snapshots and formatted cards; channel publication and result settlement are manual.

## Project Structure

- `cli/` collects and normalizes FreeTips records, writes local snapshots, formats cards, and applies manually pasted settlement markers.
- `backend/` contains the Express API, PostgreSQL Prisma schema, and a seed importer for the dated CLI dumps.
- `frontend/` contains the Next.js public site, blog, account pages, and admin dashboard UI.

See the [CLI guide](./cli/README.md), [backend guide](./backend/README.md), and [frontend guide](./frontend/README.md) for package-specific details.

## Current Readiness

The backend is not ready to launch: `backend/middleware/authentication.js` currently fails JavaScript parsing, and admin/tip-management authorization needs server-side role checks. A local PostgreSQL database and `backend/.env` must also be configured before migrations and seeding. The backend guide documents the setup sequence and known issues.

The CLI can run independently of the backend. It does not send data to the API or publish directly to Telegram; settlement uses manually pasted result markers and an exact-date JSON dump.

## Quick Start
## Docker Development

Install Docker Desktop with its WSL 2 backend enabled. In VS Code, install the Dev Containers extension, open this repository, and choose **Dev Containers: Reopen in Container**. VS Code and Compose run the Node.js environment and PostgreSQL in Linux containers, leaving host .NET installations separate.

The Compose setup exposes the frontend at `http://localhost:3181`, the API at `http://localhost:3180`, and PostgreSQL at `localhost:55432`. App dependencies and the database live in Docker volumes. `docker compose down` stops the services while preserving database data; do not use `docker compose down -v` unless you intend to delete that data.

The API still has the known syntax error in `backend/middleware/authentication.js`, so it will not become available until that code issue is fixed. The frontend and PostgreSQL can start independently.

To start the stack without opening VS Code in the container:

```bash
docker compose up --build
```

Optional port and local database overrides can be placed in a root `.env` file (ignored by Git): `API_HOST_PORT`, `FRONTEND_HOST_PORT`, `POSTGRES_HOST_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `JWT_SECRET`. Defaults are intended only for local development.

## Quick Start

Install dependencies separately for each package you plan to run:

```bash
npm install --prefix cli
npm install --prefix backend
npm install --prefix frontend
```

After the backend is fixed, configured, and migrated, the root development command starts the API and frontend together:

```bash
npm run dev
```

Run the CLI workflows from the repository root:

```bash
npm run expertise
npm run settlement
```

## API Areas

| Area | Current purpose |
|---|---|
| Authentication | Registration, login, profiles, password changes, and avatar upload |
| Tips | Public and product-filtered queries, tip details, and management; public visibility and write authorization need tightening |
| Statistics | Performance summaries and time-filtered analytics calculated from tips |
| Products and access | Product information and access-token redemption/verification |
| Administration | User, tip, publication, access-token, and product management; role enforcement remains to be fixed |

Subscription-style access is represented by access tokens; the Prisma schema has no separate `Subscription` or analytics-record model.

## License

MIT License.
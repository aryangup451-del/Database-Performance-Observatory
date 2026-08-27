# Phase 5: Massive Multi-Engine Expansion (RALPLAN-DR)

## 1. Planner Perspective
**Goal**: Expand the DPO to support SQLite, Oracle, MariaDB, Microsoft SQL Server, IBM DB2, Google Cloud SQL, and Snowflake.
**Scope**: 
- We need to modify the UI to dynamically render any number of databases rather than the hardcoded 2-column layout.
- We need to handle a mix of **Local** (Docker) databases and **Cloud-native** databases.

## 2. Architect Perspective
Our backend was designed to be pluggable, so adding new databases requires adding new `Executor` and `Analyzer` classes. 
- **Local DBs (MariaDB, MS SQL Server, SQLite)**: 
  - MariaDB is a drop-in replacement for MySQL and uses similar EXPLAIN JSON.
  - MSSQL will be added to `docker-compose.yml` using `mcr.microsoft.com/mssql/server`. We will use `SET SHOWPLAN_JSON ON`.
  - SQLite will run natively in the Node.js process using `sqlite3`.
- **Heavy Enterprise DBs (Oracle, IBM DB2)**: 
  - These have massive Docker images (Oracle Free is ~4GB, DB2 is ~2GB) and require accepting specific licensing terms. We will add them to a secondary `docker-compose.enterprise.yml` to prevent crashing your machine.
- **Cloud DBs (Google Cloud SQL, Snowflake)**:
  - These *cannot* be run locally via Docker.
  - We will add connection string variables to the `.env` file. If the user provides credentials, the API will query them. Snowflake uses `SYSTEM$EXPLAIN_PLAN_JSON`.

## 3. Critic Perspective (Pre-Mortem)
- **Risk 1 (Hardware Crash)**: Spinning up 8 relational databases (including Oracle and DB2) simultaneously will consume 12-16GB of RAM and likely crash Docker. 
  - *Mitigation*: We must split the `docker-compose` files or start them conditionally.
- **Risk 2 (Cloud Authentication)**: The app will fail to query Snowflake/Cloud SQL if you don't actually have paid accounts for them. 
  - *Mitigation*: The backend must gracefully catch connection errors for missing cloud credentials and simply skip them in the dashboard without crashing the whole analysis.
- **Risk 3 (Frontend Overflow)**: A side-by-side comparison of 8 databases will not fit on a screen.
  - *Mitigation*: We will redesign the frontend results pane into a responsive Masonry grid or horizontal scroll layout.

## 4. Execution Phases
- **Step 1**: Update `.env` and `docker-compose` structure to support the new local DBs.
- **Step 2**: Create `sqlite`, `mariadb`, `mssql`, `oracle`, `db2`, and `snowflake` Executors/Analyzers in the backend.
- **Step 3**: Update the `QueryAnalysis.js` model to accept dynamic engine keys.
- **Step 4**: Rewrite the React frontend to dynamically map over the `results` object and render cards in a responsive grid.

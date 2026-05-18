# University Makeup Lecture Scheduler

Production-ready Next.js 14 App Router backend and frontend for a University Makeup Lecture and Room Arrangement System.

## Tech Stack

- Next.js 14 App Router
- TypeScript
- PostgreSQL via Prisma
- Prisma ORM
- NextAuth.js v5 credentials auth
- bcryptjs password hashing
- Vercel deployment

## Local Setup

1. Clone the repo and enter the app folder.

   ```bash
   cd uni-scheduler
   ```

2. Install dependencies.

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and fill in the values.

   ```bash
   cp .env.example .env.local
   ```

   Required values:

   ```bash
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
   NEXTAUTH_SECRET="your-generated-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

   Generate `NEXTAUTH_SECRET` with:

   ```bash
   openssl rand -base64 32
   ```

4. Apply Prisma migrations to your database.

   ```bash
   npx prisma migrate deploy
   ```

5. Seed demo data.

   ```bash
   npm run db:seed
   ```

   Demo teacher accounts:

   - `ahmed@university.edu`
   - `fatima@university.edu`
   - `ali@university.edu`

   Password for all demo accounts:

   ```text
   pass123
   ```

6. Start the local server.

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Deployment To Vercel

1. Push the project to GitHub.
2. Import the project in the Vercel dashboard.
3. Add these environment variables in Vercel:
   - `DATABASE_URL`: a PostgreSQL production database connection string, for example from Vercel Postgres, Neon, or Supabase.
   - `NEXTAUTH_SECRET`: generated with `openssl rand -base64 32`.
   - `NEXTAUTH_URL`: your Vercel deployment URL, for example `https://your-app.vercel.app`.
   - Remove any old `DATABASE_URL` value like `file:./dev.db`; SQLite only works locally.
4. Deploy.

Vercel runs the configured build command:

```bash
npm run vercel-build
```

The `postinstall` script also runs `prisma generate` after dependency installation.

## Useful Scripts

```bash
npm run dev       # start local development server
npm run build     # generate Prisma client and build Next.js
npm run start     # start production server
npx prisma migrate deploy # create/update database tables from migrations
npm run db:seed   # insert demo teachers and sample lecture
npm run db:studio # open Prisma Studio
```

## API Overview

- `POST /api/auth/signup`: create a teacher account with a bcrypt-hashed password.
- `POST /api/auth/[...nextauth]`: NextAuth credentials login.
- `GET /api/lectures`: public lecture list with optional `department`, `semester`, and `section` filters.
- `POST /api/lectures`: authenticated lecture creation with server-side validation and conflict checks.
- `DELETE /api/lectures/[id]`: authenticated deletion; teachers can delete only their own lectures.
- `GET /api/teachers`: authenticated teacher list without passwords.
- `POST /api/seed`: development-only API seed route.

## Security Notes

- Passwords are hashed with bcryptjs rounds `12`.
- API responses never return password hashes.
- Protected routes require a valid NextAuth session.
- Prisma queries are parameterized through the Prisma Client.
- POST routes validate request bodies before database writes.
- For production auth rate limiting, add Upstash Rate Limit with Vercel KV around `/api/auth/signup` and credentials sign-in.

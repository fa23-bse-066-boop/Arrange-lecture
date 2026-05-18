import { spawnSync } from "node:child_process";

const postgresUrlKeys = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL",
];

function isPostgresUrl(value) {
  return typeof value === "string" && /^postgres(ql)?:\/\//.test(value);
}

const selectedKey = postgresUrlKeys.find((key) => isPostgresUrl(process.env[key]));

if (!selectedKey) {
  const currentDatabaseUrl = process.env.DATABASE_URL || "(not set)";

  console.error(
    [
      "Vercel build needs a PostgreSQL database URL.",
      `Current DATABASE_URL is: ${currentDatabaseUrl}`,
      "",
      "Fix in Vercel Project Settings > Environment Variables:",
      "- Set DATABASE_URL to your PostgreSQL connection string, or",
      "- Connect Vercel Postgres/Neon/Supabase so one of POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING, or POSTGRES_URL is available.",
      "",
      "SQLite URLs such as file:./dev.db only work locally and cannot be used for this Vercel deployment.",
    ].join("\n"),
  );
  process.exit(1);
}

process.env.DATABASE_URL = process.env[selectedKey];
console.log(`Using ${selectedKey} for Prisma DATABASE_URL.`);

for (const command of [
  "prisma migrate deploy",
  "prisma generate",
  "next build",
]) {
  const result = spawnSync(command, {
    env: process.env,
    shell: true,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

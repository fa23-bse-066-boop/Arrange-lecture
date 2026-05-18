import { prisma } from "../lib/prisma";

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Teacher" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "department" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Lecture" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "subject" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "department" TEXT NOT NULL,
      "semester" INTEGER NOT NULL,
      "section" TEXT NOT NULL,
      "day" TEXT NOT NULL,
      "date" TEXT NOT NULL,
      "slot" TEXT NOT NULL,
      "room" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'scheduled',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "teacherId" INTEGER NOT NULL,
      CONSTRAINT "Lecture_teacherId_fkey"
        FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Teacher_email_key" ON "Teacher"("email");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Lecture_date_slot_room_idx" ON "Lecture"("date", "slot", "room");`);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Lecture_date_slot_department_semester_section_idx"
    ON "Lecture"("date", "slot", "department", "semester", "section");
  `);

  console.log("SQLite database is ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

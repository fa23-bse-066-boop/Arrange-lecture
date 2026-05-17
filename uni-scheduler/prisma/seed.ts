import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const password = await bcrypt.hash("pass123", 12);

  const ahmed = await prisma.teacher.upsert({
    where: { email: "ahmed@university.edu" },
    update: { name: "Dr. Ahmed Khan", department: "CS", password },
    create: {
      name: "Dr. Ahmed Khan",
      email: "ahmed@university.edu",
      department: "CS",
      password,
    },
  });

  await prisma.teacher.upsert({
    where: { email: "fatima@university.edu" },
    update: { name: "Dr. Fatima Malik", department: "SE", password },
    create: {
      name: "Dr. Fatima Malik",
      email: "fatima@university.edu",
      department: "SE",
      password,
    },
  });

  await prisma.teacher.upsert({
    where: { email: "ali@university.edu" },
    update: { name: "Prof. Ali Raza", department: "AI", password },
    create: {
      name: "Prof. Ali Raza",
      email: "ali@university.edu",
      department: "AI",
      password,
    },
  });

  const existingLecture = await prisma.lecture.findFirst({
    where: {
      subject: "Data Structures",
      date: "2026-05-19",
      slot: "Slot 1",
      teacherId: ahmed.id,
    },
  });

  if (!existingLecture) {
    await prisma.lecture.create({
      data: {
        subject: "Data Structures",
        type: "Lecture",
        department: "BSCS",
        semester: 4,
        section: "A",
        day: "Tuesday",
        date: "2026-05-19",
        slot: "Slot 1",
        room: "SE-1",
        teacherId: ahmed.id,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

import { prisma } from "../lib/prisma";

async function main() {
  console.log("Seed script ready. Teachers must be created via the signup API.");
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

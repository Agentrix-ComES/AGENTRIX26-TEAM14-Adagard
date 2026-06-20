import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  // Idempotent: reset the starter tables, then insert a few rows.
  await prisma.book.deleteMany();
  await prisma.author.deleteMany();

  const author = await prisma.author.create({
    data: {
      name: "Sample Author",
      books: { create: [{ title: "First Steps" }, { title: "Second Draft" }] },
    },
  });

  console.log(`Seeded author "${author.name}" with 2 books.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

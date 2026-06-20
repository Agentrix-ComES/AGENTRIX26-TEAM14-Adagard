import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  // One read against the linked Prisma Postgres.
  const authors = await prisma.author.count();
  const books = await prisma.book.count();
  console.log(`✅ Connected — ${authors} author(s), ${books} book(s) in the database.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Verify failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

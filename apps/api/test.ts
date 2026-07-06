import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const reports = await prisma.report.findMany({
    include: {
      message: {
        include: {
          membership: {
            select: { anonymousName: true, avatarSeed: true }
          }
        }
      },
      reporter: {
        select: { id: true, anonymousName: true, avatarSeed: true }
      }
    }
  });
  console.log("REPORTS:", JSON.stringify(reports, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

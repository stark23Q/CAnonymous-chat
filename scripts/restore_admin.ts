import { PrismaClient, MembershipStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.membership.updateMany({
    where: {
      userId: "notrace-admin"
    },
    data: {
      status: MembershipStatus.APPROVED,
      bannedAt: null,
      removedAt: null
    }
  });
  console.log("Admin membership restored to APPROVED.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

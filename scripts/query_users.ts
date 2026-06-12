import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      memberships: true
    },
    orderBy: { createdAt: "desc" },
    take: 5
  });
  console.log(JSON.stringify(users, null, 2));

  const tokens = await prisma.oneTimeToken.findMany({
    orderBy: { createdAt: "desc" },
    take: 5
  });
  console.log(JSON.stringify(tokens, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

const { PrismaClient } = require('./packages/database');
const prisma = new PrismaClient();
prisma.report.findMany({
  include: {
    reporter: {
      select: { id: true, anonymousName: true, avatarSeed: true }
    },
    message: {
      include: {
        membership: {
          select: { anonymousName: true, avatarSeed: true }
        }
      }
    }
  }
}).then(reports => {
  console.log("Success:", reports);
}).catch(err => {
  console.error("Prisma Error:", err);
}).finally(() => {
  prisma.$disconnect();
});

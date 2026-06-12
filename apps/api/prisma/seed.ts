import { ChannelKind, MembershipStatus, RetentionPolicy, UserRole } from "@prisma/client";
import { hashLookupValue } from "../src/lib/crypto.js";
import { prisma } from "../src/lib/prisma.js";
import { createPseudonym } from "../src/services/pseudonyms.js";

const demoInviteCode = "NOTRACE-DEMO";

async function main() {
  const adminIdentity = createPseudonym();
  const admin = await prisma.user.upsert({
    where: { id: "notrace-admin" },
    update: { role: UserRole.ADMIN },
    create: {
      id: "notrace-admin",
      anonymousName: "RootCipher",
      avatarSeed: adminIdentity.avatarSeed,
      role: UserRole.ADMIN
    }
  });

  const group = await prisma.group.upsert({
    where: { slug: "notrace-lounge" },
    update: {},
    create: {
      name: "NoTrace Lounge",
      slug: "notrace-lounge",
      description: "A private invite-only space for anonymous conversation, memes, confessions, and signal-safe discussion.",
      rules: "Protect anonymity. No doxxing. No harassment. Keep personal identifiers out of chat. Report abusive content.",
      retentionPolicy: RetentionPolicy.DAYS_7,
      privacyMode: true,
      readReceiptsEnabled: false,
      typingEnabled: true,
      createdById: admin.id,
      channels: {
        create: [
          { name: "general", position: 0 },
          { name: "memes", position: 1 },
          { name: "confessions", position: 2 },
          { name: "discussion", position: 3 },
          { name: "voice-room", kind: ChannelKind.VOICE_FUTURE, position: 4 }
        ]
      }
    }
  });

  const membershipIdentity = createPseudonym();
  await prisma.membership.upsert({
    where: {
      userId_groupId: {
        userId: admin.id,
        groupId: group.id
      }
    },
    update: { status: MembershipStatus.APPROVED },
    create: {
      userId: admin.id,
      groupId: group.id,
      anonymousName: membershipIdentity.anonymousName,
      avatarSeed: membershipIdentity.avatarSeed,
      status: MembershipStatus.APPROVED,
      joinedAt: new Date()
    }
  });

  await prisma.invitation.upsert({
    where: { codeHash: hashLookupValue(demoInviteCode) },
    update: { disabledAt: null },
    create: {
      groupId: group.id,
      codeHash: hashLookupValue(demoInviteCode),
      createdById: admin.id,
      label: "Development demo invite",
      maxUses: 100
    }
  });

  console.log(`Seed complete. Admin user: ${admin.id}. Demo invite code: ${demoInviteCode}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

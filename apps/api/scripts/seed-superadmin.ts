import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, PrimaryRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPERADMIN_EMAIL || 'superadmin@esportm.com';
  const password = process.env.SUPERADMIN_PASSWORD || 'Admin@123456';

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const hashed = await bcrypt.hash(password, 10);

    user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashed,
        fullName: 'Super Admin',
        isPlatformAdmin: true,
      } as any,
    });

    console.log('User created');
  } else {
    await (prisma as any).user.update({
      where: { id: user.id },
      data: { isPlatformAdmin: true },
    });
    console.log('User already exists');
  }

  const systemSlug = 'esportm-system';

  let club = await prisma.club.findUnique({
    where: { slug: systemSlug },
  });

  if (!club) {
    club = await prisma.club.create({
      data: {
        name: 'EsportM System',
        slug: systemSlug,
      },
    });

    console.log('System club created');
  }

  const existingMembership = await prisma.membership.findUnique({
    where: {
      userId_clubId: {
        userId: user.id,
        clubId: club.id,
      },
    },
  });

  if (!existingMembership) {
    await prisma.membership.create({
      data: {
        userId: user.id,
        clubId: club.id,
        primary: PrimaryRole.ADMIN,
        subRoles: [],
      },
    });
    console.log('Admin membership created');
  } else {
    console.log('Membership already exists');
  }

  console.log('\nSuperadmin ready');
  console.log('Email:', email);
  console.log('Password:', password);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

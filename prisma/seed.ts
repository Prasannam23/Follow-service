import prisma from '../src/db/prisma';

async function main() {
  const users = [
    { username: 'alice', displayName: 'Alice' },
    { username: 'bob', displayName: 'Bob' },
    { username: 'carol', displayName: 'Carol' }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { displayName: u.displayName },
      create: { username: u.username, displayName: u.displayName }
    });
  }

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

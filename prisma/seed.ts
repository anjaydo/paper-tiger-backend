import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: pool });

async function main() {
  await prisma.product.createMany({
    data: [
      { name: 'Bàn phím cơ Custom', price: 2500000, stock: 10 },
      { name: 'Chuột Gaming không dây', price: 1200000, stock: 20 },
      { name: 'Lót chuột Master NestJS', price: 500000, stock: 50 },
    ],
  });
  console.log('✅ Đã đổ dữ liệu mẫu xong!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

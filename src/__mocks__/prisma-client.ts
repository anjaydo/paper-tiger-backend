/**
 * Jest mock for Prisma client. Used so tests never load the real generated client
 * (which uses ESM .js imports Jest cannot resolve). Configure in Jest moduleNameMapper.
 */
export class PrismaClient {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_opts?: unknown) {}
  $disconnect = jest.fn().mockResolvedValue(undefined);
  order = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateManyAndReturn: jest.fn(),
  };
  product = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  };
}

export const Prisma = {};

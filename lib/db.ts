// Prisma DB implementation
import { PrismaClient } from '@prisma/client';

declare global {
  // Allow global Prisma instance in development
  var prisma: PrismaClient | undefined;
}

export const db = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === 'development') {
  global.prisma = db;
}

export type DBClient = PrismaClient;
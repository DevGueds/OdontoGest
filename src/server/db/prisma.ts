import { PrismaClient } from '@prisma/client';

// Query/error logs may include personal data and parameters; log only sanitized events in app.ts.
export const prisma = new PrismaClient();

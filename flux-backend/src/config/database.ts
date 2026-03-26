import prisma from "./prisma";

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
  } catch (error) {
    process.stderr.write(`[Flux] Error al conectar con SQLite: ${error}\n`);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
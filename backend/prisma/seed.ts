import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@comprovos.com";
  const adminPassword = "123456";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        name: "Admin ComprovOS",
        passwordHash,
        role: UserRole.ADMIN,
      },
    });

    console.log("✅ Admin atualizado com sucesso.");
  } else {
    await prisma.user.create({
      data: {
        name: "Admin ComprovOS",
        email: adminEmail,
        passwordHash,
        role: UserRole.ADMIN,
      },
    });

    console.log("✅ Admin criado com sucesso.");
  }

  console.log("📧 Email:", adminEmail);
  console.log("🔑 Senha:", adminPassword);
}

main()
  .catch((error) => {
    console.error("❌ Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
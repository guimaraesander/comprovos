-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TECNICO');

-- CreateEnum
CREATE TYPE "ServiceOrderStatus" AS ENUM ('ABERTA', 'EM_ANALISE', 'AGUARDANDO_APROVACAO', 'EM_MANUTENCAO', 'FINALIZADA', 'ENTREGUE', 'CANCELADA');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TECNICO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "cpfCnpj" TEXT,
    "rgIe" TEXT,
    "address" TEXT,
    "district" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_orders" (
    "id" TEXT NOT NULL,
    "osNumber" SERIAL NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientCpfCnpj" TEXT NOT NULL,
    "equipmentType" TEXT NOT NULL,
    "equipmentBrand" TEXT,
    "equipmentModel" TEXT,
    "equipmentSerialNumber" TEXT,
    "equipmentPassword" TEXT,
    "symptoms" TEXT NOT NULL,
    "accessories" TEXT,
    "observations" TEXT,
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'ABERTA',
    "budgetValue" DECIMAL(10,2),
    "finalValue" DECIMAL(10,2),
    "webKey" TEXT,
    "trackingPassword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_history" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "previousStatus" "ServiceOrderStatus",
    "newStatus" "ServiceOrderStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_order_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_osNumber_key" ON "service_orders"("osNumber");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_webKey_key" ON "service_orders"("webKey");

-- CreateIndex
CREATE INDEX "service_orders_clientId_idx" ON "service_orders"("clientId");

-- CreateIndex
CREATE INDEX "service_orders_status_idx" ON "service_orders"("status");

-- CreateIndex
CREATE INDEX "service_order_history_serviceOrderId_idx" ON "service_order_history"("serviceOrderId");

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_history" ADD CONSTRAINT "service_order_history_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

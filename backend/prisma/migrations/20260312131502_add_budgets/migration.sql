/*
  Warnings:

  - Made the column `phone` on table `clients` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cpfCnpj` on table `clients` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "clients" ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "cpfCnpj" SET NOT NULL;

-- CreateTable
CREATE TABLE "service_order_budgets" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "travelFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "thirdPartyFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "note" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_order_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_budget_items" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "technician" TEXT,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unitValue" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_order_budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_order_budgets_serviceOrderId_key" ON "service_order_budgets"("serviceOrderId");

-- CreateIndex
CREATE INDEX "service_order_budgets_serviceOrderId_idx" ON "service_order_budgets"("serviceOrderId");

-- CreateIndex
CREATE INDEX "service_order_budget_items_budgetId_idx" ON "service_order_budget_items"("budgetId");

-- CreateIndex
CREATE INDEX "clients_cpfCnpj_idx" ON "clients"("cpfCnpj");

-- AddForeignKey
ALTER TABLE "service_order_budgets" ADD CONSTRAINT "service_order_budgets_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_budget_items" ADD CONSTRAINT "service_order_budget_items_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "service_order_budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

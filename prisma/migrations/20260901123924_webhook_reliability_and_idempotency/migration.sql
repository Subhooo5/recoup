/*
  Warnings:

  - A unique constraint covering the columns `[razorpay_payment_id]` on the table `payment_event` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pipeline,source_id]` on the table `recovery_case` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "payment_event_razorpay_payment_id_idx";

-- AlterTable
ALTER TABLE "webhook_event" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'received';

-- CreateIndex
CREATE UNIQUE INDEX "payment_event_razorpay_payment_id_key" ON "payment_event"("razorpay_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "recovery_case_pipeline_source_id_key" ON "recovery_case"("pipeline", "source_id");

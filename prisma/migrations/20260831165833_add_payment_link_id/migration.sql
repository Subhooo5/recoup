/*
  Warnings:

  - A unique constraint covering the columns `[razorpay_payment_link_id]` on the table `checkout_session` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[razorpay_payment_link_id]` on the table `recovery_action` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "checkout_session" ADD COLUMN     "razorpay_payment_link_id" TEXT;

-- AlterTable
ALTER TABLE "recovery_action" ADD COLUMN     "razorpay_payment_link_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "checkout_session_razorpay_payment_link_id_key" ON "checkout_session"("razorpay_payment_link_id");

-- CreateIndex
CREATE UNIQUE INDEX "recovery_action_razorpay_payment_link_id_key" ON "recovery_action"("razorpay_payment_link_id");

-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_event" (
    "id" TEXT NOT NULL,
    "razorpay_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "account_id" TEXT,
    "payload" JSONB NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_event" (
    "id" TEXT NOT NULL,
    "razorpay_payment_id" TEXT NOT NULL,
    "razorpay_order_id" TEXT,
    "event_type" TEXT NOT NULL,
    "customer_id" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "method" TEXT,
    "status" TEXT NOT NULL,
    "error_code" TEXT,
    "error_description" TEXT,
    "error_reason" TEXT,
    "error_source" TEXT,
    "error_step" TEXT,
    "contact" TEXT,
    "email" TEXT,
    "razorpay_created_at" TIMESTAMP(3) NOT NULL,
    "raw_payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_session" (
    "id" TEXT NOT NULL,
    "razorpay_order_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "amount" INTEGER NOT NULL,
    "amount_paid" INTEGER NOT NULL,
    "amount_due" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "receipt" TEXT,
    "status" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "notes" JSONB,
    "cart_value" INTEGER,
    "items_summary" TEXT,
    "payment_method_selected" TEXT,
    "frontend_session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "last_checked_at" TIMESTAMP(3),
    "abandoned_at" TIMESTAMP(3),
    "recovered_at" TIMESTAMP(3),

    CONSTRAINT "checkout_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "razorpay_subscription_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "plan_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "auth_attempts" INTEGER NOT NULL DEFAULT 0,
    "total_count" INTEGER,
    "paid_count" INTEGER,
    "remaining_count" INTEGER,
    "charge_at" TIMESTAMP(3),
    "current_start" TIMESTAMP(3),
    "current_end" TIMESTAMP(3),
    "last_failure_code" TEXT,
    "last_failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_case" (
    "id" TEXT NOT NULL,
    "pipeline" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "amount" INTEGER,
    "diagnosis" TEXT,
    "diagnosis_evidence" JSONB,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "recovery_case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_action" (
    "id" TEXT NOT NULL,
    "recovery_case_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "decision_json" JSONB NOT NULL,
    "gate_result" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "outcome" TEXT,
    "amount_recovered" INTEGER,
    "executed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recovery_action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_event" (
    "id" TEXT NOT NULL,
    "recovery_action_id" TEXT,
    "customer_id" TEXT,
    "channel" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "subject" TEXT,
    "status" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pipeline" TEXT NOT NULL,
    "rule_type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_snapshot" (
    "id" TEXT NOT NULL,
    "pipeline" TEXT NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "window_end" TIMESTAMP(3) NOT NULL,
    "amount_recovered" INTEGER NOT NULL,
    "case_count" INTEGER NOT NULL,
    "recovered_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_email_key" ON "customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_event_razorpay_event_id_key" ON "webhook_event"("razorpay_event_id");

-- CreateIndex
CREATE INDEX "payment_event_razorpay_payment_id_idx" ON "payment_event"("razorpay_payment_id");

-- CreateIndex
CREATE INDEX "payment_event_customer_id_idx" ON "payment_event"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "checkout_session_razorpay_order_id_key" ON "checkout_session"("razorpay_order_id");

-- CreateIndex
CREATE INDEX "checkout_session_customer_id_idx" ON "checkout_session"("customer_id");

-- CreateIndex
CREATE INDEX "checkout_session_status_idx" ON "checkout_session"("status");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_razorpay_subscription_id_key" ON "subscription"("razorpay_subscription_id");

-- CreateIndex
CREATE INDEX "subscription_customer_id_idx" ON "subscription"("customer_id");

-- CreateIndex
CREATE INDEX "subscription_status_idx" ON "subscription"("status");

-- CreateIndex
CREATE INDEX "recovery_case_customer_id_idx" ON "recovery_case"("customer_id");

-- CreateIndex
CREATE INDEX "recovery_case_status_idx" ON "recovery_case"("status");

-- CreateIndex
CREATE UNIQUE INDEX "recovery_action_recovery_case_id_action_type_key" ON "recovery_action"("recovery_case_id", "action_type");

-- CreateIndex
CREATE INDEX "communication_event_customer_id_idx" ON "communication_event"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "policy_name_key" ON "policy"("name");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "payment_event" ADD CONSTRAINT "payment_event_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_session" ADD CONSTRAINT "checkout_session_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_case" ADD CONSTRAINT "recovery_case_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_action" ADD CONSTRAINT "recovery_action_recovery_case_id_fkey" FOREIGN KEY ("recovery_case_id") REFERENCES "recovery_case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_event" ADD CONSTRAINT "communication_event_recovery_action_id_fkey" FOREIGN KEY ("recovery_action_id") REFERENCES "recovery_action"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_event" ADD CONSTRAINT "communication_event_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

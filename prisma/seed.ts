import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const placeholderEmailNotice = [
  "SEED NOTICE: every customer email below is a placeholder on @recoup-app.dev.",
  "Swap these for real inboxes you control before the demo, or recovery emails will",
  "be sent to addresses that do not exist and every send will bounce.",
].join("\n");

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const daysFromNow = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const seedCustomers = [
  {
    name: "Aarav Mehta",
    email: "demo.customer.1@recoup-app.dev",
    phone: "+919000000001",
    paymentEvents: [
      {
        razorpayPaymentId: "pay_DemoSeedAarav01",
        razorpayOrderId: "order_DemoSeedAarav01",
        eventType: "payment.failed",
        amount: 249900,
        currency: "INR",
        method: "card",
        status: "failed",
        errorCode: "BAD_REQUEST_ERROR",
        errorDescription: "Your payment was declined by the issuing bank.",
        errorReason: "payment_failed",
        errorSource: "bank",
        errorStep: "payment_authorization",
        razorpayCreatedAt: daysAgo(9),
      },
      {
        razorpayPaymentId: "pay_DemoSeedAarav02",
        razorpayOrderId: "order_DemoSeedAarav01",
        eventType: "payment.captured",
        amount: 249900,
        currency: "INR",
        method: "upi",
        status: "captured",
        errorCode: null,
        errorDescription: null,
        errorReason: null,
        errorSource: null,
        errorStep: null,
        razorpayCreatedAt: daysAgo(9),
      },
    ],
    checkoutSessions: [
      {
        razorpayOrderId: "order_DemoSeedAarav01",
        amount: 249900,
        amountPaid: 249900,
        amountDue: 0,
        currency: "INR",
        receipt: "receipt_demo_aarav_01",
        status: "paid",
        attempts: 2,
        cartValue: 249900,
        itemsSummary: "Noise cancelling headphones x1",
        paymentMethodSelected: "upi",
        frontendSessionId: "session_demo_aarav_01",
        createdAt: daysAgo(9),
        lastCheckedAt: daysAgo(9),
        abandonedAt: null,
        recoveredAt: null,
      },
    ],
    subscription: {
      razorpaySubscriptionId: "sub_DemoSeedAarav01",
      planId: "plan_DemoSeedStandard",
      status: "active",
      authAttempts: 0,
      totalCount: 12,
      paidCount: 3,
      remainingCount: 9,
      chargeAt: daysFromNow(21),
      currentStart: daysAgo(9),
      currentEnd: daysFromNow(21),
      lastFailureCode: null,
      lastFailureReason: null,
      createdAt: daysAgo(99),
    },
  },
  {
    name: "Diya Sharma",
    email: "demo.customer.2@recoup-app.dev",
    phone: "+919000000002",
    paymentEvents: [
      {
        razorpayPaymentId: "pay_DemoSeedDiya01",
        razorpayOrderId: "order_DemoSeedDiya01",
        eventType: "payment.captured",
        amount: 89900,
        currency: "INR",
        method: "netbanking",
        status: "captured",
        errorCode: null,
        errorDescription: null,
        errorReason: null,
        errorSource: null,
        errorStep: null,
        razorpayCreatedAt: daysAgo(24),
      },
      {
        razorpayPaymentId: "pay_DemoSeedDiya02",
        razorpayOrderId: "order_DemoSeedDiya02",
        eventType: "payment.failed",
        amount: 156000,
        currency: "INR",
        method: "card",
        status: "failed",
        errorCode: "GATEWAY_ERROR",
        errorDescription: "Payment processing failed because of an error at the bank.",
        errorReason: "payment_failed",
        errorSource: "gateway",
        errorStep: "payment_authorization",
        razorpayCreatedAt: daysAgo(3),
      },
    ],
    checkoutSessions: [
      {
        razorpayOrderId: "order_DemoSeedDiya01",
        amount: 89900,
        amountPaid: 89900,
        amountDue: 0,
        currency: "INR",
        receipt: "receipt_demo_diya_01",
        status: "paid",
        attempts: 1,
        cartValue: 89900,
        itemsSummary: "Running shoes x1",
        paymentMethodSelected: "netbanking",
        frontendSessionId: "session_demo_diya_01",
        createdAt: daysAgo(24),
        lastCheckedAt: daysAgo(24),
        abandonedAt: null,
        recoveredAt: null,
      },
      {
        razorpayOrderId: "order_DemoSeedDiya02",
        amount: 156000,
        amountPaid: 0,
        amountDue: 156000,
        currency: "INR",
        receipt: "receipt_demo_diya_02",
        status: "attempted",
        attempts: 2,
        cartValue: 156000,
        itemsSummary: "Espresso machine x1, Bean grinder x1",
        paymentMethodSelected: "card",
        frontendSessionId: "session_demo_diya_02",
        createdAt: daysAgo(3),
        lastCheckedAt: daysAgo(2),
        abandonedAt: null,
        recoveredAt: null,
      },
    ],
    subscription: {
      razorpaySubscriptionId: "sub_DemoSeedDiya01",
      planId: "plan_DemoSeedStandard",
      status: "active",
      authAttempts: 0,
      totalCount: 12,
      paidCount: 8,
      remainingCount: 4,
      chargeAt: daysFromNow(11),
      currentStart: daysAgo(19),
      currentEnd: daysFromNow(11),
      lastFailureCode: null,
      lastFailureReason: null,
      createdAt: daysAgo(259),
    },
  },
  {
    name: "Rohan Iyer",
    email: "demo.customer.3@recoup-app.dev",
    phone: "+919000000003",
    paymentEvents: [
      {
        razorpayPaymentId: "pay_DemoSeedRohan01",
        razorpayOrderId: "order_DemoSeedRohan01",
        eventType: "payment.failed",
        amount: 49900,
        currency: "INR",
        method: "card",
        status: "failed",
        errorCode: "BAD_REQUEST_ERROR",
        errorDescription: "The card has insufficient funds to complete this payment.",
        errorReason: "insufficient_funds",
        errorSource: "customer",
        errorStep: "payment_authorization",
        razorpayCreatedAt: daysAgo(6),
      },
      {
        razorpayPaymentId: "pay_DemoSeedRohan02",
        razorpayOrderId: "order_DemoSeedRohan01",
        eventType: "payment.failed",
        amount: 49900,
        currency: "INR",
        method: "card",
        status: "failed",
        errorCode: "BAD_REQUEST_ERROR",
        errorDescription: "The card has insufficient funds to complete this payment.",
        errorReason: "insufficient_funds",
        errorSource: "customer",
        errorStep: "payment_authorization",
        razorpayCreatedAt: daysAgo(5),
      },
    ],
    checkoutSessions: [
      {
        razorpayOrderId: "order_DemoSeedRohan01",
        amount: 49900,
        amountPaid: 0,
        amountDue: 49900,
        currency: "INR",
        receipt: "receipt_demo_rohan_01",
        status: "attempted",
        attempts: 2,
        cartValue: 49900,
        itemsSummary: "Annual reading subscription x1",
        paymentMethodSelected: "card",
        frontendSessionId: "session_demo_rohan_01",
        createdAt: daysAgo(6),
        lastCheckedAt: daysAgo(5),
        abandonedAt: null,
        recoveredAt: null,
      },
    ],
    subscription: {
      razorpaySubscriptionId: "sub_DemoSeedRohan01",
      planId: "plan_DemoSeedPremium",
      status: "active",
      authAttempts: 2,
      totalCount: 24,
      paidCount: 5,
      remainingCount: 19,
      chargeAt: daysFromNow(2),
      currentStart: daysAgo(28),
      currentEnd: daysFromNow(2),
      lastFailureCode: "BAD_REQUEST_ERROR",
      lastFailureReason: "insufficient_funds",
      createdAt: daysAgo(154),
    },
  },
  {
    name: "Ananya Nair",
    email: "demo.customer.4@recoup-app.dev",
    phone: "+919000000004",
    paymentEvents: [
      {
        razorpayPaymentId: "pay_DemoSeedAnanya01",
        razorpayOrderId: "order_DemoSeedAnanya01",
        eventType: "payment.captured",
        amount: 1299000,
        currency: "INR",
        method: "netbanking",
        status: "captured",
        errorCode: null,
        errorDescription: null,
        errorReason: null,
        errorSource: null,
        errorStep: null,
        razorpayCreatedAt: daysAgo(41),
      },
      {
        razorpayPaymentId: "pay_DemoSeedAnanya02",
        razorpayOrderId: "order_DemoSeedAnanya02",
        eventType: "payment.captured",
        amount: 329900,
        currency: "INR",
        method: "upi",
        status: "captured",
        errorCode: null,
        errorDescription: null,
        errorReason: null,
        errorSource: null,
        errorStep: null,
        razorpayCreatedAt: daysAgo(12),
      },
    ],
    checkoutSessions: [
      {
        razorpayOrderId: "order_DemoSeedAnanya01",
        amount: 1299000,
        amountPaid: 1299000,
        amountDue: 0,
        currency: "INR",
        receipt: "receipt_demo_ananya_01",
        status: "paid",
        attempts: 1,
        cartValue: 1299000,
        itemsSummary: "Standing desk x1, Desk mat x1",
        paymentMethodSelected: "netbanking",
        frontendSessionId: "session_demo_ananya_01",
        createdAt: daysAgo(41),
        lastCheckedAt: daysAgo(41),
        abandonedAt: null,
        recoveredAt: null,
      },
      {
        razorpayOrderId: "order_DemoSeedAnanya03",
        amount: 74900,
        amountPaid: 0,
        amountDue: 74900,
        currency: "INR",
        receipt: "receipt_demo_ananya_03",
        status: "created",
        attempts: 0,
        cartValue: 74900,
        itemsSummary: "Mechanical keyboard x1",
        paymentMethodSelected: null,
        frontendSessionId: "session_demo_ananya_03",
        createdAt: daysAgo(1),
        lastCheckedAt: null,
        abandonedAt: null,
        recoveredAt: null,
      },
    ],
    subscription: {
      razorpaySubscriptionId: "sub_DemoSeedAnanya01",
      planId: "plan_DemoSeedPremium",
      status: "active",
      authAttempts: 0,
      totalCount: 24,
      paidCount: 14,
      remainingCount: 10,
      chargeAt: daysFromNow(17),
      currentStart: daysAgo(13),
      currentEnd: daysFromNow(17),
      lastFailureCode: null,
      lastFailureReason: null,
      createdAt: daysAgo(433),
    },
  },
  {
    name: "Kabir Rao",
    email: "demo.customer.5@recoup-app.dev",
    phone: "+919000000005",
    paymentEvents: [
      {
        razorpayPaymentId: "pay_DemoSeedKabir01",
        razorpayOrderId: "order_DemoSeedKabir01",
        eventType: "payment.captured",
        amount: 199900,
        currency: "INR",
        method: "wallet",
        status: "captured",
        errorCode: null,
        errorDescription: null,
        errorReason: null,
        errorSource: null,
        errorStep: null,
        razorpayCreatedAt: daysAgo(31),
      },
      {
        razorpayPaymentId: "pay_DemoSeedKabir02",
        razorpayOrderId: "order_DemoSeedKabir02",
        eventType: "payment.failed",
        amount: 459900,
        currency: "INR",
        method: "upi",
        status: "failed",
        errorCode: "BAD_REQUEST_ERROR",
        errorDescription: "The payment collect request timed out before approval.",
        errorReason: "payment_timed_out",
        errorSource: "customer",
        errorStep: "payment_authentication",
        razorpayCreatedAt: daysAgo(2),
      },
    ],
    checkoutSessions: [
      {
        razorpayOrderId: "order_DemoSeedKabir02",
        amount: 459900,
        amountPaid: 0,
        amountDue: 459900,
        currency: "INR",
        receipt: "receipt_demo_kabir_02",
        status: "attempted",
        attempts: 1,
        cartValue: 459900,
        itemsSummary: "Camera body x1, Prime lens x1",
        paymentMethodSelected: "upi",
        frontendSessionId: "session_demo_kabir_02",
        createdAt: daysAgo(2),
        lastCheckedAt: daysAgo(1),
        abandonedAt: null,
        recoveredAt: null,
      },
    ],
    subscription: {
      razorpaySubscriptionId: "sub_DemoSeedKabir01",
      planId: "plan_DemoSeedStandard",
      status: "active",
      authAttempts: 0,
      totalCount: 12,
      paidCount: 1,
      remainingCount: 11,
      chargeAt: daysFromNow(27),
      currentStart: daysAgo(3),
      currentEnd: daysFromNow(27),
      lastFailureCode: null,
      lastFailureReason: null,
      createdAt: daysAgo(33),
    },
  },
];

const buildPaymentRawPayload = (
  event: (typeof seedCustomers)[number]["paymentEvents"][number],
  contact: string,
  email: string,
) => ({
  entity: "event",
  event: event.eventType,
  source: "seed",
  payload: {
    payment: {
      entity: {
        id: event.razorpayPaymentId,
        entity: "payment",
        order_id: event.razorpayOrderId,
        amount: event.amount,
        currency: event.currency,
        status: event.status,
        method: event.method,
        contact,
        email,
        error_code: event.errorCode,
        error_description: event.errorDescription,
        error_reason: event.errorReason,
        error_source: event.errorSource,
        error_step: event.errorStep,
        created_at: Math.floor(event.razorpayCreatedAt.getTime() / 1000),
      },
    },
  },
});

const clearPreviousSeedData = async (customerIds: string[]) => {
  if (customerIds.length === 0) {
    return;
  }
  await prisma.paymentEvent.deleteMany({
    where: { customerId: { in: customerIds } },
  });
  await prisma.checkoutSession.deleteMany({
    where: { customerId: { in: customerIds } },
  });
  await prisma.subscription.deleteMany({
    where: { customerId: { in: customerIds } },
  });
};

const main = async () => {
  console.log(placeholderEmailNotice);
  console.log("");

  const previouslySeeded = await prisma.customer.findMany({
    where: { email: { in: seedCustomers.map((customer) => customer.email) } },
    select: { id: true },
  });

  await clearPreviousSeedData(previouslySeeded.map((customer) => customer.id));

  for (const seedCustomer of seedCustomers) {
    const customer = await prisma.customer.upsert({
      where: { email: seedCustomer.email },
      update: { name: seedCustomer.name, phone: seedCustomer.phone },
      create: {
        name: seedCustomer.name,
        email: seedCustomer.email,
        phone: seedCustomer.phone,
      },
    });

    for (const paymentEvent of seedCustomer.paymentEvents) {
      await prisma.paymentEvent.create({
        data: {
          razorpayPaymentId: paymentEvent.razorpayPaymentId,
          razorpayOrderId: paymentEvent.razorpayOrderId,
          eventType: paymentEvent.eventType,
          customerId: customer.id,
          amount: paymentEvent.amount,
          currency: paymentEvent.currency,
          method: paymentEvent.method,
          status: paymentEvent.status,
          errorCode: paymentEvent.errorCode,
          errorDescription: paymentEvent.errorDescription,
          errorReason: paymentEvent.errorReason,
          errorSource: paymentEvent.errorSource,
          errorStep: paymentEvent.errorStep,
          contact: seedCustomer.phone,
          email: seedCustomer.email,
          razorpayCreatedAt: paymentEvent.razorpayCreatedAt,
          rawPayload: buildPaymentRawPayload(
            paymentEvent,
            seedCustomer.phone,
            seedCustomer.email,
          ),
        },
      });
    }

    for (const checkoutSession of seedCustomer.checkoutSessions) {
      await prisma.checkoutSession.create({
        data: {
          razorpayOrderId: checkoutSession.razorpayOrderId,
          customerId: customer.id,
          amount: checkoutSession.amount,
          amountPaid: checkoutSession.amountPaid,
          amountDue: checkoutSession.amountDue,
          currency: checkoutSession.currency,
          receipt: checkoutSession.receipt,
          status: checkoutSession.status,
          attempts: checkoutSession.attempts,
          notes: {
            customerId: customer.id,
            customerEmail: seedCustomer.email,
            customerName: seedCustomer.name,
          },
          cartValue: checkoutSession.cartValue,
          itemsSummary: checkoutSession.itemsSummary,
          paymentMethodSelected: checkoutSession.paymentMethodSelected,
          frontendSessionId: checkoutSession.frontendSessionId,
          createdAt: checkoutSession.createdAt,
          lastCheckedAt: checkoutSession.lastCheckedAt,
          abandonedAt: checkoutSession.abandonedAt,
          recoveredAt: checkoutSession.recoveredAt,
        },
      });
    }

    await prisma.subscription.create({
      data: {
        razorpaySubscriptionId: seedCustomer.subscription.razorpaySubscriptionId,
        customerId: customer.id,
        planId: seedCustomer.subscription.planId,
        status: seedCustomer.subscription.status,
        authAttempts: seedCustomer.subscription.authAttempts,
        totalCount: seedCustomer.subscription.totalCount,
        paidCount: seedCustomer.subscription.paidCount,
        remainingCount: seedCustomer.subscription.remainingCount,
        chargeAt: seedCustomer.subscription.chargeAt,
        currentStart: seedCustomer.subscription.currentStart,
        currentEnd: seedCustomer.subscription.currentEnd,
        lastFailureCode: seedCustomer.subscription.lastFailureCode,
        lastFailureReason: seedCustomer.subscription.lastFailureReason,
        createdAt: seedCustomer.subscription.createdAt,
      },
    });

    console.log(
      `Seeded ${seedCustomer.email}: ${seedCustomer.paymentEvents.length} payment events, ${seedCustomer.checkoutSessions.length} checkout sessions, 1 subscription`,
    );
  }

  console.log("");
  console.log(`Seed complete for ${seedCustomers.length} customers.`);
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

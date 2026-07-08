import Order from "../models/Order.js";
import Transaction from "../models/Transaction.js";

const STALE_AFTER_MINUTES = 10;

export const cleanupPendingOrders = async () => {
  const cutoff = new Date(Date.now() - STALE_AFTER_MINUTES * 60 * 1000);

  const staleOrders = await Order.find({
    createdAt: { $lt: cutoff },
    $or: [
      { status: "pending_payment", paymentStatus: "pending" }, // abandoned — never returned from Paycorp
      { paymentStatus: "failed" },                             // declined or cancelled by payer
    ],
  });

  if (staleOrders.length === 0) return;

  const orderIds = staleOrders.map((o) => o._id);

  // Clean up the associated Transactions too, since clientRef pointed at these Orders
  await Transaction.deleteMany({ clientRef: { $in: orderIds.map(String) } });
  await Order.deleteMany({ _id: { $in: orderIds } });

  console.log(`cleanupPendingOrders: removed ${staleOrders.length} stale order(s) (pending_payment + failed)`);
};
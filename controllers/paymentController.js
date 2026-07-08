import Transaction from "../models/Transaction.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";
import paycorp from "../utils/paycenter.js";
import { generateNextOrderId, sendEmailToClient, sendEmailToAgent } from "./orderController.js";

/**
 * A plain `res.redirect()` only navigates whichever browsing context made
 * the request — and since Paycorp's payment page (loaded in the checkout
 * page's iframe) is what calls this callback, a normal redirect just changes
 * the iframe's location. The parent tab never moves.
 *
 * To land the user on our own pages (in the parent tab, not the iframe), we
 * instead respond with a tiny HTML page whose script uses `window.top.location`
 * to break out of the frame. If we're ever hit directly (not inside an
 * iframe), it just navigates normally.
 */
function renderFrameBuster(res, redirectUrl) {
  res.set("Content-Type", "text/html");
  return res.send(`<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><title>Redirecting…</title></head>
  <body>
    <p>Redirecting…</p>
    <script>
      (function () {
        var url = ${JSON.stringify(redirectUrl)};
        if (window.top === window.self) {
          window.location.href = url;
        } else {
          window.top.location.href = url;
        }
      })();
    </script>
    <noscript>
      <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
    </noscript>
  </body>
</html>`);
}

/**
 * Initializes a card payment.
 *
 * The Order is created FIRST — as "pending" — before we ever call Paycorp,
 * then the Order's Mongo `_id` is used as Paycorp's `clientRef`. This gives
 * us a stable join key to reconcile the Order once Paycorp calls back.
 * `orderId` (the human-readable "ORD-10xx") is also denormalized onto the
 * Transaction so the frontend/redirects never need to resolve clientRef ->
 * Order -> orderId themselves.
 *
 * No confirmation emails are sent here — those only fire once payment is
 * actually confirmed in `receiveCallback`.
 */
export const initPayment = async (req, res) => {
  try {
    const {
      amount, // major currency units e.g. 2.00 -> converted to cents below
      currency = "LKR",
      transactionType = "PURCHASE",
      tokenize = false,
      tokenReference,
      comment,
      extraData,
      orderData, // customer info, items, etc. from Checkout.jsx
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "A valid amount is required" });
    }
    if (!orderData) {
      return res.status(400).json({ error: "orderData is required" });
    }

    // 1. Create the Order up front, before touching Paycorp at all.
    orderData.orderId = await generateNextOrderId(); // human-readable, e.g. "ORD-1000"
    orderData.paymentStatus = "pending";
    orderData.status = "pending_payment";
    const order = await Order.create(orderData);

    // 2. Init the payment with Paycorp, using the Order's Mongo _id as clientRef.
    const amountInCents = Math.round(Number(amount) * 100);
    const clientRef = order._id.toString();

    const { msgId, response } = await paycorp.paymentInit({
      amountInCents,
      currency,
      transactionType,
      tokenize,
      tokenReference,
      clientRef,
      comment,
      extraData,
    });

    const responseData = response.responseData || {};

    const txn = await Transaction.create({
      msgId,
      clientRef,
      orderId: order.orderId, // denormalized for easy lookup/redirects
      reqid: responseData.reqid,
      transactionType,
      tokenize,
      tokenReference,
      amount: { paymentAmount: amountInCents, currency },
      comment,
      extraData,
      status: "INITIATED",
      paymentPageUrl: responseData.paymentPageUrl,
      expireAt: responseData.expireAt ? new Date(responseData.expireAt) : undefined,
      rawInitResponse: response,
    });

    return res.status(201).json({
      transactionId: txn._id,
      reqid: responseData.reqid,
      paymentPageUrl: responseData.paymentPageUrl,
      expireAt: responseData.expireAt,
      orderId: order.orderId,
    });
  } catch (err) {
    console.error("initPayment error:", err.response?.data || err.message);
    return res.status(502).json({ error: "Failed to initialize payment with Paycorp" });
  }
};

/**
 * PAYMENT_COMPLETE callback (returnUrl). Paycorp's hosted/iframe payment
 * page redirects here with ?reqid=... once the payer submits their card.
 *
 * Redirect targets:
 *   approved  -> /order-success/:orderId
 *   declined  -> /order-failed/:orderId
 *   error/unresolvable -> a bare fallback route with an error flag
 */
export const receiveCallback = async (req, res) => {
  const { reqid } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  if (!reqid) {
    return renderFrameBuster(res, `${frontendUrl}/order-failed?error=missing_reqid`);
  }

  try {
    const existingTxn = await Transaction.findOneAndUpdate(
      { reqid },
      { status: "AWAITING_COMPLETE" }
    );

    if (!existingTxn) {
      console.error(`receiveCallback: no Transaction found for reqid=${reqid}`);
      return renderFrameBuster(res, `${frontendUrl}/order-failed?error=unknown_transaction`);
    }

    const { response } = await paycorp.paymentComplete({ reqid });
    const data = response.responseData || {};

    const approved = data.responseCode === "00";

    await Transaction.findOneAndUpdate(
      { reqid },
      {
        status: approved ? "APPROVED" : "DECLINED",
        txnReference: data.txnReference,
        responseCode: data.responseCode,
        responseText: data.responseText,
        authCode: data.authCode,
        settlementDate: data.settlementDate,
        creditCard: data.creditCard,
        tokenReference: data.tokenReference || undefined,
        rawCompleteResponse: response,
      }
    );

    // Reconcile the Order this payment belongs to. `clientRef` was set to
    // order._id back in initPayment(), so it's the join key between
    // Transaction and Order — NOT the human-readable orderId string.
    const orderMongoId = existingTxn.clientRef;

    if (!orderMongoId || !mongoose.Types.ObjectId.isValid(orderMongoId)) {
      console.error(`receiveCallback: Transaction reqid=${reqid} has invalid/missing clientRef "${orderMongoId}", cannot reconcile an Order`);
      return renderFrameBuster(res, `${frontendUrl}/order-failed?error=invalid_order_ref`);
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderMongoId,
      approved
        ? {
          paymentStatus: "paid",
          status: "processing",
          paycorpReqid: reqid,
          txnReference: data.txnReference,
          paidAt: new Date(),
        }
        : { paymentStatus: "failed", paycorpReqid: reqid },
      { new: true }
    );

    if (!updatedOrder) {
      // The Transaction thinks it belongs to an order that doesn't exist —
      // worth alerting on, since the customer may have been charged with
      // no corresponding order record.
      console.error(`receiveCallback: no Order found for _id=${orderMongoId} (reqid=${reqid})`);
      return renderFrameBuster(res, `${frontendUrl}/order-failed?error=order_not_found`);
    }

    if (approved) {
      // Only send confirmation emails once payment is actually confirmed —
      // unlike COD, where they fire immediately on order creation.
      sendEmailToClient(updatedOrder);
      sendEmailToAgent(updatedOrder);
      return renderFrameBuster(res, `${frontendUrl}/order-success/${updatedOrder.orderId}`);
    }

    return renderFrameBuster(res, `${frontendUrl}/order-failed/${updatedOrder.orderId}`);
  } catch (err) {
    console.error("receiveCallback error:", err.response?.data || err.message);
    await Transaction.findOneAndUpdate({ reqid }, { status: "ERROR" });
    return renderFrameBuster(res, `${frontendUrl}/order-failed?error=complete_failed`);
  }
};

/**
 * Cancel URL target (payer backed out of the hosted/iframe page before
 * submitting, or hit "back"/"cancel" on Paycorp's page).
 *
 * Redirect target: /order-cancel/:orderId (or bare /order-cancel as fallback)
 */
export const receiveCancel = async (req, res) => {
  const { reqid } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  if (!reqid) {
    return renderFrameBuster(res, `${frontendUrl}/order-cancel`);
  }

  const txn = await Transaction.findOneAndUpdate(
    { reqid },
    { status: "DECLINED", responseText: "CANCELLED_BY_PAYER" }
  );

  if (txn?.clientRef && mongoose.Types.ObjectId.isValid(txn.clientRef)) {
    const order = await Order.findByIdAndUpdate(
      txn.clientRef,
      { paymentStatus: "failed" },
      { new: true }
    );
    if (order) {
      return renderFrameBuster(res, `${frontendUrl}/order-cancel/${order.orderId}`);
    }
    console.error(`receiveCancel: no Order found for _id=${txn.clientRef} (reqid=${reqid})`);
  }

  return renderFrameBuster(res, `${frontendUrl}/order-cancel`);
};

/**
 * Lets the React app poll/fetch the final transaction record by reqid,
 * e.g. from an order-success/order-failed/order-cancel page.
 */
export const getTransactionByReqid = async (req, res) => {
  const { reqid } = req.params;
  const txn = await Transaction.findOne({ reqid });
  if (!txn) return res.status(404).json({ error: "Transaction not found" });
  return res.json(txn);
};

export const listTransactions = async (req, res) => {
  const txns = await Transaction.find().sort({ createdAt: -1 }).limit(100);
  return res.json(txns);
};

/**
 * Charge a previously stored token directly (Real Time Payments, section 8).
 * No card data touches our server — only the Paycorp-issued token + expiry.
 */
export const payWithToken = async (req, res) => {
  try {
    const { token, expiry, amount, currency = "LKR", clientRef, comment } = req.body;

    if (!token || !expiry || !amount) {
      return res.status(400).json({ error: "token, expiry and amount are required" });
    }

    const amountInCents = Math.round(Number(amount) * 100);
    const { response } = await paycorp.realTimePayment({
      token,
      expiry,
      amountInCents,
      currency,
      clientRef,
      comment,
    });

    const data = response.responseData || {};
    const approved = data.responseCode === "00";

    const txn = await Transaction.create({
      msgId: response.msgId,
      clientRef,
      transactionType: "PURCHASE",
      amount: { paymentAmount: amountInCents, currency },
      comment,
      status: approved ? "APPROVED" : "DECLINED",
      txnReference: data.txnReference,
      responseCode: data.responseCode,
      responseText: data.responseText,
      rawCompleteResponse: response,
    });

    return res.status(approved ? 200 : 402).json(txn);
  } catch (err) {
    console.error("payWithToken error:", err.response?.data || err.message);
    return res.status(502).json({ error: "Failed to process token payment" });
  }
};
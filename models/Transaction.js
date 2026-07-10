import mongoose from "mongoose";

/**
 * Stores the lifecycle of a Paycenter Web payment:
 *  1. Created on PAYMENT_INIT (status: INITIATED)
 *  2. Updated with reqid + paymentPageUrl
 *  3. Updated on the receipt-URL callback (status: AWAITING_COMPLETE)
 *  4. Finalized on PAYMENT_COMPLETE (status: APPROVED / DECLINED)
 */
const TransactionSchema = new mongoose.Schema(
  {
    msgId: { type: String, required: true, index: true },
    clientRef: { type: String, index: true }, // merchant-generated reference, validated on completion
    orderId : { type: String, index: true }, // merchant-generated reference, validated on completion
    reqid: { type: String, index: true }, // returned by Paycorp on PAYMENT_INIT
    transactionType: {
      type: String,
      enum: ["PURCHASE", "AUTHORISATION", "TOKEN"],
      default: "PURCHASE",
    },
    tokenize: { type: Boolean, default: false },
    tokenReference: { type: String },

    amount: {
      paymentAmount: Number, // in the currency's smallest unit as sent to Paycorp (cents), per section 6.10
      currency: { type: String, default: "LKR" },
    },

    comment: String,
    extraData: mongoose.Schema.Types.Mixed,

    status: {
      type: String,
      enum: [
        "INITIATED",
        "AWAITING_COMPLETE",
        "APPROVED",
        "DECLINED",
        "ERROR",
      ],
      default: "INITIATED",
    },

    paymentPageUrl: String,
    expireAt: Date,

    // Populated after PAYMENT_COMPLETE
    txnReference: String,
    responseCode: String,
    responseText: String,
    authCode: String,
    settlementDate: String,
    creditCard: {
      type: { type: String },
      holderName: String,
      number: String, // masked/truncated, never store full PAN
      expiry: String,
    },

    rawInitResponse: mongoose.Schema.Types.Mixed,
    rawCompleteResponse: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", TransactionSchema);

import express from "express";
import {
  getTransactionByReqid,
  initPayment,
  listTransactions,
  payWithToken,
  receiveCallback,
  receiveCancel,
} from "../controllers/paymentController.js";

const paymentRouter = express.Router();

// paymentRouter.post("/init", initPayment);
// paymentRouter.post("/complete", completePayment);


// Step 1: start a payment -> get { reqid, paymentPageUrl } to embed as an iframe
paymentRouter.post("/init", initPayment);

// Step 2: Paycorp's Receipt URL (redirect.returnUrl) hits this via GET ?reqid=...
paymentRouter.get("/callback", receiveCallback);
paymentRouter.get("/cancel", receiveCancel);

// Frontend receipt page fetches the final record by reqid
paymentRouter.get("/transaction/:reqid", getTransactionByReqid);

// Admin/demo listing
paymentRouter.get("/transactions", listTransactions);

// Charge a stored token (Real Time Payments)
paymentRouter.post("/pay-with-token", payWithToken);

export default paymentRouter;

import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const ENDPOINT = process.env.PAYCORP_ENDPOINT;
const CLIENT_ID = process.env.PAYCORP_CLIENT_ID_LKR;
const AUTHTOKEN = process.env.PAYCORP_AUTHTOKEN;

const client = axios.create({
  baseURL: ENDPOINT,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    AUTHTOKEN,
  },
  timeout: 15000,
});

function isoNow() {
  // e.g. 2023-07-10T07:50:43.920+0530 style is fine as ISO8601 with offset
  return new Date().toISOString();
}

/**
 * PAYMENT_INIT - section 6.5 / 6.6
 * Initializes a payment and returns a unique request id (reqid) + paymentPageUrl
 * to embed in an iframe or redirect to.
 */
async function paymentInit({
  amountInCents,
  currency = "LKR",
  transactionType = "PURCHASE", // PURCHASE | AUTHORISATION | TOKEN
  tokenize = false,
  tokenReference,
  clientRef,
  comment,
  extraData,
  returnUrl,
  cancelUrl,
  returnMethod = "GET",
}) {
  const msgId = uuidv4().toUpperCase();

  const body = {
    version: "1.5",
    msgId,
    operation: "PAYMENT_INIT",
    requestDate: isoNow(),
    validateOnly: false,
    requestData: {
      clientId: CLIENT_ID,
      clientIdHash: "",
      transactionType,
      transactionAmount: {
        totalAmount: 0,
        paymentAmount: amountInCents,
        serviceFeeAmount: 0,
        currency,
      },
      redirect: {
        returnUrl: returnUrl || process.env.PAYCORP_RETURN_URL,
        cancelUrl: cancelUrl || process.env.PAYCORP_CANCEL_URL || "",
        returnMethod,
      },
      clientRef: clientRef || "",
      comment: comment || "",
      tokenize: !!tokenize,
      tokenReference: tokenReference || "",
      cssLocation1: "",
      cssLocation2: "",
      useReliability: true,
      extraData: extraData || {},
    },
  };

  const { data } = await client.post("", body);
  return { msgId, request: body, response: data };
}

/**
 * PAYMENT_COMPLETE - section 6.9 / 6.10
 * Submits the reqid returned by the receipt-URL redirect to finalize the transaction
 * with the acquiring bank, returning the full transaction result (incl. token if requested).
 */
async function paymentComplete({ reqid }) {
  const msgId = uuidv4().toUpperCase();

  const body = {
    version: "1.5",
    operation: "PAYMENT_COMPLETE",
    msgId,
    requestDate: isoNow(),
    validateOnly: false,
    requestData: {
      clientId: CLIENT_ID,
      reqid,
    },
  };

  const { data } = await client.post("", body);
  return { msgId, request: body, response: data };
}

/**
 * REAL TIME PAYMENT (section 8) - used to charge a stored token directly
 * (server-side, PCI-scope card data is never handled since a token is used).
 */
async function realTimePayment({
  token,
  expiry,
  amountInCents,
  currency = "LKR",
  clientRef,
  comment,
  transactionType = "PURCHASE",
}) {
  const msgId = uuidv4().toUpperCase();

  const body = {
    version: "1.5",
    operation: "PAYMENT_REALTIME",
    msgId,
    requestDate: isoNow(),
    validateOnly: false,
    requestData: {
      clientId: CLIENT_ID,
      transactionType,
      creditCard: {
        number: token, // Paycorp token used in place of the real PAN
        expiry, // MMYY
      },
      transactionAmount: {
        totalAmount: 0,
        paymentAmount: amountInCents,
        serviceFeeAmount: 0,
        currency,
      },
      clientRef: clientRef || "",
      comment: comment || "",
    },
  };

  const { data } = await client.post("", body);
  return { msgId, request: body, response: data };
}

export default { paymentInit, paymentComplete, realTimePayment };

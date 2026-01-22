import { log } from "console";
import { signPayload, paycenterRequest } from "../utils/paycenter.js";

export const initPayment = async (req, res) => {
  try {
    const { amount, currency, orderId } = req.body;

    let clientIdNew = null;

    if (currency === "USD") {
      clientIdNew = process.env.PAYCENTER_CLIENT_ID_USD;
    }else{
      clientIdNew = process.env.PAYCENTER_CLIENT_ID_LKR;
    }

    const payload = {
      clientId: Number(clientIdNew),
      type: "PURCHASE",
      tokenize: true, // false not saving card details
      amount: {
        paymentAmount: amount,
        currency: currency,
      },
      redirect: {
        returnUrl: `${process.env.FRONTEND_URL}/payment/return`,
        returnMethod: "GET",
      },
      clientRef: orderId,
      comment: "Vanilla Shop Order",
    };    

    const signature = signPayload(
      payload,
      process.env.PAYCENTER_HMAC_SECRET
    );

    const data = await paycenterRequest(
      `${process.env.PAYCENTER_ENDPOINT}/init`,
      payload,
      {
        Authorization: process.env.PAYCENTER_AUTH_TOKEN,
        Signature: signature,
      }
    );

    res.json({
      reqid: data.reqid,
      paymentPageUrl: data.paymentPageUrl,
      expireAt: data.expireAt,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: "Payment init failed" });
  }
};

export const completePayment = async (req, res) => {
  try {
    const { reqid } = req.body;

    const payload = {
      clientId: Number(process.env.PAYCENTER_CLIENT_ID),
      reqid,
    };

    const signature = signPayload(
      payload,
      process.env.PAYCENTER_HMAC_SECRET
    );

    const data = await paycenterRequest(
      `${process.env.PAYCENTER_ENDPOINT}/complete`,
      payload,
      {
        Authorization: process.env.PAYCENTER_AUTH_TOKEN,
        Signature: signature,
      }
    );

    res.json(data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: "Payment completion failed" });
  }
};


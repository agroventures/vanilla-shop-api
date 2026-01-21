import crypto from "crypto";
import axios from "axios";

export const signPayload = (payload, secret) => {
  return crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");
};

export const paycenterRequest = async (url, payload, headers) => {
  const response = await axios.post(url, payload, {
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  return response.data;
};

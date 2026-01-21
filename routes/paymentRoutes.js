import express from "express";
import {
  initPayment,
  completePayment,
} from "../controllers/paymentController.js";

const paymentRouter = express.Router();

paymentRouter.post("/init", initPayment);
paymentRouter.post("/complete", completePayment);

export default paymentRouter;

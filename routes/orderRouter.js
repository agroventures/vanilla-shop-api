import express from "express";
import { createOrder, getAllOrders, getOrder, updateOrder } from "../controllers/orderController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const orderRouter = express.Router();

orderRouter.get("/", verifyToken, getAllOrders);
orderRouter.post("/", createOrder);
orderRouter.put("/:id", verifyToken, updateOrder);
orderRouter.get("/:orderId", getOrder);

export default orderRouter;
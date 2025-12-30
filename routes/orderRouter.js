import express from "express";
import { createOrder, getAllOrders, getOrder, updateOrder } from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.get("/", getAllOrders);
orderRouter.post("/", createOrder);
orderRouter.put("/:id", updateOrder);
orderRouter.get("/:orderId", getOrder);

export default orderRouter;
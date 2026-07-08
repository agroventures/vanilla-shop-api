import express from "express";
import { cleanupPendingOrders } from "../utils/cleanupPendingOrders.js";

const cleanupRouter = express.Router();

cleanupRouter.post("/cleanup-orders", async (req, res) => {
  const secret = req.headers["x-cron-secret"];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await cleanupPendingOrders();
    return res.json({ ok: true });
  } catch (err) {
    console.error("cleanup-orders endpoint error:", err);
    return res.status(500).json({ error: "Cleanup failed" });
  }
});

export default cleanupRouter;
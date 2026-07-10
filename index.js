import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import dns from "node:dns/promises";

import adminRouter from "./routes/adminRouter.js";
import productRouter from "./routes/productRouter.js";
import orderRouter from "./routes/orderRouter.js";
import contactRouter from "./routes/contactRouter.js";
import simpleRouter from "./routes/sitemap.js";
import paymentRouter from "./routes/paymentRoutes.js";

import cron from "node-cron";
import { cleanupPendingOrders } from "./utils/cleanupPendingOrders.js";
import cleanupRouter from "./routes/cleanupRouter.js";

dotenv.config()

dns.setServers(["1.1.1.1"]);

const mongoURI = process.env.MONGO_URL

//connecting mongodb
mongoose.connect(mongoURI).then(
    () => {
        console.log("Connected to MongoDB Cluster")
    }
)

//create express app
const app = express()

//enable cors
app.use(cors())

//middleware
app.use(express.json())

// cron job for delete pending payment and failed orders after 10 minutes
cron.schedule("*/10 * * * *", () => {
  cleanupPendingOrders().catch((err) =>
    console.error("cleanupPendingOrders failed:", err)
  );
});


//routes
app.use("/", simpleRouter);
app.use("/api/admin", adminRouter)
app.use("/api/products", productRouter)
app.use("/api/orders", orderRouter)
app.use("/api/payments", paymentRouter);
app.use("/api/contact", contactRouter)
app.use("/api/cleanup", cleanupRouter)

//server
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})

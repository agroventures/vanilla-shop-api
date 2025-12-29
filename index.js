import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"

import adminRouter from "./routes/adminRouter.js";
import productRouter from "./routes/productRouter.js";
import orderRouter from "./routes/orderRouter.js";

dotenv.config()

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

//routes
app.use("/api/admin", adminRouter)
app.use("/api/products", productRouter)
app.use("/api/orders", orderRouter)

//server
app.listen(3000, () => {
    console.log("Server is running on port 3000")
})

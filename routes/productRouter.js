import express from "express"
import { createProduct, deleteProduct, getAllProducts, getProduct, updateProduct } from "../controllers/productController.js"
import { verifyToken } from "../middleware/verifyToken.js"

const productRouter = express.Router()

productRouter.get("/", getAllProducts)
productRouter.post("/", verifyToken, createProduct)
productRouter.put("/:slug", verifyToken, updateProduct)
productRouter.delete("/:id", verifyToken, deleteProduct)
productRouter.get("/:slug", getProduct)

export default productRouter
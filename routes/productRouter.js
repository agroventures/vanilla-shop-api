import express from "express"
import { createProduct, deleteProduct, getAllProducts, getProduct, updateProduct } from "../controllers/productController.js"

const productRouter = express.Router()

productRouter.get("/", getAllProducts)
productRouter.post("/", createProduct)
productRouter.put("/:id", updateProduct)
productRouter.delete("/:id", deleteProduct)
productRouter.get("/:id", getProduct)

export default productRouter
import Product from "../models/Product.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json({ message: "Product created successfully", product });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate({ slug: req.params.slug }, req.body, { new: true });
        res.status(200).json({ message: "Product updated successfully", product });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Product deleted successfully"});
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const getProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
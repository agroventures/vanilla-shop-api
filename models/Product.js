import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
    {
        label: { 
            type: String,
            required: true
        },
        images: {
            type: [String],
            default: [],
        },
        highlights: {
            type: [String],
            default: [],
        },
        priceInLKR: { 
            type: Number,
            required: true
        },

        priceInUSD: { 
            type: Number,
            required: true
        },
        
        weight: { 
            type: String
        },
        stock: { 
            type: Number,
            default: 0
        },
    },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },

        category: {
            type: String,
            required: true,
        },

        description: {
            type: String,
            required: true,
        },

        ingredients: {
            type: [String],
            default: [],
        },

        highlights: {
            type: [String],
            default: [],
        },

        variants: {
            type: [variantSchema],
            default: [],
        },

        usageTips: {
            type: [String],
            default: [],
        },

        weight: {
            type: String,
        },

        stock: {
            type: Number,
            default: 0,
        },

        priceInLKR: {
            type: Number,
        },

        priceInUSD: {
            type: Number,
        },

        images: {
            type: [String],
            required: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product

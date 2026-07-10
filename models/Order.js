import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
    orderId: { 
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    orderItems: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
        },
    ],
    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
    },
    paymentMethod: { type: String, required: true },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, default: "pending" },

    // --- Payment reconciliation (Paycenter Web) ---
    // Card orders are created *before* the payment gateway runs, so this is
    // the only record of whether the card was actually charged. It's updated
    // by paymentController.receiveCallback once PAYMENT_COMPLETE resolves.
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
    },
    paycorpReqid: { type: String }, // Paycorp's reqid for this payment attempt
    txnReference: { type: String }, // Paycorp's txnReference once approved
    paidAt: { type: Date },

    createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", OrderSchema);

export default Order
import Order from "../models/Order.js";
import { agentPDF } from "../utils/agentPDF.js";
import { generateInvoicePDF } from "../utils/generateInvoicePDF.js";
import { resend } from "../utils/resend.js";
// import { transporter } from "../utils/transporter.js";

export const createOrder = async (req, res) => {
    try {
        // Generate new orderId
        const prevOrder = await Order.findOne().sort({ orderId: -1 });
        if (prevOrder) {
            const prevOrderId = prevOrder.orderId.split("-")[1];
            const newOrderId = parseInt(prevOrderId) + 1;
            req.body.orderId = "ORD-" + newOrderId;
        } else {
            req.body.orderId = "ORD-1000";
        }

        // Create order
        const order = await Order.create(req.body);

        

        // Respond after email sent
        res.status(201).json({
            message: "Order created successfully",
            order
        });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


export const getAllOrders = async (req, res) => {
    try {
        // check token cause otherwise it will return all orders

        const orders = await Order.find();
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const getOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const updateOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id });
        const oldStatus = order.status;

        order.status = req.body.status;
        await order.save();

        await resend.emails.send({
            from: "The Vanilla Shop <info@thevanillashop.lk>",
            to: order.email,
            subject: "Your Order Status Has Been Updated",
            text: `Hello,\n\nWe wanted to let you know that the status of your order has been updated.\n\n────────────────────────────\nORDER DETAILS\n────────────────────────────\nOrder ID   : ${order.orderId}\nStatus    : ${oldStatus} → ${order.status}\n────────────────────────────\n\nThank you for shopping with The Vanilla Shop.\nWe truly appreciate your trust and support 🤍\n\nIf you have any questions, simply reply to this email — we’re happy to help.\n\nWarm regards,\nThe Vanilla Shop Team\nSri Lanka 🇱🇰
`,
        });

        res.status(200).json({ message: "Order updated successfully", order });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

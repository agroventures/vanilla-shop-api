import Order from "../models/Order.js";
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

        // Send email
        // const message = {
        //     from: process.env.GMAIL_ADDRESS,
        //     to: req.body.email,
        //     subject: "Order Confirmation",
        //     text: `Your order has been placed successfully.\n Order ID: ${order.orderId}
        //     \n\nOrder Items:
        //     \n\n${order.orderItems.map(item => `${item.name} - ${item.quantity}`).join("\n")}
        //     \n\nTotal Amount: LKR ${order.totalPrice}
        //     \n\nThank you for shopping with us!`
        // };

        // // Use async/await for sending email
        // await transporter.sendMail(message);
        const pdfBuffer = await generateInvoicePDF(order);

        // await resend.emails.send({
        //     from: "The Vanilla Shop <info@thevanillashop.lk>",
        //     to: req.body.email,
        //     subject: "Order Confirmation",
        //     text: `Your order has been placed successfully.\nOrder ID: ${order.orderId}\n\nOrder Items:${order.orderItems
        //         .map(item => `${item.name} - ${item.quantity}`)
        //         .join("\n")}\n\nTotal Amount: LKR ${order.totalPrice}\n\nThank you for shopping with us!`,
        // });

        await resend.emails.send({
            from: "The Vanilla Shop <info@thevanillashop.lk>",
            to: order.email,
            subject: "Order Confirmed – Invoice Attached",
            html: `\n<h2>Thank you for your order 🎉</h2>\n<p>Your order <b>#${order.orderId}</b> was placed successfully.</p>\n<p>Your invoice is attached as a PDF.</p>`,
            attachments: [
                {
                    filename: `invoice-${order.orderId}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                },
            ],
        });

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
        const order = await Order.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
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
import Order from "../models/Order.js";
import { agentPDF } from "../utils/agentPDF.js";
import { generateInvoicePDF } from "../utils/generateInvoicePDF.js";
import { resend } from "../utils/resend.js";
// import { transporter } from "../utils/transporter.js";

export const createOrder = async (req, res) => {
    try {
        // Generate new orderId
        const newOrderId = await generateNextOrderId();
        req.body.orderId = newOrderId;

        // Create order
        const order = await Order.create(req.body);

        // send email to client
        sendEmailToClient(order);

        ////////////////////////////////////
        const itemsHtml = (order.orderItems || [])
            .map(item => `<li>${item.name} x ${item.quantity}</li>`)
            .join('');

        // send email to agent
        sendEmailToAgent(order);

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

// Generate next orderId
export const generateNextOrderId = async () => {
  const prevOrder = await Order.findOne().sort({ orderId: -1 });
  if (prevOrder) {
    const prevOrderId = prevOrder.orderId.split("-")[1];
    return "ORD-" + (parseInt(prevOrderId) + 1);
  }
  return "ORD-1000";
};


// Send email to client
export const sendEmailToClient = async (order) => {
    try {
        const pdfBuffer = await generateInvoicePDF(order);

        await resend.emails.send({
            from: "The Vanilla Shop <info@thevanillashop.lk>",
            to: order.email,
            // subject: "Order Confirmed – Invoice Attached",
            // html: `\n<h2>Thank you for your order 🎉</h2>\n<p>Your order <b>#${order.orderId}</b> was placed successfully.</p>\n<p>Your invoice is attached as a PDF.</p>`,
            // attachments: [
            //     {
            //         filename: `invoice-${order.orderId}.pdf`,
            //         content: pdfBuffer,
            //         contentType: "application/pdf",
            //     },
            // ],

            subject: "Order Placed Successfully",
            html: `<h2>Thank you for your order 🎉</h2>
<p>Your order <b>#${order.orderId}</b> has been placed successfully.</p>
<p>Our agent will contact you shortly to confirm the details and arrange delivery.</p>
<p>We appreciate your business!</p>`,
        });
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

// Send email to agent
export const sendEmailToAgent = async (order) => {
    try {
        const pdfBuffer2 = await agentPDF(order);

        // Notify agent
        await resend.emails.send({
            from: "The Vanilla Shop <info@thevanillashop.lk>",
            // to: "info@agroventures.digital",
            // to: ["lakshitha@agroventures.lk"],
            to: "ventraxdigital@gmail.com",
            subject: "New Order Received – Action Required",
            html: `<p>Please contact the customer to confirm the order details and arrange delivery.</p>`,
            attachments: [
                {
                    filename: `invoice-${order.orderId}.pdf`,
                    content: pdfBuffer2,
                    contentType: "application/pdf",
                },
            ],
        });
    } catch (error) {
        console.error("Error sending email:", error);
    }
}


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
        let oldStatus = order.status;

        order.status = req.body.status;
        await order.save();

        // if status is pending_payment, Change it to pending payment
        if (oldStatus === "pending_payment") {
            oldStatus = "pending payment";
        }

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

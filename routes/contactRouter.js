import express from "express";
import { resend } from "../utils/resend.js";

const contactRouter = express.Router();

contactRouter.post("/", async (req, res) => {
    try {
        await resend.emails.send({
            from: "Contact Form <info@thevanillashop.lk>",
            to: process.env.GMAIL_ADDRESS,
            reply_to: req.body.email,
            subject: "Inquiry Contact Form",
            text: `📩 CONTACT FORM INQUIRY\n\n────────────────────────────\n👤 Name\n${req.body.name}\n\n📧 Email\n${req.body.email}\n\n📝 Subject\n${req.body.subject}\n────────────────────────────\n\n💬 Message\n${req.body.message}\n\n────────────────────────────\nThis message was sent via The Vanilla Shop contact form.\nYou can reply directly to this email to respond to the customer.`,
        });

        return res.status(200).json({
            status: true,
            message: "Inquiry sent successfully"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: "Server error"
        });
    }
});



export default contactRouter;
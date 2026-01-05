import express from "express";
import { resend } from "../utils/resend.js";

const contactRouter = express.Router();

contactRouter.post("/", async (req, res) => {
    try {
        await resend.emails.send({
            from: "Contact Form <contact@thevanillashop.lk>",
            to: process.env.GMAIL_ADDRESS,
            reply_to: req.body.email,
            subject: "Inquiry Contact Form",
            text: `Name: ${req.body.name}\nEmail: ${req.body.email}\nPhone Number: ${req.body.phone}\nSubject: ${req.body.subject}\nMessage: ${req.body.message}`,
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
import express from "express";
import { transporter } from "../utils/transporter.js";

const contactRouter = express.Router();

contactRouter.post("/", async (req, res) => {
    try {
        const message = {
            from: req.body.email,
            to: process.env.GMAIL_ADDRESS,
            subject: "Contact Form Submission",
            text: `Name: ${req.body.name}\nEmail: ${req.body.email}\nPhone Number: ${req.body.phone}\nSubject: ${req.body.subject}\nMessage: ${req.body.message}`
        };

        await transporter.sendMail(message);

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
import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = new Admin({
            name,
            email,
            userRole: "admin",
            password: hashedPassword
        });

        await admin.save();

        res.status(201).json({ message: "Admin registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const login = async (req, res) => {
    const email = req.body.email
    const password = req.body.password

    Admin.find({ email: email }).then(
        (admins) => {
            if (admins[0] == null) {
                res.status(404).json({
                    "message": "User not found"
                })
            } else {
                const admin = admins[0]

                const isPasswordCorrect = bcrypt.compareSync(password, admin.password)

                if (isPasswordCorrect) {
                    const payload = {
                        email: admin.email,
                        name: admin.name,
                        userRole: admin.userRole
                    }

                    const token = jwt.sign(payload, process.env.JWT_SECRET)

                    res.status(200).json({
                        message: "Admin logged in successfully",
                        token: token,
                    })
                } else {
                    res.status(401).json({
                        message: "Wrong password"
                    })
                }
            }
        })
}

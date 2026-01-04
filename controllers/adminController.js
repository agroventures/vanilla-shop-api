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

        const payload = {
            email: admin.email,
            name: admin.name,
            userRole: admin.userRole
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "5h" })

        res.status(201).json({ 
            message: "Admin registered successfully",
            token: token,
            role: admin.userRole
         });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// export const login = async (req, res) => {
//     const email = req.body.email
//     const password = req.body.password

//     Admin.find({ email: email }).then(
//         (admins) => {
//             if (admins[0] == null) {
//                 res.status(404).json({
//                     "message": "User not found"
//                 })
//             } else {
//                 const admin = admins[0]

//                 const isPasswordCorrect = bcrypt.compareSync(password, admin.password)

//                 if (isPasswordCorrect) {
//                     const payload = {
//                         email: admin.email,
//                         name: admin.name,
//                         userRole: admin.userRole
//                     }

//                     const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "5h" })

//                     res.status(200).json({
//                         message: "Admin logged in successfully",
//                         token: token,
//                         role: admin.userRole
//                     })
//                 } else {
//                     res.status(401).json({
//                         message: "Wrong password"
//                     })
//                 }
//             }
//         })
// }

//new
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isPasswordCorrect = bcrypt.compareSync(password, admin.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Wrong password"
            });
        }

        const payload = {
            id: admin._id,
            email: admin.email,
            role: admin.userRole
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: "1h" } // 🔑 1 hour
        );

        // 🍪 Set HttpOnly cookie
        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: true,        // HTTPS only
            sameSite: "strict",
            maxAge: 60 * 60 * 1000 // 1 hour
            // ❗ remove maxAge if you want logout on browser close
        });

        res.status(200).json({
            message: "Admin logged in successfully",
            role: admin.userRole
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
};

//new
export const logout = (req, res) => {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict"
    });

    res.status(200).json({ message: "Logged out" });
};


export const getAdminData = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1]
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
        const admin = await Admin.findOne({ email: decodedToken.email })

        res.status(200).json({ message: "Admin data fetched successfully", admin })
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
}

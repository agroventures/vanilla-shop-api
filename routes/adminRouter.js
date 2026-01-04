import express from "express";
import { getAdminData, login, register } from "../controllers/adminController.js";
import { authenticate } from "../middleware/authenticate.js";

const adminRouter = express.Router();

adminRouter.get("/", getAdminData);

adminRouter.post("/login", login);

adminRouter.post("/register", register);

//new
adminRouter.get("/dashboard", authenticate, (req, res) => {
    res.status(200).json({
        email: req.user.email,
        role: req.user.role
    });
});

export default adminRouter;
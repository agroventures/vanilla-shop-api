import express from "express";
import { login, register } from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.post("/login", login);

adminRouter.post("/register", register);

export default adminRouter;
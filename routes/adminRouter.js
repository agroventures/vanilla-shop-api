import express from "express";
import { getAdminData, login, register } from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.get("/", getAdminData);

adminRouter.post("/login", login);

adminRouter.post("/register", register);

export default adminRouter;
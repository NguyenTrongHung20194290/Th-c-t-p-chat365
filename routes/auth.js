import express from "express";
import { login } from "../controllers/auth.js";
import { confirmlogin } from "../controllers/auth.js";  
import { takedatatoverifylogin } from "../controllers/auth.js"; 
const router = express.Router();
router.post("/login",login) 
router.post("/confirmlogin", confirmlogin)
router.get("/takedatatoverifylogin/:userId", takedatatoverifylogin)
export default router
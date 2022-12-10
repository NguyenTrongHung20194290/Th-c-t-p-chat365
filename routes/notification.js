import express from "express";
import formData from 'express-form-data';
import { 
    AllNotifications,
    TransferPicture,
    ChangeSalary,
    Salary
    } from "../controllers/notification.js";  
const router = express.Router();
router.post("/TransferPicture",formData.parse(),TransferPicture) 
router.post("/ChangeSalary",formData.parse(),ChangeSalary) 
router.get('/AllNotifications/:userId',formData.parse(),AllNotifications) 
router.get('/Salary',formData.parse(),Salary)
export default router
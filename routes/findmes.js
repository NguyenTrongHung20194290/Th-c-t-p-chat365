import express from "express";
import { findmes } from "../controllers/findmes.js";
import { findRelativeMes } from "../controllers/findmes.js";
import { findEachMes } from "../controllers/findmes.js";
import { test } from "../controllers/findmes.js";
// import { findmes_param } from "../controllers/findmes.js";
// import { findRelativeMes_param } from "../controllers/findmes.js";
import {findEachMes_param } from "../controllers/findmes.js";
// import { test_param } from "../controllers/findmes.js";

// test custom name collection 
import Test from "../models/Test.js";
const router = express.Router();

router.get("/testport",(req,res,next)=>{
   res.send("test port");
})
router.get("/custommodel",async (req,res,next)=>{
   console.log("test")
   const results = await Test.find({});
   res.json(results);
})
router.post("/findmes",findmes) 
router.post("/findrelativemes",findRelativeMes);
router.post("/findeachmes",findEachMes) 
router.post("/test",test) 
//router.get("/findmes",findmes_param) 
//router.get("/findrelativemes",findRelativeMes_param);
router.get("/findeachmes/:_id/:findword/:time",findEachMes_param) 
//router.get("/test",test_param) 
export default router
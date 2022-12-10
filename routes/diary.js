import express from "express";
import { createPostDiary } from "../controllers/diary.js";
import { deletePostDiary } from "../controllers/diary.js";
import { getAllPostDiary } from "../controllers/diary.js";
import { getPostDiary } from "../controllers/diary.js";
import { editPostDiary } from "../controllers/diary.js";
import { releaseEmotion } from "../controllers/diary.js";
import { upload } from "../controllers/diary.js";
import formData from 'express-form-data';
const router = express.Router();


router.post('/createpostdiary', upload.array('files'), createPostDiary) 
router.delete('/deletepostdiary/:id', deletePostDiary)
router.post('/editpostdiary/:id', upload.array('files') , editPostDiary)
router.get('/getallpostdiary/:conversationId', getAllPostDiary)
router.get('/getpostdiary/:_id', getPostDiary)
router.post('/releaseemotion', formData.parse(), releaseEmotion)

export default router
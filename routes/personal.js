import express from "express";
import formData from 'express-form-data';
// import { upload }  from "../controllers/personal.js"
import { createPost } from "../controllers/personal.js";
import { deletePost} from "../controllers/personal.js";
import { getPost } from "../controllers/personal.js";
import { getAllPost } from "../controllers/personal.js";
import { getAllAlbum } from "../controllers/personal.js";
import { editPost } from "../controllers/personal.js";
import { createAlbum } from "../controllers/personal.js";
import { editAlbum } from "../controllers/personal.js";
import { deleteAlbum } from "../controllers/personal.js";
import { getAlbum } from "../controllers/personal.js";
import { backgroundImg } from "../controllers/personal.js";
import { createComment } from "../controllers/personal.js";
import { updateComment } from "../controllers/personal.js";
import { deleteComment } from "../controllers/personal.js";
import { releaseEmotion } from "../controllers/personal.js";
import { countFile } from "../controllers/personal.js";
import { tagPersonal } from "../controllers/personal.js";
import { untagPersonal } from "../controllers/personal.js";

import { emotionFile } from "../controllers/personal.js"
const router = express.Router();
import multer from 'multer';
const storage = multer.memoryStorage()
const upload = multer({storage});

router.post('/createpost', upload.array('files'), createPost)
router.delete('/deletepost/:id', deletePost)
router.get('/getpost/:_id', getPost)
router.get('/getallpost/:userId/:IdSeen', getAllPost)
router.get('/getallalbum/:userId/:IdSeen', getAllAlbum)
router.post('/editpost/:id',upload.array('file'), editPost) 
router.post('/createalbum', upload.array('file'), createAlbum)
router.post('/editalbum/:id', upload.array('file'), editAlbum)
router.delete('/deletealbum/:id', deleteAlbum)
router.get('/getalbum/:_id', getAlbum)
router.post('/backgroundImg', upload.array('img'), backgroundImg)
router.post('/createcomment', formData.parse(), createComment)
router.post('/updateComment',formData.parse(), updateComment)
router.delete('/deleteComment',formData.parse(), deleteComment)
router.post('/releaseemotion', formData.parse(), releaseEmotion)
router.get('/countImage/:userId', countFile)
router.post('/emotionfile', formData.parse(),emotionFile)
router.post('/tagPersonal',formData.parse(),tagPersonal)
router.post('/untagPersonal',formData.parse(),untagPersonal)


export default router
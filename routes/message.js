import express from "express";
import formData from 'express-form-data';
import { TakeListDiaryConversation } from "../controllers/message.js";
import { TakeListUserLike } from "../controllers/message.js";
import { TakeListComment } from "../controllers/message.js";
import { Dislike } from "../controllers/message.js"; 
import { NotifySpam } from "../controllers/message.js"; 
import { SendManyMesByArrayId } from "../controllers/message.js";
import { SendManyMesByClassId } from "../controllers/message.js";
import { LoadMessage } from "../controllers/message.js"
import { DeleteMessage } from "../controllers/message.js" 
import { SendMessage } from "../controllers/message.js" 
import { DeleteMessage1 } from "../controllers/message.js"
import { EditMessage } from "../controllers/message.js"
const router = express.Router();
router.post("/loadMessage",formData.parse(),LoadMessage)
router.post("/takelistdiary",formData.parse(),TakeListDiaryConversation)
router.post("/takelistuserlike",formData.parse(),TakeListUserLike)
router.post("/takelistcomment",formData.parse(),TakeListComment)
router.post("/dislike",formData.parse(),Dislike)
router.post("/notifyspam",formData.parse(),NotifySpam)
router.post("/SendManyMesByArrayId",formData.parse(),SendManyMesByArrayId)
router.post("/SendManyMesByClassId",formData.parse(),SendManyMesByClassId)
router.post("/DeleteMessage",formData.parse(),DeleteMessage);
router.post("/SendMessage",formData.parse(),SendMessage);
router.post("/DeleteMessage1",formData.parse(),DeleteMessage1)
router.post("/EditMessage",formData.parse(),EditMessage)
export default router
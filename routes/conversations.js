import express from "express";
import formData from 'express-form-data';
import { createInterval} from "../controllers/conversations.js";
import { stopInterval } from "../controllers/conversations.js";
import { testIntervalInTimeOut } from "../controllers/conversations.js";
import { StopIntervalInTimeOut } from "../controllers/conversations.js";
import { createCanlerdal } from "../controllers/conversations.js";
import { takeListCanlerdal } from "../controllers/conversations.js";
import { createNotificationCanlerdal } from "../controllers/conversations.js";
import { takeAllCanlerdal } from "../controllers/conversations.js";
import { deleteCanlerdal } from "../controllers/conversations.js";
import { JoinConversationOffline } from "../controllers/conversations.js"; 
import { GetListConversation } from "../controllers/conversations.js"; 
import { GetListConversationUnreader } from "../controllers/conversations.js"; 
import { GetListUnreaderConversation } from "../controllers/conversations.js"; 
import { GetListMemberOfGroup } from "../controllers/conversations.js"; 
import { ChangeBrowseMemberOfGroup } from "../controllers/conversations.js"; 
import { ChangeNameGroup } from "../controllers/conversations.js";
import { PinMessage } from "../controllers/conversations.js";
import { UnPinMessage } from "../controllers/conversations.js";
import { GetConversation } from "../controllers/conversations.js";
import { OutGroup } from "../controllers/conversations.js";
import { AddToFavoriteConversation } from "../controllers/conversations.js";
import { HiddenConversation } from "../controllers/conversations.js";
import { CreateNewConversation } from "../controllers/conversations.js";
import { DeleteConversation } from "../controllers/conversations.js";
import { ReadMessage } from "../controllers/conversations.js";

const router = express.Router();
router.post("/createInterval",formData.parse(),createInterval) 
router.post("/clearInterval",formData.parse(),stopInterval) 
router.post("/testintervalintimeout",formData.parse(),testIntervalInTimeOut) 
router.post("/cleartimeout",formData.parse(),StopIntervalInTimeOut) 

router.post("/createcanlerdal",formData.parse(),createCanlerdal) 
router.get("/takelistcanlerdal/:userId",takeListCanlerdal) // take all canlerdal of 1 person and check 
router.post("/createnotificationcanledar",formData.parse(),createNotificationCanlerdal) 

router.post("/takeallcanlerdal",formData.parse(),takeAllCanlerdal) 
router.post("/deleteCanlerdal",formData.parse(),deleteCanlerdal) 

router.post("/joinconvoffline",formData.parse(),JoinConversationOffline) 

// Thang
router.post("/GetListConversation",formData.parse(), GetListConversation)
router.post("/GetListConversationUnreader",formData.parse(), GetListConversationUnreader)
router.post("/GetListUnreaderConversation",formData.parse(), GetListUnreaderConversation)
router.post("/GetListMemberOfGroup",formData.parse(), GetListMemberOfGroup)
router.post("/ChangeNameGroup",formData.parse(), ChangeNameGroup)
router.post("/ChangeBrowseMemberOfGroup",formData.parse(), ChangeBrowseMemberOfGroup)
router.post("/PinMessage",formData.parse(), PinMessage)
router.post("/UnPinMessage",formData.parse(), UnPinMessage)
router.post("/GetConversation",formData.parse(), GetConversation)
router.post("/OutGroup",formData.parse(), OutGroup)
router.post("/AddToFavoriteConversation",formData.parse(), AddToFavoriteConversation)
router.post("/HiddenConversation",formData.parse(), HiddenConversation)
router.post("/CreateNewConversation",formData.parse(), CreateNewConversation)
router.post("/DeleteConversation",formData.parse(), DeleteConversation)
router.post("/ReadMessage",formData.parse(), ReadMessage)

export default router
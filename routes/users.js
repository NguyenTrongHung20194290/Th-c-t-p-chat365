import express from "express";
import formData from 'express-form-data';
import { findarround } from "../controllers/users.js";
import { TakeListFriend } from "../controllers/users.js";
import { takeListNewFriend } from "../controllers/users.js";
import { SendLocation } from "../controllers/users.js";  
import { GetTimeOnlineForUserId } from "../controllers/users.js";
// import { setupBase } from "../controllers/users.js";
import { FindUser } from "../controllers/users.js";   
import { updateBirthday } from "../controllers/users.js";

import { 
    GetListUserByClassUserAndUserOwner,
    CheckClassUser,
    CreateClassUser, 
    InsertUserToClassUser,
    DeleteUserFromClassUser,
    GetListClassOfOneUser,
    EditClassUserName,
    EditClassUserColor,
    DeleteClassUser,
    VerifyClassArrayUser,

    GetInfoUser,
    GetContactCompany,
    GetListContactPrivate,
    GetListContact,
    GetListOfferContactByPhone,
    GetAllUserOnline,
    ChangeUserName,
    GetListSuggesContact,
    CheckContact,
    ChangeActive,
    // ForgetPassword,
    Logout,
    // RegisterSuccess
    GetAcceptMessStranger,
    UpdateAcceptMessStranger,
    RemoveSugges,
    NewAccountFromQLC,
    AccountFrom_TimViec365,
    UpdateInfomation365,
    
} from "../controllers/users.js"; 

import { 
    UpdatePhoneNumber
} from "../controllers/users.js"; 

const router = express.Router();
// router.get("/setupBase",setupBase)  
router.post("/getstatus/arrayuser",GetTimeOnlineForUserId)

// nhãn dán phân loại user 
router.post("/CreateClassUser",CreateClassUser)
router.post("/InsertUserToClassUser",InsertUserToClassUser)
router.post("/DeleteUserFromClassUser",DeleteUserFromClassUser)
router.post("/GetListUserByClassUserAndUserOwner",GetListUserByClassUserAndUserOwner)
router.post("/CheckClassUser",CheckClassUser)
router.post("/GetListClassOfOneUser",GetListClassOfOneUser)
router.post("/EditClassUserName",EditClassUserName)
router.post("/EditClassUserColor",EditClassUserColor)
router.post("/DeleteClassUser",DeleteClassUser);
router.post("/VerifyClassArrayUser",VerifyClassArrayUser)

router.post("/UpdatePhoneNumber",UpdatePhoneNumber)

router.post("/finduser",FindUser)
router.post("/sendlocation",SendLocation);
router.get("/findarround/:userId",findarround) 
router.get("/listfriend/:userId",TakeListFriend) 
router.get("/listnewfriend/:userId",takeListNewFriend)

router.post("/GetInfoUser",formData.parse(),GetInfoUser)
router.post("/GetContactCompany",GetContactCompany)
router.post("/GetListContactPrivate",GetListContactPrivate)
router.post("/GetListContact",GetListContact)
router.post("/GetListOfferContactByPhone",GetListOfferContactByPhone)
router.post("/GetAllUserOnline",GetAllUserOnline)
router.post("/ChangeUserName",formData.parse(),ChangeUserName)
router.post("/GetListSuggesContact",formData.parse(),GetListSuggesContact)
router.post("/CheckContact",CheckContact)
router.post("/ChangeActive",ChangeActive)
// router.post("/ForgetPassword",ForgetPassword)
router.post("/Logout",Logout)
router.post("/updateBirthday",formData.parse(),updateBirthday)
// router.post("/RegisterSuccess",RegisterSuccess)
// router.get("/gethistoryaccess/:id",GetHistoryAccessByUserId)
// router.get("/gethistoryaccess/:id",GetHistoryAccessByUserId)
router.post("/GetAcceptMessStranger",formData.parse(),GetAcceptMessStranger)
router.post("/UpdateAcceptMessStranger",formData.parse(),UpdateAcceptMessStranger)
router.post("/RemoveSugges",formData.parse(),RemoveSugges)
router.post("/NewAccountFromQLC",NewAccountFromQLC)
router.post("/AccountFrom_TimViec365",formData.parse(),AccountFrom_TimViec365)
router.post("/UpdateInfomation365",formData.parse(),UpdateInfomation365)
export default router
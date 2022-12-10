
import { v4 as uuidv4 } from 'uuid';
import { createError } from "../utils/error.js";
import axios from "axios"
import Conversation from "../models/Conversation.js";
import RequestContact  from "../models/RequestContact.js";
import User from "../models/User.js";
import Counter from "../models/Counter.js";
import { fUserConv } from '../functions/fModels/fUsers.js'
import { dataToViewInConversation } from '../utils/formatUserData/dataToViewInConversation.js'
import { dataToView } from '../utils/formatConversationData/dataToView.js'
import date from "date-and-time";

let array_interval=[];
let array_timeout =[];
let i=0;
const myTimer = async () => {
   console.log(i);
   i=i+1;
}

const test_interval_on_timeout = async () =>{
   let myInterval = setInterval(myTimer, 1000);
   let ele ={};
   ele.id= String(uuidv4());
   ele.interval= myInterval;
   array_interval.push(ele);
}

export const createInterval = async (req,res,next)=>{
   try{
      let myInterval = setInterval(myTimer, 1000);
      console.log(myInterval);
      array_interval.push(myInterval);
      res.send({id:1});
   }
   catch(e){
    console.log(e)
   }
}

export const stopInterval = async (req,res,next)=>{
   try{
      console.log(array_interval);
      for(let i=0; i< array_interval.length; i++){
         clearInterval(array_interval[i].interval);
      }
      res.send({id:1})
   }
   catch(e){
    console.log(e)
   }
}

export const testIntervalInTimeOut = async (req,res,next)=>{
   try{
     let myTimeout = setTimeout(test_interval_on_timeout, 5000);
     array_timeout.push(myTimeout);
     res.send({id:1})
   }
   catch(e){
      console.log(e);
   }
}

export const StopIntervalInTimeOut = async (req,res,next)=>{
    try{
       for(let i=0; i<array_timeout.length; i++){
         clearTimeout(array_timeout[i]);
       }
       res.send({id:1})
    }
    catch(e){
      console.log(e);
    }
}


export const createCanlerdal = async (req,res,next)=>{
   try{
      console.log(req.body);
      if( req && req.body && req.body.time && req.body.content 
         && req.body.type && req.body.emotion && Number(req.body.senderId)
         && Number(req.body.conversationId)
         ){
            if(String(req.body.type) == "manyeveryweek"){
               let times= String(req.body.time).split("/");
               let check = false;
               for(let i=0; i<times.length; i++){
                  let date = new Date(times[i]);
                  let time =`${String(date.getFullYear())}-${String(date.getMonth()+1)}-${String(date.getDate())}T${String(date.getHours())}:${String(date.getMinutes())}:00+07:00`
                  let dataContact = await axios({
                     method: "post",
                     url: "http://43.239.223.142:3005/Message/SendMessage",
                     data: {
                     MessageID: '',
                     ConversationID: req.body.conversationId,
                     SenderID: req.body.senderId,
                     MessageType: "Canlerdal",
                     Message: `${String(time)}/${String(req.body.content)}/everyweek/${req.body.emotion}`,
                     Emotion: 1,
                     Quote: "",
                     Profile: "",
                     ListTag: "",
                     File: "",
                     ListMember: "",
                     IsOnline: [],
                     IsGroup: 0,
                     ConversationName: '',
                     DeleteTime: 0,
                     DeleteType: 0,
                     },
                     headers: { "Content-Type": "multipart/form-data" }
                  });
                  if(dataContact){
                     check= true;
                  }
               };
               if(check){
                  res.status(200).json({
                     data:{
                       result:true,
                       message:"insert successfully",
                     },
                     error:null
                   });
               }
            }
            else{
               let date = new Date(req.body.time);
               let time =`${String(date.getFullYear())}-${String(date.getMonth()+1)}-${String(date.getDate())}T${String(date.getHours())}:${String(date.getMinutes())}:00+07:00`
               let dataContact = await axios({
                  method: "post",
                  url: "http://43.239.223.142:3005/Message/SendMessage",
                  data: {
                    MessageID: '',
                    ConversationID: req.body.conversationId,
                    SenderID: req.body.senderId,
                    MessageType: "Canlerdal",
                    Message: `${String(time)}/${String(req.body.content)}/${req.body.type}/${req.body.emotion}`,
                    Emotion: 1,
                    Quote: "",
                    Profile: "",
                    ListTag: "",
                    File: "",
                    ListMember: "",
                    IsOnline: [],
                    IsGroup: 0,
                    ConversationName: '',
                    DeleteTime: 0,
                    DeleteType: 0,
                  },
                  headers: { "Content-Type": "multipart/form-data" }
                });
                if(dataContact){
                  res.status(200).json({
                     data:{
                       result:true,
                       message:"insert successfully",
                     },
                     error:null
                   });
                }
            }
      }
      else{
         res.status(200).json(createError(200,"Thông tin truyền lên không đầy đủ"));
      }
   }
   catch(e){
      console.log(e);
      res.status(200).json(createError(200,"Đã có lỗi xảy ra"));
   }
};

// lay danh sach lich cho 1 nguoi va tien hanh check 
export const takeListCanlerdal = async (req, res, next) => {
   try{
      
      console.log(req.params);
      let day_to_milisecond = 24*60*60*1000;
    
      const conversations = await Conversation.aggregate([
         { $match: 
           {
               "memberList.memberId":Number(req.params.userId),
               "messageList.messageType":"Canlerdal"
           }
         },
         {
           // k đóng vai trò tìm kiếm luôn 
           $project: {
             messageList: 
             {
                   $filter: {
                     input: "$messageList",
                     as: "messagelist",
                     cond: { 
                        $eq: ["$$messagelist.messageType", "Canlerdal"]
                     },
                   }
              }
           }
         }
       ]);
      console.log(conversations)
      if(conversations && (conversations.length > 0) ){
          for(let j=0; j< conversations.length; j++){

            let conversation_finded= conversations[j];
            
            if(conversation_finded  && (conversation_finded.messageList.length > 0)){
               let listCanlerdal = conversation_finded.messageList;

               for(let i = 0; i < listCanlerdal.length; i++){
                  // nếu là hàng ngày thì check rồi gửi 
                  if(String(listCanlerdal[i].message.split("/")[2]) == "everyday"){
                     let today = new Date();
                     let canlerdal = new Date(String(listCanlerdal[i].message).split("/")[0])
                     let count =  Number( String( (today- canlerdal) / day_to_milisecond ).split(".")[0] );
                     console.log("So ngay tinh tu hom dat lich ",count);
                     if(count> 0){
                        let timecheck1 = canlerdal;
                        timecheck1.setDate(canlerdal.getDate() + count);
                        
                        console.log("Thoi diem check so 1", new Date(timecheck1));
                        // kiem tra xem da gui thong bao chua 
                        let conversation_finded2 = await Conversation.aggregate([
                           { $match: 
                              {_id:Number(conversation_finded._id)},
                           },
                           { $limit : 1 },
                           {
                             $project: {
                               messageList: {
                                
                                     $filter: {
                                       input: "$messageList",
                                       as: "messagelist",
                                       cond: {
                                          $and: [
                                             {
                                                $eq: ["$$messagelist.messageType", "notification"]
                                             },
                                             {
                                                $eq: ["$$messagelist.message", `Bạn có lịch ${String(listCanlerdal[i].message).split("/")[1]} lúc ${timecheck1.getHours()}:${timecheck1.getMinutes()} ${timecheck1.getDate()}-${timecheck1.getMonth()+1}-${timecheck1.getFullYear()}`]
                                             }
                                          ] 
                                       },
                                     }
                                }
                             }
                           }
                         ]);
                        if( (conversation_finded2) && (conversation_finded2.length > 0) && (conversation_finded2[0].messageList.length == 0) ){
                              console.log("Chua co lich tai thoi diem check 1");
                              let sendmes = await axios({
                                 method: "post",
                                 url: "http://43.239.223.142:3005/Message/SendMessage",
                                 data: {
                                   MessageID: '',
                                   ConversationID: Number(conversation_finded._id),
                                   SenderID: Number(req.params.userId),
                                   MessageType: "notification",
                                   Message: `Bạn có lịch ${String(listCanlerdal[i].message).split("/")[1]} lúc ${timecheck1.getHours()}:${timecheck1.getMinutes()} ${timecheck1.getDate()}-${timecheck1.getMonth()+1}-${timecheck1.getFullYear()}`,
                                   Emotion: 1,
                                   Quote: "",
                                   Profile: "",
                                   ListTag: "",
                                   File: "",
                                   ListMember: "",
                                   IsOnline: [],
                                   IsGroup: 0,
                                   ConversationName: '',
                                   DeleteTime: 0,
                                   DeleteType: 0,
                                 },
                                 headers: { "Content-Type": "multipart/form-data" }
                               });
                        }
                     }
                     if(count>1){
                        let timecheck2 = canlerdal;
                        // do canledar tu tang
                        timecheck2.setDate(canlerdal.getDate() -1);
                        let conversation_finded3 = await Conversation.aggregate([
                           { $match: 
                              {_id:Number(conversation_finded._id)},
                           },
                           { $limit : 1 },
                           {
                             $project: {
                               messageList: {
                                
                                     $filter: {
                                       input: "$messageList",
                                       as: "messagelist",
                                       cond: {
                                          $and: [
                                             {
                                                $eq: ["$$messagelist.messageType", "notification"]
                                             },
                                             {
                                                $eq: ["$$messagelist.message", `Bạn có lịch ${String(listCanlerdal[i].message).split("/")[1]} lúc ${timecheck2.getHours()}:${timecheck2.getMinutes()} ${timecheck2.getDate()}-${timecheck2.getMonth()+1}-${timecheck2.getFullYear()}`]
                                             }
                                          ] 
                                       },
                                     }
                                }
                             }
                           }
                         ]);
                        if( (conversation_finded3) && (conversation_finded3.length > 0) && (conversation_finded3[0].messageList.length == 0) ){
                             console.log("Chua co lich tai thoi diem check 2");
                             let sendmes = await axios({
                                method: "post",
                                url: "http://43.239.223.142:3005/Message/SendMessage",
                                data: {
                                  MessageID: '',
                                  ConversationID: Number(conversation_finded._id),
                                  SenderID: Number(req.params.userId),
                                  MessageType: "notification",
                                  Message: `Bạn có lịch ${String(listCanlerdal[i].message).split("/")[1]} lúc ${timecheck2.getHours()}:${timecheck2.getMinutes()} ${timecheck2.getDate()}-${timecheck2.getMonth()+1}-${timecheck2.getFullYear()}`,
                                  Emotion: 1,
                                  Quote: "",
                                  Profile: "",
                                  ListTag: "",
                                  File: "",
                                  ListMember: "",
                                  IsOnline: [],
                                  IsGroup: 0,
                                  ConversationName: '',
                                  DeleteTime: 0,
                                  DeleteType: 0,
                                },
                                headers: { "Content-Type": "multipart/form-data" }
                              });
                       }
                        console.log("Thoi diem check so 2", new Date(timecheck2));
                     }
                  }
                  else if(String(listCanlerdal[i].message.split("/")[2]) == "everyweek"){
                     let today = new Date();
                     let canlerdal = new Date(String(listCanlerdal[i].message).split("/")[0])
                     let count =  Number( String( ((today- canlerdal) / day_to_milisecond) /7 ).split(".")[0] );
                     console.log("So tuan tinh tu hom dat lich ",count);
                     if(count> 0){
                        let timecheck1 = canlerdal;
                        timecheck1.setDate(canlerdal.getDate() + count *7 );
                        
                        console.log("Thoi diem check so 1", new Date(timecheck1));
                        // kiem tra xem da gui thong bao chua 
                        let conversation_finded2 = await Conversation.aggregate([
                           { $match: 
                              {_id:Number(conversation_finded._id)},
                           },
                           { $limit : 1 },
                           {
                             $project: {
                               messageList: {
                                
                                     $filter: {
                                       input: "$messageList",
                                       as: "messagelist",
                                       cond: {
                                          $and: [
                                             {
                                                $eq: ["$$messagelist.messageType", "notification"]
                                             },
                                             {
                                                $eq: ["$$messagelist.message", `Bạn có lịch ${String(listCanlerdal[i].message).split("/")[1]} lúc ${timecheck1.getHours()}:${timecheck1.getMinutes()} ${timecheck1.getDate()}-${timecheck1.getMonth()+1}-${timecheck1.getFullYear()}`]
                                             }
                                          ] 
                                       },
                                     }
                                }
                             }
                           }
                         ]);
                        if( (conversation_finded2) && (conversation_finded2.length > 0) && (conversation_finded2[0].messageList.length == 0) ){
                              console.log("Chua co lich tai thoi diem check 1");
                              let sendmes = await axios({
                                 method: "post",
                                 url: "http://43.239.223.142:3005/Message/SendMessage",
                                 data: {
                                   MessageID: '',
                                   ConversationID: Number(conversation_finded._id),
                                   SenderID: Number(req.params.userId),
                                   MessageType: "notification",
                                   Message: `Bạn có lịch ${String(listCanlerdal[i].message).split("/")[1]} lúc ${timecheck1.getHours()}:${timecheck1.getMinutes()} ${timecheck1.getDate()}-${timecheck1.getMonth()+1}-${timecheck1.getFullYear()}`,
                                   Emotion: 1,
                                   Quote: "",
                                   Profile: "",
                                   ListTag: "",
                                   File: "",
                                   ListMember: "",
                                   IsOnline: [],
                                   IsGroup: 0,
                                   ConversationName: '',
                                   DeleteTime: 0,
                                   DeleteType: 0,
                                 },
                                 headers: { "Content-Type": "multipart/form-data" }
                               });
                        }
                     }
                   
                  }
               }
            }
          }
       }

      if(conversations){
         res.status(200).json({
            data:{
              result:true,
              message:"Lấy thông tin thành công",
              conversations
            },
            error:null
          });
      }
   }
   catch(e){
      console.log(e);
      res.status(200).json(createError(200,"Đã có lỗi xảy ra"));
   }
}


// tạo ra thông báo
export const createNotificationCanlerdal = async (req, res, next) => {
   try{
       console.log(req.body);
       // check xem dưới base có chưa 
       let canlerdal= new Date(String(req.body.time));
       let day_to_milisecond = 24*60*60*1000;
       let today= new Date();
       let count =  Number( String( (today- canlerdal) / day_to_milisecond ).split(".")[0] );
       let time_check = canlerdal;
       time_check.setDate(canlerdal.getDate() +count);
       let findword = String(``)
       const checkCanlerdal = await Conversation.aggregate([
         { $match: 
           {
               _id:Number(req.body.conversationId),
               "messageList.messageType":"Canlerdal"
           }
         },
         {
           // k đóng vai trò tìm kiếm luôn 
           $project: {
             messageList: 
             {
                   $filter: {
                     input: "$messageList",
                     as: "messagelist",
                     cond: { 
                        $and:[
                           {
                              $eq: ["$$messagelist.messageType", "Canlerdal"]
                           },
                           {
                              $eq: ["$$messagelist.message", `${String(req.body.time)}/${req.body.content}/${req.body.type}/${req.body.emotion}`]
                           }
                        ]
                     },
                   }
              }
           }
         }
       ]);
       console.log(checkCanlerdal);
       if(checkCanlerdal && (checkCanlerdal.length > 0) && (checkCanlerdal[0].messageList.length > 0)){
         let conversation_finded = await Conversation.aggregate([
            { $match: 
               {_id:Number(req.body.conversationId)},
            },
            { $limit : 1 },
            {
              $project: {
                messageList: {
                 
                      $filter: {
                        input: "$messageList",
                        as: "messagelist",
                        cond: {
                           $and: [
                              {
                                 $eq: ["$$messagelist.messageType", "notification"]
                              },
                              {
                                 $eq: ["$$messagelist.message", `Bạn có lịch ${req.body.content} lúc ${time_check.getHours()}:${time_check.getMinutes()}`]
                              }
                           ] 
                        },
                      }
                 }
              }
            }
          ]);
      
          // gửi tin nhắn thông báo vào nhóm 
          if(conversation_finded && (conversation_finded.length >0)){
            if(conversation_finded.length >0){
               if(conversation_finded[0].messageList.length>0){
                  res.status(200).json(createError(200,"Canlerdal is notified"));
               }
               else{
                  let sendmes = await axios({
                     method: "post",
                     url: "http://43.239.223.142:3005/Message/SendMessage",
                     data: {
                       MessageID: '',
                       ConversationID: Number(req.body.conversationId),
                       SenderID: Number(req.body.senderId),
                       MessageType: "notification",
                       Message: `Bạn có lịch ${req.body.content} lúc ${time_check.getHours()}:${time_check.getMinutes()}`,
                       Emotion: 1,
                       Quote: "",
                       Profile: "",
                       ListTag: "",
                       File: "",
                       ListMember: "",
                       IsOnline: [],
                       IsGroup: 0,
                       ConversationName: '',
                       DeleteTime: 0,
                       DeleteType: 0,
                     },
                     headers: { "Content-Type": "multipart/form-data" }
                   });
                  res.json({
                     data:{
                           result:true,
                           message:"Inserted successfully"
                     },
                     error: null,
                  })
               }
            }
            else{
               res.status(200).json(createError(200,"Not found conversation available"));
            }
          }
       }
       else{
         res.status(200).json(createError(200,"Không tìm thấy lịch"));
       }
   }
   catch(err){
      console.log(err);
      res.status(200).json(createError(200,"Đã có lỗi xảy ra"));
   }
};

// delete canlerdal by api delete messsage 

// take all canlerdal of 1 person va khong check 
export const takeAllCanlerdal = async (req, res, next) => {
   try{
      console.log(req.body);
      const conversations = await Conversation.aggregate([
         { $match: 
           {
               "memberList.memberId":Number(req.body.userId),
               "messageList.messageType":"Canlerdal"
           }
         },
         {
           // k đóng vai trò tìm kiếm luôn 
           $project: {
             messageList: 
             {
                   $filter: {
                     input: "$messageList",
                     as: "messagelist",
                     cond: { 
                        $eq: ["$$messagelist.messageType", "Canlerdal"]
                     },
                   }
              }
           }
         }
       ]);
      if(conversations){
         res.status(200).json({
            data:{
              result:true,
              message:"Lấy thông tin thành công",
              conversations
            },
            error:null
          });
      }
   }
   catch(e){
      console.log(e);
      res.status(200).json(createError(200,"Đã có lỗi xảy ra"));
   }
}

export const deleteCanlerdal = async (req, res, next) => {
   try{
      console.log(req.body);
      let update1 = await Conversation.updateOne(
         { _id: Number(req.body.conversationId) },
         { $pull: 
           { 
            messageList:{
               _id: String(req.body.idCanlerdal)
            }
           } 
         }
       )
      if(update1){
         res.json({
            data:{
                  result:true,
                  message:"Deleted successfully"
            },
            error: null,
         })
      }
   }
   catch(e){
      console.log(e);
      res.status(200).json(createError(200,"Đã có lỗi xảy ra"));
   }
}

// conversations offline 
const createConversationOffline = async (code,user)=>{
   try{
      console.log("start")
        // create conv Offline/050901/Thu Oct 20 2022 14:03:56 GMT+0700 (Indochina Time)
      let result = await Conversation.find({_id:{$ne:0}},{_id:1}).sort({_id:-1}).limit(1);
      if(result && (result.length==1)){
         let count = result[0]._id;
         let update = await Counter.updateOne({name:"ConversationID"},{$set:{countID:count + 1}})
         console.log(count);
         if(update){
            const newConversation = new Conversation({
               _id:count + 1,
               isGroup: 1,
               typeGroup:`Offline/${code}/${String(new Date())}`,
               avatarConversation:"",
               adminId:Number(user.memberId),
               shareGroupFromLinkOption: 1,
               browseMemberOption: 1,
               pinMessage:"",
               memberList:[],
               messageList:[],
               browseMemberList:[],
            });
            const savedConversation = await newConversation.save();
            console.log(savedConversation);
            
            // when catch err => log ; this is method save cost
            if(savedConversation){
               let update = await Conversation.findOneAndUpdate(
                  {_id:savedConversation._id}, 
                  {$push:{memberList:user}}
               )
               if(update){
                  // gui tin nhan vao la xong
                  let sendmes = await axios({
                     method: "post",
                     url: "http://43.239.223.142:3005/Message/SendMessage",
                     data: {
                        MessageID: '',
                        ConversationID: savedConversation._id,
                        SenderID: user.memberId,
                        MessageType: "notification",
                        Message: `Bạn đã tạo nhóm Offline`,
                        Emotion: 1,
                        Quote: "",
                        Profile: "",
                        ListTag: "",
                        File: "",
                        ListMember: "",
                        IsOnline: [],
                        IsGroup: 1,
                        ConversationName: '',
                        DeleteTime: 0,
                        DeleteType: 0,
                     },
                     headers: { "Content-Type": "multipart/form-data" }
                  });
               }
            }
         }
      }
   }
   catch(e){
      console.log(e)
   }
    
}
export const JoinConversationOffline = async (req, res, next) => {
  console.log(req.body)
  try{ 
     if( req.body && req.body.code && req.body.userId && req.body.lat && req.body.long && req.body.name
         && Number(req.body.long) && Number(req.body.userId) && Number(req.body.code) && Number(req.body.lat)
       )
      {
        let infor = req.body;
        let time = new Date();
        let timeplus = new Date();
        let timebefore = new Date();
        timeplus.setHours(time.getHours() + 1);
        timebefore.setHours(time.getHours() - 1);
        time= String(time).split(":")[0];
        timeplus= String(timeplus).split(":")[0];
        timebefore= String( timebefore).split(":")[0];

  
        const conversations = await Conversation.aggregate([
            { $match: 
            {   
                  typeGroup:new RegExp("Offline",'i'),
                  typeGroup:new RegExp( String(req.body.code),'i'),
                  $or:[
                     {typeGroup:new RegExp(time,'i')},  // giơ hiện tại 
                     {typeGroup:new RegExp(timeplus,'i')},  // giờ tiếp theo 
                     {typeGroup:new RegExp(timebefore,'i')},
                  ]
            }
            },
            { $limit: 1 },
            {
               $addFields: { admin: { $first: "$memberList.memberId" } }
            },
            {
               $project:{
               typeGroup:1,
               admin:1,
               "memberList.memberId":1,
               }
            },
         ]);
      
        if(conversations){  // lỗi của phần này đưa vào try catch 
           if(conversations.length > 0){
              const host = await User.find({_id:Number(conversations[0].admin)},{_id:0,latitude:1, longtitude:1});
              
              // nếu không tồn tại thì đi vào try catch 
              if(host && (host.length>0) ){
                 let host2 =host[0];
                 if( 
                    ( (Number(host2.latitude) - 0.01) < Number(infor.lat) ) &&
                    ( (Number(host2.latitude) + 0.01) > Number(infor.lat) ) &&
                    ( (Number(host2.longtitude) - 0.01) < Number(infor.long) ) &&
                    ( (Number(host2.longtitude) + 0.01) > Number(infor.long) ) 
                 )
                 {  
                    // check xem trong danh sach thanh vien da co chua 
                    if(conversations[0].memberList.find(e => Number(e.memberId) == Number(infor.userId)) ){
                        res.status(200).json({
                           data:{
                              result:false,
                              message:"User joined before",
                           },
                           error:null
                        });
                    }
                    else{
                        // tiến hành update dưới base và gửi thông báo.
                        let user_info = fUserConv(Number(infor.userId),"",0,0,0,0,1,new Date(),0,0,[]);
                        let update = await Conversation.findOneAndUpdate(
                              {_id:conversations[0]._id}, 
                              {$push:{memberList:user_info}}
                           )
                        if(update){ // if have err => try catch log
                                 // gửi tin nhắn vào nhóm 
                                 let sendmes = await axios({
                                    method: "post",
                                    url: "http://43.239.223.142:3005/Message/SendMessage",
                                    data: {
                                       MessageID: '',
                                       ConversationID: conversations[0]._id,
                                       SenderID: conversations[0].admin,
                                       MessageType: "notification",
                                       Message: `${String(infor.name)} joined group`,
                                       Emotion: 1,
                                       Quote: "",
                                       Profile: "",
                                       ListTag: "",
                                       File: "",
                                       ListMember: "",
                                       IsOnline: [],
                                       IsGroup: 1,
                                       ConversationName: '',
                                       DeleteTime: 0,
                                       DeleteType: 0,
                                    },
                                    headers: { "Content-Type": "multipart/form-data" }
                                 });
                           if(sendmes){  // if have err => try catch log
                                 res.status(200).json({
                                    data:{
                                    result:true,
                                    message:"Thêm thành công",
                                    },
                                    error:null
                                 });
                           }
                        }
                    }
                 }
                 else{
                    let user_infom = fUserConv(Number(infor.userId),`${infor.name}-Offline-${infor.lat}-${infor.long}`,0,0,0,0,1,new Date(),0,0,[]);
                    createConversationOffline(String(req.body.code),user_infom);
                    res.status(200).json({
                       data:{
                       result:false,
                       message:"Vị trí không phù hợp, Nhóm offline chưa tồn tại,Đã tạo nhóm offline mới ",
                       },
                       error:null
                    });
                 }
              }
              // nếu thành viên đầu tiên của nhóm không còn tồn tại thì tiến hành xóa nhóm ; user nhập lại mã thì tạo nhóm mới 
              else if (host && ( Number(host.length)  === 0)) {
                 const delete_conv = await Conversation.deleteOne({_id:conversations[0]._id});
                 if(delete_conv){  // nếu không tồn tại thì đi vào try catch 
                    res.status(200).json(createError(200,"Nhóm không hợp lệ"));
                 }
              }
           }
           else{
              // tạo nhóm với tên mặc định 
              let user_info = fUserConv(Number(infor.userId),`${infor.name}-Offline-${infor.lat}-${infor.long}`,0,0,0,0,1,new Date(),0,0,[]);
              createConversationOffline(String(req.body.code),user_info);
              res.status(200).json({
                 data:{
                 result:false,
                 message:"Thời gian hoặc mã code không phù hợp, Nhóm offline chưa tồn tại,Đã tạo nhóm offline mới",
                 },
                 error:null
              });
           }
        }
      }
     else{
        res.status(200).json(createError(200,"Thông tin không đầy đủ"));
     }
  }
  catch(e){
     console.log(e);
     res.status(200).json(createError(200,"Đã có lỗi xảy ra"));
  }
}


// Thang lay danh sach cuoc hoi thoai
export const GetListConversation = async (req, res) => {
   try {
     const userId = Number(req.body.userId);
     const countConversation = Number(req.body.countConversation);
     const countConversationLoad = Number(req.body.countConversationLoad);
     const listConversations = await Conversation.find({
       "memberList.memberId": userId,
     })
       .limit(countConversation)
       .skip(countConversationLoad)
       .sort({ _id: -1 })
       .populate("members")
     const data = {
       result: true,
       message: "Lấy danh sách cuộc trò chuyện thành công",
       conversation: null,
       countConversation: countConversation,
       conversation_info: null,
       user_list: null,
       listConversation: [],
       error: null,
     };
     const lenListConversations = listConversations.length;
     let count = 0;
     while (count < lenListConversations) {
       if (listConversations[count].isGroup === 0) {
         const opponent =
           listConversations[count].members.find((e) => e._id !== userId) ||
           listConversations[count].members.find((e) => e._id === userId);
         const user = listConversations[count].memberList.find(
           (e) => e.memberId === Number(userId)
         );
         const mess = listConversations[count].messageList.at(-1) || null;
         const opponentAvatar = opponent.avatarUser
           ? `https://mess.timviec365.vn/avatarUser/${opponent._id}/${opponent.avatarUser}`
           : `https://mess.timviec365.vn/avatar/${opponent.userName.substring(
               0,
               1
             )}_${Math.floor(Math.random() * 4) + 1}.png`;
         const listMember = [];
         const lenMemberList = listConversations[count].memberList.length;
         for (let j = 0; j < lenMemberList; j++) {
           const dataUser = listConversations[count].members.find(
             (mems) => mems._id === listConversations[count].memberList[j].memberId
           );
           if (!dataUser) {
             continue;
           }
           const requestContact = await RequestContact.findOne({
             userId: listConversations[count].memberList[j].memberId,
             contactId: userId,
           });
           const avatarUser = dataUser.avatarUser
             ? `https://mess.timviec365.vn/avatarUser/${dataUser._id}/${dataUser.avatarUser}`
             : `https://mess.timviec365.vn/avatar/${dataUser.userName.substring(
                 0,
                 1
               )}_${Math.floor(Math.random() * 4) + 1}.png`;
           listMember.push({
             id: dataUser._id,
             userName: dataUser.userName,
             avatarUser: avatarUser,
             status: dataUser.status,
             active: dataUser.active,
             isOnline: dataUser.isOnline,
             statusEmotion: dataUser.dataUser,
             lastActive: dataUser.lastActive,
             unReader: 0,
             linkAvatar: avatarUser,
             companyId: dataUser.companyId,
             timeLastSeener: listConversations[count].memberList[j].timeLastSeener,
             idTimViec: dataUser.idTimViec,
             type365: dataUser.type365,
             friendStatus: requestContact ? requestContact.status : "none",
             liveChat: null,
           });
         }
         data.listConversation.push({
           conversationId: listConversations[count].id,
           conversationName: opponent.userName,
           avatarConversation: opponentAvatar,
           unReader: user.unReader,
           isGroup: listConversations[count].isGroup,
           senderId: mess ? mess.senderId : null,
           pinMessageId: listConversations[count].pinMessage,
           messageId: mess ? mess._id : null,
           message: mess ? mess.message : null,
           messageType: mess ? mess.messageType : null,
           createAt: mess ? mess.createAt : null,
           countMessage: listConversations[count].messageList.length || 0,
           messageDisplay: mess ? mess.displayMessage : null,
           typeGroup: listConversations[count].typeGroup,
           adminId: listConversations[count].adminId,
           shareGroupFromLink: listConversations[count].shareGroupFromLinkOption,
           memberList: null,
           browseMember: listConversations[count].browseMemberOption,
           isFavorite: user.isFavorite,
           notification: user.notification,
           isHidden: user.isHidden,
           deleteTime: user.deleteTime,
           deleteType: user.deleteType,
           listMess: 0,
           linkAvatar: opponentAvatar,
           listBrowerMember: [],
           listMember,
         });
       }
       if (listConversations[count].isGroup === 1) {
         const user = listConversations[count].memberList.find(
           (e) => e.memberId === Number(userId)
         );
         const userData = listConversations[count].members.find(
           (e) => e._id === Number(userId)
         );
         let conversationName;
         if (listConversations[count].memberList.length === 1) {
           conversationName = user.conversationName
             ? user.conversationName
             : userData.userName;
         }
         if (listConversations[count].memberList.length === 2) {
           conversationName = user.conversationName
             ? user.conversationName
             : listConversations[count].members.find((e) => e._id !== user.memberId)
                 .userName;
         }
         if (listConversations[count].memberList.length === 3) {
           conversationName = user.conversationName
             ? user.conversationName
             : listConversations[count].members
                 .filter((e) => e._id === user.memberId)
                 .map((e) => {
                   e = e.userName;
                 })
                 .join(",");
         }
         if (listConversations[count].memberList.length > 3) {
           conversationName = user.conversationName
             ? user.conversationName
             : listConversations[count].members
                 .filter((e) => e._id === user.memberId)
                 .slice(-3)
                 .map((e) => {
                   e = e.userName;
                 })
                 .join(",");
         }
         const mess = listConversations[count].messageList.at(-1) || null;
         const conversationAvatar = listConversations[count].avatarConversation
           ? `https://mess.timviec365.vn/avatarUser/${listConversations[count]._id}/${listConversations[count].avatarConversation}`
           : `https://mess.timviec365.vn/avatar/${conversationName.substring(
               0,
               1
             )}_${Math.floor(Math.random() * 4) + 1}.png`;
         const listMember = [];
         const lenMemberList = listConversations[count].memberList.length;
         for (let j = 0; j < lenMemberList; j++) {
           const dataUser = listConversations[count].members.find(
             (mems) => mems._id === listConversations[count].memberList[j].memberId
           );
           if (!dataUser) {
             continue;
           }
           const requestContact = await RequestContact.findOne({
             userId: listConversations[count].memberList[j].memberId,
             contactId: userId,
           });
           const avatarUser = dataUser.avatarUser
             ? `https://mess.timviec365.vn/avatarUser/${dataUser._id}/${dataUser.avatarUser}`
             : `https://mess.timviec365.vn/avatar/${dataUser.userName.substring(
                 0,
                 1
               )}_${Math.floor(Math.random() * 4) + 1}.png`;
           listMember.push({
             id: dataUser._id,
             userName: dataUser.userName,
             avatarUser: avatarUser,
             status: dataUser.status,
             active: dataUser.active,
             isOnline: dataUser.isOnline,
             statusEmotion: dataUser.dataUser,
             lastActive: dataUser.lastActive,
             unReader: 0,
             linkAvatar: avatarUser,
             companyId: dataUser.companyId,
             timeLastSeener: listConversations[count].memberList[j].timeLastSeener,
             idTimViec: dataUser.idTimViec,
             type365: dataUser.type365,
             friendStatus: requestContact ? requestContact.status : "none",
             liveChat: null,
           });
         }
 
         data.listConversation.push({
           conversationId: listConversations[count].id,
           conversationName: conversationName,
           avatarConversation: conversationAvatar,
           unReader: user.unReader,
           isGroup: listConversations[count].isGroup,
           senderId: mess ? mess.senderId : null,
           pinMessageId: listConversations[count].pinMessage,
           messageId: mess ? mess._id : null,
           message: mess ? mess.message : null,
           messageType: mess ? mess.messageType : null,
           createAt: mess ? mess.createAt : null,
           countMessage: listConversations[count].messageList.length || 0,
           messageDisplay: mess ? mess.displayMessage : null,
           typeGroup: listConversations[count].typeGroup,
           adminId: listConversations[count].adminId,
           shareGroupFromLink: listConversations[count].shareGroupFromLinkOption,
           memberList: null,
           browseMember: listConversations[count].browseMemberOption,
           isFavorite: user.isFavorite,
           notification: user.notification,
           isHidden: user.isHidden,
           deleteTime: user.deleteTime,
           deleteType: user.deleteType,
           listMess: 0,
           linkAvatar: conversationAvatar,
           listBrowerMember: [],
           listMember,
         });
       }
     count++;
     
     }
     return res.send(data);
   } catch (err) {
     console.log(err);
     if (err) return res.status(200).json(createError(200, err.message));
   }
 };
//ChangeShareLinkOfGroup
export const ChangeShareLinkOfGroup = async (req, res) => {
   try {
     const conversationId = Number(req.body.conversationId);
     const shareGroupFromLink = Number(req.body.shareGroupFromLink);
     const existConversation = await Conversation.findById(conversationId);
     if (shareGroupFromLink == null)
       return res
         .status(200)
         .send(createError(200, "Thiếu thông tin truyền lên"));
     if (!existConversation)
       return res
         .status(200)
         .send(createError(200, "Thay đổi chia sẻ link nhóm thất bại"));
     if (shareGroupFromLink > 0) {
       existConversation.shareGroupFromLinkOption = 1;
     }
     if (shareGroupFromLink === 0) {
       existConversation.shareGroupFromLinkOption = 0;
     }
     await existConversation.save();
     const data = {
       result: true,
       message: "Thay đổi chia sẻ link nhóm thành công",
     };
     return res.status(200).send(data);
   } catch (err) {
     if (err) return res.status(200).send(createError(200, err.message));
   }
};
//Danh sach cuoc hoi thoai chua doc
export const GetListConversationUnreader = async (req, res) => {
   try {
     const userId = Number(req.body.userId);
     const listConversationsUnreader = await Conversation.find({
       $and: [
         { "memberList.memberId": { $eq: userId } },
         { "memberList.unReader": { $ne: 0 } },
       ],
     }).populate("members");
 
     if (listConversationsUnreader.length === 0)
       return res
         .status(200)
         .send(createError(200, "User không có cuộc trò chuyện chưa đọc nào"));
     const data = {
       result: true,
       message: "Lấy cuộc trò chuyện thành công",
       conversation: [],
     };
     for (let i = 0; i < listConversationsUnreader.length; i++) {
       const memberList = listConversationsUnreader[i].memberList;
       const listMember = listConversationsUnreader[i].members;
       const conversationName =
         listConversationsUnreader[i].isGroup === 1
           ? memberList[0].conversationName
           : listMember.find((e) => e._id !== userId).userName;
       const unReader = memberList.find((e) => e.memberList !== userId).unReader;
       data.conversation.push(
         dataToView(
           listConversationsUnreader[i],
           conversationName,
           null,
           unReader
         )
       );
     }
     data["countConversation"] = data.conversation.length;
     return res.status(200).send(data);
   } catch (err) {
     console.log(err);
     if (err) return res.status(200).send(createError(200, err.message));
   }
 };
//Danh sach hoi thoai chua doc (id)
export const GetListUnreaderConversation = async (req, res) => {
   try {
     const userId = Number(req.body.userId);
     if (!userId)
       return res
         .status(200)
         .send(createError(200, "Thiếu thông tin truyền lên"));
     const listUnreaderConversations = await Conversation.find({
       $and: [
         { "memberList.memberId": { $eq: userId } },
         { "memberList.unReader": { $ne: 0 } },
       ],
     })
     .select("_id");
     if (listUnreaderConversations.length === 0)
       return res
         .status(200)
         .send(createError(200, "User không có cuộc trò chuyện chưa đọc nào"));
     const data = {
       result: true,
       message: "Lấy cuộc trò chuyện thành công",
       conversation: [],
       error: null
     };
     for (let i = 0; i < listUnreaderConversations.length; i++) {
       data.conversation.push(listUnreaderConversations[i]._id);
     }
     data["countConversation"] = data.conversation.length;
     return res.status(200).send(data);
   } catch (err) {
     if (err) return res.status(200).send(createError(200, err.message));
   }
};

//Danh sach thanh vien trong group
export const GetListMemberOfGroup = async (req, res) => {
   try {
     const conversationId = Number(req.body.conversationId) || null;
     const existConversation = await Conversation.findById(
       conversationId
     ).populate("members");
     if (existConversation.length === 0)
       return res.status(200).send(createError(200, "Không tìm thấy kết quả"));
     const data = {
       result: true,
       message: "Lấy danh sách thành viên thành công",
       userList: [],
       error: null,
     };
     const dataUser = existConversation.members;
     let count = 0;
     while (count < dataUser.length) {
       const avatarUser = dataUser[count].avatarUser
         ? `https://mess.timviec365.vn/avatarUser/${dataUser[count]._id}/${dataUser[count].avatarUser}`
         : `https://mess.timviec365.vn/avatar/${dataUser[count].userName.substring(0, 1)}_${
             Math.floor(Math.random() * 4) + 1
           }.png`;
       data.userList.push({
         id: dataUser[count]._id,
         userName: dataUser[count].userName,
         avatarUser: avatarUser,
         status: dataUser[count].status,
         active: dataUser[count].active,
         isOnline: dataUser[count].isOnline,
         statusEmotion: dataUser[count].statusEmotion,
         lastActive: date.format(dataUser[count].lastActive, "DD/MM/YYYY HH:mm:ss A"),
         linkAvatar: avatarUser,
         companyId: dataUser[count].companyId,
         timeLastSeener: dataUser[count].timeLastSeener,
         idTimViec: dataUser[count].idTimViec,
         type365: dataUser[count].type365,
         friendStatus: "none",
         liveChat: null,
       });
       count++;
     }
     res.status(200).send(data);
   } catch (err) {
     console.log(err);
     if (err) return res.status(200).send(createError(200, err.message));
   }
 };

//Thay doi ten nhom
export const ChangeNameGroup = async (req, res) => {
   try {
     const conversationId = Number(req.body.conversationId);
     const conversationName = req.body.conversationName;
     const existConversation = await Conversation.findOne({
       _id: conversationId,
       isGroup: 1,
     });
     if (!existConversation)
       return res
         .status(200)
         .send(createError(200, "Thay đổi tên nhóm thất bại"));
     const data = {
       result: true,
       message: "Thay đổi tên nhóm thành công",
     };
     for (let i = 0; i < existConversation.memberList.length; i++) {
       existConversation.memberList[i].conversationName = conversationName;
     }
     await existConversation.save();
     return res.status(200).send({ data, error: null });
   } catch (err) {
     // console.log(err)
     if (err) return res.status(200).send(createError(200, err.message));
   }
};
//Bat tat thanh vien kiem duyet
export const ChangeBrowseMemberOfGroup = async (req, res) => {
   try {
     const userId = Number(req.body.userId);
     const conversationId = Number(req.body.conversationId);
     if (!userId || !conversationId)
       return res
         .status(200)
         .send(createError(200, "Thiếu thông tin truyền lên"));
     const conversation = await Conversation.findOne({
       _id: conversationId,
       isGroup: 1,
       "memberList.memberId": userId,
     });
     if (!conversation) {
       return res.status(200).send({
         result: true,
         message: "Thay đổi chia sẻ link nhóm thành công",
         error: null,
       });
     }
     conversation.browseMemberOption =
       conversation.browseMemberOption === 1 ? 0 : 1;
     await conversation.save();
     return res
       .status(200)
       .send(createError(200, "Thay đổi chia sẻ link nhóm thất bại"));
   } catch (err) {
     if (err) return res.status(200).send(createError(200, err.message));
   }
};
//Ghim tin nhan
export const PinMessage = async (req, res) => {
   try {
     const conversationId = Number(req.body.conversationId);
     const pinMessageId = req.body.pinMessageId;
     const existConversation = await Conversation.findOne({
       _id: conversationId,
       "messageList._id": pinMessageId,
     });
     if (!existConversation)
       return res.status(200).send(createError(200, "Ghim tin nhắn thất bại"));
     existConversation.pinMessage = pinMessageId;
     await existConversation.save();
     return res.status(200).send({
       data: {
         result: true,
         message: "Ghim tin nhắn thành công",
       },
     });
   } catch (err) {
     if (err) return res.status(200).send(createError(200, err.message));
   }
 };
 //Bo ghim tin nhan
 export const UnPinMessage = async (req, res) => {
   try {
     const conversationId = Number(req.body.conversationId);
     const pinMessageId = req.body.pinMessageId;
     const existConversation = await Conversation.findOne({
       _id: conversationId,
       "messageList._id": pinMessageId,
     });
     if (!existConversation)
       return res
         .status(200)
         .send(createError(200, "Bỏ ghim tin nhắn thất bại"));
     existConversation.pinMessage = "";
     await existConversation.save();
     return res.status(200).send({
       data: {
         result: true,
         message: "Bỏ ghim tin nhắn thành công",
       },
     });
   } catch (err) {
     if (err) return res.status(200).send(createError(200, err.message));
   }
 };
 //Lay 1 cuoc hoi thoai
 export const GetConversation = async (req, res) => {
   try {
     const conversationId = Number(req.body.conversationId);
     const senderId = Number(req.body.senderId);
     const existConversation = await Conversation.findOne({
       _id: conversationId,
       "memberList.memberId": senderId,
     }).populate("members").lean();
     const data = {
       result: true,
       message: "Lấy thông tin cuộc trò chuyện thành công",
       err: null,
     };
     let conversationName;
     let avatarConversation;
     const members = existConversation.members;
     if (members.length === 1) {
       conversationName = members[0].userName;
       avatarConversation = `https://mess.timviec365.vn/avatar/${members[0].userName.substring(
         0,
         1
       )}_${Math.floor(Math.random() * 4) + 1}.png`;
     }
     if (members.length === 2) {
       const user = members.find((e) => e._id !== senderId);
       conversationName = user.userName;
       avatarConversation = user.avatarConversation
         ? `https://mess.timviec365.vn/avatarGroup/${conversationId}/`
         : `https://mess.timviec365.vn/avatar/${user.userName.substring(0, 1)}_${
             Math.floor(Math.random() * 4) + 1
           }.png`;
     }
     if (members.length > 2) {
       conversationName = members
         .filter((e) => e._id === senderId)
         .slice(-2)
         .map((e) => (e = e.userName))
         .join(",");
       avatarConversation = `https://mess.timviec365.vn/avatar/${conversationName.substring(
         0,
         1
       )}_${Math.floor(Math.random() * 4) + 1}.png`;
     }
     const listMember = [];
     const lenMemberList = existConversation.memberList.length;
     console.log(existConversation.memberList[4]);
     for (let j = 0; j < lenMemberList; j++) {
       const dataUser = existConversation.members.find(
         (mems) => mems._id == existConversation.memberList[j].memberId
       );
       if (!dataUser) {
         continue;
       }
       const requestContact = await RequestContact.findOne({
         userId: existConversation.memberList[j].memberId,
         contactId: senderId,
       });
       const avatarUser = dataUser.avatarUser
         ? `https://mess.timviec365.vn/avatarUser/${dataUser._id}/${dataUser.avatarUser}`
         : `https://mess.timviec365.vn/avatar/${dataUser.userName.substring(
             0,
             1
           )}_${Math.floor(Math.random() * 4) + 1}.png`;
       listMember.push({
         id: dataUser._id,
         userName: dataUser.userName,
         avatarUser: avatarUser,
         status: dataUser.status,
         active: dataUser.active,
         isOnline: dataUser.isOnline,
         statusEmotion: dataUser.dataUser,
         lastActive: dataUser.lastActive,
         unReader: 0,
         linkAvatar: avatarUser,
         companyId: dataUser.companyId,
         timeLastSeener: existConversation.memberList[j].timeLastSeener,
         idTimViec: dataUser.idTimViec,
         type365: dataUser.type365,
         friendStatus: requestContact ? requestContact.status : "none",
         liveChat: null,
       });
     }
     const sender = members.find((e) => e._id === senderId);
     data["conversation_info"] = dataToView(
       existConversation,
       conversationName,
       listMember,
       sender.unReader
     );
     return res.status(200).send(data);
   } catch (err) {
     console.log(err);
     if (err) return res.status(200).send(createError(200, err.mesesage));
   }
 };
 //Thoat khoi cuoc tro chuyen
 export const OutGroup = async (req, res) => {
  try {
    const conversationId = Number(req.body.conversationId);
    const senderId = Number(req.body.senderId);
    const adminId = Number(req.body.adminId) || 0;
    let existConversation;
    if (adminId > 0) {
      existConversation = await Conversation.findOne({
        _id: conversationId,
        adminId: senderId,
        $and: [
          { "memberList.memberId": { $eq: senderId } },
          { "memberList.memberId": { $eq: adminId } },
        ],
      }).select({
        adminId: 1,
        memberList: 1,
      });
    } else {
      existConversation = await Conversation.findOne({
        _id: conversationId,
        "memberList.memberId": { $eq: senderId },
      }).select({
        memberList: 1,
      });
    }
    const data = {
      result: true,
      error: null,
    };
    if (!existConversation)
      return res.status(200).send(createError(200, "Rời nhóm thất bại"));
    if (existConversation && adminId === -1) {
      existConversation.adminId = adminId;
      existConversation.memberList = existConversation.memberList.filter(
        (e) => e.memberId !== senderId
      );
      await existConversation.save();
      data["message"] = "Rời nhóm thành công";
      return res.status(200).send(data);
    }
    if (existConversation && adminId !== 0) {
      existConversation.adminId = adminId;
      existConversation.memberList = existConversation.memberList.filter(
        (e) => e.memberId !== senderId
      );
      await existConversation.save();
      data["message"] = "Trao quyền quản trị viên nhóm thành công";
      return res.status(200).send(data);
    }

    if (existConversation && adminId === 0) {
      existConversation.memberList = existConversation.memberList.filter(
        (e) => e.memberId !== senderId
      );
      await existConversation.save();
      data["message"] = "Rời nhóm thành công";
      return res.status(200).send(data);
    }
    data["message"] = "Trao quyền quản trị viên nhóm thất bại";
    return res.status(200).send(data);
  } catch (err) {
    console.log(err);
    if (err) res.status(200).send(createError(200, err.message));
  }
};
 //Them cuoc hoi thoait vao yeu thich
 export const AddToFavoriteConversation = async (req, res) => {
   try {
     const conversationId = Number(req.body.conversationId);
     const senderId = Number(req.body.senderId);
     const isFavorite = Number(req.body.isFavorite);
     const existConversation = await Conversation.findById(
       conversationId
     ).select({ memberList: 1 });
     const data = {
       result: true,
       error: null,
     };
     if (!existConversation)
       return res.send(
         createError(200, "Sửa Trạng thái yêu thích nhóm thất bại")
       );
     if (isFavorite == 0) {
       let memberIndex = existConversation.memberList.findIndex(
         (e) => e.memberId === senderId
       );
       existConversation.memberList[memberIndex].isFavorite = 0;
       await existConversation.save();
       data["message"] = "Sửa Trạng thái ẩn nhóm thành công";
       return res.send(data);
     }
     if (isFavorite > 0) {
       let memberIndex = existConversation.memberList.findIndex(
         (e) => e.memberId === senderId
       );
       existConversation.memberList[memberIndex].isFavorite = 1;
       await existConversation.save();
       data["message"] = "Sửa Trạng thái ẩn nhóm thành công";
       return res.send(data);
     }
     return res.send(createError(200, "Sửa Trạng thái yêu thích nhóm thất bại"));
   } catch (err) {
     if (err) return res.send(createError(200, err.message));
   }
 };
 //An cuoc hoi thoai
 export const HiddenConversation = async (req, res) => {
   try {
     const conversationId = Number(req.body.conversationId);
     const senderId = Number(req.body.senderId);
     const isHidden = Number(req.body.isHidden);
     const existConversation = await Conversation.findById(
       conversationId
     ).select({ memberList: 1 });
     const data = {
       result: true,
       error: null,
     };
     if (!existConversation)
       return res.send(createError(200, "Sửa Trạng thái ẩn nhóm thất bại"));
     if (isHidden == 0) {
       let memberIndex = existConversation.memberList.findIndex(
         (e) => e.memberId === senderId
       );
       existConversation.memberList[memberIndex].isHidden = 0;
       await existConversation.save();
       data["message"] = "Sửa Trạng thái yêu thích nhóm thành công";
       return res.send(data);
     }
     if (isHidden > 0) {
       let memberIndex = existConversation.memberList.findIndex(
         (e) => e.memberId === senderId
       );
       existConversation.memberList[memberIndex].isHidden = 1;
       await existConversation.save();
       data["message"] = "Sửa Trạng thái ẩn nhóm thành công";
       return res.send(data);
     }
     return res.send(createError(200, "Sửa Trạng thái ẩn nhóm thất bại"));
   } catch (err) {
     if (err) return res.send(createError(200, err.message));
   }
 };

//Tao cuoc hoi thoai 1 1
export const CreateNewConversation = async (req, res) => {
  try {
    const userId = Number(req.body.userId);
    const contactId = Number(req.body.contactId);
    const data = {
      result: true,
      error: null,
    };
    const bigestId = (
      await Conversation.find().sort({ _id: -1 }).select("_id").limit(1)
    )[0]._id;
    const existConversation = await Conversation.findOne({
      adminId: userId,
      "memberList.memberId": contactId,
    });
    if (existConversation) {
      data["conversationId"] = existConversation._id;
      return res.send(data);
    }
    const newConversation = await Conversation.create({
      _id: bigestId + 1,
      adminId: userId,
      memberList: [
        {
          memberId: userId,
        },
        {
          memberId: contactId,
        },
      ],
      messageList: [],
      browseMemberList: [],
    });
    data["conversationId"] = newConversation._id;
    return res.send(data);
  } catch (err) {
    if (err) return res.send(createError(200, err.message));
  }
};
//Xoa cuoc hoi thoai
export const DeleteConversation = async (req, res) => {
  try {
    const conversationId = Number(req.body.conversationId);
    const senderId = Number(req.body.senderId);
    const existConversation = await Conversation.findOne({
      _id: conversationId,
    }).select({
      memberList: 1,
      messageList: 1,
    });
    const indexMemer = existConversation.memberList.findIndex(
      (e) => e.memberId === senderId
    );
    const lastMess = existConversation.messageList.at(-1);
    existConversation.memberList[indexMemer].messageDisplay =
      lastMess.displayMessage;
    await existConversation.save();
    const data = {
      result: true,
      message: "Xóa cuộc trò chuyện thành công",
      err: null,
    };
    return res.status(200).send(data);
  } catch (err) {
    if (err) return res.send(createError(200, err.message));
  }
};

//Doc tin nhan
export const ReadMessage = async (req, res) => {
  try {
    const senderId = Number(req.body.senderId);
    const conversationId = Number(req.body.conversationId);
    const existUnreadMessage = await Conversation.findOne({
      _id: conversationId,
      $and: [
        { "memberList.memberId": senderId },
        { "memberList.unReader": { $ne: 0 } },
      ],
    });
    if (!existUnreadMessage)
      return res.send(createError(200, "Không tồn tại tin nhắn chưa đọc"));
    const idxMem = existUnreadMessage.memberList.findIndex(
      (e) => e.memberId === senderId
    );
    existUnreadMessage.memberList[idxMem].unReader = 0;
    existUnreadMessage.memberList[idxMem].timeLastSeener = Date.now();
    existUnreadMessage.save();
    const data = {
      result: true,
      message: "Đánh dấu tin nhắn đã đọc thành công thành công",
    };
    return res.send(data);
  } catch (err) {
    if (err) return res.send(createError(err, err.message));
  }
};
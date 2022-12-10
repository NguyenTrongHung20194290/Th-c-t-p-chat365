import Conversation from "../models/Conversation.js";
import { createError } from "../utils/error.js";
import User from "../models/User.js";
import {Messages , MessageQuote,MessagesDB ,EmotionMessageDBDefault} from "../functions/fModels/fMessage.js";
import RequestContact from "../models/RequestContact.js";
import UsersClassified from "../models/UsersClassified.js"; 
import {fInfoLink ,fInfoFile,fEmotion, fMessageQuote} from "../functions/fModels/fMessages.js";
import io from 'socket.io-client';
import qs from 'qs';
import axios from 'axios'
import Birthday from "../models/Birthday.js"
import cron from 'node-cron'
const socket = io.connect('http://43.239.223.142:3000', {
  secure: true,
  enabledTransports: ["wss"],
  transports: ['websocket', 'polling'],
});
// Nhật ký 
// Lấy danh sách nhật ký của cuộc trò chuyện gồm những bài đăng và bình luận mới nhất 
export const TakeListDiaryConversation = async (req, res, next) => {
    // dùng vòng for => Truy vấn 10 lần 
    console.log(req.body)
    try{
        if(req.body && req.body.conversationId && req.body.time && Number(req.body.conversationId)){
            
          if(Number(req.body.time) === 0) {
            let result = await Conversation.aggregate([
              { $match: 
                    {_id:Number(req.body.conversationId)},
              },
              {
                $project: {
                  messageList: {
                    $slice: [  // để giới hạn kết quả trả về 
                      {
                        $filter: {
                          input: "$messageList",
                          as: "messagelist",
                          cond: { 
                              $eq: ["$$messagelist.messageType", "DiaryElement"]
                          },
                        }
                      },
                      -10 
                    ]
                  }
                }
              }
            ]);
            let listDiary = result[0].messageList;
            // sắp xếp 
            listDiary.sort((a, b)=> {
              if (new Date(a.createAt) < new Date(b.createAt)) {
                return 1;
              }
              if (new Date(a.createAt) > new Date(b.createAt)) {
                return -1;
              }
              return 0;
            });
            for(let i=0; i<listDiary.length; i++){
                let count = await Conversation.aggregate([
                    { $match: 
                          {_id:Number(req.body.conversationId)},
                    },
                    {
                      $project: {
                        "total": {
                            "$size": {
                                $filter: {
                                    input: "$messageList",
                                    as: "messagelist",
                                    cond: { 
                                      $and:[
                                        {
                                          $regexMatch: {
                                            input: "$$messagelist.messageType",  // nhớ kỹ input 
                                            regex: new RegExp(String(listDiary[i]._id),'i')
                                          }
                                        },
                                        {
                                          $regexMatch: {
                                            input: "$$messagelist.messageType",  // nhớ kỹ input 
                                            regex: new RegExp("Comment",'i')
                                          }
                                        }
                                      ]
                                    },
                                }
                            }
                        }
                      }
                    }
                  ]);
                
                listDiary[i].countComment = Number(count[0].total);
                if(listDiary[i].emotion.Emotion1==""){
                    listDiary[i].countLike=0;
                }
                else{
                    listDiary[i].countLike= String(listDiary[i].emotion.Emotion1).split(",").length;
                }
            }
            res.status(200).json({
                data:{
                  result:true,
                  message:"Lấy thông tin thành công",
                  listDiary,
                  countDiary: listDiary.length
                },
                error:null
            });
          }
          // chia case => Giúp tối ưu performance => dễ mở rộng 
          else{
            if(new Date(String(req.body.time))){
              let result = await Conversation.aggregate([
                { $match: 
                      {_id:Number(req.body.conversationId)},
                },
                {
                  $project: {
                    messageList: {
                      $slice: [  // để giới hạn kết quả trả về 
                        {
                          $filter: {
                            input: "$messageList",
                            as: "messagelist",
                            cond: { 
                                $and:[ 
                                  {$eq: ["$$messagelist.messageType", "DiaryElement"]},
                                  {$lte: [ "$$messagelist.createAt", new Date(String(req.body.time)) ]}
                                ]
                            },
                          }
                        },
                        -10 
                      ]
                    }
                  }
                }
              ]);
              let listDiary = result[0].messageList;
              listDiary.sort((a, b)=> {
                if (new Date(a.createAt) < new Date(b.createAt)) {
                  return 1;
                }
                if (new Date(a.createAt) > new Date(b.createAt)) {
                  return -1;
                }
                return 0;
              });
              for(let i=0; i<listDiary.length; i++){
                  let count = await Conversation.aggregate([
                      { $match: 
                            {_id:Number(req.body.conversationId)},
                      },
                      {
                        $project: {
                          "total": {
                              "$size": {
                                  $filter: {
                                      input: "$messageList",
                                      as: "messagelist",
                                      cond: { 
                                        $and:[
                                          {
                                            $regexMatch: {
                                              input: "$$messagelist.messageType",  // nhớ kỹ input 
                                              regex: new RegExp(String(listDiary[i]._id),'i')
                                            }
                                          },
                                          {
                                            $regexMatch: {
                                              input: "$$messagelist.messageType",  // nhớ kỹ input 
                                              regex: new RegExp("Comment",'i')
                                            }
                                          }
                                        ]
                                      },
                                  }
                              }
                          }
                        }
                      }
                    ]);
                  
                  listDiary[i].countComment = Number(count[0].total);
                  if(listDiary[i].emotion.Emotion1==""){
                      listDiary[i].countLike=0;
                  }
                  else{
                      listDiary[i].countLike= String(listDiary[i].emotion.Emotion1).split(",").length;
                  }
              }
              res.status(200).json({
                  data:{
                    result:true,
                    message:"Lấy thông tin thành công",
                    listDiary,
                    countDiary: listDiary.length
                  },
                  error:null
              });
            }
            else{
              res.status(200).json(createError(200,"Time truyền lên không hợp lệ"));
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
 }

export const TakeListUserLike = async ( req, res, next )=>{
  console.log(req.body)
  try{
    if(req.body && req.body.listUserId){
      let info = req.body;
      if(info.listUserId==""){
        res.status(200).json({
            data:{
              result:false,
              message:"Không có Id truyền lên",
              listUser:[]
            },
            error:null
        });
      }
      else{
        let listUserId = [];
        for(let i=0; i<String(info.listUserId).split(",").length; i++){
          listUserId.push(Number(String(info.listUserId).split(",")[i]))
        }
        let listUser = await User.find( { _id: { $in:  listUserId } },{userName:1, avatarUser:1} );
        res.status(200).json({
          data:{
            result:true,
            message:"Lấy thông tin thành công",
            listUser
          },
          error:null
      });
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
}

export const TakeListComment = async ( req, res, next )=>{
  try{
    if(req.body && req.body.conversationId && Number(req.body.conversationId) &&  req.body.messageId ){
      let result = await Conversation.aggregate([
        { $match: 
              {_id:Number(req.body.conversationId)},
        },
        {
          $project: {
            messageList: {
            
                  $filter: {
                    input: "$messageList",
                    as: "messagelist",
                    cond: { 
                      $and:[
                        {
                          $regexMatch: {
                            input: "$$messagelist.messageType",  // nhớ kỹ input 
                            regex: new RegExp( String(req.body.messageId),'i')
                          }
                        },
                        {
                          $regexMatch: {
                            input: "$$messagelist.messageType",  // nhớ kỹ input 
                            regex: new RegExp( "Comment",'i')
                          }
                        }
                      ]
                    },
                  }
               
            }
          }
        }
      ]);
      if(result){
        res.status(200).json({
          data:{
            result:true,
            message:"Lấy thông tin thành công",
            result
          },
          error:null
        });
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
}

export const Dislike = async (req,res,next) =>{
  try{
    if(req.body && req.body.conversationId && Number(req.body.conversationId) &&  req.body.messageId && req.body.userId && Number(req.body.userId)){
      let result = await Conversation.aggregate([
        { $match: 
              {_id:Number(req.body.conversationId)},
        },
        {
          $project: {
            messageList: {
              $slice: [  // để giới hạn kết quả trả về 
                {
                  $filter: {
                    input: "$messageList",
                    as: "messagelist",
                    cond: { 
                      $eq: ["$$messagelist._id", String(req.body.messageId)]
                    },
                  }
                },
                -10 
              ]
            }
          }
        }
      ]);
      if(result){
        let ListUserLike = result[0].messageList[0].emotion.Emotion1;
        console.log(ListUserLike);
        if(String(ListUserLike).split(",")[0] == String(req.body.userId)){
          ListUserLike= String(ListUserLike).replace(`${String(req.body.userId)},`,"");
        }
        else{
          ListUserLike= String(ListUserLike).replace(`,${String(req.body.userId)}`,"");
        }
        console.log(ListUserLike);
        //db.Conversations.updateOne({_id:4,"messageList.messageType":"text"},{$set:{"messageList.$.messageType":"DiaryElement"}})
        let update = await Conversation.findOneAndUpdate(
          { _id:Number(req.body.conversationId),
            "messageList._id":String(req.body.messageId)
          }, 
          {$set:{"messageList.$.emotion.Emotion1":ListUserLike}}
        )
        if(update){
          res.status(200).json({
            data:{
              result:update,
              message:"Dislike thành công"
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
}

// báo xấu 
export const NotifySpam = async (req,res,next) =>{
  try{
    if(req.body && req.body.conversationId && Number(req.body.conversationId) &&  req.body.messageId && req.body.userId && Number(req.body.userId) && req.body.nameuser && String(req.body.nameuser)){
      let result = await Conversation.aggregate([
        { $match: 
              {_id:Number(req.body.conversationId)},
        },
        {
          $project: {
            messageList: {
              $slice: [  // để giới hạn kết quả trả về 
                {
                  $filter: {
                    input: "$messageList",
                    as: "messagelist",
                    cond: { 
                      $eq: ["$$messagelist._id", String(req.body.messageId)]
                    },
                  }
                },
                -10 
              ]
            }
          }
        }
      ]);
      if(result){
        console.log()
        let user = await User.find({_id:Number(result[0].messageList[0].senderId)},{userName:1});
        if(user && user.length>0){
          let sendmes = await axios({
            method: "post",
            url: "http://43.239.223.142:3005/Message/SendMessage",
            data: {
               MessageID: '',
               ConversationID: Number(req.body.conversationId),
               SenderID: Number(req.body.userId),
               MessageType: "notification",
               Message: `${req.body.nameuser} báo xấu bài viết trong nhật ký chung của ${user[0].userName} : ${result[0].messageList[0].message.slice(0,20)}...`,
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
          if(sendmes){
            res.status(200).json({
              data:{
                result:true,
                message:"Lấy thông tin thành công",
                result
              },
              error:null
            });
          }
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
}


// tin nhắn đồng thời. 
export const  SendManyMesByArrayId = async ( req,res,next ) =>{
  try{
    if(req.body && req.body.SenderId && req.body.content && req.body.ArrayUserId && (String(req.body.ArrayUserId).includes("["))){
      let listUserId =[] ;
      let dataReceived = req.body;
      // xử lý dữ liệu mảng truyền lên dạng form-data hoặc json.
      if(dataReceived.ArrayUserId.includes("[")){
        let StringListUserId = dataReceived.ArrayUserId;
        StringListUserId = StringListUserId.replace("[","");
        StringListUserId = StringListUserId.replace("]","");
        let listUserIdString = StringListUserId.split(",");
        for(let i=0; i<listUserIdString.length; i++){
          if(Number(listUserIdString[i])){
            listUserId.push(Number(listUserIdString[i]))
          }
        }
      }
      else {
        if(dataReceived.ArrayUserId.length && dataReceived.ArrayUserId.length>0){
          for(let i=0; i<dataReceived.ArrayUserId.length; i++){
            // đảm bảo các phần tử trong mảng userId đều là số
            if(Number(dataReceived.ArrayUserId[i])){
              listUserId.push(Number(dataReceived.ArrayUserId[i]))
            }
          }
        }
        else{
          listUserId=[];
        }
      }
      
      let listConversationId= [];
      let listConversationIdFist =[];
     
      listConversationIdFist = await Promise.all(
          listUserId.map((userId)=>{
            return axios({
              method: "post",
              url: "http://43.239.223.142:3005/Conversation/CreateNewConversation",
              data: {
                userId:Number(req.body.SenderId),
                contactId:Number(userId)  
              },
              headers: { "Content-Type": "multipart/form-data" }
             }); 
          })
      )
      
      for(let i=0; i<listConversationIdFist.length; i++){
        if(!isNaN(listConversationIdFist[i].data.data.conversationId)){
          listConversationId.push(Number(listConversationIdFist[i].data.data.conversationId))
        }
      }
      const list = await Promise.all( // send liên tục => tối ưu performance 
        listConversationId .map((ConversationId) => { 
          return  axios({
            method: "post",
            url: "http://43.239.223.142:3005/Message/SendMessage",
            data: {
              MessageID: '',
              ConversationID: Number(ConversationId),
              SenderID: Number(dataReceived.SenderId),
              MessageType: "text",
              Message: `${dataReceived.content}`,
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
          })
        })
      );
      if(list){
        if(list.length && list.length>0){
          res.json({
            data:{
              result:true,
              message:"Gửi thành công",
              countMessage: list.length 
            },
            error:null
          })
        }
        else{
          res.status(200).json(createError(200,"Gửi tin nhắn không thành công"));
        }
      }
    }
    else{
      res.status(200).json(createError(200,"Thông tin truyền lên không đầy đủ"));
    }
  }
  catch(e){
    res.status(200).json(createError(200,"Đã có lỗi xảy ra"));
  }
}


export const  SendManyMesByClassId = async ( req,res,next ) =>{
  try{
    if(req.body && req.body.SenderId && (!isNaN(req.body.SenderId)) && req.body.content && req.body.IdClass){
      let listUserId =[] ;
      let dataReceived = req.body;
      
      let classUser = await UsersClassified.findOne({_id:String(req.body.IdClass)}); // findOne không tìm thấy thì không đi vào try catch 
      if(classUser){
        if(classUser.IdOwner){
          if(classUser.IdOwner == req.body.SenderId){
            listUserId = classUser.listUserId;
            let listConversationId= [];
            let listConversationIdFist =[];
            listConversationIdFist = await Promise.all(
              listUserId.map((userId)=>{
                return axios({
                  method: "post",
                  url: "http://43.239.223.142:3005/Conversation/CreateNewConversation",
                  data: {
                    userId:Number(req.body.SenderId),
                    contactId:Number(userId)  
                  },
                  headers: { "Content-Type": "multipart/form-data" }
                 }); 
              })
            )
            
            for(let i=0; i<listConversationIdFist.length; i++){
              if(!isNaN(listConversationIdFist[i].data.data.conversationId)){
                listConversationId.push(Number(listConversationIdFist[i].data.data.conversationId))
              }
            }
            const list = await Promise.all( // send liên tục => tối ưu performance 
              listConversationId .map((ConversationId) => { 
                return  axios({
                  method: "post",
                  url: "http://43.239.223.142:3005/Message/SendMessage",
                  data: {
                    MessageID: '',
                    ConversationID: Number(ConversationId),
                    SenderID: Number(dataReceived.SenderId),
                    MessageType: "text",
                    Message: `${dataReceived.content}`,
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
                })
              })
            );
            if(list){
              if(list.length && list.length>0){
                res.json({
                  data:{
                    result:true,
                    message:"Gửi thành công",
                    countMessage: list.length 
                  },
                  error:null
                })
              }
              else{
                res.status(200).json(createError(200,"Gửi tin nhắn không thành công"));
              }
            }
          }
          else{
            res.status(200).json(createError(200,"Bạn không thể gửi tin nhắn đồng thời với nhãn dán này"));
          }
        }
        else{
           res.status(200).json(createError(200,"Không tìm thấy nhãn dán phù hợp"));
        }
      }
      else{
        res.status(200).json(createError(200,"Không tìm thấy nhãn dán phù hợp"));
      }
    }
    else{
      res.status(200).json(createError(200,"Thông tin truyền lên không đầy đủ"));
    }
  }
  catch(e){
    res.status(200).json(createError(200,"Đã có lỗi xảy ra"));
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

// load message 
export const LoadMessage = async (req,res,next) =>{
  try{
    if(req.body && req.body.conversationId && Number(req.body.conversationId) &&  req.body.time && req.body.adminId){
       let time;
       if(req.body.time == "0"){
         time = new Date();
       }
       else if( new Date(req.body.time)){
        time = new Date(req.body.time);
       }
      //  Conversation.aggregate([
      //   { $match: 
      //     {
      //        _id:Number(req.body.conversationId)
      //     }
      //   },
      //   {
      //     $project: {
      //       messageList: {
      //         $slice: [  
      //           // {
      //           //   $filter: {
      //           //     input: "$messageList",
      //           //     as: "messagelist",
      //           //     cond: { 
      //           //         $lte: [ "$$messagelist.createAt", time ]  
      //           //     },
      //           //   }
      //           // },
      //           2,3
      //          ]
      //        },
      //        memberList:{
            
      //             $filter: {
      //               input: "$memberList",
      //               as: "memberList",
      //               cond: { 
      //                 $eq: [ "$$memberList.memberId", Number(req.body.adminId)]  
      //               },
      //             }
               
      //        }
      //     }
      //   }
      // ])
      Conversation.find({ _id:Number(req.body.conversationId)},{messageList:{$slice:[2,3]}})
      .then( async (conversation)=>{
         if(conversation){
            if(conversation.length>0){
              let ListMessFavour =[];
              if(conversation[0].memberList && conversation[0].memberList.length && (conversation[0].memberList.length>0) ){
                ListMessFavour = conversation[0].memberList[0].favoriteMessage;
              }
              let ListMessFinal = [];
              let ListMes = conversation[0].messageList;
              for(let i = 0; i< ListMes.length ; i++){
                let a ={};
                a._id= ListMes[i]._id;
                a.displayMessage= ListMes[i].displayMessage;
                a.senderId= ListMes[i].senderId;
                a.messageType= ListMes[i].messageType;
                a.message= ListMes[i].message;
                if(ListMes[i].quoteMessage && (ListMes[i].quoteMessage.trim() !="")){
                  let conversationTakeMessage = await  Conversation.aggregate([
                    { $match: 
                      {
                         _id:Number(req.body.conversationId)
                      }
                    },
                    {
                      $project: {
                        messageList: {
                          $slice: [  
                            {
                              $filter: {
                                input: "$messageList",
                                as: "messagelist",
                                cond: { 
                                    $eq: [ "$$messagelist._id", ListMes[i].quoteMessage ]  
                                },
                              }
                            },
                            -1
                           ]
                         }
                      }
                    }
                  ])
                  if(conversationTakeMessage && conversationTakeMessage.length > 0  && conversationTakeMessage[0].messageList && conversationTakeMessage[0].messageList.length && (conversationTakeMessage[0].messageList.length >0)){
                      let message = conversationTakeMessage[0].messageList[0];
                      let senderData = await  User.findOne({_id:message.senderId},{userName:1})
                      if(senderData && senderData.userName){
                          a.quoteMessage = fMessageQuote(message._id,senderData.userName,message.senderId,message.messageType,message.message,message.createAt)
                      }
                  }
                }
                else{
                  a.quoteMessage= ListMes[i].quoteMessage;
                }
                a.messageQuote= ListMes[i].messageQuote;
                a.createAt= ListMes[i].createAt;
                a.isEdited= ListMes[i].isEdited;
                if(ListMes[i].infoLink){
                  a.infoLink = fInfoLink(ListMes[i]._id,ListMes[i].infoLink.title,ListMes[i].infoLink.description,ListMes[i].infoLink.linkHome,ListMes[i].infoLink.image,ListMes[i].infoLink.isNotification);
                }
                else{
                  a.infoLink= ListMes[i].infoLink;
                }
                if(ListMes[i].listFile && ListMes[i].listFile.length && (ListMes[i].listFile.length>0)){
                  let listFileFirst = [];
                  for(let i = 0; i<ListMes[i].listFile.length; i++){
                    listFileFirst.push(
                        fInfoFile(
                          ListMes[i].listFile[i].messageType,
                          ListMes[i].listFile[i].nameFile,
                          ListMes[i].listFile[i].sizeFile,
                          ListMes[i].listFile[i].height,
                          ListMes[i].listFile[i].width
                    ));
                  }
                  ListMes[i].listFile = listFileFirst;
                }
                else{
                  a.listFile= ListMes[i].listFile;
                }
                if(ListMes[i].emotion){
                  a.EmotionMessage = [];
                  if(String(ListMes[i].emotion.Emotion1).trim() != ""){
                    a.EmotionMessage.push(fEmotion(1,ListMes[i].emotion.Emotion1.split(","),"https://mess.timviec365.vn/Emotion/Emotion1.png"))
                  }
                  if(String(ListMes[i].emotion.Emotion2).trim() != ""){
                    a.EmotionMessage.push(fEmotion(2,ListMes[i].emotion.Emotion2.split(","),"https://mess.timviec365.vn/Emotion/Emotion2.png"))
                  }
                  if(String(ListMes[i].emotion.Emotion3).trim() != ""){
                    a.EmotionMessage.push(fEmotion(3,ListMes[i].emotion.Emotion3.split(","),"https://mess.timviec365.vn/Emotion/Emotion3.png"))
                  }
                  if(String(ListMes[i].emotion.Emotion4).trim() != ""){
                    a.EmotionMessage.push(fEmotion(4,ListMes[i].emotion.Emotion4.split(","),"https://mess.timviec365.vn/Emotion/Emotion4.png"))
                  }
                  if(String(ListMes[i].emotion.Emotion5).trim() != ""){
                    a.EmotionMessage.push(fEmotion(5,ListMes[i].emotion.Emotion5.split(","),"https://mess.timviec365.vn/Emotion/Emotion5.png"))
                  }
                  if(String(ListMes[i].emotion.Emotion6).trim() != ""){
                    a.EmotionMessage.push(fEmotion(6,ListMes[i].emotion.Emotion6.split(","),"https://mess.timviec365.vn/Emotion/Emotion6.png"))
                  }
                  if(String(ListMes[i].emotion.Emotion7).trim() != ""){
                    a.EmotionMessage.push(fEmotion(7,ListMes[i].emotion.Emotion7.split(","),"https://mess.timviec365.vn/Emotion/Emotion7.png"))
                  }
                  if(String(ListMes[i].emotion.Emotion8).trim() != ""){
                    a.EmotionMessage.push(fEmotion(8,ListMes[i].emotion.Emotion8.split(","),"https://mess.timviec365.vn/Emotion/Emotion8.png"))
                  }
                }
                else{
                  a.emotion= ListMes[i].emotion;
                }
                if(ListMes[i].messageType == "sendProfile"){
                   let userData = await User.findOne({_id: ListMes[i].message });
                   if(userData && userData.userName){
                      let b = {};
                      b.iD365 = userData.id365;
                      b.idTimViec = userData.idTimViec;
                      b.type365 = userData.type365;
                      b.password="";
                      b.phone = userData.phone;
                      b.notificationPayoff= userData.notificationPayoff;
                      b.notificationCalendar = userData.notificationCalendar;
                      b.notificationReport = userData.notificationReport;
                      b.notificationOffer = userData.notificationOffer;
                      b.notificationPersonnelChange = userData.notificationPersonnelChange;
                      b.notificationRewardDiscipline = userData.notificationRewardDiscipline;
                      b.notificationNewPersonnel = userData.notificationNewPersonnel;
                      b.notificationChangeProfile = userData.notificationChangeProfile;
                      b.notificationTransferAsset = userData.notificationTransferAsset;
                      b.acceptMessStranger = userData.acceptMessStranger;
                      b.type_Pass = 0 ;
                      b.companyName = userData.companyName;
                      b.secretCode ="";
                      b.notificationMissMessage =0;
                      b.notificationCommentFromTimViec=0;
                      b.notificationCommentFromRaoNhanh=0;
                      b.notificationTag=0;
                      b.notificationSendCandidate=0;
                      b.notificationChangeSalary=0;
                      b.notificationAllocationRecall=0;
                      b.notificationAcceptOffer=0;
                      b.notificationDecilineOffer=0;
                      b.notificationNTDPoint=0;
                      b.notificationNTDExpiredPin=0;
                      b.notificationNTDExpiredRecruit=0;
                      b.fromWeb = userData.fromWeb;
                      b.notificationNTDApplying=0;
                      b.userQr = null;
                      b.id = userData._id;
                      b.email = userData.email;
                      b.userName = userData.userName;
                      b.avatarUser = userData.avatarUser;
                      b.status = userData.status;
                      b.active = userData.active;
                      b.isOnline = userData.isOnline;
                      b.looker = userData.looker;
                      b.statusEmotion = userData.statusEmotion;
                      b.lastActive = userData.lastActive;
                     
                      if(String(userData.avatarUser).trim !=""){
                        b.linkAvatar= `https://mess.timviec365.vn/avatarUser/${userData._id}/${userData.avatarUser}`;
                      }
                      else{
                        b.linkAvatar= `https://mess.timviec365.vn/avatar/${userData.userName[0]}_${getRandomInt(1,4)}.png`
                      }
                      b.companyId = userData.companyId;

                      let status = await RequestContact.findOne({
                        $or: [
                          { userId: Number(req.body.adminId), contactId: userData._id  },
                          { userId: userData._id, contactId: Number(req.body.adminId) }
                        ]
                      });
                      if(status){
                        if(status.status == "accept"){
                          b.friendStatus = "friend";
                        }
                        else{
                          b.friendStatus = status.status;
                        }
                      }
                      else{
                        b.friendStatus = "none";
                      }
                     a.userProfile= b;
                   }
                   else{
                    a.userProfile = null;
                   }
                }
                else{
                  a.userProfile = null;
                }
                a.deleteTime= ListMes[i].deleteTime;
                a.deleteType= ListMes[i].deleteType
                a.deleteDate= ListMes[i].deleteDate
                a.infoSupport= ListMes[i].infoSupport
                a.liveChat= ListMes[i].liveChat
                a.EmotionMessage= ListMes[i].EmotionMessage;
                if(ListMessFavour.includes(ListMes[i]._id)){
                  a.IsFavorite = 1;
                }
                else{
                  a.IsFavorite = 0;
                }
                ListMessFinal.push(a)
              }
              return res.json(ListMessFinal)
            }
            else{
              return res.status(200).json(createError(200,"Không tìm thấy cuộc trò chuyện thích hợp"));
            }
         }
        return res.json(conversation)
      });
    }
    else{
      res.status(200).json(createError(200,"Thông tin truyền lên không đầy đủ"));
    }
  }
  catch(e){
    console.log(e);
    res.status(200).json(createError(200,"Đã có lỗi xảy ra"));
  }
}


//xoa tin nha
export const DeleteMessage = async (req, res) => {
  try {
    const messId = req.body.MessageID;
    const existConversation = await Conversation.findOne({
      "messageList._id": messId,
    });
    if (!existConversation)
      return res.send(createError(200, "Tin nhắn không tồn tại"));
    const idxMess = existConversation.messageList.find((e) => e._id == messId);
    existConversation.messageList.splice(idxMess, 1);
    existConversation.save();
    const data = {
      result: true,
      message: "Xóa nhắn thành công",
      error: null,
    };
    return res.send(data);
  } catch (err) {
    if (err) return res.send(createError(200, err.message));
  }
};

export const sendNotificationToTimViec = async (message,conversationName,conversationId,listmember,isOnline,isGroup,flag) =>{
  try {
      let receiverid = "";
      let indexContact = -1;
      for(let i=0; i<listmember.length; i++){
           if(String(listmember[i]) != String(message.SenderID)){
             receiverid = `${receiverid}${listmember[i]},`
           }
           indexContact=i;
      }
      let user = await User.findOne({_id:Number(message.SenderID)});
      let mess = "";
      if(message.MessageType == "sendFile"){
         mess = "Tệp";
      }
      else if(message.MessageType == "sendProfile"){
         mess = "Thẻ Liên Hệ";
      }
      else if(message.MessageType == "sendPhoto"){
         mess ="Ảnh";
      }
      else{
         mess = message.Message;
      }

     let sender_avartar = "";
                 if(user){
                   if(user.avatarUser !=""){
                     sender_avartar= `https://mess.timviec365.vn/avatarUser/${user._id}/${user.avatarUser}`;
                   }
                   else{
                     sender_avartar= `https://mess.timviec365.vn/avatar/${user.userName[0]}_${getRandomInt(1,4)}.png`
                   }
                 }
     let content = {};
     if(String(receiverid).trim()!=""){
       receiverid = receiverid.slice(0,receiverid.slice(0,receiverid.length-1));
       content =  qs.stringify({
         'title':`${conversationName}`,
         'message': `${mess}`,
         'from':'chat365',
         'sender_id':`${String(message.SenderID)+""}`,
         'sender_email':`${(user && user.email) ? user.email : "" }`,   
         'sender_type':`${(user && user.type365) ? String(user.type365) : ""}`,
         'sender_avatar': `${sender_avartar}`,
         'sender_name':`${(user && user.userName) ? user.userName : "" }`,
         'converstation_id':`${String(message.ConversationID)}`,
         'receiver_id':`${receiverid}`,
         'not_type':'Chat',
         'payload_data':''
       });
     }
     if(user && user.userName){
       // gửi thông báo tin nhắn đến tìm việc 
       socket.emit("SendNotificationToHHP",message.Message,user.userName,conversationId,conversationName,message.SenderID,listmember.find(e=>Number(e)!= Number(message.SenderID)))
     }
     if((isGroup == 0) && (indexContact != -1) ){
         let DataContact = await User.findOne({_id:Number(listmember[indexContact])});
         if(flag){
           if(DataContact && DataContact._id){
             content =  qs.stringify({
               'title':`${conversationName}`,
               'message': `${mess}`,
               'from':'chat365',
               'sender_id':`${String(message.SenderID)+""}`,
               'sender_email':`${(user && user.email) ? user.email : "" }`,   
               'sender_type':`${(user && user.type365) ? String(user.type365) : ""}`,
               'sender_avatar': `${sender_avartar}`,
               'sender_name':`${(user && user.userName) ? user.userName : "" }`,
               'converstation_id':`${String(message.ConversationID)}`,
               'receiver_id':`${receiverid}`,
               'not_type':'Chat',
               'receiver_email':`${( DataContact &&  DataContact.email) ?  DataContact.email : ""}`,
               'type_user':`${( Number(DataContact.type365) == 0) ?  "2" : String(DataContact.type365)}`,
               'payload_data':''
             });
           }
         }
         if(DataContact && (DataContact.isOnline ==0)){
           let content2 = {};
           content2 = qs.stringify({
             'name':`${DataContact.userName}`,
             'email': `${DataContact.email}`,
             'type':`${String(DataContact.type365)}`,
             'mess':`${mess}`,   
             'senderId':`${String(message.SenderID)+""}`
           });
           let response2 = await axios.post('https://timviec365.vn/api_app/notification_chat365.php', content2);
         }
     }
     if( String(receiverid).trim() != ""){
       let response = await axios.post('https://timviec365.vn/notification/push_notification_from_chat365_v2.php', content);
     }
  }
  catch(e){
      console.log(e)
  }
}
const ConvertToObject = (string)=>{
     let stringObject = string.replace(/{|}|"/g,'');
     let obj ={};
     let stringKeyValueArr = stringObject.split(",")
     for(let i=0; i<stringKeyValueArr.length; i++){
         obj[`${stringKeyValueArr[i].split(":")[0]}`] = `${stringKeyValueArr[i].slice(stringKeyValueArr[i].split(":")[0].length+1,stringKeyValueArr[i].length)}`
     }
     return obj
}
const ConvertToArrayObject = (string)=>{
  let stringObject = string.replace("]",'').replace("[",'');
  let stringArrayObject = stringObject.split("},{")
  let arrayObject = [];
  for(let i=0; i<stringArrayObject.length; i++){
    arrayObject.push(ConvertToObject(stringArrayObject[i]));
  }
  return arrayObject
}
// gửi tin nhắn 
export const SendMessage = async (req, res) => {
  try{
    if(req.body && req.body.ConversationID && (!isNaN(req.body.ConversationID)) && req.body.SenderID && (!isNaN(req.body.SenderID)) ){
        let MessageID = req.body.MessageID ? String(req.body.MessageID) : "";
        let ConversationID = Number(req.body.ConversationID);
        let SenderID = Number(req.body.SenderID);
        let Message = req.body.Message ? String(req.body.Message) : "";
        let Quote = req.body.Quote ? String(req.body.Quote) : "";
        let Profile = req.body.Profile ? String(req.body.Profile) : "";
        let ListTag = req.body.ListTag ? String(req.body.ListTag) : "";
        let File = req.body.File ? String( req.body.File) : "";
        let ListMember = req.body.ListMember ? String(req.body.ListMember) : "";
        let IsOnline = req.body.IsOnline ? String(req.body.IsOnline) : "";
        let conversationName = req.body.conversationName ? String(req.body.conversationName) : "";
        let isGroup = (req.body.isGroup && (!isNaN(req.body.isGroup))) ? Number(req.body.isGroup) : 0;
        let deleteTime = (req.body.deleteTime && (!isNaN(req.body.deleteTime))) ? Number(req.body.deleteTime) : 0;
        let deleteType = (req.body.deleteType && (!isNaN(req.body.deleteType))) ? Number(req.body.deleteType) : 0;

        if(req.body.MessageType && (req.body.File || req.body.Message || req.body.Quote) ){
            let MessageType = String(req.body.MessageType);
            let mess = {};
            mess.MessageID= MessageID;
            mess.ConversationID=ConversationID;
            mess.SenderID= SenderID;
            mess.MessageType= MessageType;
            mess.Message= Message;
            mess.ListTag= ListTag;
            mess.DeleteTime= 0;
            mess.DeleteType= 0;
            mess.DeleteDate= new Date('0001-01-01T00:00:00Z');
            mess.IsFavorite= 0;
            if( !req.body.Quote || (String(req.body.Quote).trim() == "")){
                mess.QuoteMessage = MessageQuote("","",0,"","",new Date());
            }
            else{
                mess.QuoteMessage = ConvertToObject(req.body.Quote);
                mess.QuoteMessage.SenderID = Number(mess.QuoteMessage.SenderID);
                mess.QuoteMessage.CreateAt = new Date(mess.QuoteMessage.CreateAt);
            }
            if( req.body.File ){
                mess.ListFile = ConvertToArrayObject(req.body.File);
            }
            else{
                mess.ListFile = null;
            }
            if( req.body.Profile){
                console.log("Gán giá trị bằng object")
            }
            else{
                mess.UserProfile = {};
            }
            mess.Message = Message;
            mess.CreateAt = new Date();
            mess.DeleteDate = new Date('0001-01-01T00:00:00Z');

            if (mess.DeleteType == 0 && mess.DeleteTime > 0){
              console.log("add second")
            }
            if( String(MessageID).trim() == "" ){
              mess.MessageID = `${((new Date).getTime() * 10000) + 621355968000000000}_${SenderID}`;
            }
            let listMember = [];
            let isOnline = [];
            if(req.body.ListMember){
                 console.log("Xử lý dữ liệu object truyền lên ListMember")
            }
            else{
               // take data user 
               let conversation = await Conversation.findOne({_id:ConversationID},{"memberList.memberId":1});
               if(conversation && conversation.memberList && (conversation.memberList.length >0)){
                  for(let i=0; i<conversation.memberList.length; i++){
                      listMember.push(conversation.memberList[i].memberId)
                  }
               }
               let users = await User.find({_id:{$in:listMember}},{isOnline:1});
               for(let i=0; i<listMember.length; i++){
                  let ele = users.find(e => e._id == listMember[i]);
                  if(ele){
                     isOnline.push(ele.isOnline);
                  } 
                  else{
                     isOnline.push(0);
                  }
               }
            }

            // gửi thông báo tin nhắn cho tìm việc, app 
            sendNotificationToTimViec(mess, conversationName, mess.ConversationID, listMember, isOnline, isGroup, true)
            if(MessageType != "link"){
               socket.emit("SendMessage", mess, listMember);
               if(MessageType == "sendFile" || MessageType == "sendPhoto"){

               }
               else if(MessageType == "map"){
                   let z = mess.Message.split(",");
                   let string = `https://www.google.com/maps/search/${z[0].trim()},${z[1].trim()}/${z[0].trim()},${z[1].trim()},10z?hl=vi`; // check link googlre map 
               }
               else {
                   // insert dữ liệu vào base và cập nhất counter; displayMessage lấy từ bảng counter 
                   let messInsert = MessagesDB(mess.MessageID,0,mess.SenderID,MessageType,mess.Message,mess.QuoteMessage.MessageID,mess.QuoteMessage.Message,mess.CreateAt,0,null,mess.ListFile,EmotionMessageDBDefault(),mess.DeleteTime,mess.DeleteType,mess.DeleteDate);
                   let insertMes = await Conversation.updateOne({_id:ConversationID},{$push:{messageList:messInsert}})
               }
            }
            res.json({
              data:{
                result:true,
                message:"Gửi thành công"
              },
              error:null
            })
        }
        else{
          res.status(200).json(createError(200,"Thông tin truyền lên không đầy đủ"));
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

}

// export const notificationBirthday = () => setInterval(async () => {
  
//   let dateYear = new Date().getFullYear();
//   let dateMonth = new Date().getMonth() + 1;
//   let dateDay = new Date().getDate();
//   const birthdays = await Birthday.find({})

//   for (let i = 0; i < birthdays.length; i++) {
//     const arr = birthdays[i].Dob.split("-");
//     let listConversationId = await Conversation.find({
//       "memberList.memberId": birthdays[i].UserId,
//     });
//     if (dateDay === Number(arr[0]) && dateMonth === Number(arr[1])) {
//       for (let j = 0; j < listConversationId.length; j++) {
//         console.log("Gửi thông báo sinh nhật tới conversation");
//       }
//     }
//   }
//   //})
// }, 10000 * 1000);

cron.schedule('40 16 * * *', async (req,res,next) =>  {
  try{
  let dateYear = new Date().getFullYear();
  let dateMonth = new Date().getMonth() + 1;
  let dateDay = new Date().getDate();
  const birthdays = await Birthday.find({})
  for (let i = 0; i < birthdays.length; i++) {
    const arr = birthdays[i].Dob.split("-");
    let listConversationId = await Conversation.find({
      "memberList.memberId": birthdays[i].UserId,
      isGroup:0
    },{_id:1}
    );
    console.log(listConversationId)
    if (dateDay === Number(arr[0]) && dateMonth === Number(arr[1])) {
      for (let j = 0; j < listConversationId.length; j++) {
      
        let sendmes = await axios({
          method: "post",
          url: "http://43.239.223.142:3005/Message/SendMessage",
          data: {
             MessageID: '',
             ConversationID: Number(listConversationId[j]._id),
             SenderID: Number(birthdays[i].UserId),
             MessageType: "notification",
             Message: "Chúc mừng sinh nhật",
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
        if(sendmes){
          res.status(200).json({
            data:{
              result:true,
              message:"Lấy thông tin thành công",
              result
            },
            error:null
          });
        }
      }
    }
    else{
    }
  }
  }
  catch(e){
    {
      res.status(200).json(createError(200,"Đã có lỗi xảy ra"));
    }
  }
})

//xoa tin nha
export const DeleteMessage1 = async (req, res) => {
  try {
    const messId = req.body.MessageID;
    const filter = {
      "messageList._id": messId,
    };
    const update = { $pull: { messageList: { _id: messId } } };
    const existConversation = await Conversation.findOneAndUpdate(
      filter,
      update
    );
    if (!existConversation)
      return res.send(createError(200, "Tin nhắn không tồn tại"));
    const data = {
      result: true,
      message: "Xóa nhắn thành công",
    };
    return res.send({ data, error: null });
  } catch (err) {
    if (err) return res.send(createError(200, err.message));
  }
};

//Sua tin nhan
export const EditMessage = async (req, res) => {
  try {
    const conversationID = Number(req.body.ConversationID) || "";
    const senderID = Number(req.body.SenderID) || "";
    const messageType = req.body.MessageType || "";
    const message = req.body.Message || "";
    const messageId = req.body.MessageID || "";
    const listTag = req.body.ListTag || "";
    const quote = req.body.Quote || "";
    const profile = req.body.Profile || "";
    const file = req.body.File || "";
    const listMember = req.body.ListMember || "";
    const isOnline = req.body.IsOnline || "";
    const conversationName = req.body.ConversationName || "";
    const isGroup = req.body.IsGroup || "";
    const deleteTime = req.body.DeleteTime || "";
    const deleteType = req.body.DeleteType || "";
    const liveChat = req.body.LiveChat || "";
    const infoSupport = req.body.InfoSupport || "";

    if (!(message && messageId)) {
      return res.send(createError(200, "Thiếu thông tin truyền lên"));
    }
    const filter = { messageList: { $elemMatch: { _id: { $eq: messageId } } } };
    const update = {
      $set: {
        "messageList.$.message": message,
        "messageList.$.isEdited": 1,

      },
    };
    const exCons = await Conversation.findOneAndUpdate(filter, update);
    
    if (!exCons) return res.send(createError(200, "Tin nhắn không tồn tại"));
    const data = {
      result: true,
      message: "Sửa nhắn thành công",
    };
    return res.send({data, error: null});
  } catch (err) {
    console.log(err);
    if (err) return res.send(createError(200, err.message));
  }
};
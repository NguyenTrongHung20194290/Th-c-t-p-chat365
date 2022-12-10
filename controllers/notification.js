import { createError } from "../utils/error.js";
import User from "../models/User.js";
import {fUsers} from "../functions/fModels/fUsers.js";
import {InsertNotification,fParticipantNotification} from "../functions/fTools/fNotification.js";
import io from 'socket.io-client';
import axios from 'axios';
import qs from 'qs' 
import Notification from "../models/Notification.js";
const socket = io.connect('http://43.239.223.142:3000', {
  secure: true,
  enabledTransports: ["wss"],
  transports: ['websocket', 'polling'],
});

export const TransferPicture = async (req, res, next) => {
    try{
        if(req.body && req.body.id && req.body.picture && req.body.room && req.body.time && req.body.shift && req.body.name ){
            socket.emit("Send_cc",req.body,req.body.id,req.body.picture,req.body.room,req.body.time,req.body.shift,req.body.name);
            res.json({
                data:{
                  result:true,
                  message:"Gửi ảnh thành công",
                },
                error:null
            })
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

 export const ChangeSalary = async (req, res, next) => {
    try{
        if(req.body && req.body.CompanyId && req.body.EmployeeId && req.body.Salary && req.body.ListReceive && req.body.CreateAt && String(req.body.ListReceive).includes("[") ){
                let ListReceive =[];
                if(req.body.ListReceive.includes("[")){
                  let StringListReceive= req.body.ListReceive;
                  StringListReceive = StringListReceive.replace("[","");
                  StringListReceive = StringListReceive.replace("]","");
                  ListReceive = StringListReceive.split(",");
                }
                else if(req.body.ListReceive.length && req.body.ListReceive.length>0){
                  ListReceive= req.body.ListReceive;
                }
                else{
                  ListReceive=[];
                }
                
                let Salary = String(req.body.Salary)
                let dataUser = await User.find({id365:Number(req.body.EmployeeId),type365:2});
                let user;
                if(dataUser && dataUser.length>0){
                    console.log("Người dùng đã có tài khoản chat, gửi thông báo ChangeSalary");
                    user = dataUser[0];
                }
                else{
                    let response = await axios.post('https://chamcong.24hpay.vn/api_chat365/get_infor_user.php',  qs.stringify({
                        'id_user':`${String(req.body.EmployeeId)}`
                    }));
                    if(response.data){
                      user = fUsers(0, response.data.data.user_info.ep_id, 0, 2,response.data.data.user_info.ep_email,response.data.data.user_info.ep_pass,response.data.data.user_info.ep_phone,response.data.data.user_info.ep_name, response.data.data.user_info.ep_image, "", 1, new Date(), 1, 1, 1, response.data.data.user_info.com_id, response.data.data.user_info.com_name, 1, 1, 1, 1, 1, 1, 1, 1, 1,1,1,1,1,1,1,1,1,1,1,1,1)
                   }
                   else{
                      user = null;
                   }
                }
                if(user){
                  if( ( user.companyId && (String(user.companyId) === String(req.body.CompanyId)) ) || (user.CompanyId && (user.CompanyId == req.body.CompanyId)) ){
                      let companyId = 0;
                      if (user.companyId){
                        companyId = Number(user.companyId);
                      }
                      else if(user.CompanyId){
                        companyId = Number(user.CompanyId);
                      }
                      let DataCompany = await User.find({id365:Number(companyId),type365:1});
                      if(DataCompany){
                        if(DataCompany.length>0){
                          // (companyId,CompanyName,fromWeb,id,id365,idTimviec,lastActive,type365,userName)
                            let company =fParticipantNotification(DataCompany[0].companyId,DataCompany[0].companyName,DataCompany[0].fromWeb,DataCompany[0]._id,DataCompany[0].id365,DataCompany[0].idTimViec,DataCompany[0].lastActive,DataCompany[0].type365,DataCompany[0].userName);
                            for(let i=0; i < ListReceive.length; i++){
                               let receiver_infor = await User.find({id365:Number(ListReceive[i]),type365:2});
                               if( receiver_infor && receiver_infor.length >0){

                                    let newSalary = ""; 
                                    for (let j = 0; j < Salary.length; j++)
                                    {
                                        newSalary = `${newSalary}${Salary[j]}`
                                        if ((Salary.length - 1 - j) % 3 == 0 && (Salary.length - 1 - j) != 0)
                                        {
                                          newSalary = `${newSalary},`
                                        }
                                    }
                                    
                                    let NotiCreateAt = new Date();
                                    let notificationId = `${((new Date).getTime() * 10000) + 621355968000000000}_${receiver_infor[0]._id}`;
                                    let Status = "";
                                    if(ListReceive[i] == req.body.EmployeeId){
                                       Status="Mức lương của bạn đã có sự thay đổi"
                                    }
                                    else{
                                       Status = `Bạn đã thay đổi mức lương cho nhân viên ${receiver_infor[0].userName}`
                                    }
                                    let insert = await InsertNotification(notificationId,receiver_infor[0]._id,companyId,Status,"","ChangeSalary","",0,NotiCreateAt,"");
                                    console.log(insert)
                                    if(insert >0){
                                       console.log("emit dw liệu đến",receiver_infor[0]._id)
                                       socket.emit("SendNotification", receiver_infor[0]._id, {
                                             IDNotification:notificationId,
                                             UserID:dataUser[0]._id,
                                             Participant:company, 
                                             Title:Status, 
                                             Message:"",
                                             IsUnreader:1, 
                                             Type:"ChangeSalary", 
                                             ConversationId:0, 
                                             CreateAt:NotiCreateAt, 
                                             Link:""
                                        });
                                    }
                               }
                            }
                            res.json({
                              data:{
                                result:true,
                                message:"Thông báo đến tài khoản Chat365 thành công",
                              },
                              error:null
                            })
                        }
                        else{
                           res.status(200).json(createError(200,"Sai thông tin công ty"));
                        }
                      }
                  }
                  else{
                     res.status(200).json(createError(200,"Sai thông tin công ty"));
                  }
                }
                else{
                  res.status(200).json(createError(200,"Không tìm thấy thông tin nhân viên"));
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

//hiển thị tất cả thông báo
export const AllNotifications = async (req, res, next) => {
  try{
      if( req && req.params && req.params.userId ){
          
          const userId = req.params.userId
          let AllNotifications = await Notification.find({userId: userId}).sort({ createAt: 'desc' })
          if(AllNotifications){
            res.json({
                data:{
                  result:AllNotifications,
                  message:"Thành công",
                },
                error:null
            })
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

//thông báo lương
export const Salary = async (req, res, next) => {
  try{
      if( req && req.params && req.params.userId ){
          
          const userId = req.params.userId
          let AllNotifications = await Notification.find({userId: userId}).sort({ createAt: 'desc' })
          if(AllNotifications){
            res.json({
                data:{
                  result:AllNotifications,
                  message:"Thành công",
                },
                error:null
            })
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
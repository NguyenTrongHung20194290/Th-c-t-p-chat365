import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Contact from "../models/Contact.js";
import Counter from "../models/Counter.js";
import {fUsers} from "../functions/fModels/fUsers.js";
import {UsersModelExtra} from "../functions/fModels/fUsers.js";
import {InsertNewUser} from "../functions/handleModels/InsertNewUser.js";
import {InsertNewUserExtra} from "../functions/fTools/fUsers.js";
import {UpdateInfoUser} from "../functions/fTools/fUsers.js";
import {GetUserByID365} from "../functions/fTools/fUsers.js";
import {downloadImage} from "../functions/fTools/Download.js";
import { createError } from "../utils/error.js";
import { HandleNoSqlInjection } from "../functions/fTools/HandleQueryInjection.js";
import axios from 'axios'
import md5 from 'md5';
import qs from 'qs' // dùng axios call api php cần config thêm qs 
import io from 'socket.io-client';
import  geoip from 'geoip-lite';

let urlImg="https://mess.timviec365.vn/avatarUser";

const socket2 = io.connect('wss://socket.timviec365.vn', {
  secure: true,
  enabledTransports: ["wss"],
  transports: ['websocket', 'polling'],
});
// let socket2 = io('https://chat.timviec365.vn',{token:"v3"});

function isNullOrWhitespace( input ) {
  return !input || !input.trim(); // loại bỏ khoản trắng
}

// các phần ngoại vi của controller luôn chạy 
export const login = async (req,res,next)=>{
  console.log(req.body);
   try {
     let ipAddress = req.socket.remoteAddress;
     let geo = geoip.lookup(ipAddress); // take location 
     let IdDevice = req.body.IdDevice;
     let NameDevice = req.body.NameDevice;
     let latitude =0;
     let longtitude =0;
     if(geo && geo.ll &&(geo.ll.length > 0)){
      latitude = geo.ll[0] ;
      longtitude = geo.ll[1]; 
     }

     // số 0 cũng bị coi là rỗng 
     if(req && req.body && req.body.Email && req.body.Password){
       let type_pass; // loại mật khẩu truyền lên
       let user =req.body;
       // nosql injection
       user.Password= HandleNoSqlInjection(user.Password)
       user.Email= HandleNoSqlInjection(user.Email)
       if( (user.Password == "" ) || (user.Email=="") ){
          res.status(200).json(createError(200,"Thông tin truyền lên không hợp lệ"));
       }
       else{
        if((!user.Type_Pass)&&(!Number(user.Type_Pass))){  // nếu truyền type pass không có hoặc không hợp lệ thì đưa về 0
          type_pass=0;
        }
        else{
          type_pass=Number(user.Type_Pass);
        }
        // dùng axios call api php cần config thêm qs 
        let response = await axios.post('https://chamcong.24hpay.vn/api_chat365/login_chat_h.php',  qs.stringify({
          'email':`${String(user.Email)}`,
          'pass': `${type_pass == 0 ? String(md5(user.Password)) : user.Password}`,// luôn đẩy về md5 
          'os':'os',
          'from':'chat365',
          'type':`${String(user.Type365)}`  // truyền sai type đúng  quản lý chung vẫn nhận 
        }));
        if(response.data.data){  // nếu đã có thông tin từ quản lý chung 
           console.log("Dữ liệu lấy từ quản lý chung",response.data.data);
           let flag=false;
           let account = await User.find({email: user.Email,type365:Number(user.Type365),password:type_pass == 0 ? String(md5(user.Password)) : user.Password}).limit(1);
 
           if((account.length == 0) && (user.Type365==0)){ // vẫn lấy account bằng email và loại tài khoản; không cần mật khẩu 
              account= await User.find({email:user.email,type365:Number(user.Type365)});
              flag=true;
           }
          
           if(account && (account.length > 0)){
            // cập nhật  địa chỉ ip trc khi trả về 
           
              // đếm conv 
             let count_conv=  await Conversation.countDocuments({ "memberList.memberId": Number(account[0]._id) , 'messageList.0':{$exists:true} });
             console.log("Đăng nhập thành công")
             if(flag){ // nếu mật khẩu không đúng mà lại có loại tài khoản là 0 
              account[0].id365=0;
              account[0].companyId=0;
              account[0].type365=0;
              account[0].companyName=""
             }
             // nếu id tìm việc thì bắn dữ liệu online cho bên tìm viêc 
             if(Number(account[0].idTimViec)!=0){
              socket2.emit("checkonlineUser",{uid: String(account[0].idTimViec), uid_type: account[0].type365 == 1 ? "1" : "0"})
             }
             
             let resfinal = {};
             if(true){
              resfinal._id=account[0]._id
              resfinal.id365=account[0].id365;
              resfinal.type365=account[0].type365;
              resfinal.email=account[0].email;
              resfinal.password=account[0].password;
              resfinal.phone=account[0].phone;
              resfinal.userName=account[0].userName;
              resfinal.avatarUser= `${urlImg}/${account[0]._id}/${account[0].avatarUser}`;
              resfinal.status=account[0].status;
              resfinal.statusEmotion=account[0].statusEmotion;
              resfinal.lastActive=account[0].lastActive;
              resfinal.active=account[0].active;
              resfinal.isOnline=account[0].isOnline;
              resfinal.looker=account[0].looker;
              resfinal.companyId=account[0].companyId;
              resfinal.companyName=account[0].companyName;
              resfinal.notificationPayoff=account[0].notificationPayoff;
              resfinal.notificationCalendar=account[0].notificationCalendar;
              resfinal.notificationReport=account[0].notificationReport;
              resfinal.notificationOffer=account[0].notificationOffer;
              resfinal.notificationPersonnelChange=account[0].notificationPersonnelChange;
              resfinal.notificationRewardDiscipline=account[0].notificationRewardDiscipline;
              resfinal.notificationNewPersonnel=account[0].notificationNewPersonnel;
              resfinal.notificationChangeProfile=account[0].notificationChangeProfile;
              resfinal.notificationTransferAsset=account[0].notificationTransferAsset;
              resfinal.acceptMessStranger=account[0].acceptMessStranger;
              resfinal.idTimViec=account[0].idTimViec;
              resfinal.fromWeb=account[0].fromWeb;
              resfinal.secretCode=account[0].secretCode;
              resfinal.HistoryAccess=account[0].HistoryAccess;
              resfinal.linkAvatar= `${urlImg}/${account[0]._id}/${account[0].avatarUser}`;
             }

             // nếu truyền thêm hai trường này thì trả thêm cảnh báo 
             if(IdDevice && NameDevice){
                let warning = 0;
                if((resfinal.HistoryAccess.length == 0)){
                  console.log("Thiết bị đăng nhập lần đầu, chưa có thiết bị đăng nhập trước đó, hợp lệ")
                  let update1 = await User.updateOne(
                    { _id: resfinal._id },
                    { $push: 
                      { 
                        HistoryAccess:
                       {
                          IdDevice: String(IdDevice),
                          IpAddress: String(ipAddress),
                          NameDevice: String(NameDevice),
                          Time: new Date(),
                          AccessPermision: true
                        } 
                      } ,
                      $set: {
                       latitude:Number(latitude),
                       longtitude:Number(longtitude),
                       isOnline:1,
                      }
                    }
                  )
                }
                else{
                  console.log("Có thiết bị đã đăng nhập");
                  let find1 = resfinal.HistoryAccess.find(e => e.IdDevice == IdDevice);
                  if (find1){
                    console.log("Thiết bị này đã đăng nhập");
                    if(find1.AccessPermision){
                      console.log("Thiết bị này hợp lệ");
                      let update2 = await User.updateOne(
                        { _id: resfinal._id ,"HistoryAccess.IdDevice": String(IdDevice)},
                        {
                          $set :{
                            "HistoryAccess.$.Time": new Date(),
                            "HistoryAccess.$.IpAddress": String(ipAddress),
                            "HistoryAccess.$.NameDevice": String(NameDevice),
                            latitude:Number(latitude),
                            longtitude:Number(longtitude),
                            isOnline:1,
                          }
                        }
                      )
                    }
                    else{
                      console.log("Thiết bị này k hợp lệ");
                      warning = 1;
                      let update3 = await User.updateOne(
                        { _id: resfinal._id ,"HistoryAccess.IdDevice": String(IdDevice)},
                        {
                          $set :{
                            "HistoryAccess.$.Time": new Date(),
                            "HistoryAccess.$.IpAddress": String(ipAddress),
                            "HistoryAccess.$.NameDevice": String(NameDevice)
                          }
                        }
                      )
                    }
                     
                  }
                  else{
                    console.log("Thiết bị đăng nhâp lần đầu, trước đó đã có thiết bị đăng nhập, không hợp lệ")
                    warning=1;
                    let update4 = await User.updateOne(
                      { _id: resfinal._id },
                      { $push: 
                        { 
                          HistoryAccess:
                         {
                            IdDevice: String(IdDevice),
                            IpAddress: String(ipAddress),
                            NameDevice: String(NameDevice),
                            Time: new Date(),
                            AccessPermision: false
                          } 
                        } 
                      }
                    )
                  }
                }
                let checkFrienList = await Contact.find( {$or: [
                  { userFist:resfinal._id },
                  { userSecond:resfinal._id }
                ]}).limit(1);
                if(checkFrienList.length==0){
                  warning=0;
                }
                // xóa field 
                delete resfinal.HistoryAccess;
                res.json({
                  data:{
                    result:true,
                    message:"Đăng nhập thành công",
                    userName:flag ? null : account[0].userName,
                    countConversation:count_conv,
                    conversationId:0,
                    total:0,
                    listUserOnline:null,
                    currentTime: ((new Date).getTime() * 10000) + 621355968000000000,
                    user_info:resfinal,
                    user_list:null,
                    warning
                  },
                  error:null 
                 });
             }
             else{
              delete resfinal.HistoryAccess;
              let update1 = await User.updateOne(
               { _id: resfinal._id },
               { 
                 $set: {
                  latitude:Number(latitude),
                  longtitude:Number(longtitude),
                  isOnline:1,
                 }
               }
              )
              res.json({
                data:{
                  result:true,
                  message:"Đăng nhập thành công",
                  userName:flag ? null : account[0].userName,
                  countConversation:count_conv,
                  conversationId:0,
                  total:0,
                  listUserOnline:null,
                  currentTime: ((new Date).getTime() * 10000) + 621355968000000000,
                  user_info:resfinal,
                  user_list:null,
 
                },
                error:null 
               });
             }
           }
 
           // nếu có tài khoản quản lý chung mà không tìm thấy tài khoản chat phù hợp
           else{
              if(user.Type365==1){  // nếu là tài khoản công ty 
                user = await InsertNewUser(
                          fUsers(
                            -1, response.data.data.user_info.com_id, 0, user.Type365, 
                            response.data.data.user_info.com_email, 
                            type_pass == 0 ? String(md5(user.Password)) : user.Password, 
                            response.data.data.user_info.com_phone, 
                            response.data.data.user_info.com_name, 
                            response.data.data.user_info.com_logo ? response.data.data.user_info.com_logo :"", // logo công ty, có thể null 
                            "", 0, new Date(), 
                            1,0, 0, 
                            response.data.data.user_info.com_id, 
                            response.data.data.user_info.com_name,
                            1, 1, 1, 1, 1, 1, 1, 1, 1,1,1,1,1,1,1,1,1,1,1,1,1
                          ),
                          false,
                          "quanlychung365"
                       )
              }
              else if( user.Type365==2){  // tài khoản nhân viên 
                user = await InsertNewUser(
                          fUsers(
                            -1, response.data.data.user_info.ep_id, 0, 
                            user.Type365, response.data.data.user_info.ep_email, 
                            type_pass == 0 ? String(md5(user.Password)) : user.Password,
                            response.data.data.user_info.ep_phone, 
                            response.data.data.user_info.ep_name, 
                            response.data.data.user_info.ep_image ? response.data.data.user_info.ep_image: "",
                            "", 0, new Date(), 1, 0, 0, 
                            response.data.data.user_info.com_id, response.data.data.user_info.com_name,
                            1, 1, 1, 1, 1, 1, 1, 1, 1,1,1,1,1,1,1,1,1,1,1,1,1
                          ),
                          false,
                          "quanlychung365"
                )
              }
              else{  // tài khoản cá nhân 
                user = await InsertNewUser(
                          fUsers(
                            -1, 0, 0, user.Type365, response.data.data.user_info.ep_email,
                            type_pass == 0 ? String(md5(user.Password)) : user.Password,
                            response.data.data.user_info.ep_phone, response.data.data.user_info.ep_name, 
                            response.data.data.user_info.ep_image ? response.data.data.user_info.ep_image: ""
                            , "", 0, new Date(), 1, 0, 0, 0, "", 
                            1, 1, 1, 1, 1, 1, 1, 1, 1,1,1,1,1,1,1,1,1,1,1,1,1
                          ),
                          false,
                          "quanlychung365"
               ) 
              }
              // user là dữ liệu trả về từ các lệnh insert trên kia 
              if(user){
                  try{
                    let check_com = await GetUserByID365(Number(response.data.data.user_info.com_id),1);
                    // nếu chưa có công ty của user muốn đăng nhập thì lên quản lý chung lấy dữ liệu xuống và tạo tài khaonr cho công ty đó
                    if(user.companyId && (Number(user.companyId)) && (Number(user.companyId) !=0) && (check_com.length == 0)){  
                         let response2 = await axios.get(`https://chamcong.24hpay.vn/api_tinhluong/list_com.php?id_com=${response.data.data.user_info.com_id}`);
                         if(response2.data){
                              try{  
                                    let user2 = UsersModelExtra(-1, response.data.data.user_info.com_id, 0, 1, response2.data.data.items[0].com_email,
                                    response2.data.data.items[0].com_pass, response2.data.data.items[0].com_phone, response2.data.data.items[0].com_name, 
                                    response2.data.data.items[0].com_logo ?   response2.data.data.items[0].com_logo : ""  // có thể null 
                                    , "", 0, new Date(), 1, 0, 0, 
                                    response.data.data.user_info.com_id, response2.data.data.items[0].com_name);
                                    let  dataArr;
                                    let  bytesize;
                                    let  imgUrl;
                                    // nếu có link ảnh thì tiến hành tải ảnh 
                                    if((user2.AvatarUser)&&(user2.AvatarUser!="")&& (!(isNullOrWhitespace(String(user2.AvatarUser)))) && (!(user2.AvatarUser.trim() == 0))){2
                                      dataArr = await axios.get(`https://chamcong.24hpay.vn/upload/company/logo/${user.AvatarUser}`);
                                      bytesize = String(dataArr).length;
                                      imgUrl= `https://chamcong.24hpay.vn/upload/company/logo/${user.AvatarUser}`;
                                    }
                                    let userId = InsertNewUserExtra(user2.UserName, user2.ID365, user2.IDTimViec, user2.Type365, user2.Email, user2.Password, user2.CompanyId, user2.CompanyName, "quanlychung365");
                                    if(userId>0){
                                        if(String(dataArr).length>0){
                                          let filePath= `./public/avatarUser/${userId}`;
                                          let time_start_file= ((new Date).getTime() * 10000) + 621355968000000000;
                                          let fileName = `${time_start_file}_${userId}origin.jpg`;
                                          await downloadImage(userId,imgUrl,filePath,fileName);
                                          // chỉnh kích thước
                                          await sharp(`${filePath}/${fileName}`).resize({fit: sharp.fit.contain, width:120,height:120})
                                          .toFile(`${filePath}/${time_start_file}_${userId}.jpg`)
                                          .then(()=> console.log("done"));
                                          if(fs.existsSync(`${filePath}/${fileName}`)){
                                              fs.unlinkSync(`${filePath}/${fileName}`);
                                          }
                                          // update thông tin về avatarUser 
                                          await UpdateInfoUser(userId, user2.ID365, user2.Type365, user2.UserName, `${time_start_file}_${userId}.jpg`, user2.Password, user2.CompanyId, user2.CompanyName, 0)
                                        }
                                    }
                              }
                              catch(e){
                                //res.status(200).json(createError(200,e));
                                console.log(e);
                              }
                         }
                    }
                    
                    let count_conv=  await Conversation.countDocuments({ "memberList.memberId": user._id, 'messageList.0':{$exists:true} });
                    if(Number(user.idTimViec) != 0){
                      socket2.emit("checkonlineUser",{uid: String(user.idTimViec), uid_type: user.type365 == 1 ? "1" : "0"})
                    }
                    
                    if(IdDevice && NameDevice){
                      let warning = 0;
                      if((user.HistoryAccess.length == 0)){
                        console.log("Thiết bị đăng nhập lần đầu, chưa có thiết bị đăng nhập trước đó, hợp lệ")
                        let update1 = await User.updateOne(
                          { _id: user._id },
                          { $push: 
                            { 
                              HistoryAccess:
                             {
                                IdDevice: String(IdDevice),
                                IpAddress: String(ipAddress),
                                NameDevice: String(NameDevice),
                                Time: new Date(),
                                AccessPermision: true
                              } 
                            },
                            $set: {
                             latitude:Number(latitude),
                             longtitude:Number(longtitude),
                             isOnline:1
                            } 
                          },
                          
                        )
                      }
                      else{
                        console.log("Có thiết bị đã đăng nhập");
                        let find1 = user.HistoryAccess.find(e => e.IdDevice == IdDevice);
                        if (find1){
                          console.log("Thiết bị này đã đăng nhập");
                          if(find1.AccessPermision){
                            console.log("Thiết bị này hợp lệ");
                            let update2 = await User.updateOne(
                              { _id: user._id ,"HistoryAccess.IdDevice": String(IdDevice)},
                              {
                                $set :{
                                  "HistoryAccess.$.Time": new Date(),
                                  "HistoryAccess.$.IpAddress": String(ipAddress),
                                  "HistoryAccess.$.NameDevice": String(NameDevice),
                                  latitude:Number(latitude),
                                  longtitude:Number(longtitude),
                                  isOnline:1,
                                }
                              }
                            )
                          }
                          else{
                            console.log("Thiết bị này k hợp lệ");
                            warning = 1;
                            let update3 = await User.updateOne(
                              { _id: user._id ,"HistoryAccess.IdDevice": String(IdDevice)},
                              {
                                $set :{
                                  "HistoryAccess.$.Time": new Date(),
                                  "HistoryAccess.$.IpAddress": String(ipAddress),
                                  "HistoryAccess.$.NameDevice": String(NameDevice)
                                }
                              }
                            )
                          }
                           
                        }
                        else{
                          console.log("Thiết bị đăng nhâp lần đầu, trước đó đã có thiết bị đăng nhập, không hợp lệ")
                          warning=1;
                          let update4 = await User.updateOne(
                            { _id: user._id },
                            { $push: 
                              { 
                                HistoryAccess:
                               {
                                  IdDevice: String(IdDevice),
                                  IpAddress: String(ipAddress),
                                  NameDevice: String(NameDevice),
                                  Time: new Date(),
                                  AccessPermision: false
                                } 
                              } 
                            }
                          )
                        }
                      }
                      // Không trẩ về mảng lịch sử truye cập 

                      let checkFrienList = await Contact.find( {$or: [
                        { userFist:user._id },
                        { userSecond:user._id }
                      ]}).limit(1);
                      if(checkFrienList.length==0){
                        warning=0;
                      }
                      delete user.HistoryAccess;
                      res.json({
                        data:{
                          result:true,
                          message:"Đăng nhập thành công",
                          userName:user.userName ? user.userName :"",
                          countConversation:count_conv,
                          conversationId:0,
                          total:0,
                          listUserOnline:null,
                          currentTime: ((new Date).getTime() * 10000) + 621355968000000000,
                          user_info:user,
                          user_list:null,
                          warning
                        },
                        error:null 
                       });
                    }
                    else{
                      delete user.HistoryAccess;
                      let update1 = await User.updateOne(
                       { _id: resfinal._id },
                       { 
                         $set: {
                          latitude:Number(latitude),
                          longtitude:Number(longtitude),
                          isOnline:1,
                         }
                       }
                      )
                      res.json({
                        data:{
                          result:true,
                          message:"Đăng nhập thành công",
                          userName:user.userName ? user.userName :"",
                          countConversation:count_conv,
                          conversationId:0,
                          total:0,
                          listUserOnline:null,
                          currentTime: ((new Date).getTime() * 10000) + 621355968000000000,
                          user_info:user,
                          user_list:null,
                        },
                        error:null 
                      });
                    }
                    console.log("Dữ liệu sau khi insert khi có tài khoản quản lý chung nhưng không có tk chat, Đăng nhập thành công ", user)
                  }
                  catch(e){
                    console.log(e);
                    res.status(200).json(createError(200,e.message));
                  } 
              }
              else{
                res.status(200).json(createError(200,"Đã có lỗi xảy ra"));
              }
           }
        }
        // nếu thông tin trả về từ quản lý chung bị lỗi 
        else{ 
           
           // lỗi không sở hữu quyền truy cập  từ quản lý chung
           if(response.data.error && Number(response.data.error.code) == 401){
              res.status(301).json(createError(301,response.error.message));
           }
           // nếu không phải tài khoản cá nhân và không có tài khoản từ quản lý chung 
           else if(user.Type365 !=0)
           { 
            // lấy ra tài khoản chat từ mail, pass và type 
            let account = await User.find({email: user.Email,type365:Number(user.Type365),password:String(type_pass == 0 ? String(md5(user.Password)) : user.Password)}).limit(1);
            if(account &&(account.length > 0)){  // nếu có dư liệu thì trả về bình thường 
              const updatedIp = await User.findByIdAndUpdate(  // cập nhật ip 
                account[0]._id,
                { $set: {IpAddress:ipAddress} },
                { new: true }
              );
              const count_conv=  await Conversation.countDocuments({ "memberList.memberId": Number(account[0]._id), 'messageList.0':{$exists:true} });
              let resfinal = {};
              if(true){
               resfinal._id=account[0]._id
               resfinal.id365=account[0].id365;
               resfinal.type365=account[0].type365;
               resfinal.email=account[0].email;
               resfinal.password=account[0].password;
               resfinal.phone=account[0].phone;
               resfinal.userName=account[0].userName;
               resfinal.avatarUser= account[0].avatarUser ?  `${urlImg}/${account[0]._id}/${account[0].avatarUser}` : "";
               resfinal.status=account[0].status;
               resfinal.statusEmotion=account[0].statusEmotion;
               resfinal.lastActive=account[0].lastActive;
               resfinal.active=account[0].active;
               resfinal.isOnline=account[0].isOnline;
               resfinal.looker=account[0].looker;
               resfinal.companyId=account[0].companyId;
               resfinal.companyName=account[0].companyName;
               resfinal.notificationPayoff=account[0].notificationPayoff;
               resfinal.notificationCalendar=account[0].notificationCalendar;
               resfinal.notificationReport=account[0].notificationReport;
               resfinal.notificationOffer=account[0].notificationOffer;
               resfinal.notificationPersonnelChange=account[0].notificationPersonnelChange;
               resfinal.notificationRewardDiscipline=account[0].notificationRewardDiscipline;
               resfinal.notificationNewPersonnel=account[0].notificationNewPersonnel;
               resfinal.notificationChangeProfile=account[0].notificationChangeProfile;
               resfinal.notificationTransferAsset=account[0].notificationTransferAsset;
               resfinal.acceptMessStranger=account[0].acceptMessStranger;
               resfinal.idTimViec=account[0].idTimViec;
               resfinal.fromWeb=account[0].fromWeb;
               resfinal.secretCode=account[0].secretCode;
               resfinal.HistoryAccess=account[0].HistoryAccess;
               resfinal.linkAvatar= account[0].avatarUser ? `${urlImg}/${account[0]._id}/${account[0].avatarUser}` : "";
              }
              // bắn lên tìm việc 
              if(Number(account[0].idTimViec)!=0){
                socket2.emit("checkonlineUser",{uid: String(account[0].idTimViec), uid_type: account[0].type365 == 1 ? "1" : "0"})
              }
              if(IdDevice && NameDevice){
                let warning = 0;
                if((resfinal.HistoryAccess.length == 0)){
                  console.log("Thiết bị đăng nhập lần đầu, chưa có thiết bị đăng nhập trước đó, hợp lệ")
                  let update1 = await User.updateOne(
                    { _id: resfinal._id },
                    { $push: 
                      { 
                        HistoryAccess:
                       {
                          IdDevice: String(IdDevice),
                          IpAddress: String(ipAddress),
                          NameDevice: String(NameDevice),
                          Time: new Date(),
                          AccessPermision: true
                        } 
                      },
                      $set: {
                       latitude:Number(latitude),
                       longtitude:Number(longtitude),
                       isOnline:1
                      } 
                    }
                  )
                }
                else{
                  console.log("Có thiết bị đã đăng nhập");
                  let find1 = resfinal.HistoryAccess.find(e => e.IdDevice == IdDevice);
                  if (find1){
                    console.log("Thiết bị này đã đăng nhập");
                    if(find1.AccessPermision){
                      console.log("Thiết bị này hợp lệ");
                      let update2 = await User.updateOne(
                        { _id: resfinal._id ,"HistoryAccess.IdDevice": String(IdDevice)},
                        {
                          $set :{
                            "HistoryAccess.$.Time": new Date(),
                            "HistoryAccess.$.IpAddress": String(ipAddress),
                            "HistoryAccess.$.NameDevice": String(NameDevice),
                            latitude:Number(latitude),
                            longtitude:Number(longtitude),
                            isOnline:1
                          }
                        }
                      )
                    }
                    else{
                      console.log("Thiết bị này k hợp lệ");
                      warning = 1;
                      let update3 = await User.updateOne(
                        { _id: resfinal._id ,"HistoryAccess.IdDevice": String(IdDevice)},
                        {
                          $set :{
                            "HistoryAccess.$.Time": new Date(),
                            "HistoryAccess.$.IpAddress": String(ipAddress),
                            "HistoryAccess.$.NameDevice": String(NameDevice),
 
                          }
                        }
                      )
                    }
                     
                  }
                  else{
                    console.log("Thiết bị đăng nhâp lần đầu, trước đó đã có thiết bị đăng nhập, không hợp lệ")
                    warning=1;
                    let update4 = await User.updateOne(
                      { _id: resfinal._id },
                      { $push: 
                        { 
                          HistoryAccess:
                         {
                            IdDevice: String(IdDevice),
                            IpAddress: String(ipAddress),
                            NameDevice: String(NameDevice),
                            Time: new Date(),
                            AccessPermision: false
                          } 
                        } 
                      }
                    )
                  }
                }
                delete resfinal.HistoryAccess;
                let checkFrienList = await Contact.find( {$or: [
                  { userFist:resfinal._id },
                  { userSecond:resfinal._id }
                ]}).limit(1);
                if(checkFrienList.length==0){
                  warning=0;
                }
                res.json({
                  data:{
                    result:true,
                    message:"Đăng nhập thành công",
                    userName:resfinal.userName ? resfinal.userName : "",
                    countConversation:count_conv,
                    conversationId:0,
                    total:0,
                    listUserOnline:null,
                    currentTime: ((new Date).getTime() * 10000) + 621355968000000000,
                    user_info:resfinal,
                    user_list:null,
                    warning
                  },
                  error:null 
                 });
              }
              else{
                delete resfinal.HistoryAccess;
                let update1 = await User.updateOne(
                 { _id: resfinal._id },
                 { 
                   $set: {
                    latitude:Number(latitude),
                    longtitude:Number(longtitude),
                    isOnline:1                  }
                 }
                )
                res.json({
                  data:{
                    result:true,
                    message:"Đăng nhập thành công",
                    userName:resfinal.userName ? resfinal.userName : "",
                    countConversation:count_conv,
                    conversationId:0,
                    total:0,
                    listUserOnline:null,
                    currentTime: ((new Date).getTime() * 10000) + 621355968000000000,
                    user_info:resfinal,
                    user_list:null,
                  },
                  error:null 
                 });
              }
            }
            // check xem có phải sai do type hay không 
            else{
              account= await User.find({email:user.Email,password:type_pass == 0 ? md5(user.Password) : user.Password});
              if(account&&(account.length>0)){
                 let array =[];
                 for(let i=0; i<account.length; i++){
                  if(account[i].type365){
                    array.push(Number(account[i].type365));
                  }
                 }
                 if((array.includes(1)) &&(array.includes(0))){
                    res.status(300).json(createError(300,"Tài khoản đang thuộc diện khách hàng cá nhân, vui lòng chọn đúng loại tài khoản"));
                 }
                 else if( Number(account[0].type365) == 0){
                    res.status(300).json(createError(300,"Tài khoản đang thuộc diện khách hàng cá nhân, vui lòng chọn đúng loại tài khoản"));
                 }
                 else if( Number(account[0].type365) == 1 ){
                    res.status(303).json(createError(303,"Tài khoản đang thuộc diện khách hàng công ty, vui lòng chọn đúng loại tài khoản"));
                 }
                 else if( Number(account[0].type365) == 2 ){
                    res.status(302).json(createError(302,"Tài khoản đang thuộc diện khách hàng nhân viên, vui lòng chọn đúng loại tài khoản"));
                 }
              }
              else{
                // trả về mã lỗi của response nếu không có tài khoản chính xác 
                let code = Number(response.data.error.code)
                res.status(code).json(createError(code,response.data.error.message));
              }
            }
           }
           // nếu không có tài khoản quản lý chung và là tài khoản cá nhân 
           else{
            let account = await User.find({type365:0,email: user.Email,password:String(type_pass == 0 ? String(md5(user.Password)) : user.Password)}).limit(1);
            if(account && (account.length > 0)){
              const updatedIp = await User.findByIdAndUpdate(  // cập nhật ip 
                account[0]._id,
                { $set: {IpAddress:ipAddress} },
                { new: true }
              );
              const count_conv=  await Conversation.countDocuments({ "memberList.memberId": Number(account[0]._id), 'messageList.0':{$exists:true} });
              // nếu id tìm việc thì bắn dữ liệu online cho bên tìm viêc 
              let resfinal = {};
              if(true){
               resfinal._id=account[0]._id
               resfinal.id365=account[0].id365;
               resfinal.type365=account[0].type365;
               resfinal.email=account[0].email;
               resfinal.password=account[0].password;
               resfinal.phone=account[0].phone;
               resfinal.userName=account[0].userName;
               resfinal.avatarUser= account[0].avatarUser ?  `${urlImg}/${account[0]._id}/${account[0].avatarUser}` : "";
               resfinal.status=account[0].status;
               resfinal.statusEmotion=account[0].statusEmotion;
               resfinal.lastActive=account[0].lastActive;
               resfinal.active=account[0].active;
               resfinal.isOnline=account[0].isOnline;
               resfinal.looker=account[0].looker;
               resfinal.companyId=account[0].companyId;
               resfinal.companyName=account[0].companyName;
               resfinal.notificationPayoff=account[0].notificationPayoff;
               resfinal.notificationCalendar=account[0].notificationCalendar;
               resfinal.notificationReport=account[0].notificationReport;
               resfinal.notificationOffer=account[0].notificationOffer;
               resfinal.notificationPersonnelChange=account[0].notificationPersonnelChange;
               resfinal.notificationRewardDiscipline=account[0].notificationRewardDiscipline;
               resfinal.notificationNewPersonnel=account[0].notificationNewPersonnel;
               resfinal.notificationChangeProfile=account[0].notificationChangeProfile;
               resfinal.notificationTransferAsset=account[0].notificationTransferAsset;
               resfinal.acceptMessStranger=account[0].acceptMessStranger;
               resfinal.idTimViec=account[0].idTimViec;
               resfinal.fromWeb=account[0].fromWeb;
               resfinal.secretCode=account[0].secretCode;
               resfinal.HistoryAccess=account[0].HistoryAccess;
               resfinal.linkAvatar= account[0].avatarUser ? `${urlImg}/${account[0]._id}/${account[0].avatarUser}` : "";
              }
              // bắn lên tìm việc 
              if(Number(account[0].idTimViec)!=0){
                socket2.emit("checkonlineUser",{uid: String(account[0].idTimViec), uid_type: account[0].type365 == 1 ? "1" : "0"})
              }
              if(IdDevice && NameDevice){
                let warning = 0;
                if((resfinal.HistoryAccess.length == 0)){
                  console.log("Thiết bị đăng nhập lần đầu, chưa có thiết bị đăng nhập trước đó, hợp lệ")
                  let update1 = await User.updateOne(
                    { _id: resfinal._id },
                    { $push: 
                      { 
                        HistoryAccess:
                       {
                          IdDevice: String(IdDevice),
                          IpAddress: String(ipAddress),
                          NameDevice: String(NameDevice),
                          Time: new Date(),
                          AccessPermision: true
                        } 
                      },
                      $set: {
                       latitude:Number(latitude),
                       longtitude:Number(longtitude),
                       isOnline:1
                      }  
                    }
                  )
                }
                else{
                  console.log("Có thiết bị đã đăng nhập");
                  let find1 = resfinal.HistoryAccess.find(e => e.IdDevice == IdDevice);
                  if (find1){
                    console.log("Thiết bị này đã đăng nhập");
                    if(find1.AccessPermision){
                      console.log("Thiết bị này hợp lệ");
                      let update2 = await User.updateOne(
                        { _id: resfinal._id ,"HistoryAccess.IdDevice": String(IdDevice)},
                        {
                          $set :{
                            "HistoryAccess.$.Time": new Date(),
                            "HistoryAccess.$.IpAddress": String(ipAddress),
                            "HistoryAccess.$.NameDevice": String(NameDevice),
                            latitude:Number(latitude),
                            longtitude:Number(longtitude),
                            isOnline:1
                          }
                        }
                      )
                    }
                    else{
                      console.log("Thiết bị này k hợp lệ");
                      warning = 1;
                      let update3 = await User.updateOne(
                        { _id: resfinal._id ,"HistoryAccess.IdDevice": String(IdDevice)},
                        {
                          $set :{
                            "HistoryAccess.$.Time": new Date(),
                            "HistoryAccess.$.IpAddress": String(ipAddress),
                            "HistoryAccess.$.NameDevice": String(NameDevice)
                          }
                        }
                      )
                    }
                     
                  }
                  else{
                    console.log("Thiết bị đăng nhâp lần đầu, trước đó đã có thiết bị đăng nhập, không hợp lệ")
                    warning=1;
                    let update4 = await User.updateOne(
                      { _id: resfinal._id },
                      { $push: 
                        { 
                          HistoryAccess:
                         {
                            IdDevice: String(IdDevice),
                            IpAddress: String(ipAddress),
                            NameDevice: String(NameDevice),
                            Time: new Date(),
                            AccessPermision: false
                          } 
                        } 
                      }
                    )
                  }
                }
                // xóa field trả về 
                delete resfinal.HistoryAccess;
                res.json({
                  data:{
                    result:true,
                    message:"Đăng nhập thành công",
                    userName:resfinal.userName ? resfinal.userName : "",
                    countConversation:count_conv,
                    conversationId:0,
                    total:0,
                    listUserOnline:null,
                    currentTime: ((new Date).getTime() * 10000) + 621355968000000000,
                    user_info:resfinal,
                    user_list:null,
                    warning
                  },
                  error:null 
                 });
              }
              else{
                delete resfinal.HistoryAccess;
                let update1 = await User.updateOne(
                 { _id: resfinal._id },
                 { 
                   $set: {
                    latitude:Number(latitude),
                    longtitude:Number(longtitude),
                    isOnline:1
                   }
                 }
                )
                res.json({
                  data:{
                    result:true,
                    message:"Đăng nhập thành công",
                    userName:account[0].userName ? account[0].userName :"",
                    countConversation:count_conv,
                    conversationId:0,
                    total:0,
                    listUserOnline:null,
                    currentTime: ((new Date).getTime() * 10000) + 621355968000000000,
                    user_info:resfinal,
                    user_list:null,
                  },
                  error:null 
                 });
              }
            }
            // nếu không có tài khoản quản lý chung và cũng không có tài khoản chat check xem có sai type không  
            else{
              account= await User.find({email:user.Email,password:String(type_pass == 0 ? String(md5(user.Password)) : user.Password)});
              if(account&&(account.length>0)){
                 let array =[];
                 for(let i=0; i<account.length; i++){
                  if(account[i].type365){
                    array.push(Number(account[i].type365));
                  }
                 }
                 if((array.includes(1)) &&(array.includes(0))){
                    res.status(300).json(createError(300,"Tài khoản đang thuộc diện khách hàng cá nhân, vui lòng chọn đúng loại tài khoản"));
                 }
                 else if( Number(account[0].type365) == 0){
                    res.status(300).json(createError(300,"Tài khoản đang thuộc diện khách hàng cá nhân, vui lòng chọn đúng loại tài khoản"));
                 }
                 else if( Number(account[0].type365) == 1 ){
                    res.status(303).json(createError(303,"Tài khoản đang thuộc diện khách hàng công ty, vui lòng chọn đúng loại tài khoản"));
                 }
                 else if( Number(account[0].type365) == 2 ){
                    res.status(302).json(createError(302,"Tài khoản đang thuộc diện khách hàng nhân viên, vui lòng chọn đúng loại tài khoản"));
                 }
              }
              else{
                // trả về mã lỗi của response nếu không có tài khoản chính xác 
                let code = Number(response.data.error.code)
                res.status(code).json(createError(code,response.data.error.message));
              }
            }
           }
        }
       }
     }
     else{
       res.status(200).json(createError(200,"Thiếu thông tin tài khoản"));
     }
   } catch (err) {
     console.log(err);
     res.status(200).json(createError(200,err.message));
   }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

export const takedatatoverifylogin = async ( req,res,next )=>{
  // truyền lên id của 3 ngươid bạn, userId của mình, IdDevice, NameDevice 
  try{
    console.log(req.params);
    let userId = Number(req.params.userId);
    
    // random số thứ tự của kết quả và sắp xêos chúng 
    let temp2=0
    let randomArray=[];
    while(temp2 <3){
      let t = getRandomInt(1,7);
      if(!randomArray.includes(t)){
        randomArray.push(t);
        temp2++;
      }
    }
    randomArray.sort((a, b)=> {
      if (a < b) {
          return -1;// giữ nguyên 
      }
      else if  (a > b) {
          return 1;// đổi
      }
      return 0;
    })
    console.log(randomArray);
    
    // lấy ra userId của 3 người bạn 
    let result1 = await Contact.find( {$or: [
      { userFist: userId },
      { userSecond: userId }
    ]}).limit(3);
    let arrayUserId = [];
    if(result1){
      for (let i = 0; i < result1.length; i++){
        arrayUserId.push(result1[i].userFist);
        arrayUserId.push(result1[i].userSecond)
      }
    }
    arrayUserId = arrayUserId.filter(e=>e != userId);
    
    let listAccountFinal = [];
    let listAccount = await User.find({ _id: {$in:arrayUserId }},{userName:1 ,avatarUser:1, lastActive: 1, isOnline:1}).sort({isOnline:1,lastActive:-1});
    
    // xác định khoảng lấy dữ liệu random 
    let count = await User.find({_id:{$ne:0}},{_id:1}).sort({_id:-1}).limit(1);
    let UserIdmax = 40000;
    if(count){
      if(count.length ==1){
        UserIdmax= count[0]._id;
      }
    }
    
    // lấy 6 tài khoản bất kỳ 
    let temp =0;
    let tempArray =[];
    while(temp<6){
      let userId = getRandomInt(1,UserIdmax);
      let user = await User.find({ _id: userId},{userName:1 ,avatarUser:1, lastActive: 1, isOnline:1}).limit(1);
      if(user){
        if(user.length>0){
          tempArray.push(user[0]);
          temp++;
        }
      }
    }
    
    // trộn danh sách người bạn với danh sách người bất kỳ 
    let a=0; // thứ tự mảng trung gian 
    let b=0; // thứ tự đếm của mảng thứ tự kết quả 
    let c=randomArray[b];
    while(b<3){
      while(a<c){
        listAccountFinal.push(tempArray[a]);
        a++;
      }
      listAccountFinal.push(listAccount[b]);
      b++;
      c=randomArray[b]
    }
    if(listAccountFinal.length<9){
       for(let i=a; i<tempArray.length; i++){
        listAccountFinal.push(tempArray[i]);
       }
    }
    listAccountFinal= listAccountFinal.filter(e=> e != undefined)
    if(result1){
      if(listAccount){
        let result =[];
        for(let i= 0; i<listAccountFinal.length;i++){
          let a = {};
          a._id= listAccountFinal[i]._id;
          a.userName= listAccountFinal[i].userName;
          a.avatarUser= `https://mess.timviec365.vn/avatarUser/${listAccountFinal[i]._id}/${listAccountFinal[i].avatarUser}`;
          a.listAccountFinal= listAccountFinal[i].lastActive;
          a.isOnline= listAccountFinal[i].isOnline;
          result.push(a);
        }
        res.status(200).json({
          data:{
            result:true,
            message:"Lấy thông tin thành công",
            listAccount:result,
            friendlist:listAccount
          },
          error:null
        });
      }
    }
  }
  catch(err){
    console.log(err);
    res.status(200).json(createError(200,"Đã có lỗi xảy ra"));
  }
}


// 100ms 
export const confirmlogin = async ( req,res,next )=>{
  // truyền lên id của 3 ngươid bạn, userId của mình, IdDevice, NameDevice 
  try{
     console.log(req.body);
     let ipAddress = req.socket.remoteAddress;
     let geo = geoip.lookup(ipAddress); // take location 
     let latitude = 0 ;
     let longtitude = 0; 
     if(geo && geo.ll){
        latitude= geo.ll[0] ;
        longtitude= geo.ll[1];
     }
     let info = req.body;
     if(info.listUserId.includes("[")){
      info.listUserId = info.listUserId.replace("[","");
      info.listUserId = info.listUserId.replace("]","");
      info.listUserId = info.listUserId.replace(`"`,"");
      info.listUserId = info.listUserId.replace(`"`,"");
      info.listUserId = info.listUserId.replace(`"`,"");
      info.listUserId = info.listUserId.replace(`"`,"");
      info.listUserId = info.listUserId.replace(`"`,"");
      info.listUserId = info.listUserId.replace(`"`,"");
      info.listUserId = info.listUserId.replace(`"`,"");

      info.listUserId = info.listUserId.split(",");
      console.log(info.listUserId)
     }
     if(req.body.myId && req.body.IdDevice  && req.body.NameDevice && req.body.listUserId){
          let check = true;
          if(req.body.listUserId.length == 3){
            let result1 = await Contact.find( {$or: [
              { userFist: Number(info.myId), userSecond:Number(info.listUserId[0]) },
              { userSecond: Number(info.myId), userFist:Number(info.listUserId[0]) },
              { userFist: Number(info.myId), userSecond:Number(info.listUserId[1]) },
              { userSecond: Number(info.myId), userFist:Number(info.listUserId[1]) },
              { userFist: Number(info.myId), userSecond:Number(info.listUserId[2]) },
              { userSecond: Number(info.myId), userFist:Number(info.listUserId[2]) },
            ]});
            if(result1.length <3){
              check= false;
            }
          }
          else if( req.body.listUserId.length==2 ){
            let result1 = await Contact.find( {$or: [
              { userFist: Number(info.myId), userSecond:Number(info.listUserId[0]) },
              { userSecond: Number(info.myId), userFist:Number(info.listUserId[0]) },
              { userFist: Number(info.myId), userSecond:Number(info.listUserId[1]) },
              { userSecond: Number(info.myId), userFist:Number(info.listUserId[1]) },
            ]});
            if(result1.length <2){
              check= false;
            }
          }
          else if( req.body.listUserId.length==1 ){
            let result1 = await Contact.find( {$or: [
              { userFist: Number(info.myId), userSecond:Number(info.listUserId[0]) },
              { userSecond: Number(info.myId), userFist:Number(info.listUserId[0]) },
            ]});
            if(result1.length <1){
              check= false;
            }
          }
          if(check){
            let update = await User.updateOne(
              {
                _id: Number(info.myId),
                HistoryAccess: { $elemMatch: { IdDevice: { $eq: String(info.IdDevice) }} }
              },
              { $set: {
                 "HistoryAccess.$.AccessPermision" : true,
                 "HistoryAccess.$.IpAddress" : String(ipAddress),
                 latitude:Number(latitude),
                 longtitude:Number(longtitude),
              } }
            )
          
            let createConv = await axios({
                method: "post",
                url: "http://43.239.223.142:3005/Conversation/CreateNewConversation",
                data: {
                  userId:114803,
                  contactId:Number(info.myId)
                },
               headers: { "Content-Type": "multipart/form-data" }
            });
            if(createConv && createConv.data && createConv.data.data && createConv.data.data.conversationId){
                let sendmes = await axios({
                  method: "post",
                  url: "http://43.239.223.142:3005/Message/SendMessage",
                  data: {
                    MessageID: '',
                    ConversationID: createConv.data.data.conversationId,
                    SenderID: 114803,
                    MessageType: "text",
                    Message: `Thiết bị ${String(req.body.NameDevice).split("-")[0]} đã đăng nhập tài khoản của bạn vào lúc ${new Date().getHours()}:${new Date().getMinutes()} ${new Date().getFullYear()}/${new Date().getMonth()+1}/${new Date().getDate()}`,
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
            res.json({
              data:{
                result:true,
                status:true,
              },
              error:null 
             });
          }
          else{
            res.status(200).json(createError(200,"Danh sách bạn bè không chính xác"));
          }
     }
     else{
       res.status(200).json(createError(200,"Thiếu thông tin truyền lên"));
     }
  }
  catch(e){
    console.log(e);
    res.status(200).json(createError(200,"Đã có lỗi xảy ra"));
  }
}
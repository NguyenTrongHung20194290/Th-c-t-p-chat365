import axios from 'axios'
import User from "../../models/User.js";
import {getIdTimViec} from "../fTools/TimViec.js";
import {checkMailEmpty365} from "../fTools/fUsers.js";
import {downloadImage} from "../fTools/Download.js";
import {UpdateInfoUser} from "../fTools/fUsers.js";
import {InsertNewUserExtra} from "../fTools/fUsers.js";
import sharp from 'sharp';
import fs from 'fs';

function isNullOrWhitespace( input ) {
   return !input || !input.trim(); // loại bỏ khoản trắng
}

export const InsertNewUser = async (user, isFullLink, fromWeb) => {
   try{
      let urlImg="https://mess.timviec365.vn/avatarUser";
      let  dataArr;
      let  bytesize;
      let  imgUrl;
      console.log("Dữ liệu ảnh truyền từ quản lý chung",user.AvatarUser,user)
      // lấy ảnh và kích thước từ quản lý chung về  
      if (!(isNullOrWhitespace(String(user.AvatarUser))) && !(user.AvatarUser.trim() == 0))
      {  
         // nếu khôn truyền vào fullLink
         if(!isFullLink){
              if(user.Type365 == 1){  
                  dataArr = await axios.get(`https://chamcong.24hpay.vn/upload/company/logo/${user.AvatarUser}`);
                  bytesize = String(dataArr).length;
                  imgUrl= `https://chamcong.24hpay.vn/upload/company/logo/${user.AvatarUser}`;
              }
              else{
                  dataArr = await axios.get(`https://chamcong.24hpay.vn/upload/employee/${user.AvatarUser}`);
                  bytesize =  String(dataArr).length;
                  imgUrl= `https://chamcong.24hpay.vn/upload/employee/${user.AvatarUser}`;
              }
         }
         // nếu truyền vào fullLink 
         else{
            dataArr = await axios.get(user.AvatarUser);
            bytesize =  String(dataArr).length;
            imgUrl = user.AvatarUser;
         }
      }
      else{ // xử lý trường hợp không có ảnh từ quản lý chung
         imgUrl="";
         dataArr="";
      }
       
      // Không dùng vì không quan trọng lắm 
      // if(user.IDTimViec == 0){
      //    user.IDTimViec = await getIdTimViec(String(user.Email), String(user.Type365)); /// lấ bên tìm việc 
      // }
      // kiểm tra xem đã có tài khoản chưa 
      let result = await checkMailEmpty365(String(user.Email));
     
      if(result.length > 0) {  
          user.ID = Number(result[0]._id); 
          let filePath= `../public/${user.ID}`;
          let time_start_file= ((new Date).getTime() * 10000) + 621355968000000000;
          let fileName = `${time_start_file}_${user.ID}origin.jpg`;
          // nếu tải được ảnh thì tiến hành lưu ảnh vào thiết bị rồi cắt ảnh 
          if (String(dataArr).length > 1) 
          {
            await downloadImage(user.ID,imgUrl,filePath,fileName);
            // chỉnh kích thước
            await sharp(`${filePath}/${fileName}`).resize({fit: sharp.fit.contain, width:120,height:120})
            .toFile(`${filePath}/${time_start_file}_${user.ID}.jpg`)
            .then(()=> console.log("done"));
            if(fs.existsSync(`${filePath}/${fileName}`)){
               fs.unlinkSync(`${filePath}/${fileName}`);
            }
          }
          // tiến hành update thông tin cho tài khoản cá nhân có tài khoản quản lý chung nhưng tài khoản chat không hợp lệ
          await UpdateInfoUser(user.ID, user.ID365, user.Type365, user.UserName, `${time_start_file}_${user.ID}.jpg`, user.Password, user.CompanyId, user.CompanyName, user.IDTimViec)
      }
      // trường hợp có tài khoản quản lý chung nhưng không có tài khoản cá nhân chat 
      else{
         // tiến hành thêm tài khoản chat và trả ra Id 
         user.ID = await InsertNewUserExtra(user.UserName, user.ID365, user.IDTimViec, user.Type365, user.Email, user.Password, user.CompanyId, user.CompanyName, fromWeb);
         console.log("insert dữ liệu thành công",user.ID);
         
         // nếu có ảnh từ quản lý chung mới xử lý 
         if(user.ID > 0 &&  String(dataArr).length>1){  // nếu insert user thành công và ảnh tải thành công
            try{
               console.log("Bắt đầu tải ảnh ")
               let filePath= `../public/${user.ID}`;
               let time_start_file= ((new Date).getTime() * 10000) + 621355968000000000;
               let fileName = `${time_start_file}_${user.ID}origin.jpg`;
               await downloadImage(user.ID,imgUrl,filePath,fileName);
               
               // chỉnh kích thước
               await sharp(`${filePath}/${fileName}`).resize({fit: sharp.fit.contain, width:120,height:120})
               .toFile(`${filePath}/${time_start_file}_${user.ID}.jpg`)
               .then(()=> console.log("done"));
               if(fs.existsSync(`${filePath}/${fileName}`)){
                  fs.unlinkSync(`${filePath}/${fileName}`);
               }
               // update avatarUser
               let updateAvatarUser = await User.findOneAndUpdate({_id: Number(user.ID)}, {avatarUser:`${time_start_file}_${user.ID}.jpg`}, {new: true});
            }
            catch(e){
               console.log(e)
            }
         }
      }
      // lấy lại dữ liệu đã thêm 
      let userInfor = await User.find({_id:user.ID});
      let finaluserInfor={};
      if(userInfor &&(userInfor.length > 0)){
          finaluserInfor._id=userInfor[0]._id
          finaluserInfor.id365=userInfor[0].id365;
          finaluserInfor.type365=userInfor[0].type365;
          finaluserInfor.email=userInfor[0].email;
          finaluserInfor.password=userInfor[0].password;
          finaluserInfor.phone=userInfor[0].phone;
          finaluserInfor.userName=userInfor[0].userName;
          if(dataArr!=""){
            finaluserInfor.avatarUser= `${urlImg}/${userInfor[0]._id}/${userInfor[0].avatarUser}`;
          }
          else{
            finaluserInfor.avatarUser="";
          }
          finaluserInfor.status=userInfor[0].status;
          finaluserInfor.statusEmotion=userInfor[0].statusEmotion;
          finaluserInfor.lastActive=userInfor[0].lastActive;
          finaluserInfor.active=userInfor[0].active;
          finaluserInfor.isOnline=userInfor[0].isOnline;
          finaluserInfor.looker=userInfor[0].looker;
          finaluserInfor.companyId=userInfor[0].companyId;
          finaluserInfor.companyName=userInfor[0].companyName;
          finaluserInfor.notificationPayoff=userInfor[0].notificationPayoff;
          finaluserInfor.notificationCalendar=userInfor[0].notificationCalendar;
          finaluserInfor.notificationReport=userInfor[0].notificationReport;
          finaluserInfor.notificationOffer=userInfor[0].notificationOffer;
          finaluserInfor.notificationPersonnelChange=userInfor[0].notificationPersonnelChange;
          finaluserInfor.notificationRewardDiscipline=userInfor[0].notificationRewardDiscipline;
          finaluserInfor.notificationNewPersonnel=userInfor[0].notificationNewPersonnel;
          finaluserInfor.notificationChangeProfile=userInfor[0].notificationChangeProfile;
          finaluserInfor.notificationTransferAsset=userInfor[0].notificationTransferAsset;
          finaluserInfor.acceptMessStranger=userInfor[0].acceptMessStranger;
          finaluserInfor.idTimViec=userInfor[0].idTimViec;
          finaluserInfor.fromWeb=userInfor[0].fromWeb;
          finaluserInfor.secretCode=userInfor[0].secretCode;
          finaluserInfor.HistoryAccess=userInfor[0].HistoryAccess;
          if(dataArr!=""){
            finaluserInfor.linkAvatar= `${urlImg}/${userInfor[0]._id}/${userInfor[0].avatarUser}`;
          }
          else{
            finaluserInfor.linkAvatar="";
          }
          
      }
      return finaluserInfor;
   }
   catch(e){
      console.log(e);
      return null;
   }
   
};


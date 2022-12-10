import Personal from "../models/Personal.js";
import Privacy from "../models/Privacy.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import { createError } from "../utils/error.js";
import io from "socket.io-client";
let socket = io("http://localhost:3030");
import multer from "multer";
import path from "path";
import fs from "fs";
import { RandomString } from "../functions/fTools/fUsers.js";
import Contact from "../models/Contact.js";
import { Duplex } from "stream";
import { Console, info } from "console";
import { ifError } from "assert";
import Diary from "../models/Diary.js";
import axios from 'axios'
import {
  Comment,
  EmotionCommentDBDefault,
  fEmotion,
} from "../functions/fModels/fpersonal.js";
import mongoose from "mongoose";
import { Server } from "http";
import { application } from "express";
const ObjectId = mongoose.Types.ObjectId;

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         if (!fs.existsSync(`public/personalUpload`)) {
//             fs.mkdirSync(`public/personalUpload`);
//         }
//         if (!fs.existsSync(`public/personalBackgroundImg`)) {
//             fs.mkdirSync(`public/personalBackgroundImg`);
//         }
//         if (!fs.existsSync(`public/personalUpload/personalImage`)) {
//             fs.mkdirSync(`public/personalUpload/personalImage`);
//         }
//         if (!fs.existsSync(`public/personalUpload/personalVideo`)) {
//             fs.mkdirSync(`public/personalUpload/personalVideo`);
//         }

//         if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png' || file.mimetype === 'video/mp4') {
//             if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png'){
//                 if (req.originalUrl === `/api/personal/backgroundImg`){
//                     cb(null, `public/personalBackgroundImg`)
//                 }
//                 else cb(null,`public/personalUpload/personalImage`)
//             }
//             if (file.mimetype === 'video/mp4'){
//                 cb(null,`public/personalUpload/personalVideo`)
//             }
//         }
//         else {
//             cb(new Error('not file'), false)
//         }
//     },
//     filename: function (req, file, cb) {
//         cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
//     }
// });

// export const upload = multer({
//     storage: storage,
// })

const ShowPersonal = async (userId) => {
  const show = await Privacy.findOne({ userId: userId }, { post: 1 });
  if (show) {
    if (show.post === "0") {
        const date = new Date(0);
        return date;
      } else if (show.post === "1") {
        const date = new Date();
        date.setMonth(date.getMonth() - 6);
        return date;
      } else if (show.post === "2") {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date;
      } else if (show.post === "3") {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date;
      } else {
        const date = new Date(show.post);
        return date;
      }
  }
  else {
    return false
  }
};

const IsFriend = async (userId1, userId2) => {
  let result1 = await Contact.find({
    $or: [{ userFist: userId1 }, { userSecond: userId1 }],
  }).limit(3);
  let arrayUserId = [];
  if (result1) {
    for (let i = 0; i < result1.length; i++) {
      arrayUserId.push(result1[i].userFist);
      arrayUserId.push(result1[i].userSecond);
    }
  }
  arrayUserId = arrayUserId.filter((e) => e != userId1);
  return arrayUserId.includes(userId2);
};

//thêm bài viết
export const createPost = async (req, res, next) => {
  try {
   
      const formData = { ...req.body };
      formData.contentPost = req.body.contentPost;
      formData.userId = req.body.userId;
      formData.raw = req.body.raw;
      formData.link = req.body.link;
      formData.createAt = Date.now();
      formData.imageList = [];
      formData.videoList = [];
      formData.imageListId = []
      formData.videoListId = []
      let err = false;
      // Thêm ảnh và video vào dữ liệu ( phân biệt ảnh và video riêng)

      if (!fs.existsSync(`public/personalUpload`)) {
        fs.mkdirSync(`public/personalUpload`);
      }
      if (!fs.existsSync(`public/personalUpload/personalImage`)) {
        fs.mkdirSync(`public/personalUpload/personalImage`);
      }
      if (!fs.existsSync(`public/personalUpload/personalVideo`)) {
        fs.mkdirSync(`public/personalUpload/personalVideo`);
      }
      // if (req.files) {
      //     for (let i = 0; i < req.files.length; i++) {
      //         if (req.files[i].mimetype === 'image/jpeg' || req.files[i].mimetype === 'image/jpg' || req.files[i].mimetype === 'image/png') {
      //             formData.imageList.push({
      //                 pathFile: req.files[i].filename,
      //                 sizeFile: req.files[i].size,
      //             })
      //         }
      //         if (req.files[i].mimetype === 'video/mp4') {
      //             formData.videoList.push({
      //                 pathFile: req.files[i].filename,
      //                 sizeFile: req.files[i].size,
      //             })
      //         }
      //     }
      // }
      for (let i = 0; i < req.files.length; i++) {
        
        if (
          req.files[i].mimetype === "image/jpeg" ||
          req.files[i].mimetype === "application/octet-stream" ||
          req.files[i].mimetype === "image/jpg" ||
          req.files[i].mimetype === "image/png"
        ) {
          const pathFile = `${Date.now()}_${req.body.userId}${path.extname(
            req.files[i].originalname
          )}`;
          fs.writeFileSync(
            `public/personalUpload/personalImage/${pathFile}`,
            req.files[i].buffer
          );
          formData.imageList.push({
            pathFile: pathFile,
            sizeFile: req.files[i].size,
          });
          
        } else if (
          req.files[i].mimetype === "video/mp4" ||
          req.files[i].mimetype === "video/avi" ||
          req.files[i].mimetype === "video/mpeg"
        ) {
          const pathFile = `${Date.now()}_${req.body.userId}${path.extname(
            req.files[i].originalname
          )}`;
          fs.writeFileSync(
            `public/personalUpload/personalVideo/${pathFile}`,
            req.files[i].buffer
          );
          formData.videoList.push({
            pathFile: pathFile,
            sizeFile: req.files[i].size,
          });
          
        } else {
          err = true;
          break;
        }
      }
        
      if (!err || err === true) {
        


        // const user = await User.findOne({ _id: Number(formData.userId) }, { userName: 1, avatarUser: 1 });
        // formData.avatarUserSender = user.avatarUser
        // formData.userNameSender = user.userName
        const personal = new Personal(formData);
        
        const savedpersonal = await personal.save();
        if (savedpersonal) {
          formData.createAt = Date.now();
        for(let i = 0; i < formData.imageList.length; i++) {
          formData.imageListId.push(String(savedpersonal.imageList[savedpersonal.imageList.length-i-1]._id)) 
        }
        for(let i = 0; i < formData.videoList.length; i++) {
          formData.videoListId.push(String(savedpersonal.videoList[savedpersonal.videoList.length-i-1]._id)) 
        }
          // let conv = await Conversation.findOne({ _id: Number(req.body.conversationId) }, { memberList: 1 });
          // console.log('conv', conv)
          // let listUserId = [];
          // if (conv) {
          //     for (let i = 0; i < conv.memberList.length; i++) {
          //         listUserId.push(conv.memberList[i].memberId);
          //         console.log(conv.memberList[i].memberId)
          //     }
          // }
          // const message = `${saveddiary.userNameSender} đã vừa đăng 1 bài viết`
          // socket.emit("post", saveddiary, message, listUserId);
          for (let i = 0; i < savedpersonal.imageList.length; i++) {
            savedpersonal.imageList[
              i
            ].pathFile = `http://43.239.223.142:9000/personalUpload/personalImage/${savedpersonal.imageList[i].pathFile}`;
          }
          for (let j = 0; j < savedpersonal.videoList.length; j++) {
            savedpersonal.videoList[
              j
            ].pathFile = `http://43.239.223.142:9000/personalUpload/personalVideo/${savedpersonal.videoList[j].pathFile}`;
          }
          
          const aloalo = await Personal.findOneAndUpdate(
              {_id : savedpersonal._id},
              {
                $push: {imageListId: formData.imageListId, videoListId: formData.videoListId}
                
              })
          res.json({
            data: {
              result: savedpersonal,
              message: "Success",
            },
            error: null,
          });
        }
      } else {
        res
          .status(200)
          .json(
            createError(200, "Dữ liệu truyền lên phải là hình ảnh hoặc video")
          );
      }

  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

// xóa bài viết
export const deletePost = async (req, res, next) => {
  try {
    if (req && req.params && req.params.id) {
      const idPost = req.params.id;

      const result = await Personal.findOneAndDelete({ _id: idPost });
      if (result) {
        if (result) {
          res.status(200).json({ message: "Success" });
        } else {
          res.status(200).json(createError(200, "Id không chính xác"));
        }
      }
    } else {
      res
        .status(200)
        .json(createError(200, "Thông tin truyền lên không đầy đủ"));
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

// hiển thị 1 bài viết
export const getPost = async (req, res, next) => {
  try {
    if (req && req.params && req.params._id) {
      const postId = req.params._id;
      const post = await Personal.findOne({ _id: postId });
      if (post) {
        let totalComment = 0;
        for (let i = 0; i < post.commentList.length; i++) {
          totalComment += 1;
        }
        const result = { ...post };
        result._doc.totalComment = totalComment;

        for (let i = 0; i < post.imageList.length; i++) {
          post.imageList[
            i
          ].pathFile = `http://43.239.223.142:9000/personalUpload/personalImage/${post.imageList[i].pathFile}`;
        }
        for (let i = 0; i < post.videoList.length; i++) {
          post.videoList[
            i
          ].pathFile = `http://43.239.223.142:9000/personalUpload/personalVideo/${post.videoList[i].pathFile}`;
        }

        res.status(200).json({
          data: {
            result: result._doc,
            message: "Lấy thông tin thành công",
          },
          error: null,
        });
      }
    } else {
      res.status(200).json(createError(200, "Chưa truyền đủ dữ liệu"));
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

// hiển thị tất cả bài viết
// IdSeen : Id của người xem bài viết đó
export const getAllPost = async (req, res, next) => {
  try {
    if (
      req &&
      req.params &&
      req.params.userId &&
      req.params.IdSeen &&
      Number(req.params.userId) &&
      Number(req.params.IdSeen)
    ) {
      let showPost;
      let personal
      const userId = req.params.userId;
      await ShowPersonal(userId)
          .then(e => showPost = e )
    if (showPost === false) {
        personal = await Personal.find({ userId: userId }).sort({
          createAt: "desc",
        });
    }
    else {
        personal = await Personal.find({ userId: userId, createAt : {$gte: showPost} }).sort({
            createAt: "desc",
          });
    }
      // check friend 0
      let check = false;
      let listFriendId = [];
      let checkFriend = await Contact.find({
        $or: [{ userFist: userId }, { userSecond: userId }],
      });
      if (checkFriend) {
        for (let i = 0; i < checkFriend.length; i++) {
          listFriendId.push(checkFriend[i].userFist);
          listFriendId.push(checkFriend[i].userSecond);
        }
        listFriendId = listFriendId.filter((e) => Number(e) != Number(userId));
      }
      console.log(listFriendId);
      if (listFriendId.includes(Number(req.params.IdSeen))) {
        check = true;
      }
      if (personal) {
        if (personal.length > 0) {
          console.log(personal);
          for (let i = 0; i < personal.length; i++) {
            for (let j = 0; j < personal[i].imageList.length; j++) {
              personal[i].imageList[
                j
              ].pathFile = `http://43.239.223.142:9000/personalUpload/personalImage/${personal[i].imageList[j].pathFile}`;
            }
            for (let j = 0; j < personal[i].videoList.length; j++) {
              personal[i].videoList[
                j
              ].pathFile = `http://43.239.223.142:9000/personalUpload/personalVideo/${personal[i].videoList[j].pathFile}`;
            }
            {
              if (String(personal[i].raw) === "1") {
                if (Number(req.params.IdSeen) != Number(req.params.userId)) {
                  personal = personal.filter((e) => e._id != personal[i]._id);
                }
              } else if (Number(personal[i].raw) === "2") {
                if (!check) {
                  personal = personal.filter((e) => e._id != personal[i]._id);
                }
              } else if (personal[i].raw.includes("3/")) {
                const s = personal[i].raw.slice(2, personal[i].raw.length);

                if (
                  !s.split(",").includes(String(req.params.IdSeen)) &&
                  Number(req.params.IdSeen) !== personal[i].userId
                ) {
                  personal = personal.filter((e) => e._id !== personal[i]._id);
                }
              } else if (personal[i].raw.includes("4/")) {
                const s = personal[i].raw.slice(2, personal[i].raw.length);

                if (s.split(",").includes(String(req.params.IdSeen))) {
                  personal = personal.filter((e) => e._id !== personal[i]._id);
                }
                if (!check) {
                  personal = personal.filter((e) => e._id !== personal[i]._id);
                }
              }
            }
          }
          res.status(200).json({
            data: {
              result: personal,
              message: "Lấy thông tin thành công",
            },
            error: null,
          });
        } else {
          res.status(200).json(createError(200, "Id không chính xác"));
        }
      }
    } else {
      res
        .status(200)
        .json(createError(200, "Thông tin truyền lên không đầy đủ"));
    }
  } catch (err) {
    console.log(err);
    // res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

// sửa bài viết
export const editPost = async (req, res, next) => {
  try {
    const formData = { ...req.body };
    const id = req.params.id;
    const content = req.body.contentPost;
    const raw = req.body.raw;
    const type = req.body.type;
    const IdImage = req.body.IdImage
    const IdVideo = req.body.IdVideo

    // Thêm ảnh và video vào dữ liệu
    formData.imageList = [];
    formData.videoList = [];
    formData.imageListId = []
    formData.videoListId = []
    let err = false;

    for (let i = 0; i < req.files.length; i++) {
      if (
        req.files[i].mimetype === "image/jpeg" ||
        req.files[i].mimetype === "application/octet-stream" ||
        req.files[i].mimetype === "image/jpg" ||
        req.files[i].mimetype === "image/png"
      ) {
        const pathFile = `${Date.now()}${path.extname(
          req.files[i].originalname
        )}`;
        fs.writeFileSync(
          `public/personalUpload/personalImage/${pathFile}`,
          req.files[i].buffer
        );
        formData.imageList.push({
          pathFile: pathFile,
          sizeFile: req.files[i].size,
        });
      } else if (
        req.files[i].mimetype === "video/mp4" ||
        req.files[i].mimetype === "video/avi" ||
        req.files[i].mimetype === "video/mpeg" 
      ) {
        const pathFile = `${Date.now()}${path.extname(
          req.files[i].originalname
        )}`;
        fs.writeFileSync(
          `public/personalUpload/personalVideo/${pathFile}`,
          req.files[i].buffer
        );
        formData.videoList.push({
          pathFile: pathFile,
          sizeFile: req.files[i].size,
        });
      } else {
        err = true;
        break;
      }
    }
  
    // const update = await Personal.findByIdAndUpdate(
    //     id,
    //     { $set: { content: content, createAt: Date.now(), fileList: files } },
    //     { new: true }
    //   );
    //let update = await Personal.updateOne({_id:id},{$set:{content: content}});
    //const update = await Personal.findOneAndUpdate({ _id: id }, { content: content, createAt: Date.now(), fileList: files }, { new: true })


    if (err === true || !err) {
      
      if (type === "1") {
        const update = await Personal.findOneAndUpdate(
          { _id: id },
          {
            contentPost: content,
            createAt: Date.now(),
            raw: raw,
            $push: {
              imageList: formData.imageList,
              videoList: formData.videoList,
            },
          },
          { new: true }
        );
        if (update) {
          for(let i = 0; i < formData.imageList.length; i++) {
            formData.imageListId.push(String(update.imageList[update.imageList.length-i-1]._id)) 
          }
          for(let i = 0; i < formData.videoList.length; i++) {
            formData.videoListId.push(String(update.videoList[update.videoList.length-i-1]._id)) 
          }
          for (let i = 0; i < update.imageList.length; i++) {
            update.imageList[
              i
            ].pathFile = `http://43.239.223.142:9000/personalUpload/personalImage/${update.imageList[i].pathFile}`;
    
            
          }
          for (let i = 0; i < update.videoList.length; i++) {
            update.videoList[
              i
            ].pathFile = `http://43.239.223.142:9000/personalUpload/personalVideo/${update.videoList[i].pathFile}`;
           
            
          }
          const update1 = await Personal.findOneAndUpdate(
            { _id: id },
            {
              $push: {
                imageListId:formData.imageListId,
                videoListId:formData.videoListId
              },
            },
            { new: true }
          );
          res.json({
            data: {
              result: update,
              message: "Success",
            },
            error: null,
          });
        } else {
          res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
        }
      }
       else if (type === "2") {
        const find = await Personal.findOne(
          { _id: id },
        );
        
        let Image = [];
        let Video = []
      
      
      if (!String(req.body.IdImage).includes("[")) {
        
      } else {
        let string = String(req.body.IdImage).replace("[", "");
        string = String(string).replace("]", "");
        
        let list = string.split(",");
        for (let i = 0; i < list.length; i++) {
          if (String(list[i])) {
            Image.push(String(list[i]));
          }
        }
      }

      if (!String(req.body.IdVideo).includes("[")) {
        
      } else {
        let string = String(req.body.IdVideo).replace("[", "");
        string = String(string).replace("]", "");
        
        let list = string.split(",");
        for (let i = 0; i < list.length; i++) {
          if (String(list[i])) {
            Video.push(String(list[i]));
          }
        }
      }
      
      
      let intersection 
      for(let i = 0; i < find.imageListId.length; i++) {
      let check = find.imageListId[i].filter(x => Image.includes(x));
      
      if(check.length > 0){
        intersection= check
      }
      }
      console.log(intersection)

      let intersection1 =[]
      for(let i = 0; i < find.videoListId.length; i++) {
      let check = find.videoListId[i].filter(x => Video.includes(x));
      if(check.length > 0){
        intersection1= check
      }
      }
        const update = await Personal.findOneAndUpdate(
          { _id: id },
          {
            contentPost: content,
            createAt: Date.now(),
            raw: raw,
            $pull: {
              imageList: { _id:intersection },
              videoList: { _id: intersection1 },
            },
          },
          { new: true }
        );
        if (update) {
          for (let i = 0; i < update.imageList.length; i++) {
            update.imageList[
              i
            ].pathFile = `http://43.239.223.142:9000/personalUpload/personalImage/${update.imageList[i].pathFile}`;
            
          }
          
          for (let i = 0; i < update.videoList.length; i++) {
            update.videoList[
              i
            ].pathFile = `http://43.239.223.142:9000/personalUpload/personalVideo/${update.videoList[i].pathFile}`;
          }
          res.json({
            data: {
              result: update,
              message: "Success",
            },
            error: null,
          });
        } else {
          res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
        }
      }
    } else {
      res
        .status(200)
        .json(createError(200, "Thông tin truyền lên không chính xác"));
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

// tạo album ( thêm 2 trường album Name và contentAlbum)
export const createAlbum = async (req, res, next) => {
  try {
    
      const formData = { ...req.body };
      // Thêm ảnh vào dữ liệu
      formData.imageList = [];
      formData.videoList = [];
      formData.contentAlbum = req.body.contentAlbum;
      formData.userId = req.body.userId;
      formData.albumName = req.body.albumName;
      formData.raw = req.body.raw;
      formData.imageListId = []
      formData.videoListId = []
      const type = req.body.type
      let err = false;

      if (!fs.existsSync(`public/personalUpload`)) {
        fs.mkdirSync(`public/personalUpload`);
      }
      if (!fs.existsSync(`public/personalUpload/personalImage`)) {
        fs.mkdirSync(`public/personalUpload/personalImage`);
      }
      if (!fs.existsSync(`public/personalUpload/personalVideo`)) {
        fs.mkdirSync(`public/personalUpload/personalVideo`);
      }

      for (let i = 0; i < req.files.length; i++) {
        if (
          req.files[i].mimetype === "image/jpeg" ||
          req.files[i].mimetype === "application/octet-stream" ||
          req.files[i].mimetype === "image/jpg" ||
          req.files[i].mimetype === "image/png"
        ) {
          const pathFile = `${Date.now()}_${req.body.userId}${path.extname(
            req.files[i].originalname
          )}`;
          fs.writeFileSync(
            `public/personalUpload/personalImage/${pathFile}`,
            req.files[i].buffer
          );
          formData.imageList.push({
            pathFile: pathFile,
            sizeFile: req.files[i].size,
          });
        } else if (
          req.files[i].mimetype === "video/mp4" ||
          req.files[i].mimetype === "video/avi" ||
          req.files[i].mimetype === "video/mpeg"
        ) {
          const pathFile = `${Date.now()}_${req.body.userId}${path.extname(
            req.files[i].originalname
          )}`;
          fs.writeFileSync(
            `public/personalUpload/personalVideo/${pathFile}`,
            req.files[i].buffer
          );
          formData.videoList.push({
            pathFile: pathFile,
            sizeFile: req.files[i].size,
          });
        } else {
          err = true;
          break;
        }
      }
      if (!err || err === true && type == 1) {
        formData.createAt = Date.now();
        const personalalbum = new Personal(formData);
        const savedpersonalalbum = await personalalbum.save();
        if (savedpersonalalbum) {
          for(let i = 0; i < formData.imageList.length; i++) {
            formData.imageListId.push(String(savedpersonalalbum.imageList[savedpersonalalbum.imageList.length-i-1]._id) )
          }
          for(let i = 0; i < formData.videoList.length; i++) {
            formData.videoListId.push(String(savedpersonalalbum.videoList[savedpersonalalbum.videoList.length-i-1]._id) )
          }
          for (let i = 0; i < savedpersonalalbum.imageList.length; i++) {
            savedpersonalalbum.imageList[
              i
            ].pathFile = `http://43.239.223.142:9000/personalUpload/personalImage/${savedpersonalalbum.imageList[i].pathFile}`;
          }
          for (let i = 0; i < savedpersonalalbum.videoList.length; i++) {
            savedpersonalalbum.videoList[
              i
            ].pathFile = `http://43.239.223.142:9000/personalUpload/personalVideo/${savedpersonalalbum.videoList[i].pathFile}`;
          }
          const update1 = await Personal.findOneAndUpdate(
            { _id: savedpersonalalbum._id },
            {
              $push: {
                imageListId:formData.imageListId,
                videoListId:formData.videoListId
              },
            },
            { new: true }
          );
          res.json({
            data: {
              result: savedpersonalalbum,
              message: "Success",
            },
            error: null,
          });
        }
      } else {
        res
          .status(200)
          .json(
            createError(200, "Dữ liệu truyền lên phải là hình ảnh hoặc video")
          );
      }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

// hiển thị tất cả album
export const getAllAlbum = async (req, res, next) => {
  try {
    if (
      req &&
      req.params &&
      req.params.userId &&
      req.params.IdSeen &&
      Number(req.params.userId) &&
      Number(req.params.IdSeen)
    ) {
      const userId = req.params.userId;
      let personal = await Personal.find({ userId: userId }).sort({
        createAt: "desc",
      });

      // check friend 0
      let check = false;
      let listFriendId = [];
      let checkFriend = await Contact.find({
        $or: [{ userFist: userId }, { userSecond: userId }],
      });
      if (checkFriend) {
        for (let i = 0; i < checkFriend.length; i++) {
          listFriendId.push(checkFriend[i].userFist);
          listFriendId.push(checkFriend[i].userSecond);
        }
        listFriendId = listFriendId.filter((e) => Number(e) != Number(userId));
      }
      console.log(listFriendId);
      if (listFriendId.includes(Number(req.params.IdSeen))) {
        check = true;
      }
      if (personal) {
        if (personal.length > 0) {
          console.log(personal);
          for (let i = 0; i < personal.length; i++) {
            for (let j = 0; j < personal[i].imageList.length; j++) {
              personal[i].imageList[
                j
              ].pathFile = `http://43.239.223.142:9000/personalUpload/personalImage/${personal[i].imageList[j].pathFile}`;
            }
            for (let j = 0; j < personal[i].videoList.length; j++) {
              personal[i].videoList[
                j
              ].pathFile = `http://43.239.223.142:9000/personalUpload/personalVideo/${personal[i].videoList[j].pathFile}`;
            }
            {
              if (String(personal[i].raw) === "1") {
                if (Number(req.params.IdSeen) != Number(req.params.userId)) {
                  personal = personal.filter((e) => e._id != personal[i]._id);
                }
              } else if (Number(personal[i].raw) === "2") {
                if (!check) {
                  personal = personal.filter((e) => e._id != personal[i]._id);
                }
              } else if (personal[i].raw.includes("3/")) {
                const s = personal[i].raw.slice(2, personal[i].raw.length);

                if (
                  !s.split(",").includes(String(req.params.IdSeen)) &&
                  Number(req.params.IdSeen) !== personal[i].userId
                ) {
                  personal = personal.filter((e) => e._id !== personal[i]._id);
                }
              } else if (personal[i].raw.includes("4/")) {
                const s = personal[i].raw.slice(2, personal[i].raw.length);

                if (s.split(",").includes(String(req.params.IdSeen))) {
                  personal = personal.filter((e) => e._id !== personal[i]._id);
                }
                if (!check) {
                  personal = personal.filter((e) => e._id !== personal[i]._id);
                }
              }
            }
          }
          res.status(200).json({
            data: {
              result: personal,
              message: "Lấy thông tin thành công",
            },
            error: null,
          });
        } else {
          res.status(200).json(createError(200, "Id không chính xác"));
        }
      }
    } else {
      res
        .status(200)
        .json(createError(200, "Thông tin truyền lên không đầy đủ"));
    }
  } catch (err) {
    console.log(err);
    // res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

// update album ( thay đổi ảnh, tên album với nội dung album)
export const editAlbum = async (req, res, next) => {
  try {
    console.log(req.body);
    const formData = { ...req.body };
    const id = req.params.id;
    const contentAlbum = req.body.contentAlbum;
    const albumName = req.body.albumName;
    const raw = req.body.raw;
    const type = req.body.type;
    const IdImage = req.body.IdImage
    const IdVideo = req.body.IdVideo

    formData.imageListId = []
    formData.videoListId = []
    formData.imageList = [];
    formData.videoList = [];
    let err = false;

    for (let i = 0; i < req.files.length; i++) {
      if (
        req.files[i].mimetype === "image/jpeg" ||
        req.files[i].mimetype === "application/octet-stream" ||
        req.files[i].mimetype === "image/jpg" ||
        req.files[i].mimetype === "image/png"
      ) {
        const pathFile = `${Date.now()}${path.extname(
          req.files[i].originalname
        )}`;
        fs.writeFileSync(
          `public/personalUpload/personalImage/${pathFile}`,
          req.files[i].buffer
        );
        formData.imageList.push({
          pathFile: pathFile,
          sizeFile: req.files[i].size,
        });
      }
      else if (
        req.files[i].mimetype === "video/mp4" ||
        req.files[i].mimetype === "video/avi" ||
        req.files[i].mimetype === "video/mpeg"
        
      ) {
        const pathFile = `${Date.now()}${path.extname(
          req.files[i].originalname
        )}`;
        fs.writeFileSync(
          `public/personalUpload/personalVideo/${pathFile}`,
          req.files[i].buffer
        );
        formData.videoList.push({
          pathFile: pathFile,
          sizeFile: req.files[i].size,
        });
      } else {
        err = true;
        break;
      }
    }
    if (err === true || !err) {
      if (type === "1") {
        const update = await Personal.findOneAndUpdate(
          { _id: id },
          {
            contentAlbum: contentAlbum,
            albumName: albumName,
            createAt: Date.now(),
            raw: raw,
            $push: {
              imageList: formData.imageList,
              videoList: formData.videoList,
            },
          },
          { new: true }
        );
        if (update) {
          for(let i = 0; i < formData.imageList.length; i++) {
            formData.imageListId.push(String(update.imageList[update.imageList.length-i-1]._id) )
          }
          for(let i = 0; i < formData.videoList.length; i++) {
            formData.videoListId.push(String(update.videoList[update.videoList.length-i-1]._id) )
          }
          for (let i = 0; i < update.imageList.length; i++) {
            update.imageList[
              i
            ].pathFile = `http://43.239.223.142:9000/personalUpload/personalImage/${update.imageList[i].pathFile}`;
          }
          for (let i = 0; i < update.videoList.length; i++) {
            update.videoList[
              i
            ].pathFile = `http://43.239.223.142:9000/personalUpload/personalVideo/${update.videoList[i].pathFile}`;
          }
          const update1 = await Personal.findOneAndUpdate(
            { _id: id },
            {
              $push: {
                imageListId:formData.imageListId,
                videoListId:formData.videoListId
              },
            },
            { new: true }
          );
          res.json({
            data: {
              result: update,
              message: "Success",
            },
            error: null,
          });
        } else {
          res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
        }
      } else if (type === "2") {
        const find = await Personal.findOne(
          { _id: id },
        );
          
        let Image = [];
        let Video = []
        if (!String(req.body.IdImage).includes("[")) {
        
        } else {
          let string = String(req.body.IdImage).replace("[", "");
          string = String(string).replace("]", "");
          
          let list = string.split(",");
          for (let i = 0; i < list.length; i++) {
            if (String(list[i])) {
              Image.push(String(list[i]));
            }
          }
        }

        if (!String(req.body.IdVideo).includes("[")) {
          
        } else {
          let string = String(req.body.IdVideo).replace("[", "");
          string = String(string).replace("]", "");
          
          let list = string.split(",");
          for (let i = 0; i < list.length; i++) {
            if (String(list[i])) {
              Video.push(String(list[i]));
            }
          }
        }
        
      let intersection =[]
      for(let i = 0; i < find.imageListId.length; i++) {
    
      let check = find.imageListId[i].filter(x => Image.includes(x));
      if(check.length > 0){
        intersection = check
      }
      }
      console.log(intersection)
      

      let intersection1 =[]
      for(let i = 0; i < find.videoListId.length; i++) {
      let check = find.videoListId[i].filter(x => Video.includes(x));
      if(check.length > 0){
        intersection1 = check
      }
      }

        const update = await Personal.findOneAndUpdate(
          { _id: id },
          {
            contentAlbum: contentAlbum,
            albumName: albumName,
            createAt: Date.now(),
            raw: raw,
            $pull: {
              imageList: { _id:intersection },
              // imageListId: {_id: intersection},
              videoList: { _id: intersection1 },
            },
          },
          { new: true }
        );
        if (update) {
          for (let i = 0; i < update.imageList.length; i++) {
            update.imageList[
              i
            ].pathFile = `http://43.239.223.142:9000/personalUpload/personalImage/${update.imageList[i].pathFile}`;
          }
          for (let i = 0; i < update.videoList.length; i++) {
            update.videoList[
              i
            ].pathFile = `http://43.239.223.142:9000/personalUpload/personalVideo/${update.videoList[i].pathFile}`;
          }
          res.json({
            data: {
              result: update,
              message: "Success",
            },
            error: null,
          });
        } else {
          res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
        }
      }
    } else {
      res
        .status(200)
        .json(createError(200, "Thông tin truyền lên không chính xác"));
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

// xóa album
export const deleteAlbum = async (req, res, next) => {
  try {
    if (req && req.params && req.params.id) {
      const id = req.params.id;

      const result = await Personal.findOneAndDelete({ _id: id });
      if (result) {
        if (result) {
          res.status(200).json({ message: "Success" });
        } else {
          res.status(200).json(createError(200, "Id không chính xác"));
        }
      }
    } else {
      res
        .status(200)
        .json(createError(200, "Thông tin truyền lên không đầy đủ"));
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

//hiển thị album
export const getAlbum = async (req, res, next) => {
  try {
    if (req && req.params && req.params._id) {
      const albumId = req.params._id;
      const album = await Personal.findOne({ _id: albumId });

      if (album) {
        let totalImage = 0;
        let totalVideo = 0;

        for (let i = 0; i < album.imageList.length; i++) {
          totalImage += 1;
        }
        for (let i = 0; i < album.videoList.length; i++) {
          totalVideo += 1;
        }
        const result = { ...album };
        result._doc.totalImage = totalImage;
        result._doc.totalVideo = totalVideo;

        for (let i = 0; i < album.imageList.length; i++) {
          album.imageList[
            i
          ].pathFile = `http://43.239.223.142:9000/personalUpload/personalImage/${album.imageList[i].pathFile}`;
        }
        for (let i = 0; i < album.videoList.length; i++) {
          album.videoList[
            i
          ].pathFile = `http://43.239.223.142:9000/personalUpload/personalVideo/${album.videoList[i].pathFile}`;
        }
        res.status(200).json({
          data: {
            result: result._doc,
            message: "Lấy thông tin thành công",
          },
          error: null,
        });
      } else {
        res.status(200).json(createError(200, "Id không chính xác"));
      }
    } else {
      res.status(200).json(createError(200, "Chưa truyền đủ dữ liệu"));
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

//update backgroundImage
export const backgroundImg = async (req, res, next) => {
  try {
    console.log(req.body);
    const files = [];
    const formData = { ...req.body };
    const userId = req.body.userId;
    let err = false;

    if (!fs.existsSync(`public/personalBackgroundImg`)) {
      fs.mkdirSync(`public/personalBackgroundImg`);
    }

    for (let i = 0; i < req.files.length; i++) {
      if (
        req.files[i].mimetype === "image/jpeg" ||
        req.files[i].mimetype === "application/octet-stream" ||
        req.files[i].mimetype === "image/jpg" ||
        req.files[i].mimetype === "image/png"
      ) {
        const pathFile = `${Date.now()}_${path.extname(
          req.files[i].originalname
        )}`;
        fs.writeFileSync(
          `public/personalBackgroundImg/${pathFile}`,
          req.files[i].buffer
        );

        files.push({
          pathFile: pathFile,
          sizeFile: req.files[i].size,
        });
      } else {
        err = true;
        break;
      }
    }
    if (!err) {
      const updatebackground = await Personal.updateMany(
        { userId: userId },
        { $set: { backgroundImage: files, createAt: Date.now() } },
        { upsert: true }
      );
      if (updatebackground) {
        const backgroundImg = await Personal.findOne({ userId: userId });
        for (let i = 0; i < backgroundImg.backgroundImage.length; i++) {
          backgroundImg.backgroundImage[
            i
          ].pathFile = `http://43.239.223.142:9000/personalUpload/personalImage/${backgroundImg.backgroundImage[i].pathFile}`;
        }
        res.json({
          data: {
            result: backgroundImg,
            message: "Update Background Thành công",
          },
          error: null,
        });
      } else {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
      }
    } else {
      res.status(200).json(createError(200, "Chưa nhập dữ liệu"));
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

//Tạo bình luận (nếu 1 là personal, 2 là diary)
export const createComment = async (req, res, next) => {
  try {
    if (req && req.body && req.body.type) {
      const formData = { ...req.body };
      
      const user = await User.findOne(
        { _id: Number(req.body.commentatorId) },
        { userName: 1, avatarUser: 1 }
      );
      if (user.avatarUser !== "") {
        user.avatarUser = `https://mess.timviec365.vn/avatarUser/${user._id}/${user.avatarUser}`;
      } else {
        user.avatarUser = `https://mess.timviec365.vn/avatar/${
          user.userName[0]
        }_${Math.floor(Math.random() * 4) + 1}.png`;
      }
      let commentInsert = {
        content: String(req.body.content),
        commentatorId: Number(req.body.commentatorId),
        commentName: user.userName,
        commentAvatar: user.avatarUser,
        createAt: new Date(),
      };

      let commentImageInsert ={
        IdImage: String(req.body.IdImage),
        content: String(req.body.content),
        commentatorId: Number(req.body.commentatorId),
        commentName: user.userName,
        commentAvatar: user.avatarUser,
        createAt: new Date(),
      }

      let commentVideoInsert ={
        IdVideo: String(req.body.IdImage),
        content: String(req.body.content),
        commentatorId: Number(req.body.commentatorId),
        commentName: user.userName,
        commentAvatar: user.avatarUser,
        createAt: new Date(),
      }

      if (String(req.body.type) === "1") {
        const update = await Personal.findByIdAndUpdate(
          { _id: String(req.body.id) },
          { $push: { commentList: commentInsert } },
          { new: true }
        );

        if (update) {
          // const postcomment = await Personal.findOne({_id:String(req.body.id)})
          // const user = await User.findOne({_id: Number(req.body.commentatorId)},{userName: 1, avatarUser: 1})
          // console.log(user)
          // const message = `${user.userName} đã bình luận về 1 bài viết của bạn`
          // socket.emit("comment", postDiary,user,message, postDiary.userSenderId)

          res.json({
            data: {
              result: update,
              message: "Thêm bình luận thành công",
            },
            error: null,
          });
        }
      }

      if (String(req.body.type) === "2") {
        console.log(formData);
        let commentdiaryInsert = {
          content: String(req.body.content),
          commentatorId: Number(req.body.commentatorId),
          createAt: new Date(),
        };
        const update = await Diary.findByIdAndUpdate(
          { _id: String(req.body.id) },
          { $push: { commentList: commentdiaryInsert } },
          { new: true }
        );

        if (update) {
          res.json({
            data: {
              result: update,
              message: "Thêm bình luận thành công",
            },
            error: null,
          });
        }
      }

      if (String(req.body.type) === "3") {
        const update = await Personal.findByIdAndUpdate(
          { _id: String(req.body.id) },
          { $push: { commentList: commentImageInsert } },
          { new: true }
        );

        if (update) {
          res.json({
            data: {
              result: update,
              message: "Thêm bình luận ảnh thành công",
            },
            error: null,
          });
        }
      }
      
      if (String(req.body.type) === "4") {
        const update = await Personal.findByIdAndUpdate(
          { _id: String(req.body.id) },
          { $push: { commentList: commentVideoInsert } },
          { new: true }
        );

        if (update) {
          res.json({
            data: {
              result: update,
              message: "Thêm bình luận video thành công",
            },
            error: null,
          });
        }
      }
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Có lỗi xảy ra"));
  }
};

// cập nhật bình luận (nếu 1 là personal, 2 là diary)
export const updateComment = async (req, res, next) => {
  try {
    if (req && req.body && req.body.type) {
      const formData = { ...req.body };

      if (String(req.body.type) === "1") {
        let update = await Personal.findOneAndUpdate(
          {
            _id: String(req.body.id), // id bài viết,
            "commentList._id": formData.commentId,
            "commentList._commentatorId": Number(formData.commentatorId),
          },
          {
            $set: {
              "commentList.$.content": formData.content,
              "commentList.$.createAt": new Date(),
            },
          },
          { new: true } // nội dung bình luận mới }
        );
        if (update) {
          res.json({
            data: {
              result: update,
              message: "Thêm bình luận thành công",
            },
            error: null,
          });
        }
      }
        if (String(req.body.type) === "2") {
          console.log(req.body)
          let update = await Diary.findOneAndUpdate(
            {
              _id: String(req.body.id), // id bài viết,
              "commentList._id": formData.commentId,
              "commentList._commentatorId": Number(formData.commentatorId)
            },
            {
              $set: {
                "commentList.$.content": formData.content,
                "commentList.$.createAt": new Date(),
              },
            },
            { new: true } // nội dung bình luận mới }
          );
          if (update) {
            res.json({
              data: {
                result: update,
                message: "Thêm bình luận thành công",
              },
              error: null,
            });
          }
        }else res.status(200).json(createError(200, "truyền sai"));
      
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Có lỗi xảy ra"));
  }
};

// xóa bình luận (nếu 1 là personal, 2 là diary)
export const deleteComment = async (req, res, next) => {
  try {
    if (req && req.body && req.body.type) {
      const formData = { ...req.body };

      if (String(req.body.type) === "1") {
        const user = await User.findOne(
          { _id: Number(req.body.commentatorId) },
          { userName: 1, avatarUser: 1 }
        );
        if (user.avatarUser !== "") {
          user.avatarUser = `https://mess.timviec365.vn/avatarUser/${user._id}/${user.avatarUser}`;
        } else {
          user.avatarUser = `https://mess.timviec365.vn/avatar/${
            user.userName[0]
          }_${Math.floor(Math.random() * 4) + 1}.png`;
        }

        let update = await Personal.findOneAndUpdate(
          {
            _id: String(req.body.id),
            "commentList._id": formData.commentId,
            "commentList._commentatorId": Number(req.body.commentatorId),
          },
          {
            $pull: {
              commentList: {
                _id: formData.commentId,
                commentatorId: Number(req.body.commentatorId),
                commentName: user.userName,
                commentAvatar: user.avatarUser,
              },
            },
          },
          { new: true }
        );
        if (update) {
          res.json({
            data: {
              result: update,
              message: "Thêm bình luận thành công",
            },
            error: null,
          });
        }
      }

      if (String(req.body.type) === "2") {
        const user = await User.findOne(
          { _id: Number(req.body.commentatorId) },
          { userName: 1, avatarUser: 1 }
        );

        let update = await Diary.findOneAndUpdate(
          {
            _id: String(req.body.id),
            "commentList._id": formData.commentId,
            "commentList._commentatorId": Number(req.body.commentatorId),
          },
          {
            $pull: {
              commentList: {
                _id: formData.commentId,
                commentatorId: Number(req.body.commentatorId),
                commentName: user.userName,
                commentAvatar: user.avatarUser,
              },
            },
          },
          { new: true }
        );
        if (update) {
          res.json({
            data: {
              result: update,
              message: "Thêm bình luận thành công",
            },
            error: null,
          });
        }
      }

      if (String(req.body.type) === "3") {
        const user = await User.findOne(
          { _id: Number(req.body.commentatorId) },
          { userName: 1, avatarUser: 1 }
        );
        if (user.avatarUser !== "") {
          user.avatarUser = `https://mess.timviec365.vn/avatarUser/${user._id}/${user.avatarUser}`;
        } else {
          user.avatarUser = `https://mess.timviec365.vn/avatar/${
            user.userName[0]
          }_${Math.floor(Math.random() * 4) + 1}.png`;
        }

        let update = await Personal.findOneAndUpdate(
          {
            _id: String(req.body.id),
            "commentList._id": formData.commentId,
            "commentList._commentatorId": Number(req.body.commentatorId),
          },
          {
            $pull: {
              commentList: {
                IdImage: formData.IdImage,
                _id: formData.commentId,
                commentatorId: Number(req.body.commentatorId),
                commentName: user.userName,
                commentAvatar: user.avatarUser,
              },
            },
          },
          { new: true }
        );
        if (update) {
          res.json({
            data: {
              result: update,
              message: "Xóa bình luận ảnh thành công",
            },
            error: null,
          });
        }
      }

      if (String(req.body.type) === "4") {
        const user = await User.findOne(
          { _id: Number(req.body.commentatorId) },
          { userName: 1, avatarUser: 1 }
        );
        if (user.avatarUser !== "") {
          user.avatarUser = `https://mess.timviec365.vn/avatarUser/${user._id}/${user.avatarUser}`;
        } else {
          user.avatarUser = `https://mess.timviec365.vn/avatar/${
            user.userName[0]
          }_${Math.floor(Math.random() * 4) + 1}.png`;
        }

        let update = await Personal.findOneAndUpdate(
          {
            _id: String(req.body.id),
            "commentList._id": formData.commentId,
            "commentList._commentatorId": Number(req.body.commentatorId),
          },
          {
            $pull: {
              commentList: {
                IdVideo: formData.IdVideo,
                _id: formData.commentId,
                commentatorId: Number(req.body.commentatorId),
                commentName: user.userName,
                commentAvatar: user.avatarUser,
              },
            },
          },
          { new: true }
        );
        if (update) {
          res.json({
            data: {
              result: update,
              message: "Thêm bình luận thành công",
            },
            error: null,
          });
        }
      }
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Có lỗi xảy ra"));
  }
};

//thêm like và đếm like của bài viết
export const releaseEmotion = async (req, res, next) => {
  try {
    if (req && req.body) {
      const data = {};
      let totalEmotion, message;
      data.userSendId = req.body.userSendId;
      data.postId = req.body._id;
      const user = await User.findOne(
        { _id: Number(req.body.userSendId) },
        { userName: 1, avatarUser: 1 }
      );
      const postPersonal = await Personal.findOne({ _id: data.postId });

      let UserLikeName = postPersonal.emotionName
      let UserLikeAvatar = postPersonal.emotionAvatar
      const arname = UserLikeName.split(",")
      const aravatar = UserLikeAvatar.split(",")
      if (postPersonal.emotion) {
        if (postPersonal.emotion.split("/").includes(data.userSendId)) {
          //Xóa lượt thích
          postPersonal.emotion = postPersonal.emotion.replace(
            `${data.userSendId}/`,
            ""
          );
          arname.splice(arname.indexOf(String(user.userName)),1)
          UserLikeName = arname.join(",")
          if (user.avatarUser !== "") {
            aravatar.splice(
              aravatar.indexOf(
                `https://mess.timviec365.vn/avatarUser/${user._id}/${user.avatarUser}`
              ),
              1
            );
          } else {
            aravatar.splice(
              aravatar.indexOf(
                `https://mess.timviec365.vn/avatar/${user.userName[0]}_${
                  Math.floor(Math.random() * 4) + 1
                }.png`
              ),
              1
            );
          }
          UserLikeAvatar = aravatar.join(",");
        } else {
          postPersonal.emotion = `${postPersonal.emotion}${data.userSendId}/`;
          arname.push(String(user.userName))
          UserLikeName = arname.join(",");
          if (user.avatarUser !== "") {
            aravatar.push(
              `https://mess.timviec365.vn/avatarUser/${user._id}/${user.avatarUser}`
            );
          } else {
            aravatar.push(
              `https://mess.timviec365.vn/avatar/${user.userName[0]}_${
                Math.floor(Math.random() * 4) + 1
              }.png`
            );
          }
          UserLikeAvatar = aravatar.join(","); //Thêm lượt thích
        }
      } else {
        postPersonal.emotion = `${data.userSendId}/`;
        arname.push(String(user.userName))
        console.log(arname)
          UserLikeName = arname.join(",")
          if (user.avatarUser !== "") {
            aravatar.push(
              `https://mess.timviec365.vn/avatarUser/${user._id}/${user.avatarUser}`
            );
          } else {
            aravatar.push(
              `https://mess.timviec365.vn/avatar/${user.userName[0]}_${
                Math.floor(Math.random() * 4) + 1
              }.png`
            );
          }
          UserLikeAvatar = aravatar.join(",") //Thêm lượt thích
      }

      if (postPersonal.emotion) {
        totalEmotion = postPersonal.emotion.split("/").length - 1;
      } else {
        totalEmotion = 0;
      }

      const personal = await Personal.findOneAndUpdate(
        { _id: data.postId },
        { emotion: postPersonal.emotion, emotionName: UserLikeName, emotionAvatar: UserLikeAvatar },
        { new: true }
      );
      if (personal) {
        // const user = await User.findOne({ _id: Number(data.userSendId) }, { userName: 1, avatarUser: 1 });
        // if (currentTotalEmotion < totalEmotion) {
        //     message = `${user.userName} đã thích 1 bài viết của bạn`
        // }

        const result = { ...personal };
        result._doc.totalEmotion = totalEmotion;
        // socket.emit("releasePost", result._doc, message, user, diary.userSender)
        res.status(200).json({
          data: {
            result: result._doc,
            message: "Success",
          },
          error: null,
        });
      } else {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
      }
    } else {
      res
        .status(200)
        .json(createError(200, "Thông tin truyền lên không đầy đủ"));
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

//đếm tổng số ảnh và tổng số video trong tất cả album
export const countFile = async (req, res, next) => {
  try {
    if (req && req.params && req.params.userId) {
      const userId = req.params.userId;
      const count = await Personal.find({ userId: userId }).sort({
        createAt: "desc",
      });

      if (count) {
        let totalImage = 0;
        let totalVideo = 0;
        for (let i = 0; i < count.length; i++) {
          totalImage += count[i].imageList.length;
        }
        for (let i = 0; i < count.length; i++) {
          totalVideo += count[i].videoList.length;
        }
        const result = {
          post: count,
          totalImage: totalImage,
          totalVideo: totalVideo,
        };
        res.status(200).json({
          data: {
            result: result,
            message: "Lấy thông tin thành công",
          },
          error: null,
        });
      } else {
        res.status(200).json(createError(200, "Id không chính xác"));
      }
    } else {
      res.status(200).json(createError(200, "Chưa truyền đủ dữ liệu"));
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

//thêm, đếm số like vào ảnh và video và comment đã đăng
export const emotionFile = async (req, res, next) => {
  try {
    if (
      req.body &&
      String(req.body.type) &&
      req.body.userSendId &&
      Number(req.body.userSendId)
    ) {
      const user = await User.findOne(
        { _id: Number(req.body.userSendId) },
        { userName: 1, avatarUser: 1 }
      );
      if (String(req.body.type) === "1") {
        const formData = { ...req.body };
        let totalImageEmotion;

        // if (user.avatarUser !== '') {
        //     user.avatarUser = `https://mess.timviec365.vn/avatarUser/${user._id}/${user.avatarUser}`
        // }
        // else {
        //     user.avatarUser = `https://mess.timviec365.vn/avatar/${user.userName[0]}_${Math.floor(Math.random() * 4) + 1}.png`
        // }
        let result = await Personal.aggregate([
          {
            $match: {
              _id: ObjectId(req.body._id),
            },
          },
          {
            $project: {
              imageList: {
                $slice: [
                  // để giới hạn kết quả trả về
                  {
                    $filter: {
                      input: "$imageList",
                      as: "imagelist",
                      cond: {
                        $eq: ["$$imagelist._id", ObjectId(req.body.imageId)],
                      },
                    },
                  },
                  -10,
                ],
              },
            },
          },
        ]);

        if (result) {
          let ListUserLike = result[0].imageList[0].imageEmotion;
          let UserLikeName = result[0].imageList[0].imageLikeName;
          let UserLikeAvatar = result[0].imageList[0].imageLikeAvatar;

          const ar = ListUserLike.split(",");
          const arname = UserLikeName.split(",");
          const aravatar = UserLikeAvatar.split(",");
          if (ar.includes(String(req.body.userSendId))) {
            ar.splice(ar.indexOf(String(req.body.userSendId)), 1);
            ListUserLike = ar.join(",");
            if (user.avatarUser !== "") {
              aravatar.splice(
                ar.indexOf(
                  `https://mess.timviec365.vn/avatarUser/${user._id}/${user.avatarUser}`
                ),
                1
              );
            } else {
              aravatar.splice(
                aravatar.indexOf(
                  `https://mess.timviec365.vn/avatar/${user.userName[0]}_${
                    Math.floor(Math.random() * 4) + 1
                  }.png`
                ),
                1
              );
            }
            UserLikeAvatar = aravatar.join(",");
            arname.splice(arname.indexOf(String(user.userName)), 1);
            UserLikeName = arname.join(",");
          } else {
            ar.push(String(req.body.userSendId));

            if (user.avatarUser !== "") {
              aravatar.push(
                `https://mess.timviec365.vn/avatarUser/${user._id}/${user.avatarUser}`
              );
            } else {
              aravatar.push(
                `https://mess.timviec365.vn/avatar/${user.userName[0]}_${
                  Math.floor(Math.random() * 4) + 1
                }.png`
              );
            }
            arname.push(String(user.userName));
            ListUserLike = ar.join(",");
            UserLikeName = arname.join(",");
            UserLikeAvatar = aravatar.join(",");
          }

          if (ListUserLike) {
            totalImageEmotion = ListUserLike.split(",").length - 1;
          }

          let update = await Personal.findOneAndUpdate(
            {
              _id: String(req.body._id),
              "imageList._id": String(req.body.imageId),
            },
            {
              $set: {
                "imageList.$.imageEmotion": ListUserLike,
                "imageList.$.imageLikeName": UserLikeName,
                "imageList.$.imageLikeAvatar": UserLikeAvatar,
              },
            },
            { new: true }
          );
          if (update) {
            const result = { ...update };
            result._doc.totalImageEmotion = totalImageEmotion;
            res.status(200).json({
              data: {
                result: result._doc,
                message: "thành công",
              },
              error: null,
            });
          }
        }
      }

      if (String(req.body.type) === "2") {
        let totalVideoEmotion;
        let result1 = await Personal.aggregate([
          {
            $match: {
              _id: ObjectId(req.body._id),
            },
          },
          {
            $project: {
              videoList: {
                $slice: [
                  // để giới hạn kết quả trả về
                  {
                    $filter: {
                      input: "$videoList",
                      as: "videolist",
                      cond: {
                        $eq: ["$$videolist._id", ObjectId(req.body.videoId)],
                      },
                    },
                  },
                  -10,
                ],
              },
            },
          },
        ]);

        if (result1) {
          let ListUserLike = result1[0].videoList[0].imageEmotion;
          let UserLikeName = result1[0].videoList[0].imageLikeName;
          let UserLikeAvatar = result1[0].videoList[0].imageLikeAvatar;

          const ar = ListUserLike.split(",");
          const arname = UserLikeName.split(",");
          const aravatar = UserLikeAvatar.split(",");
          if (ar.includes(String(req.body.userSendId))) {
            ar.splice(ar.indexOf(String(req.body.userSendId)), 1);
            ListUserLike = ar.join(",");
            if (user.avatarUser !== "") {
              aravatar.splice(
                ar.indexOf(
                  `https://mess.timviec365.vn/avatarUser/${user._id}/${user.avatarUser}`
                ),
                1
              );
            } else {
              aravatar.splice(
                aravatar.indexOf(
                  `https://mess.timviec365.vn/avatar/${user.userName[0]}_${
                    Math.floor(Math.random() * 4) + 1
                  }.png`
                ),
                1
              );
            }
            UserLikeAvatar = aravatar.join(",");
            arname.splice(arname.indexOf(String(user.userName)), 1);
            UserLikeName = arname.join(",");
          } else {
            ar.push(String(req.body.userSendId));

            if (user.avatarUser !== "") {
              aravatar.push(
                `https://mess.timviec365.vn/avatarUser/${user._id}/${user.avatarUser}`
              );
            } else {
              aravatar.push(
                `https://mess.timviec365.vn/avatar/${user.userName[0]}_${
                  Math.floor(Math.random() * 4) + 1
                }.png`
              );
            }
            arname.push(String(user.userName));
            ListUserLike = ar.join(",");
            UserLikeName = arname.join(",");
            UserLikeAvatar = aravatar.join(",");
          }
          if (ListUserLike) {
            totalVideoEmotion = ListUserLike.split(",").length - 1;
          }

          let update = await Personal.findOneAndUpdate(
            {
              _id: String(req.body._id),
              "videoList._id": String(req.body.videoId),
            },
            {
              $set: { "videoList.$.videoEmotion": ListUserLike },
              "videoList.$.videoLikeName": UserLikeName,
              "videoList.$.videoLikeAvatar": UserLikeAvatar,
            },
            { new: true }
          );
          if (update) {
            const result = { ...update };
            result._doc.totalVideoEmotion = totalVideoEmotion;
            res.status(200).json({
              data: {
                result: result._doc,
                message: "thành công",
              },
              error: null,
            });
          }
        }
      }

      if (String(req.body.type) === "3") {
        let totalCommentEmotion;
        let result = await Personal.aggregate([
          {
            $match: {
              _id: ObjectId(req.body._id),
            },
          },
          {
            $project: {
              commentList: {
                $slice: [
                  // để giới hạn kết quả trả về
                  {
                    $filter: {
                      input: "$commentList",
                      as: "commentlist",
                      cond: {
                        $eq: [
                          "$$commentlist._id",
                          ObjectId(req.body.commentId),
                        ],
                      },
                    },
                  },
                  -10,
                ],
              },
            },
          },
        ]);

        if (result) {
            let ListUserLike = result[0].commentList[0].commentEmotion;
            let UserLikeName = result[0].commentList[0].commentLikeName;
            let UserLikeAvatar = result[0].commentList[0].commentLikeAvatar;
  
            const ar = ListUserLike.split(",");
            const arname = UserLikeName.split(",");
            const aravatar = UserLikeAvatar.split(",");
            if (ar.includes(String(req.body.userSendId))) {
              ar.splice(ar.indexOf(String(req.body.userSendId)), 1);
              ListUserLike = ar.join(",");
              if (user.avatarUser !== "") {
                aravatar.splice(
                  ar.indexOf(
                    `https://mess.timviec365.vn/avatarUser/${user._id}/${user.avatarUser}`
                  ),
                  1
                );
              } else {
                aravatar.splice(
                  aravatar.indexOf(
                    `https://mess.timviec365.vn/avatar/${user.userName[0]}_${
                      Math.floor(Math.random() * 4) + 1
                    }.png`
                  ),
                );
              }
              UserLikeAvatar = aravatar.join(",");
              arname.splice(arname.indexOf(String(user.userName)), 1);
              UserLikeName = arname.join(",");
            } else {
              ar.push(String(req.body.userSendId));
  
              if (user.avatarUser !== "") {
                aravatar.push(
                  `https://mess.timviec365.vn/avatarUser/${user._id}/${user.avatarUser}`
                );
              } else {
                aravatar.push(
                  `https://mess.timviec365.vn/avatar/${user.userName[0]}_${
                    Math.floor(Math.random() * 4) + 1
                  }.png`
                );
              }
              arname.push(String(user.userName));
              ListUserLike = ar.join(",");
              UserLikeName = arname.join(",");
              UserLikeAvatar = aravatar.join(",");
            }
            if (ListUserLike) {
              totalCommentEmotion = ListUserLike.split(",").length - 1;
            }
  
            let update = await Personal.findOneAndUpdate(
              {
                _id: String(req.body._id),
                "commentList._id": String(req.body.commentId),
              },
              {
                $set: { "commentList.$.commentEmotion": ListUserLike },
                "commentList.$.commentLikeName": UserLikeName,
                "commentList.$.commentLikeAvatar": UserLikeAvatar,
              },
              { new: true }
            );
            if (update) {
              const result = { ...update };
              result._doc.totalcommentEmotion = totalCommentEmotion;
              res.status(200).json({
                data: {
                  result: result._doc,
                  message: "thành công",
                },
                error: null,
              });
            }
        }
      }
    } else {
      res
        .status(200)
        .json(createError(200, "Thông tin truyền lên không đầy đủ"));
    }
  } catch (e) {
    console.log(e);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

// gắn thẻ người xem
export const tagPersonal = async (req, res, next) => {
  try {
    if (req && req.body && req.body.listTag) {
      const formData = { ...req.body };
      const user = await User.findOne({_id:req.body.userId},{userName:1, avatarUser:1})
      
      const updatetag = await Personal.findOneAndUpdate(
        { _id: String(req.body.id) },
        { listTag: formData.listTag },
        { new: true }
      );
      let tag = [];
      if(updatetag){
        if (!req.body.listTag.includes("[")) {
          tag = req.body.listTag;
        } else {
          let string = String(req.body.listTag).replace("[", "");
          string = String(string).replace("]", "");
          let list = string.split(",");
          for (let i = 0; i < list.length; i++) {
            if (Number(list[i])) {
              tag.push(Number(list[i]));
            }
          }
        }
      }
   
      for( let i=0; i< tag.length; i++ ) {
        const find = await User.find(
          {_id: tag[i] },
          {userName: 1, avatarUser:1}
        )
        // console.log(find)
        if (find[0].avatarUser !== "") {
          find[0].avatarUser = `https://mess.timviec365.vn/avatarUser/${find[0]._id}/${find[0].avatarUser}`;
        } else {
          find[0].avatarUser = `${find[0]._id}`;
        }
        if(find && !updatetag.tagName.includes(find[0].userName) && !updatetag.tagAvatar.includes(find[0].avatarUser)){
          const update = await Personal.findOneAndUpdate(
            {_id:String(req.body.id)},
            {
              $push:{tagName : find[0].userName, tagAvatar: find[0].avatarUser}
            }, {new: true}
          )
        }
        
      }
      
      
      const findinfo = await Personal.findOne({_id:req.body.id})
      
      for (let i = 0; i < tag.length; i++) {
          axios({
            method: "post",
            url: "http://43.239.223.142:9000/api/V2/Notification/SendNotification",
            data: {
              Title: "Thông báo gắn thẻ",
              Message: `Bạn đã được gắn thẻ bới ${user.userName}`,
              Type: "SendCandidate",
              UserId: tag[i]
            },
            headers: { "Content-Type": "multipart/form-data" }
          }).catch((e)=>{
             console.log(e)
          })
      }
      res.status(200).json({
        data: {
          result: findinfo,
          message: "Success",
        },
        error: null,
      });
    } else
      res.status(200).json(createError(200, "Thông tin truyền lên không đúng"));
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

//gỡ thẻ người xem
export const untagPersonal = async (req, res, next) => {
  try {
    if (req && req.body && req.body.listunTag) {
      const formData = { ...req.body };
      const listTag = await Personal.findOne({_id:req.body.id})
      let untag = [];
      let list 
        if (!req.body.listunTag.includes("[")) {
          untag = req.body.listunTag;
        } else {
          let string = String(req.body.listunTag).replace("[", "");
          string = String(string).replace("]", "");
          list = string.split(",");
        }
        

        let listfinal = ''
        for( let i=0; i<list.length; i++ ) {
          
          listTag.listTag = listTag.listTag.replace(list[i],"")
           listfinal = listTag.listTag
           
        }
       
         listfinal = listfinal.replace("[","")
         listfinal = listfinal.replace("]","")
         let listfinal1 = listfinal.split(",")
         
         listfinal1 = listfinal1.filter((e) => e!== '').join(',')
         let listfinal2 = listfinal1.split(",")

         let name=[]
         let avatar = []
      for( let i=0; i< listfinal2.length; i++ ) {
        const find = await User.find(
          {_id: listfinal2[i] },
          {userName: 1, avatarUser:1}
        )
        if (find[0].avatarUser !== "") {
          find[0].avatarUser = `https://mess.timviec365.vn/avatarUser/${find[0]._id}/${find[0].avatarUser}`;
        } else {
          find[0].avatarUser = `${find[0]._id}`;
          
        }
        
          name.push(find[0].userName)
          avatar.push(find[0].avatarUser)
        
      }
      console.log(avatar)
      const listFinal = await Personal.findOneAndUpdate({_id:req.body.id},
        {listTag:listfinal1, tagName:name, tagAvatar: avatar},{new: true})
        
      if(listFinal){
        
        res.status(200).json({
          data: {
            result: listFinal,
            message: "Success",
          },
          error: null,
        })
      }else {
        res.status(200).json(createError(200, "Đã có lỗi"));
      }
    } else
      res.status(200).json(createError(200, "Thông tin truyền lên không đúng"));
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};


import  geoip from 'geoip-lite';
import axios from 'axios';
import qs from 'qs'
import { createError } from "../utils/error.js";
import fs from "fs";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Contact from "../models/Contact.js";
import RequestContact from "../models/RequestContact.js";
import UsersClassified from "../models/UsersClassified.js"; 
import { response } from 'express';
import Birthday from "../models/Birthday.js"
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export const findarround = async (req, res, next) => {
  try {
    if (req.params && req.params.userId && Number(req.params.userId)) {
      console.log(req.params);
      let userId = Number(req.params.userId);
      let user = await User.findOne(
        { _id: Number(req.params.userId) },
        { latitude: 1, longtitude: 1 }
      );
      if (user) {
        // danh sách bạn bè
        let listFriend = await Contact.find({
          $or: [{ userFist: userId }, { userSecond: userId }],
        });
        let arrayUserIdFriend = [];
        if (listFriend) {
          for (let i = 0; i < listFriend.length; i++) {
            arrayUserIdFriend.push(listFriend[i].userFist);
            arrayUserIdFriend.push(listFriend[i].userSecond);
          }
        }
        arrayUserIdFriend = arrayUserIdFriend.filter((e) => e != userId);
        if (Number(user.latitude) > 0 && Number(user.longtitude) > 0) {
          let users_finded = await User.find(
            {
              _id: { $ne: Number(req.params.userId) },
              latitude: {
                $gt: Number(user.latitude) - 0.05,
                $lt: Number(user.latitude) + 0.05,
              },
              longtitude: {
                $gt: Number(user.longtitude) - 0.05,
                $lt: Number(user.longtitude) + 0.05,
              },
            },
            { userName: 1, avatarUser: 1, latitude: 1, longtitude: 1 }
          );
          if (users_finded) {
            let listUser = [];
            for (let i = 0; i < users_finded.length; i++) {
              let a = {};
              a._id = users_finded[i]._id;
              a.userName = users_finded[i].userName;
              a.avatarUser = `https://mess.timviec365.vn/avatarUser/${users_finded[i]._id}/${users_finded[i].avatarUser}`;
              a.latitude = users_finded[i].latitude;
              a.longitude = users_finded[i].longtitude;
              a.distance = getDistanceFromLatLonInKm(
                user.latitude,
                user.longtitude,
                users_finded[i].latitude,
                users_finded[i].longtitude
              );
              a.friend = arrayUserIdFriend.includes(users_finded[i]._id);
              listUser.push(a);
            }
            res.status(200).json({
              data: {
                result: true,
                message: "Lấy thông tin thành công",
                users_finded: listUser,
                count_user: users_finded.length,
              },
              error: null,
            });
          } else {
            res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
          }
        } else {
          res.status(200).json({
            data: {
              result: true,
              message: "Lấy thông tin thành công",
              users_finded: [],
            },
            error: null,
          });
        }
      } else {
        res
          .status(200)
          .json(createError(200, "Không tìm thấy tài khoản của bạn"));
      }
    } else {
      console.log(err);
      res
        .status(200)
        .json(createError(200, "Thông tin truyền lên không đầy đủ"));
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};
export const updatelocation = async (req, res, next) => {
  try {
    if (
      req.body &&
      req.body.userId &&
      Number(req.body.userId) &&
      Number(req.body.latitude) &&
      Number(req.body.longtitude)
    ) {
      let user = await User.findOne({ _id: Number(req.body.userId) });
      if (user) {
        // let update= await User.updateOne({_id:Number(req.body.userId))
        let update = await User.updateOne(
          { _id: Number(req.body.userId) },
          {
            $set: {
              longtitude: Number(req.body.longtitude),
              latitude: Number(req.body.latitude),
            },
          }
        );
        if (update) {
          let user2 = await User.findOne({ _id: Number(req.body.userId) });
          if (user2) {
            res.status(200).json({
              data: {
                result: true,
                message: "Update successfully",
                user: {
                  _id: user2._id,
                  latitude: user2.latitude,
                  longtitude: user2.longtitude,
                },
              },
              error: null,
            });
          }
        }
      } else {
        res
          .status(200)
          .json(createError(200, "Thông tin truyền lên không đầy đủ"));
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
export const TakeListFriend = async (req, res, next) => {
  try {
    console.log(req.params);
    let userId = Number(req.params.userId);
    let result1 = await Contact.find({
      $or: [{ userFist: userId }, { userSecond: userId }],
    });
    let arrayUserId = [];
    if (result1) {
      for (let i = 0; i < result1.length; i++) {
        arrayUserId.push(result1[i].userFist);
        arrayUserId.push(result1[i].userSecond);
      }
    }
    arrayUserId = arrayUserId.filter((e) => e != userId);
    let listAccount = await User.find(
      { _id: { $in: arrayUserId } },
      { userName: 1, avatarUser: 1, lastActive: 1, isOnline: 1 }
    ).sort({ isOnline: 1, lastActive: -1 });
    //  "https://mess.timviec365.vn/avatarUser/12457/"
    if (result1) {
      if (listAccount) {
        let result = [];
        for (let i = 0; i < listAccount.length; i++) {
          let a = {};
          a._id = listAccount[i]._id;
          a.userName = listAccount[i].userName;
          a.avatarUser = `https://mess.timviec365.vn/avatarUser/${listAccount[i]._id}/${listAccount[i].avatarUser}`;
          a.lastActive = listAccount[i].lastActive;
          a.isOnline = listAccount[i].isOnline;
          result.push(a);
        }
        let listLastestUser = [];
        let time = new Date();
        time.setDate(time.getDate() - 1);
        console.log(time);
        for (let i = 0; i < result.length; i++) {
          if (
            result[i].isOnline == 0 &&
            new Date(result[i].lastActive) > time
          ) {
            listLastestUser.push(result[i]);
          }
        }
        res.status(200).json({
          data: {
            result: true,
            message: "Lấy thông tin thành công",
            listAccount: result,
            listLastestUser,
            count: listAccount.length,
          },
          error: null,
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

// danh sách bạn mới => Lấy 5 người bạn mới nhất
export const takeListNewFriend = async (req, res, next) => {
  try {
    console.log(req.params);
    let userId = Number(req.params.userId);
    let result1 = await Contact.find({
      $or: [{ userFist: userId }, { userSecond: userId }],
    }).sort({ _id: -1 });

    let arrayUserId = [];
    if (result1) {
      for (let i = 0; i < result1.length; i++) {
        arrayUserId.push(result1[i].userFist);
        arrayUserId.push(result1[i].userSecond);
      }
    }

    arrayUserId = arrayUserId.filter((e) => e != userId);

    let listAccount = await User.find(
      { _id: { $in: arrayUserId } },
      { userName: 1, avatarUser: 1, lastActive: 1, isOnline: 1 }
    ).limit(10);
    if (result1) {
      if (listAccount) {
        let result = [];
        for (let i = 0; i < listAccount.length; i++) {
          let a = {};
          a._id = listAccount[i]._id;
          a.userName = listAccount[i].userName;
          a.avatarUser = `https://mess.timviec365.vn/avatarUser/${listAccount[i]._id}/${listAccount[i].avatarUser}`;
          a.lastActive = listAccount[i].lastActive;
          a.isOnline = listAccount[i].isOnline;
          result.push(a);
        }

        res.status(200).json({
          data: {
            result: true,
            message: "Lấy thông tin thành công",
            listAccount: result,
          },
          error: null,
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

// danh sách bạn mới truy cập  client handle
export const takeListNewActiveFriend = async (req, res, next) => {
  try {
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

// send location
export const SendLocation = async (req, res, next) => {
  try {
    let ipAddress = req.socket.remoteAddress;
    let ipLocal = req.socket.localAddress;
    console.log("Ip local", ipLocal);
    let geo = geoip.lookup(ipAddress); // take location
    console.log(req.body);
    if (geo && geo.ll && geo.ll.length > 1) {
      let sendmes = await axios({
        method: "post",
        url: "http://43.239.223.142:3005/Message/SendMessage",
        data: {
          MessageID: "",
          ConversationID: Number(req.body.conversationId),
          SenderID: Number(req.body.senderId),
          MessageType: "map",
          Message: `${geo.ll[0]},${geo.ll[1]}`,
          Emotion: 1,
          Quote: "",
          Profile: "",
          ListTag: "",
          File: "",
          ListMember: "",
          IsOnline: [],
          IsGroup: 0,
          ConversationName: "",
          DeleteTime: 0,
          DeleteType: 0,
        },
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (sendmes) {
        res.status(200).json({
          data: {
            result: true,
            message: "Successfully sending",
          },
          error: null,
        });
      } else {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
      }
    } else {
      res.status(200).json(createError(200, "Cannot take your location"));
    }
  } catch (e) {
    console.log(e);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

export const GetTimeOnlineForUserId = async (req, res, next) => {
  try {
    // console.log(req.body);
    if (req && req.body && req.body.arrayUser) {
      let info = [];
      if (!req.body.arrayUser.includes("[")) {
        info = req.body.arrayUser;
      } else {
        let string = String(req.body.arrayUser).replace("[", "");
        string = String(string).replace("]", "");
        let infoFirst = string.split(",");
        for (let i = 0; i < infoFirst.length; i++) {
          if (Number(infoFirst[i])) {
            info.push(Number(infoFirst[i]));
          }
        }
      }
      let result = [];
      User.find({ _id: { $in: info } }, { isOnline: 1, lastActive: 1 }).then(
        (listUser) => {
          if (listUser.length > 0) {
            for (let i = 0; i < listUser.length; i++) {
              let a = {};
              a.id = listUser[i]._id;
              if (listUser[i].isOnline) {
                a.status = "Đang hoạt động";
              } else {
                let time = (new Date() - listUser[i].lastActive) / 1000 / 60;
                if (time <= 1) {
                  a.status = "Vừa truy cập";
                } else if (time > 1 && time < 60) {
                  a.status = `Hoạt động ${
                    String(time).split(".")[0]
                  } phút trước`;
                } else if (time >= 60 && time < 60 * 24) {
                  time = time / 60;
                  a.status = `Hoạt động ${
                    String(time).split(".")[0]
                  } giờ trước`;
                } else if (time >= 60 * 24) {
                  time = time / 60 / 24;
                  a.status = `Hoạt động ${
                    String(time).split(".")[0]
                  } ngày trước`;
                  if (time > 7) {
                    a.status = `Không hoạt động`;
                  }
                }
              }
              result.push(a);
            }
            return res.status(200).json({
              data: {
                result,
                message: "Lấy thông tin thành công",
              },
              error: null,
            });
          } else {
            return res.status(200).json({
              data: {
                result: [],
                message: "Lấy thông tin thành công",
              },
              error: null,
            });
          }
        }
      );
    }
    // nếu truyền thông tin lên không đầy đủ thì sao
    else {
      res.status(200).json(createError(200, "Truyền thông tin không đầy đủ"));
    }
  } catch (e) {
    console.log(e);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};
export const GetTimeOnlineForUserIdTest = async (req, res, next) => {
  try {
    console.log(req.body);
    if (req && req.body && req.body.arrayUser) {
      let info = [];
      if (!req.body.arrayUser.includes("[")) {
        info = req.body.arrayUser;
      } else {
        let string = String(req.body.arrayUser).replace("[", "");
        string = String(string).replace("]", "");
        info = string.split(",");
        console.log(info);
      }
      let result = [];
      User.find({ _id: { $in: info } }, { isOnline: 1, lastActive: 1 }).then(
        (listUser) => {
          if (listUser.length > 0) {
            for (let i = 0; i < listUser.length; i++) {
              let a = {};
              a.id = listUser[i]._id;
              if (listUser[i].isOnline) {
                a.status = "Đang hoạt động";
              } else {
                let time = (new Date() - listUser[i].lastActive) / 1000 / 60;
                console.log(time);
                if (time <= 1) {
                  a.status = "Vừa truy cập";
                } else if (time > 1 && time < 60) {
                  a.status = `Hoạt động ${
                    String(time).split(".")[0]
                  } phút trước`;
                } else if (time >= 60 && time < 60 * 24) {
                  time = time / 60;
                  a.status = `Hoạt động ${
                    String(time).split(".")[0]
                  } giờ trước`;
                } else if (time >= 60 * 24) {
                  time = time / 60 / 24;
                  a.status = `Hoạt động ${
                    String(time).split(".")[0]
                  } ngày trước`;
                  if (time > 7) {
                    a.status = `Không hoạt động`;
                  }
                }
              }
              result.push(a);
            }
            return res.status(200).json({
              data: {
                result,
                message: "Lấy thông tin thành công",
              },
              error: null,
            });
          } else {
            return res.status(200).json({
              data: {
                result: [],
                message: "Lấy thông tin thành công",
              },
              error: null,
            });
          }
        }
      );
    }
    // nếu truyền thông tin lên không đầy đủ thì sao
    else {
      res.status(200).json(createError(200, "Truyền thông tin không đầy đủ"));
    }
  } catch (e) {
    console.log(e);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

export const GetHistoryAccessByUserId = async (req, res, next) => {
  console.log(req.params);
  try {
    if (req && req.params && req.params.id && Number(req.params.id)) {
      let user = await User.find(
        { _id: Number(req.params.id) },
        { HistoryAccess: 1 }
      );
      let accessed = [];
      let latestDevice = {};
      if (user.length > 0) {
        //maxTimeDevice = user[0].HistoryAccess[0];
        for (let i = 0; i < user[0].HistoryAccess.length; i++) {
          if (user[0].HistoryAccess[i].AccessPermision) {
            accessed.push(user[0].HistoryAccess[i]);
          }
        }
        latestDevice = accessed[0];
        for (let j = 0; j < accessed.length; j++) {
          if (new Date(accessed[j].Time) > new Date(latestDevice.Time)) {
            latestDevice = accessed[j];
          }
        }
      }
      if (user) {
        if (user.length > 0) {
          let result = [];
          for (let i = 0; i < user[0].HistoryAccess.length; i++) {
            let a = {};
            let geo = geoip.lookup(user[0].HistoryAccess[i].IpAddress);
            a.IdDevice = user[0].HistoryAccess[i].IdDevice;
            a.IpAddress = user[0].HistoryAccess[i].IpAddress;
            a.NameDevice = user[0].HistoryAccess[i].NameDevice;
            a.Time = user[0].HistoryAccess[i].Time;
            a.AccessPermision = user[0].HistoryAccess[i].AccessPermision;
            if (String(geo.region) == "HN" && String(geo.country) == "VN") {
              a.location = "Hà Nội,Việt Nam";
            } else {
              a.location = `${geo.region},${geo.country}`;
            }
            if (a.AccessPermision) {
              a.status = true;
            } else {
              a.status = false;
            }
            a.method = "Password";
            result.push(a);
          }
          let b = result.filter((ele) => ele.IdDevice == latestDevice.IdDevice);
          res.status(200).json({
            data: {
              result: true,
              message: "Lấy thông tin thành công",
              HistoryAccess: result,
              latestDevice: b[0],
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
  } catch (e) {
    console.log(e);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}
function removeVietnameseTones(str) {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  // Some system encode vietnamese combining accent as individual utf-8 characters
  // Một vài bộ encode coi các dấu mũ, dấu chữ như một kí tự riêng biệt nên thêm hai dòng này
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
  // Remove extra spaces
  // Bỏ các khoảng trắng liền nhau
  str = str.replace(/ + /g, " ");
  str = str.trim();

  str = str.replace(
    /!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g,
    " "
  );
  return str;
}
// tim kiem nguoi vaf cuoc tro chuyn
// tìm kiếm user nhóm
export const FindUser = async (req, res, next) => {
  try {
    console.log(req.body);
    if (req.body && req.body.senderId && Number(req.body.senderId)) {
      let userId = Number(req.body.senderId);
      let findword;
      let findwordNoVN;
      if (!req.body.message) {
        findword = "";
        findwordNoVN = "";
      } else {
        findword = String(req.body.message);
        findwordNoVN = removeVietnameseTones(String(req.body.message));
      }
      if (req.body.companyId) {
        companyId = Number(req.body.companyId);
      } else {
        companyId = 0;
      }
      let conversations = await Conversation.find(
        {
          "memberList.memberId": userId,
          isGroup: 0,
        },
        {
          timeLastMessage: 1,
          "memberList.memberId": 1,
          "memberList.conversationName": 1,
        }
      )
        .sort({ timeLastMessage: -1 })
        .limit(5);

      // Group
      let conversationGroup = [];
      let conversationGroupStart = await Conversation.aggregate([
        {
          $match: {
            "memberList.memberId": userId,
            isGroup: 1,
          },
        },
        { $sort: { timeLastMessage: -1 } },
        { $limit: 100 }, // lấy cuộc trò chuyện đầu tiên thỏa mãn => cũng k cần thiết vì id là duy nhất
        {
          $project: {
            countMessage: {
              $size: {
                $filter: {
                  input: "$messageList",
                  as: "messagelist",
                  cond: {
                    $lte: ["$$messagelist.createAt", new Date()],
                  },
                },
              },
            },
            messageList: {
              $slice: [
                // để giới hạn kết quả trả về
                {
                  $filter: {
                    input: "$messageList",
                    as: "messagelist",
                    cond: {
                      $lte: ["$$messagelist.createAt", new Date()], // nhỏ hơn hiện tại và là tin nhắn cuối
                    },
                  },
                },
                -1,
              ],
            },
            memberList: 1,
            isGroup: 1,
            typeGroup: 1,
            avatarConversation: 1,
            adminId: 1,
            shareGroupFromLinkOption: 1,
            browseMemberOption: 1,
            pinMessage: 1,
            timeLastMessage: 1,
          },
        },
      ]);

      for (let i = 0; i < conversationGroupStart.length; i++) {
        let a = {};
        let ele = conversationGroupStart[i].memberList.find(
          (e) => Number(e.memberId) == userId
        );
        if (
          ele &&
          Number(ele.memberId) == userId &&
          removeVietnameseTones(ele.conversationName)
            .toLowerCase()
            .includes(removeVietnameseTones(findword).toLowerCase())
        ) {
          a.conversationId = conversationGroupStart[i]._id;
          a.companyId = 0;
          a.conversationName = ele.conversationName;
          a.unReader = ele.unReader; // lay tu account
          a.isGroup = conversationGroupStart[i].isGroup;
          a.senderId = conversationGroupStart[i].messageList[0].senderId;
          a.pinMessageId = conversationGroupStart[i].pinMessage;
          a.messageId = conversationGroupStart[i].messageList[0].messageId;
          a.message = conversationGroupStart[i].messageList[0].message;
          a.messageType = conversationGroupStart[i].messageList[0].messageType;
          a.createAt = conversationGroupStart[i].messageList[0].createAt;
          a.countMessage = conversationGroupStart[i].countMessage; //total
          a.messageDisplay =
            conversationGroupStart[i].messageList[0].displayMessage;
          a.typeGroup = conversationGroupStart[i].typeGroup;
          a.adminId = conversationGroupStart[i].adminId;
          a.shareGroupFromLink =
            conversationGroupStart[i].shareGroupFromLinkOption;
          a.memberList = null;
          a.browseMember = conversationGroupStart[i].browseMemberOption;
          a.isFavorite = ele.isFavorite;
          a.notification = ele.notification;
          a.isHidden = ele.isHidden;
          a.deleteTime = ele.deleteTime;
          a.deleteType = ele.deleteType;
          a.listMess = 0;
          if (String(conversationGroupStart[i].avatarConversation) !== "") {
            a.linkAvatar = `https://mess.timviec365.vn/avatar/${conversationGroupStart[i]._id}/${conversationGroupStart[i].avatarConversation}`;
          } else {
            let t = getRandomInt(1, 4);
            a.linkAvatar = `https://mess.timviec365.vn/avatar/${ele.conversationName[0]}_${t}.png`;
          }
          a.avatarConversation = a.linkAvatar;
          a.listBrowerMember = conversationGroupStart[i].browseMemberList;
          a.listMember = conversationGroupStart[i].memberList;
          a.listMessage = null;
          conversationGroup.push(a);
        }
      }

      // listUserId in conversation
      let listUserFirstCompany = [];
      let listUserFirstNomal = [];
      let listUserId = [];
      if (conversations) {
        if (conversations.length > 0) {
          for (let i = 0; i < conversations.length; i++) {
            if (conversations[i].memberList.length > 1) {
              if (Number(conversations[i].memberList[0].memberId) != userId) {
                listUserId.push(conversations[i].memberList[0].memberId);
              }
              if (Number(conversations[i].memberList[1].memberId) != userId) {
                listUserId.push(conversations[i].memberList[1].memberId);
              }
            }
          }
          let listUserDetail = await User.find({
            _id: { $in: listUserId },
            userNameNoVn: new RegExp(findwordNoVN, "i"),
          });
          for (let j = 0; j < listUserId.length; j++) {
            let ele = listUserDetail.find((e) => e._id == listUserId[j]);
            if (ele) {
              if (Number(ele.companyId) == Number(companyId)) {
                listUserFirstCompany.push(ele);
              } else {
                listUserFirstNomal.push(ele);
              }
            }
          }
        } else {
          listUserFirstCompany = [];
          listUserFirstNomal = [];
        }

        // secondCompany
        let limitUserCompany = 5 - listUserFirstCompany.length;
        // loai bo chinh minh
        listUserId.push(userId);
        let listUserSecondCompany = await User.find({
          _id: { $nin: listUserId },
          userNameNoVn: new RegExp(findwordNoVN, "i"),
          companyId: companyId,
        }).limit(limitUserCompany);
        for (let i = 0; i < listUserSecondCompany.length; i++) {
          listUserFirstCompany.push(listUserSecondCompany[i]);
        }
        let resultCompany = [];

        for (let i = 0; i < listUserFirstCompany.length; i++) {
          let a = {};
          a["id"] = listUserFirstCompany[i]._id;
          a["email"] = listUserFirstCompany[i].email;
          a["userName"] = listUserFirstCompany[i].userName;
          a["status"] = listUserFirstCompany[i].status;
          a["active"] = listUserFirstCompany[i].active;
          a["isOnline"] = listUserFirstCompany[i].isOnline;
          a["looker"] = listUserFirstCompany[i].looker;
          a["statusEmotion"] = listUserFirstCompany[i].statusEmotion;
          a["lastActive"] = listUserFirstCompany[i].lastActive;
          if (listUserFirstCompany[i].avatarUser != "") {
            a[
              "linkAvatar"
            ] = `https://mess.timviec365.vn/avatarUser/${listUserFirstCompany[i]._id}/${listUserFirstCompany[i].avatarUser}`;
          } else {
            a["linkAvatar"] = `https://mess.timviec365.vn/avatar/${
              listUserFirstCompany[i].userName[0]
            }_${getRandomInt(1, 4)}.png`;
          }
          a["avatarUser"] = a["linkAvatar"];
          a["companyId"] = listUserFirstCompany[i].companyId;
          a["type365"] = listUserFirstCompany[i].type365;

          let status = await RequestContact.findOne({
            $or: [
              { userId: userId, contactId: listUserFirstCompany[i]._id },
              { userId: listUserFirstCompany[i]._id, contactId: userId },
            ],
          });
          if (status) {
            if (status.status == "accept") {
              a["friendStatus"] = "friend";
            } else {
              a["friendStatus"] = status.status;
            }
          } else {
            a["friendStatus"] = "none";
          }
          resultCompany.push(a);
        }

        // secondnormal
        let limitUserNormal = 5 - listUserFirstNomal.length;
        let listUserSecondNormal = await User.find({
          _id: { $nin: listUserId },
          userNameNoVn: new RegExp(findwordNoVN, "i"),
          companyId: { $ne: companyId },
        }).limit(limitUserNormal);
        for (let i = 0; i < listUserSecondNormal.length; i++) {
          listUserFirstNomal.push(listUserSecondNormal[i]);
        }
        let resultNormal = [];
        for (let i = 0; i < listUserFirstNomal.length; i++) {
          let a = {};
          a["id"] = listUserFirstNomal[i]._id;
          a["email"] = listUserFirstNomal[i].email;
          a["userName"] = listUserFirstNomal[i].userName;
          a["status"] = listUserFirstNomal[i].status;
          a["active"] = listUserFirstNomal[i].active;
          a["isOnline"] = listUserFirstNomal[i].isOnline;
          a["looker"] = listUserFirstNomal[i].looker;
          a["statusEmotion"] = listUserFirstNomal[i].statusEmotion;
          a["lastActive"] = listUserFirstNomal[i].lastActive;
          if (listUserFirstNomal[i].avatarUser != "") {
            a[
              "linkAvatar"
            ] = `https://mess.timviec365.vn/avatarUser/${listUserFirstNomal[i]._id}/${listUserFirstNomal[i].avatarUser}`;
          } else {
            a["linkAvatar"] = `https://mess.timviec365.vn/avatar/${
              listUserFirstNomal[i].userName[0]
            }_${getRandomInt(1, 4)}.png`;
          }
          a["companyId"] = listUserFirstNomal[i].companyId;
          a["type365"] = listUserFirstNomal[i].type365;
          a["avatarUser"] = a["linkAvatar"];
          let status = await RequestContact.findOne({
            $or: [
              { userId: userId, contactId: listUserFirstNomal[i]._id },
              { userId: listUserFirstNomal[i]._id, contactId: userId },
            ],
          });
          if (status) {
            if (status.status == "accept") {
              a["friendStatus"] = "friend";
            } else {
              a["friendStatus"] = status.status;
            }
          } else {
            a["friendStatus"] = "none";
          }
          resultNormal.push(a);
        }
        res.status(200).json({
          data: {
            result: true,
            message: "Lấy thông tin thành công",
            listContactInCompany: resultCompany,
            listGroup: conversationGroup,
            listEveryone: resultNormal,
          },
          error: null,
        });
      }
    } else {
      res.status(200).json(createError(200, "Thông tin truyền không đầy đủ"));
    }
  } catch (e) {
    console.log(e);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

// tìm kiếm user nhóm
export const FindUserApp = async (req, res, next) => {
  try {
    if (
      req.body &&
      req.body.senderId &&
      Number(req.body.senderId) &&
      Number(req.body.companyId) &&
      req.body.type
    ) {
      let userId = Number(req.body.senderId);
      let findword;
      let findwordNoVN;
      if (!req.body.message) {
        findword = "";
        findwordNoVN = "";
      } else {
        findword = String(req.body.message);
        findwordNoVN = removeVietnameseTones(String(req.body.message));
      }
      let companyId = Number(req.body.companyId);
      if (String(req.body.type) == "all") {
        let conversations = await Conversation.find(
          {
            "memberList.memberId": userId,
            isGroup: 0,
          },
          {
            timeLastMessage: 1,
            "memberList.memberId": 1,
            "memberList.conversationName": 1,
          }
        )
          .sort({ timeLastMessage: -1 })
          .limit(5);

        // Group
        let conversationGroup = [];
        let conversationGroupStart = await Conversation.aggregate([
          {
            $match: {
              "memberList.memberId": userId,
              isGroup: 1,
            },
          },
          { $sort: { timeLastMessage: -1 } },
          { $limit: 100 }, // lấy cuộc trò chuyện đầu tiên thỏa mãn => cũng k cần thiết vì id là duy nhất
          {
            $project: {
              countMessage: {
                $size: {
                  $filter: {
                    input: "$messageList",
                    as: "messagelist",
                    cond: {
                      $lte: ["$$messagelist.createAt", new Date()],
                    },
                  },
                },
              },
              messageList: {
                $slice: [
                  // để giới hạn kết quả trả về
                  {
                    $filter: {
                      input: "$messageList",
                      as: "messagelist",
                      cond: {
                        $lte: ["$$messagelist.createAt", new Date()], // nhỏ hơn hiện tại và là tin nhắn cuối
                      },
                    },
                  },
                  -1,
                ],
              },
              memberList: 1,
              isGroup: 1,
              typeGroup: 1,
              avatarConversation: 1,
              adminId: 1,
              shareGroupFromLinkOption: 1,
              browseMemberOption: 1,
              pinMessage: 1,
              timeLastMessage: 1,
            },
          },
        ]).limit(10);

        for (let i = 0; i < conversationGroupStart.length; i++) {
          let a = {};
          let ele = conversationGroupStart[i].memberList.find(
            (e) => Number(e.memberId) == userId
          );
          if (
            ele &&
            Number(ele.memberId) == userId &&
            removeVietnameseTones(ele.conversationName)
              .toLowerCase()
              .includes(removeVietnameseTones(findword).toLowerCase())
          ) {
            a.conversationId = conversationGroupStart[i]._id;
            a.companyId = 0;
            a.conversationName = ele.conversationName;

            a.unReader = ele.unReader; // lay tu account
            a.isGroup = conversationGroupStart[i].isGroup;
            a.senderId = conversationGroupStart[i].messageList[0].senderId;
            a.pinMessageId = conversationGroupStart[i].pinMessage;
            a.messageId = conversationGroupStart[i].messageList[0]._id;
            a.message = conversationGroupStart[i].messageList[0].message;
            a.messageType =
              conversationGroupStart[i].messageList[0].messageType;
            a.createAt = conversationGroupStart[i].messageList[0].createAt;
            a.countMessage = conversationGroupStart[i].countMessage; //total
            a.messageDisplay =
              conversationGroupStart[i].messageList[0].displayMessage;
            a.typeGroup = conversationGroupStart[i].typeGroup;
            a.adminId = conversationGroupStart[i].adminId;
            a.shareGroupFromLink =
              conversationGroupStart[i].shareGroupFromLinkOption;
            a.memberList = null;
            a.browseMember = conversationGroupStart[i].browseMemberOption;
            a.isFavorite = ele.isFavorite;
            a.notification = ele.notification;
            a.isHidden = ele.isHidden;
            a.deleteTime = ele.deleteTime;
            a.deleteType = ele.deleteType;
            a.listMess = 0;
            if (String(conversationGroupStart[i].avatarConversation) !== "") {
              a.linkAvatar = `https://mess.timviec365.vn/avatar/${conversationGroupStart[i]._id}/${conversationGroupStart[i].avatarConversation}`;
            } else {
              let t = getRandomInt(1, 4);
              a.linkAvatar = `https://mess.timviec365.vn/avatar/${ele.conversationName[0]}_${t}.png`;
            }
            a.avatarConversation = a.linkAvatar;
            a.listBrowerMember = conversationGroupStart[i].browseMemberList;
            a.listMember = conversationGroupStart[i].memberList;
            a.listMessage = null;
            conversationGroup.push(a);
          }
        }

        // listUserId in conversation
        let listUserFirstCompany = [];
        let listUserFirstNomal = [];
        let listUserId = [];
        if (conversations) {
          if (conversations.length > 0) {
            for (let i = 0; i < conversations.length; i++) {
              if (conversations[i].memberList.length > 1) {
                if (Number(conversations[i].memberList[0].memberId) != userId) {
                  listUserId.push(conversations[i].memberList[0].memberId);
                }
                if (Number(conversations[i].memberList[1].memberId) != userId) {
                  listUserId.push(conversations[i].memberList[1].memberId);
                }
              }
            }
            let listUserDetail = await User.find({
              _id: { $in: listUserId },
              userNameNoVn: new RegExp(findwordNoVN, "i"),
            });
            for (let j = 0; j < listUserId.length; j++) {
              let ele = listUserDetail.find((e) => e._id == listUserId[j]);
              if (ele) {
                if (Number(ele.companyId) == Number(companyId)) {
                  listUserFirstCompany.push(ele);
                } else {
                  listUserFirstNomal.push(ele);
                }
              }
            }
          } else {
            listUserFirstCompany = [];
            listUserFirstNomal = [];
          }

          // secondCompany
          let limitUserCompany = 5 - listUserFirstCompany.length;
          // loai bo chinh minh
          listUserId.push(userId);
          let listUserSecondCompany = await User.find({
            _id: { $nin: listUserId },
            userNameNoVn: new RegExp(findwordNoVN, "i"),
            companyId: companyId,
          }).limit(limitUserCompany);
          for (let i = 0; i < listUserSecondCompany.length; i++) {
            listUserFirstCompany.push(listUserSecondCompany[i]);
          }
          let resultCompany = [];
          for (let i = 0; i < listUserFirstCompany.length; i++) {
            let a = {};
            a["id"] = listUserFirstCompany[i]._id;
            a["email"] = listUserFirstCompany[i].email;
            a["userName"] = listUserFirstCompany[i].userName;
            a["status"] = listUserFirstCompany[i].status;
            a["active"] = listUserFirstCompany[i].active;
            a["isOnline"] = listUserFirstCompany[i].isOnline;
            a["looker"] = listUserFirstCompany[i].looker;
            a["statusEmotion"] = listUserFirstCompany[i].statusEmotion;
            a["lastActive"] = listUserFirstCompany[i].lastActive;
            if (listUserFirstCompany[i].avatarUser != "") {
              a[
                "linkAvatar"
              ] = `https://mess.timviec365.vn/avatarUser/${listUserFirstCompany[i]._id}/${listUserFirstCompany[i].avatarUser}`;
            } else {
              a["linkAvatar"] = `https://mess.timviec365.vn/avatar/${
                listUserFirstCompany[i].userName[0]
              }_${getRandomInt(1, 4)}.png`;
            }
            a["avatarUser"] = a["linkAvatar"];
            a["companyId"] = listUserFirstCompany[i].companyId;
            a["type365"] = listUserFirstCompany[i].type365;

            let status = await RequestContact.findOne({
              $or: [
                { userId: userId, contactId: listUserFirstCompany[i]._id },
                { userId: listUserFirstCompany[i]._id, contactId: userId },
              ],
            });
            if (status) {
              if (status.status == "accept") {
                a["friendStatus"] = "friend";
              } else {
                a["friendStatus"] = status.status;
              }
            } else {
              a["friendStatus"] = "none";
            }
            resultCompany.push(a);
          }

          // secondnormal
          let limitUserNormal = 6 - listUserFirstNomal.length;
          let listUserSecondNormal = await User.find({
            _id: { $nin: listUserId },
            userNameNoVn: new RegExp(findwordNoVN, "i"),
            companyId: { $ne: companyId },
          }).limit(limitUserNormal);
          for (let i = 0; i < listUserSecondNormal.length; i++) {
            listUserFirstNomal.push(listUserSecondNormal[i]);
          }
          let resultNormal = [];
          for (let i = 0; i < listUserFirstNomal.length; i++) {
            let a = {};
            a["id"] = listUserFirstNomal[i]._id;
            a["email"] = listUserFirstNomal[i].email;
            a["userName"] = listUserFirstNomal[i].userName;
            a["status"] = listUserFirstNomal[i].status;
            a["active"] = listUserFirstNomal[i].active;
            a["isOnline"] = listUserFirstNomal[i].isOnline;
            a["looker"] = listUserFirstNomal[i].looker;
            a["statusEmotion"] = listUserFirstNomal[i].statusEmotion;
            a["lastActive"] = listUserFirstNomal[i].lastActive;
            if (listUserFirstNomal[i].avatarUser != "") {
              a[
                "linkAvatar"
              ] = `https://mess.timviec365.vn/avatarUser/${listUserFirstNomal[i]._id}/${listUserFirstNomal[i].avatarUser}`;
            } else {
              a["linkAvatar"] = `https://mess.timviec365.vn/avatar/${
                listUserFirstNomal[i].userName[0]
              }_${getRandomInt(1, 4)}.png`;
            }
            a["avatarUser"] = a["linkAvatar"];
            a["companyId"] = listUserFirstNomal[i].companyId;
            a["type365"] = listUserFirstNomal[i].type365;

            let status = await RequestContact.findOne({
              $or: [
                { userId: userId, contactId: listUserFirstNomal[i]._id },
                { userId: listUserFirstNomal[i]._id, contactId: userId },
              ],
            });
            if (status) {
              if (status.status == "accept") {
                a["friendStatus"] = "friend";
              } else {
                a["friendStatus"] = status.status;
              }
            } else {
              a["friendStatus"] = "none";
            }
            resultNormal.push(a);
          }
          res.status(200).json({
            data: {
              result: true,
              message: "Lấy thông tin thành công",
              listContactInCompany: resultCompany,
              listGroup: conversationGroup,
              listEveryone: resultNormal,
            },
            error: null,
          });
        }
      } else if (String(req.body.type) == "company") {
        let conversations = await Conversation.find(
          {
            "memberList.memberId": userId,
            isGroup: 0,
          },
          {
            timeLastMessage: 1,
            "memberList.memberId": 1,
            "memberList.conversationName": 1,
          }
        )
          .sort({ timeLastMessage: -1 })
          .limit(10);
        // listUserId in conversation
        let listUserFirstCompany = [];

        let listUserId = [];
        if (conversations) {
          if (conversations.length > 0) {
            for (let i = 0; i < conversations.length; i++) {
              if (conversations[i].memberList.length > 1) {
                if (Number(conversations[i].memberList[0].memberId) != userId) {
                  listUserId.push(conversations[i].memberList[0].memberId);
                }
                if (Number(conversations[i].memberList[1].memberId) != userId) {
                  listUserId.push(conversations[i].memberList[1].memberId);
                }
              }
            }
            let listUserDetail = await User.find({
              _id: { $in: listUserId },
              userNameNoVn: new RegExp(findwordNoVN, "i"),
            });
            for (let j = 0; j < listUserId.length; j++) {
              let ele = listUserDetail.find((e) => e._id == listUserId[j]);
              if (ele) {
                if (Number(ele.companyId) == Number(companyId)) {
                  listUserFirstCompany.push(ele);
                }
              }
            }
          } else {
            listUserFirstCompany = [];
          }

          let limitUserCompany = 10 - listUserFirstCompany.length;
          // loai bo chinh minh
          listUserId.push(userId);
          let listUserSecondCompany = await User.find({
            _id: { $nin: listUserId },
            userNameNoVn: new RegExp(findwordNoVN, "i"),
            companyId: companyId,
          }).limit(limitUserCompany);
          for (let i = 0; i < listUserSecondCompany.length; i++) {
            listUserFirstCompany.push(listUserSecondCompany[i]);
          }
          let resultCompany = [];
          for (let i = 0; i < listUserFirstCompany.length; i++) {
            let a = {};
            a["id"] = listUserFirstCompany[i]._id;
            a["email"] = listUserFirstCompany[i].email;
            a["userName"] = listUserFirstCompany[i].userName;
            a["status"] = listUserFirstCompany[i].status;
            a["active"] = listUserFirstCompany[i].active;
            a["isOnline"] = listUserFirstCompany[i].isOnline;
            a["looker"] = listUserFirstCompany[i].looker;
            a["statusEmotion"] = listUserFirstCompany[i].statusEmotion;
            a["lastActive"] = listUserFirstCompany[i].lastActive;
            if (listUserFirstCompany[i].avatarUser != "") {
              a[
                "linkAvatar"
              ] = `https://mess.timviec365.vn/avatarUser/${listUserFirstCompany[i]._id}/${listUserFirstCompany[i].avatarUser}`;
            } else {
              a["linkAvatar"] = `https://mess.timviec365.vn/avatar/${
                listUserFirstCompany[i].userName[0]
              }_${getRandomInt(1, 4)}.png`;
            }
            a["avatarUser"] = a["linkAvatar"];
            a["companyId"] = listUserFirstCompany[i].companyId;
            a["type365"] = listUserFirstCompany[i].type365;

            let status = await RequestContact.findOne({
              $or: [
                { userId: userId, contactId: listUserFirstCompany[i]._id },
                { userId: listUserFirstCompany[i]._id, contactId: userId },
              ],
            });
            if (status) {
              if (status.status == "accept") {
                a["friendStatus"] = "friend";
              } else {
                a["friendStatus"] = status.status;
              }
            } else {
              a["friendStatus"] = "none";
            }
            resultCompany.push(a);
          }

          // secondnormal
          res.status(200).json({
            data: {
              result: true,
              message: "Lấy thông tin thành công",
              listContactInCompany: resultCompany,
            },
            error: null,
          });
        }
      } else if (String(req.body.type) == "normal") {
        let conversations = await Conversation.find(
          {
            "memberList.memberId": userId,
            isGroup: 0,
          },
          {
            timeLastMessage: 1,
            "memberList.memberId": 1,
            "memberList.conversationName": 1,
          }
        )
          .sort({ timeLastMessage: -1 })
          .limit(10);

        // listUserId in conversation
        let listUserFirstNomal = [];
        let listUserId = [];
        if (conversations) {
          if (conversations.length > 0) {
            for (let i = 0; i < conversations.length; i++) {
              if (conversations[i].memberList.length > 1) {
                if (Number(conversations[i].memberList[0].memberId) != userId) {
                  listUserId.push(conversations[i].memberList[0].memberId);
                }
                if (Number(conversations[i].memberList[1].memberId) != userId) {
                  listUserId.push(conversations[i].memberList[1].memberId);
                }
              }
            }
            let listUserDetail = await User.find({
              _id: { $in: listUserId },
              userNameNoVn: new RegExp(findwordNoVN, "i"),
            });
            for (let j = 0; j < listUserId.length; j++) {
              let ele = listUserDetail.find((e) => e._id == listUserId[j]);
              if (ele) {
                if (!Number(ele.companyId) == Number(companyId)) {
                  listUserFirstNomal.push(ele);
                }
              }
            }
          } else {
            listUserFirstNomal = [];
          }

          // secondnormal
          let limitUserNormal = 10 - listUserFirstNomal.length;
          let listUserSecondNormal = await User.find({
            _id: { $nin: listUserId },
            userNameNoVn: new RegExp(findwordNoVN, "i"),
            companyId: { $ne: companyId },
          }).limit(limitUserNormal);
          for (let i = 0; i < listUserSecondNormal.length; i++) {
            listUserFirstNomal.push(listUserSecondNormal[i]);
          }
          let resultNormal = [];
          for (let i = 0; i < listUserFirstNomal.length; i++) {
            let a = {};
            a["id"] = listUserFirstNomal[i]._id;
            a["email"] = listUserFirstNomal[i].email;
            a["userName"] = listUserFirstNomal[i].userName;
            a["avatarUser"] = listUserFirstNomal[i].avatarUser;
            a["status"] = listUserFirstNomal[i].status;
            a["active"] = listUserFirstNomal[i].active;
            a["isOnline"] = listUserFirstNomal[i].isOnline;
            a["looker"] = listUserFirstNomal[i].looker;
            a["statusEmotion"] = listUserFirstNomal[i].statusEmotion;
            a["lastActive"] = listUserFirstNomal[i].lastActive;
            if (listUserFirstNomal[i].avatarUser != "") {
              a[
                "linkAvatar"
              ] = `https://mess.timviec365.vn/avatarUser/${listUserFirstNomal[i]._id}/${listUserFirstNomal[i].avatarUser}`;
            } else {
              a["linkAvatar"] = `https://mess.timviec365.vn/avatar/${
                listUserFirstNomal[i].userName[0]
              }_${getRandomInt(1, 4)}.png`;
            }
            a["avatarUser"] = a["linkAvatar"];
            a["companyId"] = listUserFirstNomal[i].companyId;
            a["type365"] = listUserFirstNomal[i].type365;

            let status = await RequestContact.findOne({
              $or: [
                { userId: userId, contactId: listUserFirstNomal[i]._id },
                { userId: listUserFirstNomal[i]._id, contactId: userId },
              ],
            });
            if (status) {
              if (status.status == "accept") {
                a["friendStatus"] = "friend";
              } else {
                a["friendStatus"] = status.status;
              }
            } else {
              a["friendStatus"] = "none";
            }
            resultNormal.push(a);
          }
          res.status(200).json({
            data: {
              result: true,
              message: "Lấy thông tin thành công",
              listEveryone: resultNormal,
            },
            error: null,
          });
        }
      } else if (String(req.body.type) == "group") {
        let conversationGroup = [];
        let conversationGroupStart = await Conversation.aggregate([
          {
            $match: {
              "memberList.memberId": userId,
              isGroup: 1,
            },
          },
          { $sort: { timeLastMessage: -1 } },
          { $limit: 100 }, // lấy cuộc trò chuyện đầu tiên thỏa mãn => cũng k cần thiết vì id là duy nhất
          {
            $project: {
              countMessage: {
                $size: {
                  $filter: {
                    input: "$messageList",
                    as: "messagelist",
                    cond: {
                      $lte: ["$$messagelist.createAt", new Date()],
                    },
                  },
                },
              },
              messageList: {
                $slice: [
                  // để giới hạn kết quả trả về
                  {
                    $filter: {
                      input: "$messageList",
                      as: "messagelist",
                      cond: {
                        $lte: ["$$messagelist.createAt", new Date()], // nhỏ hơn hiện tại và là tin nhắn cuối
                      },
                    },
                  },
                  -1,
                ],
              },
              memberList: 1,
              isGroup: 1,
              typeGroup: 1,
              avatarConversation: 1,
              adminId: 1,
              shareGroupFromLinkOption: 1,
              browseMemberOption: 1,
              pinMessage: 1,
              timeLastMessage: 1,
            },
          },
        ]);

        for (let i = 0; i < conversationGroupStart.length; i++) {
          let a = {};
          let ele = conversationGroupStart[i].memberList.find(
            (e) => Number(e.memberId) == userId
          );
          if (
            ele &&
            Number(ele.memberId) == userId &&
            removeVietnameseTones(ele.conversationName)
              .toLowerCase()
              .includes(removeVietnameseTones(findword).toLowerCase())
          ) {
            a.conversationId = conversationGroupStart[i]._id;
            a.companyId = 0;
            a.conversationName = ele.conversationName;
            a.avatarConversation = conversationGroupStart[i].avatarConversation;
            a.unReader = ele.unReader; // lay tu account
            a.isGroup = conversationGroupStart[i].isGroup;
            a.senderId = conversationGroupStart[i].messageList[0].senderId;
            a.pinMessageId = conversationGroupStart[i].pinMessage;
            a.messageId = conversationGroupStart[i].messageList[0]._id;
            a.message = conversationGroupStart[i].messageList[0].message;
            a.messageType =
              conversationGroupStart[i].messageList[0].messageType;
            a.createAt = conversationGroupStart[i].messageList[0].createAt;
            a.countMessage = conversationGroupStart[i].countMessage; //total
            a.messageDisplay =
              conversationGroupStart[i].messageList[0].displayMessage;
            a.typeGroup = conversationGroupStart[i].typeGroup;
            a.adminId = conversationGroupStart[i].adminId;
            a.shareGroupFromLink =
              conversationGroupStart[i].shareGroupFromLinkOption;
            a.memberList = null;
            a.browseMember = conversationGroupStart[i].browseMemberOption;
            a.isFavorite = ele.isFavorite;
            a.notification = ele.notification;
            a.isHidden = ele.isHidden;
            a.deleteTime = ele.deleteTime;
            a.deleteType = ele.deleteType;
            a.listMess = 0;
            if (String(conversationGroupStart[i].avatarConversation) !== "") {
              a.linkAvatar = `https://mess.timviec365.vn/avatar/${conversationGroupStart[i]._id}/${conversationGroupStart[i].avatarConversation}`;
            } else {
              let t = getRandomInt(1, 4);
              a.linkAvatar = `https://mess.timviec365.vn/avatar/${ele.conversationName[0]}_${t}.png`;
            }
            a.listBrowerMember = conversationGroupStart[i].browseMemberList;
            a.listMember = conversationGroupStart[i].memberList;
            a.listMessage = null;
            conversationGroup.push(a);
          }
        }
        res.status(200).json({
          data: {
            result: true,
            message: "Lấy thông tin thành công",
            listGroup: conversationGroup,
          },
          error: null,
        });
      } else {
        res.status(200).json({
          data: {
            result: true,
            message: "Type is not valid",
          },
          error: null,
        });
      }
    } else {
      res.status(200).json(createError(200, "Thông tin truyền không đầy đủ"));
    }
  } catch (e) {
    console.log(e);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

export const FindUserAppAll = async (req, res, next) => {
  try {
    console.log(req.body);
    if (req.body && req.body.senderId && Number(req.body.senderId)) {
      let userId = Number(req.body.senderId);
      let findword;
      let findwordNoVN;
      if (!req.body.message) {
        findword = "";
        findwordNoVN = "";
      } else {
        findword = String(req.body.message);
        findwordNoVN = removeVietnameseTones(String(req.body.message));
      }
      let companyId = 0;
      if (req.body.companyId) {
        companyId = Number(req.body.companyId);
      } else {
        companyId = 0;
      }

      let conversations = await Conversation.find(
        {
          "memberList.memberId": userId,
          isGroup: 0,
        },
        {
          timeLastMessage: 1,
          "memberList.memberId": 1,
          "memberList.conversationName": 1,
        }
      )
        .sort({ timeLastMessage: -1 })
        .limit(5);

      // Group
      let conversationGroup = [];
      let conversationGroupStart = await Conversation.aggregate([
        {
          $match: {
            "memberList.memberId": userId,
            isGroup: 1,
          },
        },
        { $sort: { timeLastMessage: -1 } },
        { $limit: 100 }, // lấy cuộc trò chuyện đầu tiên thỏa mãn => cũng k cần thiết vì id là duy nhất
        {
          $project: {
            countMessage: {
              $size: {
                $filter: {
                  input: "$messageList",
                  as: "messagelist",
                  cond: {
                    $lte: ["$$messagelist.createAt", new Date()],
                  },
                },
              },
            },
            messageList: {
              $slice: [
                // để giới hạn kết quả trả về
                {
                  $filter: {
                    input: "$messageList",
                    as: "messagelist",
                    cond: {
                      $lte: ["$$messagelist.createAt", new Date()], // nhỏ hơn hiện tại và là tin nhắn cuối
                    },
                  },
                },
                -1,
              ],
            },
            memberList: 1,
            isGroup: 1,
            typeGroup: 1,
            avatarConversation: 1,
            adminId: 1,
            shareGroupFromLinkOption: 1,
            browseMemberOption: 1,
            pinMessage: 1,
            timeLastMessage: 1,
          },
        },
      ]).limit(10);

      for (let i = 0; i < conversationGroupStart.length; i++) {
        let a = {};
        let ele = conversationGroupStart[i].memberList.find(
          (e) => Number(e.memberId) == userId
        );
        if (
          ele &&
          Number(ele.memberId) == userId &&
          removeVietnameseTones(ele.conversationName)
            .toLowerCase()
            .includes(removeVietnameseTones(findword).toLowerCase())
        ) {
          a.conversationId = conversationGroupStart[i]._id;
          a.companyId = 0;
          a.conversationName = ele.conversationName;

          a.unReader = ele.unReader; // lay tu account
          a.isGroup = conversationGroupStart[i].isGroup;
          a.senderId = conversationGroupStart[i].messageList[0].senderId;
          a.pinMessageId = conversationGroupStart[i].pinMessage;
          a.messageId = conversationGroupStart[i].messageList[0]._id;
          a.message = conversationGroupStart[i].messageList[0].message;
          a.messageType = conversationGroupStart[i].messageList[0].messageType;
          a.createAt = conversationGroupStart[i].messageList[0].createAt;
          a.countMessage = conversationGroupStart[i].countMessage; //total
          a.messageDisplay =
            conversationGroupStart[i].messageList[0].displayMessage;
          a.typeGroup = conversationGroupStart[i].typeGroup;
          a.adminId = conversationGroupStart[i].adminId;
          a.shareGroupFromLink =
            conversationGroupStart[i].shareGroupFromLinkOption;
          a.memberList = null;
          a.browseMember = conversationGroupStart[i].browseMemberOption;
          a.isFavorite = ele.isFavorite;
          a.notification = ele.notification;
          a.isHidden = ele.isHidden;
          a.deleteTime = ele.deleteTime;
          a.deleteType = ele.deleteType;
          a.listMess = 0;
          if (String(conversationGroupStart[i].avatarConversation) !== "") {
            a.linkAvatar = `https://mess.timviec365.vn/avatarGroup/${conversationGroupStart[i]._id}/${conversationGroupStart[i].avatarConversation}`;
          } else {
            let t = getRandomInt(1, 4);
            a.linkAvatar = `https://mess.timviec365.vn/avatar/${ele.conversationName[0]}_${t}.png`;
          }
          a.avatarConversation = a.linkAvatar;
          a.listBrowerMember = conversationGroupStart[i].browseMemberList;
          a.listMember = conversationGroupStart[i].memberList;
          a.listMessage = null;
          conversationGroup.push(a);
        }
      }

      // listUserId in conversation
      let listUserFirstCompany = [];
      let listUserFirstNomal = [];
      let listUserId = [];
      if (conversations) {
        if (conversations.length > 0) {
          for (let i = 0; i < conversations.length; i++) {
            if (conversations[i].memberList.length > 1) {
              if (Number(conversations[i].memberList[0].memberId) != userId) {
                listUserId.push(conversations[i].memberList[0].memberId);
              }
              if (Number(conversations[i].memberList[1].memberId) != userId) {
                listUserId.push(conversations[i].memberList[1].memberId);
              }
            }
          }
          let listUserDetail = await User.find({
            _id: { $in: listUserId },
            userNameNoVn: new RegExp(findwordNoVN, "i"),
          });
          for (let j = 0; j < listUserId.length; j++) {
            let ele = listUserDetail.find((e) => e._id == listUserId[j]);
            if (ele) {
              if (Number(ele.companyId) == Number(companyId)) {
                listUserFirstCompany.push(ele);
              } else {
                listUserFirstNomal.push(ele);
              }
            }
          }
        } else {
          listUserFirstCompany = [];
          listUserFirstNomal = [];
        }

        // secondCompany
        let limitUserCompany = 5 - listUserFirstCompany.length;
        // loai bo chinh minh
        listUserId.push(userId);
        let listUserSecondCompany = await User.find({
          _id: { $nin: listUserId },
          userNameNoVn: new RegExp(findwordNoVN, "i"),
          companyId: companyId,
        }).limit(limitUserCompany);
        for (let i = 0; i < listUserSecondCompany.length; i++) {
          listUserFirstCompany.push(listUserSecondCompany[i]);
        }
        let resultCompany = [];
        for (let i = 0; i < listUserFirstCompany.length; i++) {
          let a = {};
          a["id"] = listUserFirstCompany[i]._id;
          a["email"] = listUserFirstCompany[i].email;
          a["userName"] = listUserFirstCompany[i].userName;
          a["status"] = listUserFirstCompany[i].status;
          a["active"] = listUserFirstCompany[i].active;
          a["isOnline"] = listUserFirstCompany[i].isOnline;
          a["looker"] = listUserFirstCompany[i].looker;
          a["statusEmotion"] = listUserFirstCompany[i].statusEmotion;
          a["lastActive"] = listUserFirstCompany[i].lastActive;
          if (listUserFirstCompany[i].avatarUser != "") {
            a[
              "linkAvatar"
            ] = `https://mess.timviec365.vn/avatarUser/${listUserFirstCompany[i]._id}/${listUserFirstCompany[i].avatarUser}`;
          } else {
            a["linkAvatar"] = `https://mess.timviec365.vn/avatar/${
              listUserFirstCompany[i].userName[0]
            }_${getRandomInt(1, 4)}.png`;
          }
          a["avatarUser"] = a["linkAvatar"];
          a["companyId"] = listUserFirstCompany[i].companyId;
          a["type365"] = listUserFirstCompany[i].type365;

          let status = await RequestContact.findOne({
            $or: [
              { userId: userId, contactId: listUserFirstCompany[i]._id },
              { userId: listUserFirstCompany[i]._id, contactId: userId },
            ],
          });
          if (status) {
            if (status.status == "accept") {
              a["friendStatus"] = "friend";
            } else {
              a["friendStatus"] = status.status;
            }
          } else {
            a["friendStatus"] = "none";
          }
          resultCompany.push(a);
        }

        // secondnormal
        let limitUserNormal = 6 - listUserFirstNomal.length;
        let listUserSecondNormal = await User.find({
          _id: { $nin: listUserId },
          userNameNoVn: new RegExp(findwordNoVN, "i"),
          companyId: { $ne: companyId },
        }).limit(limitUserNormal);
        for (let i = 0; i < listUserSecondNormal.length; i++) {
          listUserFirstNomal.push(listUserSecondNormal[i]);
        }
        let resultNormal = [];
        for (let i = 0; i < listUserFirstNomal.length; i++) {
          let a = {};
          a["id"] = listUserFirstNomal[i]._id;
          a["email"] = listUserFirstNomal[i].email;
          a["userName"] = listUserFirstNomal[i].userName;
          a["status"] = listUserFirstNomal[i].status;
          a["active"] = listUserFirstNomal[i].active;
          a["isOnline"] = listUserFirstNomal[i].isOnline;
          a["looker"] = listUserFirstNomal[i].looker;
          a["statusEmotion"] = listUserFirstNomal[i].statusEmotion;
          a["lastActive"] = listUserFirstNomal[i].lastActive;
          if (listUserFirstNomal[i].avatarUser != "") {
            a[
              "linkAvatar"
            ] = `https://mess.timviec365.vn/avatarUser/${listUserFirstNomal[i]._id}/${listUserFirstNomal[i].avatarUser}`;
          } else {
            a["linkAvatar"] = `https://mess.timviec365.vn/avatar/${
              listUserFirstNomal[i].userName[0]
            }_${getRandomInt(1, 4)}.png`;
          }
          a["avatarUser"] = a["linkAvatar"];
          a["companyId"] = listUserFirstNomal[i].companyId;
          a["type365"] = listUserFirstNomal[i].type365;

          let status = await RequestContact.findOne({
            $or: [
              { userId: userId, contactId: listUserFirstNomal[i]._id },
              { userId: listUserFirstNomal[i]._id, contactId: userId },
            ],
          });
          if (status) {
            if (status.status == "accept") {
              a["friendStatus"] = "friend";
            } else {
              a["friendStatus"] = status.status;
            }
          } else {
            a["friendStatus"] = "none";
          }
          resultNormal.push(a);
        }
        res.status(200).json({
          data: {
            result: true,
            message: "Lấy thông tin thành công",
            listContactInCompany: resultCompany,
            listGroup: conversationGroup,
            listEveryone: resultNormal,
          },
          error: null,
        });
      }
    } else {
      res.status(200).json(createError(200, "Thông tin truyền không đầy đủ"));
    }
  } catch (e) {
    console.log(e);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

export const FindUserAppCompany = async (req, res, next) => {
  try {
    console.log(req.body);
    if (
      req.body &&
      req.body.senderId &&
      Number(req.body.senderId) &&
      Number(req.body.companyId)
    ) {
      let userId = Number(req.body.senderId);
      let findword;
      let findwordNoVN;
      if (!req.body.message) {
        findword = "";
        findwordNoVN = "";
      } else {
        findword = String(req.body.message);
        findwordNoVN = removeVietnameseTones(String(req.body.message));
      }
      if (req.body.ConversationId && !isNaN(req.body.ConversationId)) {
        let arrayUserIdAvoid = [];
        let conversation = await Conversation.findOne(
          { _id: Number(req.body.ConversationId) },
          { "memberList.memberId": 1 }
        );
        if (conversation && conversation.memberList) {
          for (let i = 0; i < conversation.memberList.length; i++) {
            arrayUserIdAvoid.push(conversation.memberList[i].memberId);
          }
          let companyId = Number(req.body.companyId);
          let conversations = await Conversation.find(
            {
              "memberList.memberId": userId,
              isGroup: 0,
            },
            {
              timeLastMessage: 1,
              "memberList.memberId": 1,
              "memberList.conversationName": 1,
            }
          )
            .sort({ timeLastMessage: -1 })
            .limit(10);
          // listUserId in conversation
          let listUserFirstCompany = [];

          let listUserId = [];
          if (conversations) {
            if (conversations.length > 0) {
              for (let i = 0; i < conversations.length; i++) {
                if (conversations[i].memberList.length > 1) {
                  if (
                    Number(conversations[i].memberList[0].memberId) != userId &&
                    !arrayUserIdAvoid.includes(
                      Number(conversations[i].memberList[0].memberId)
                    )
                  ) {
                    listUserId.push(conversations[i].memberList[0].memberId);
                  }
                  if (
                    Number(conversations[i].memberList[1].memberId) != userId &&
                    !arrayUserIdAvoid.includes(
                      Number(conversations[i].memberList[1].memberId)
                    )
                  ) {
                    listUserId.push(conversations[i].memberList[1].memberId);
                  }
                }
              }
              let listUserDetail = await User.find({
                _id: { $in: listUserId },
                userNameNoVn: new RegExp(findwordNoVN, "i"),
              });
              for (let j = 0; j < listUserId.length; j++) {
                let ele = listUserDetail.find((e) => e._id == listUserId[j]);
                if (ele) {
                  if (Number(ele.companyId) == Number(companyId)) {
                    listUserFirstCompany.push(ele);
                  }
                }
              }
            } else {
              listUserFirstCompany = [];
            }

            let limitUserCompany = 10 - listUserFirstCompany.length;
            // loai bo chinh minh
            listUserId.push(userId);
            for (let i = 0; i < arrayUserIdAvoid.length; i++) {
              listUserId.push(arrayUserIdAvoid[i]);
            }
            let listUserSecondCompany = await User.find({
              _id: { $nin: listUserId },
              userNameNoVn: new RegExp(findwordNoVN, "i"),
              companyId: companyId,
            }).limit(limitUserCompany);
            for (let i = 0; i < listUserSecondCompany.length; i++) {
              listUserFirstCompany.push(listUserSecondCompany[i]);
            }
            let resultCompany = [];
            for (let i = 0; i < listUserFirstCompany.length; i++) {
              let a = {};
              a["id"] = listUserFirstCompany[i]._id;
              a["email"] = listUserFirstCompany[i].email;
              a["userName"] = listUserFirstCompany[i].userName;
              a["status"] = listUserFirstCompany[i].status;
              a["active"] = listUserFirstCompany[i].active;
              a["isOnline"] = listUserFirstCompany[i].isOnline;
              a["looker"] = listUserFirstCompany[i].looker;
              a["statusEmotion"] = listUserFirstCompany[i].statusEmotion;
              a["lastActive"] = listUserFirstCompany[i].lastActive;
              if (listUserFirstCompany[i].avatarUser != "") {
                a[
                  "linkAvatar"
                ] = `https://mess.timviec365.vn/avatarUser/${listUserFirstCompany[i]._id}/${listUserFirstCompany[i].avatarUser}`;
              } else {
                a["linkAvatar"] = `https://mess.timviec365.vn/avatar/${
                  listUserFirstCompany[i].userName[0]
                }_${getRandomInt(1, 4)}.png`;
              }
              a["avatarUser"] = a["linkAvatar"];
              a["companyId"] = listUserFirstCompany[i].companyId;
              a["type365"] = listUserFirstCompany[i].type365;

              let status = await RequestContact.findOne({
                $or: [
                  { userId: userId, contactId: listUserFirstCompany[i]._id },
                  { userId: listUserFirstCompany[i]._id, contactId: userId },
                ],
              });
              if (status) {
                if (status.status == "accept") {
                  a["friendStatus"] = "friend";
                } else {
                  a["friendStatus"] = status.status;
                }
              } else {
                a["friendStatus"] = "none";
              }
              resultCompany.push(a);
            }

            // secondnormal
            res.status(200).json({
              data: {
                result: false,
                message: null,
                userName: null,
                countConversation: 0,
                conversationId: 0,
                total: 0,
                currentTime: 0,
                listUserOnline: null,
                user_info: null,
                user_list: resultCompany,
              },
              error: null,
            });
          }
        } else {
        }
      } else {
        let companyId = Number(req.body.companyId);
        let conversations = await Conversation.find(
          {
            "memberList.memberId": userId,
            isGroup: 0,
          },
          {
            timeLastMessage: 1,
            "memberList.memberId": 1,
            "memberList.conversationName": 1,
          }
        )
          .sort({ timeLastMessage: -1 })
          .limit(10);
        // listUserId in conversation
        let listUserFirstCompany = [];

        let listUserId = [];
        if (conversations) {
          if (conversations.length > 0) {
            for (let i = 0; i < conversations.length; i++) {
              if (conversations[i].memberList.length > 1) {
                if (Number(conversations[i].memberList[0].memberId) != userId) {
                  listUserId.push(conversations[i].memberList[0].memberId);
                }
                if (Number(conversations[i].memberList[1].memberId) != userId) {
                  listUserId.push(conversations[i].memberList[1].memberId);
                }
              }
            }
            let listUserDetail = await User.find({
              _id: { $in: listUserId },
              userNameNoVn: new RegExp(findwordNoVN, "i"),
            });
            for (let j = 0; j < listUserId.length; j++) {
              let ele = listUserDetail.find((e) => e._id == listUserId[j]);
              if (ele) {
                if (Number(ele.companyId) == Number(companyId)) {
                  listUserFirstCompany.push(ele);
                }
              }
            }
          } else {
            listUserFirstCompany = [];
          }

          let limitUserCompany = 10 - listUserFirstCompany.length;
          // loai bo chinh minh
          listUserId.push(userId);
          let listUserSecondCompany = await User.find({
            _id: { $nin: listUserId },
            userNameNoVn: new RegExp(findwordNoVN, "i"),
            companyId: companyId,
          }).limit(limitUserCompany);
          for (let i = 0; i < listUserSecondCompany.length; i++) {
            listUserFirstCompany.push(listUserSecondCompany[i]);
          }
          let resultCompany = [];
          for (let i = 0; i < listUserFirstCompany.length; i++) {
            let a = {};
            a["id"] = listUserFirstCompany[i]._id;
            a["email"] = listUserFirstCompany[i].email;
            a["userName"] = listUserFirstCompany[i].userName;
            a["status"] = listUserFirstCompany[i].status;
            a["active"] = listUserFirstCompany[i].active;
            a["isOnline"] = listUserFirstCompany[i].isOnline;
            a["looker"] = listUserFirstCompany[i].looker;
            a["statusEmotion"] = listUserFirstCompany[i].statusEmotion;
            a["lastActive"] = listUserFirstCompany[i].lastActive;
            if (listUserFirstCompany[i].avatarUser != "") {
              a[
                "linkAvatar"
              ] = `https://mess.timviec365.vn/avatarUser/${listUserFirstCompany[i]._id}/${listUserFirstCompany[i].avatarUser}`;
            } else {
              a["linkAvatar"] = `https://mess.timviec365.vn/avatar/${
                listUserFirstCompany[i].userName[0]
              }_${getRandomInt(1, 4)}.png`;
            }
            a["avatarUser"] = a["linkAvatar"];
            a["companyId"] = listUserFirstCompany[i].companyId;
            a["type365"] = listUserFirstCompany[i].type365;

            let status = await RequestContact.findOne({
              $or: [
                { userId: userId, contactId: listUserFirstCompany[i]._id },
                { userId: listUserFirstCompany[i]._id, contactId: userId },
              ],
            });
            if (status) {
              if (status.status == "accept") {
                a["friendStatus"] = "friend";
              } else {
                a["friendStatus"] = status.status;
              }
            } else {
              a["friendStatus"] = "none";
            }
            resultCompany.push(a);
          }

          // secondnormal
          res.status(200).json({
            data: {
              result: false,
              message: null,
              userName: null,
              countConversation: 0,
              conversationId: 0,
              total: 0,
              currentTime: 0,
              listUserOnline: null,
              user_info: null,
              user_list: resultCompany,
            },
            error: null,
          });
        }
      }
    } else {
      res.status(200).json(createError(200, "Thông tin truyền không đầy đủ"));
    }
  } catch (e) {
    console.log(e);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

export const FindUserAppNormal = async (req, res, next) => {
  try {
    console.log(req.body);
    if (req.body && req.body.senderId && Number(req.body.senderId)) {
      let userId = Number(req.body.senderId);
      let findword;
      let findwordNoVN;
      if (!req.body.message) {
        findword = "";
        findwordNoVN = "";
      } else {
        findword = String(req.body.message);
        findwordNoVN = removeVietnameseTones(String(req.body.message));
      }
      let companyId = 0;
      if (req.body.companyId) {
        companyId = Number(req.body.companyId);
      } else {
        companyId = 0;
      }
      let conversations = await Conversation.find(
        {
          "memberList.memberId": userId,
          isGroup: 0,
        },
        {
          timeLastMessage: 1,
          "memberList.memberId": 1,
          "memberList.conversationName": 1,
        }
      )
        .sort({ timeLastMessage: -1 })
        .limit(10);

      // listUserId in conversation
      let listUserFirstNomal = [];
      let listUserId = [];
      if (conversations) {
        if (conversations.length > 0) {
          for (let i = 0; i < conversations.length; i++) {
            if (conversations[i].memberList.length > 1) {
              if (Number(conversations[i].memberList[0].memberId) != userId) {
                listUserId.push(conversations[i].memberList[0].memberId);
              }
              if (Number(conversations[i].memberList[1].memberId) != userId) {
                listUserId.push(conversations[i].memberList[1].memberId);
              }
            }
          }
          let listUserDetail = await User.find({
            _id: { $in: listUserId },
            userNameNoVn: new RegExp(findwordNoVN, "i"),
          });
          for (let j = 0; j < listUserId.length; j++) {
            let ele = listUserDetail.find((e) => e._id == listUserId[j]);
            if (ele) {
              if (!Number(ele.companyId) == Number(companyId)) {
                listUserFirstNomal.push(ele);
              }
            }
          }
        } else {
          listUserFirstNomal = [];
        }

        // secondnormal
        let limitUserNormal = 10 - listUserFirstNomal.length;
        let listUserSecondNormal = await User.find({
          _id: { $nin: listUserId },
          userNameNoVn: new RegExp(findwordNoVN, "i"),
          companyId: { $ne: companyId },
        }).limit(limitUserNormal);
        for (let i = 0; i < listUserSecondNormal.length; i++) {
          listUserFirstNomal.push(listUserSecondNormal[i]);
        }
        let resultNormal = [];
        for (let i = 0; i < listUserFirstNomal.length; i++) {
          let a = {};
          a["id"] = listUserFirstNomal[i]._id;
          a["email"] = listUserFirstNomal[i].email;
          a["userName"] = listUserFirstNomal[i].userName;
          a["avatarUser"] = listUserFirstNomal[i].avatarUser;
          a["status"] = listUserFirstNomal[i].status;
          a["active"] = listUserFirstNomal[i].active;
          a["isOnline"] = listUserFirstNomal[i].isOnline;
          a["looker"] = listUserFirstNomal[i].looker;
          a["statusEmotion"] = listUserFirstNomal[i].statusEmotion;
          a["lastActive"] = listUserFirstNomal[i].lastActive;
          if (listUserFirstNomal[i].avatarUser != "") {
            a[
              "linkAvatar"
            ] = `https://mess.timviec365.vn/avatarUser/${listUserFirstNomal[i]._id}/${listUserFirstNomal[i].avatarUser}`;
          } else {
            a["linkAvatar"] = `https://mess.timviec365.vn/avatar/${
              listUserFirstNomal[i].userName[0]
            }_${getRandomInt(1, 4)}.png`;
          }
          a["avatarUser"] = a["linkAvatar"];
          a["companyId"] = listUserFirstNomal[i].companyId;
          a["type365"] = listUserFirstNomal[i].type365;

          let status = await RequestContact.findOne({
            $or: [
              { userId: userId, contactId: listUserFirstNomal[i]._id },
              { userId: listUserFirstNomal[i]._id, contactId: userId },
            ],
          });
          if (status) {
            if (status.status == "accept") {
              a["friendStatus"] = "friend";
            } else {
              a["friendStatus"] = status.status;
            }
          } else {
            a["friendStatus"] = "none";
          }
          resultNormal.push(a);
        }
        res.status(200).json({
          data: {
            result: false,
            message: null,
            userName: null,
            countConversation: 0,
            conversationId: 0,
            total: 0,
            currentTime: 0,
            listUserOnline: null,
            user_info: null,
            result: true,
            message: "Lấy thông tin thành công",
            user_list: resultNormal,
          },
          error: null,
        });
      }
    } else {
      res.status(200).json(createError(200, "Thông tin truyền không đầy đủ"));
    }
  } catch (e) {
    console.log(e);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

export const FindUserAppConversation = async (req, res, next) => {
  try {
    if (req.body && req.body.senderId && Number(req.body.senderId)) {
      let userId = Number(req.body.senderId);
      let findword;
      let findwordNoVN;
      if (!req.body.message) {
        findword = "";
        findwordNoVN = "";
      } else {
        findword = String(req.body.message);
        findwordNoVN = removeVietnameseTones(String(req.body.message));
      }
      let companyId = Number(req.body.companyId);
      let conversationGroup = [];
      let conversationGroupStart = await Conversation.aggregate([
        {
          $match: {
            "memberList.memberId": userId,
            isGroup: 1,
          },
        },
        { $sort: { timeLastMessage: -1 } },
        { $limit: 100 }, // lấy cuộc trò chuyện đầu tiên thỏa mãn => cũng k cần thiết vì id là duy nhất
        {
          $project: {
            countMessage: {
              $size: {
                $filter: {
                  input: "$messageList",
                  as: "messagelist",
                  cond: {
                    $lte: ["$$messagelist.createAt", new Date()],
                  },
                },
              },
            },
            messageList: {
              $slice: [
                // để giới hạn kết quả trả về
                {
                  $filter: {
                    input: "$messageList",
                    as: "messagelist",
                    cond: {
                      $lte: ["$$messagelist.createAt", new Date()], // nhỏ hơn hiện tại và là tin nhắn cuối
                    },
                  },
                },
                -1,
              ],
            },
            memberList: 1,
            isGroup: 1,
            typeGroup: 1,
            avatarConversation: 1,
            adminId: 1,
            shareGroupFromLinkOption: 1,
            browseMemberOption: 1,
            pinMessage: 1,
            timeLastMessage: 1,
          },
        },
      ]).limit(10);

      for (let i = 0; i < conversationGroupStart.length; i++) {
        let a = {};
        let ele = conversationGroupStart[i].memberList.find(
          (e) => Number(e.memberId) == userId
        );
        if (
          ele &&
          Number(ele.memberId) == userId &&
          removeVietnameseTones(ele.conversationName)
            .toLowerCase()
            .includes(removeVietnameseTones(findword).toLowerCase())
        ) {
          a.conversationId = conversationGroupStart[i]._id;
          a.companyId = 0;
          a.conversationName = ele.conversationName;
          a.unReader = ele.unReader; // lay tu account
          a.isGroup = conversationGroupStart[i].isGroup;
          a.senderId = conversationGroupStart[i].messageList[0].senderId;
          a.pinMessageId = conversationGroupStart[i].pinMessage;
          a.messageId = conversationGroupStart[i].messageList[0]._id;
          a.message = conversationGroupStart[i].messageList[0].message;
          a.messageType = conversationGroupStart[i].messageList[0].messageType;
          a.createAt = conversationGroupStart[i].messageList[0].createAt;
          a.countMessage = conversationGroupStart[i].countMessage; //total
          a.messageDisplay =
            conversationGroupStart[i].messageList[0].displayMessage;
          a.typeGroup = conversationGroupStart[i].typeGroup;
          a.adminId = conversationGroupStart[i].adminId;
          a.shareGroupFromLink =
            conversationGroupStart[i].shareGroupFromLinkOption;
          a.memberList = null;
          a.browseMember = conversationGroupStart[i].browseMemberOption;
          a.isFavorite = ele.isFavorite;
          a.notification = ele.notification;
          a.isHidden = ele.isHidden;
          a.deleteTime = ele.deleteTime;
          a.deleteType = ele.deleteType;
          a.listMess = 0;
          if (String(conversationGroupStart[i].avatarConversation) !== "") {
            a.linkAvatar = `https://mess.timviec365.vn/avatarGroup/${conversationGroupStart[i]._id}/${conversationGroupStart[i].avatarConversation}`;
          } else {
            let t = getRandomInt(1, 4);
            a.linkAvatar = `https://mess.timviec365.vn/avatar/${ele.conversationName[0]}_${t}.png`;
          }
          a.avatarConversation = a.linkAvatar;
          a.listBrowerMember = conversationGroupStart[i].browseMemberList;
          a.listMember = conversationGroupStart[i].memberList;
          a.listMessage = null;
          conversationGroup.push(a);
        }
      }
      res.status(200).json({
        data: {
          result: true,
          message: "Lấy danh sách cuộc trò chuyện thành công",
          conversation: null,
          countConversation: conversationGroup.length,
          conversation_info: null,
          user_list: null,
          message: "Lấy thông tin thành công",
          listCoversation: conversationGroup,
        },
        error: null,
      });
    } else {
      res.status(200).json(createError(200, "Thông tin truyền không đầy đủ"));
    }
  } catch (e) {
    console.log(e);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

export const FindUserAppCompanyRandom = async (req, res, next) => {
  console.log("FindUserAppCompanyRandom", req.body);
  try {
    if (
      req.body &&
      req.body.ID &&
      Number(req.body.ID) &&
      Number(req.body.CompanyID)
    ) {
      if (req.body.ConversationId && !isNaN(req.body.ConversationId)) {
        let arrayUserIdAvoid = [];
        let conversation = await Conversation.findOne(
          { _id: Number(req.body.ConversationId) },
          { "memberList.memberId": 1 }
        );
        if (conversation && conversation.memberList) {
          for (let i = 0; i < conversation.memberList.length; i++) {
            arrayUserIdAvoid.push(conversation.memberList[i].memberId);
          }

          let userId = Number(req.body.ID);
          let findword;
          let findwordNoVN;
          if (!req.body.message) {
            findword = "";
            findwordNoVN = "";
          } else {
            findword = String(req.body.message);
            findwordNoVN = removeVietnameseTones(String(req.body.message));
          }
          let companyId = Number(req.body.CompanyID);
          let conversations = await Conversation.find(
            {
              "memberList.memberId": userId,
              isGroup: 0,
            },
            {
              timeLastMessage: 1,
              "memberList.memberId": 1,
              "memberList.conversationName": 1,
            }
          )
            .sort({ timeLastMessage: -1 })
            .limit(10);
          // listUserId in conversation
          let listUserFirstCompany = [];

          let listUserId = [];
          if (conversations) {
            if (conversations.length > 0) {
              for (let i = 0; i < conversations.length; i++) {
                if (conversations[i].memberList.length > 1) {
                  if (
                    Number(conversations[i].memberList[0].memberId) != userId &&
                    !arrayUserIdAvoid.includes(
                      Number(conversations[i].memberList[0].memberId)
                    )
                  ) {
                    listUserId.push(conversations[i].memberList[0].memberId);
                  }
                  if (
                    Number(conversations[i].memberList[1].memberId) != userId &&
                    !arrayUserIdAvoid.includes(
                      Number(conversations[i].memberList[0].memberId)
                    )
                  ) {
                    listUserId.push(conversations[i].memberList[1].memberId);
                  }
                }
              }
              let listUserDetail = await User.find({
                _id: { $in: listUserId },
                userNameNoVn: new RegExp(findwordNoVN, "i"),
                companyId: Number(req.body.CompanyID),
              });
              for (let j = 0; j < listUserId.length; j++) {
                let ele = listUserDetail.find((e) => e._id == listUserId[j]);
                if (ele) {
                  if (Number(ele.companyId) == Number(companyId)) {
                    listUserFirstCompany.push(ele);
                  }
                }
              }
            } else {
              listUserFirstCompany = [];
            }

            let limitUserCompany = 10 - listUserFirstCompany.length;
            // loai bo chinh minh
            listUserId.push(userId);
            for (let i = 0; i < arrayUserIdAvoid.length; i++) {
              listUserId.push(arrayUserIdAvoid[i]);
            }
            let listUserSecondCompany = await User.find({
              _id: { $nin: listUserId },
              userNameNoVn: new RegExp(findwordNoVN, "i"),
              companyId: companyId,
            }).limit(limitUserCompany);
            for (let i = 0; i < listUserSecondCompany.length; i++) {
              listUserFirstCompany.push(listUserSecondCompany[i]);
            }
            let resultCompany = [];
            for (let i = 0; i < listUserFirstCompany.length; i++) {
              let a = {};
              a["id"] = listUserFirstCompany[i]._id;
              a["email"] = listUserFirstCompany[i].email;
              a["userName"] = listUserFirstCompany[i].userName;
              a["status"] = listUserFirstCompany[i].status;
              a["active"] = listUserFirstCompany[i].active;
              a["isOnline"] = listUserFirstCompany[i].isOnline;
              a["looker"] = listUserFirstCompany[i].looker;
              a["statusEmotion"] = listUserFirstCompany[i].statusEmotion;
              a["lastActive"] = listUserFirstCompany[i].lastActive;
              if (listUserFirstCompany[i].avatarUser != "") {
                a[
                  "linkAvatar"
                ] = `https://mess.timviec365.vn/avatarUser/${listUserFirstCompany[i]._id}/${listUserFirstCompany[i].avatarUser}`;
              } else {
                a["linkAvatar"] = `https://mess.timviec365.vn/avatar/${
                  listUserFirstCompany[i].userName[0]
                }_${getRandomInt(1, 4)}.png`;
              }
              a["avatarUser"] = a["linkAvatar"];
              a["companyId"] = listUserFirstCompany[i].companyId;
              a["type365"] = listUserFirstCompany[i].type365;

              let status = await RequestContact.findOne({
                $or: [
                  { userId: userId, contactId: listUserFirstCompany[i]._id },
                  { userId: listUserFirstCompany[i]._id, contactId: userId },
                ],
              });
              if (status) {
                if (status.status == "accept") {
                  a["friendStatus"] = "friend";
                } else {
                  a["friendStatus"] = status.status;
                }
              } else {
                a["friendStatus"] = "none";
              }
              resultCompany.push(a);
            }

            // secondnormal
            res.status(200).json({
              data: {
                result: false,
                message: null,
                userName: null,
                countConversation: 0,
                conversationId: 0,
                total: 0,
                currentTime: 0,
                listUserOnline: null,
                user_info: null,
                user_list: resultCompany,
              },
              error: null,
            });
          }
        } else {
          res
            .status(200)
            .json(createError(200, "Khong tim thay cuoc tro chuyen"));
        }
      } else {
        let userId = Number(req.body.ID);
        let findword;
        let findwordNoVN;
        if (!req.body.message) {
          findword = "";
          findwordNoVN = "";
        } else {
          findword = String(req.body.message);
          findwordNoVN = removeVietnameseTones(String(req.body.message));
        }
        let companyId = Number(req.body.CompanyID);
        let conversations = await Conversation.find(
          {
            "memberList.memberId": userId,
            isGroup: 0,
          },
          {
            timeLastMessage: 1,
            "memberList.memberId": 1,
            "memberList.conversationName": 1,
          }
        )
          .sort({ timeLastMessage: -1 })
          .limit(10);
        // listUserId in conversation
        let listUserFirstCompany = [];

        let listUserId = [];
        if (conversations) {
          if (conversations.length > 0) {
            for (let i = 0; i < conversations.length; i++) {
              if (conversations[i].memberList.length > 1) {
                if (Number(conversations[i].memberList[0].memberId) != userId) {
                  listUserId.push(conversations[i].memberList[0].memberId);
                }
                if (Number(conversations[i].memberList[1].memberId) != userId) {
                  listUserId.push(conversations[i].memberList[1].memberId);
                }
              }
            }
            let listUserDetail = await User.find({
              _id: { $in: listUserId },
              userNameNoVn: new RegExp(findwordNoVN, "i"),
            });
            for (let j = 0; j < listUserId.length; j++) {
              let ele = listUserDetail.find((e) => e._id == listUserId[j]);
              if (ele) {
                if (Number(ele.companyId) == Number(companyId)) {
                  listUserFirstCompany.push(ele);
                }
              }
            }
          } else {
            listUserFirstCompany = [];
          }

          let limitUserCompany = 10 - listUserFirstCompany.length;
          // loai bo chinh minh
          listUserId.push(userId);
          let listUserSecondCompany = await User.find({
            _id: { $nin: listUserId },
            userNameNoVn: new RegExp(findwordNoVN, "i"),
            companyId: companyId,
          }).limit(limitUserCompany);
          for (let i = 0; i < listUserSecondCompany.length; i++) {
            listUserFirstCompany.push(listUserSecondCompany[i]);
          }
          let resultCompany = [];
          for (let i = 0; i < listUserFirstCompany.length; i++) {
            let a = {};
            a["id"] = listUserFirstCompany[i]._id;
            a["email"] = listUserFirstCompany[i].email;
            a["userName"] = listUserFirstCompany[i].userName;
            a["status"] = listUserFirstCompany[i].status;
            a["active"] = listUserFirstCompany[i].active;
            a["isOnline"] = listUserFirstCompany[i].isOnline;
            a["looker"] = listUserFirstCompany[i].looker;
            a["statusEmotion"] = listUserFirstCompany[i].statusEmotion;
            a["lastActive"] = listUserFirstCompany[i].lastActive;
            if (listUserFirstCompany[i].avatarUser != "") {
              a[
                "linkAvatar"
              ] = `https://mess.timviec365.vn/avatarUser/${listUserFirstCompany[i]._id}/${listUserFirstCompany[i].avatarUser}`;
            } else {
              a["linkAvatar"] = `https://mess.timviec365.vn/avatar/${
                listUserFirstCompany[i].userName[0]
              }_${getRandomInt(1, 4)}.png`;
            }
            a["avatarUser"] = a["linkAvatar"];
            a["companyId"] = listUserFirstCompany[i].companyId;
            a["type365"] = listUserFirstCompany[i].type365;

            let status = await RequestContact.findOne({
              $or: [
                { userId: userId, contactId: listUserFirstCompany[i]._id },
                { userId: listUserFirstCompany[i]._id, contactId: userId },
              ],
            });
            if (status) {
              if (status.status == "accept") {
                a["friendStatus"] = "friend";
              } else {
                a["friendStatus"] = status.status;
              }
            } else {
              a["friendStatus"] = "none";
            }
            resultCompany.push(a);
          }

          // secondnormal
          res.status(200).json({
            data: {
              result: false,
              message: null,
              userName: null,
              countConversation: 0,
              conversationId: 0,
              total: 0,
              currentTime: 0,
              listUserOnline: null,
              user_info: null,
              user_list: resultCompany,
            },
            error: null,
          });
        }
      }
    } else {
      res.status(200).json(createError(200, "Thông tin truyền không đầy đủ"));
    }
  } catch (e) {
    console.log(e);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

// export const setupBase = async (req,res,next) =>{
//   try{
//     let listUser = await User.find({},{userName:1});
//     for (let i=0;i<listUser.length;i++){
//       console.log(removeVietnameseTones(listUser[i].userName))
//       let update = await User.updateOne({_id:Number(listUser[i]._id)},{$set:{userNameNoVn:removeVietnameseTones(listUser[i].userName)}})
//       if(update){
//         console.log("update thành công")
//       }
//     }
//     res.json("update thành công")
//   }
//   catch(e){
//    console.log(e);
//    res.status(200).json(createError(200,"Đã có lỗi xảy ra"));
//   }
// }

// nhãn dán phân loại user
export const CreateClassUser = async (req, res, next) => {
  try {
    if (
      req.body &&
      req.body.NameClass &&
      req.body.IdOwner &&
      req.body.Color &&
      Number(req.body.IdOwner) &&
      req.body.listUserId &&
      String(req.body.listUserId).includes("[")
    ) {
      let listUserId = [];
      let dataReceived = req.body;
      // xử lý dữ liệu mảng truyền lên dạng form-data hoặc json.
      if (dataReceived.listUserId.includes("[")) {
        let StringListUserId = dataReceived.listUserId;
        StringListUserId = StringListUserId.replace("[", "");
        StringListUserId = StringListUserId.replace("]", "");
        let listUserIdString = StringListUserId.split(",");
        for (let i = 0; i < listUserIdString.length; i++) {
          if (Number(listUserIdString[i])) {
            listUserId.push(Number(listUserIdString[i]));
          }
        }
      } else if (
        dataReceived.listUserId.length &&
        dataReceived.listUserId.length > 0
      ) {
        for (let i = 0; i < dataReceived.listUserId.length; i++) {
          // đảm bảo các phần tử trong mảng userId đều là số
          if (Number(dataReceived.listUserId[i])) {
            listUserId.push(Number(dataReceived.listUserId[i]));
          }
        }
      } else {
        listUserId = [];
      }

      // kiểm tra xem user đã tạo nhãn dán này trc đo hay chưa
      UsersClassified.find({
        IdOwner: Number(dataReceived.IdOwner),
        NameClass: String(dataReceived.NameClass),
      }).then((UsersClassifieds) => {
        if (UsersClassifieds.length > 0) {
          return res.json({
            data: {
              result: false,
              classInfor: UsersClassifieds[0],
            },
            error: "Trước đó bạn đã tạo nhãn dán này",
          });
        } else {
          let newUsersClassified = new UsersClassified({
            NameClass: String(req.body.NameClass),
            IdOwner: Number(req.body.IdOwner),
            Color: String(req.body.Color),
            listUserId: listUserId,
          });
          newUsersClassified.save().then((UsersClassified) => {
            if (UsersClassified) {
              return res.status(200).json({
                data: {
                  result: true,
                  message: "Thêm dữ liệu thành công",
                  UsersClassified,
                },
                error: null,
              });
            } else {
              return res.status(200).json({
                data: null,
                error: "Thêm dữ liệu không thành công",
              });
            }
          });
        }
      });
    } else {
      res.status(200).json({
        data: null,
        error: "Thông tin truyền lên không đaayf đủ",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

// Thêm người vào loại sẵn có
// dùng promise gây chết server
export const InsertUserToClassUser = async (req, res, next) => {
  try {
    if (
      req.body &&
      req.body.IdClass &&
      String(req.body.IdClass) &&
      req.body.ArrayUserId &&
      String(req.body.ArrayUserId).includes("[")
    ) {
      let listUserId = [];
      let dataReceived = req.body;
      // xử lý dữ liệu mảng truyền lên dạng form-data hoặc json.
      if (dataReceived.ArrayUserId.includes("[")) {
        let StringListUserId = dataReceived.ArrayUserId;
        StringListUserId = StringListUserId.replace("[", "");
        StringListUserId = StringListUserId.replace("]", "");
        let listUserIdString = StringListUserId.split(",");
        for (let i = 0; i < listUserIdString.length; i++) {
          if (Number(listUserIdString[i])) {
            listUserId.push(Number(listUserIdString[i]));
          }
        }
      } else if (
        dataReceived.ArrayUserId.length &&
        dataReceived.ArrayUserId.length > 0
      ) {
        for (let i = 0; i < dataReceived.listUserId.length; i++) {
          // đảm bảo các phần tử trong mảng userId đều là số
          if (Number(dataReceived.ArrayUserId[i])) {
            listUserId.push(Number(dataReceived.ArrayUserId[i]));
          }
        }
      } else {
        listUserId = [];
      }
      // đảm bảo mảng unique

      const updatedUsersClassified1 = await UsersClassified.findByIdAndUpdate(
        String(dataReceived.IdClass),
        { $pull: { listUserId: { $in: listUserId } } },
        { new: true }
      );
      if (updatedUsersClassified1) {
        const updatedUsersClassified = await UsersClassified.findByIdAndUpdate(
          String(dataReceived.IdClass),
          { $push: { listUserId: { $each: listUserId } } },
          { new: true }
        );
        if (updatedUsersClassified) {
          res.status(200).json({
            data: {
              result: true,
              message: "Thêm dữ liệu thành công",
              updatedUsersClassified,
            },
            error: null,
          });
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

// xóa user khỏi nhãn dán
export const DeleteUserFromClassUser = async (req, res, next) => {
  try {
    if (
      req.body &&
      req.body.IdClass &&
      String(req.body.IdClass) &&
      req.body.ArrayUserId &&
      String(req.body.ArrayUserId).includes("[")
    ) {
      let listUserId = [];
      let dataReceived = req.body;
      // xử lý dữ liệu mảng truyền lên dạng form-data hoặc json.
      if (dataReceived.ArrayUserId.includes("[")) {
        let StringListUserId = dataReceived.ArrayUserId;
        StringListUserId = StringListUserId.replace("[", "");
        StringListUserId = StringListUserId.replace("]", "");
        let listUserIdString = StringListUserId.split(",");
        for (let i = 0; i < listUserIdString.length; i++) {
          if (Number(listUserIdString[i])) {
            listUserId.push(Number(listUserIdString[i]));
          }
        }
      } else if (
        dataReceived.ArrayUserId.length &&
        dataReceived.ArrayUserId.length > 0
      ) {
        for (let i = 0; i < dataReceived.listUserId.length; i++) {
          // đảm bảo các phần tử trong mảng userId đều là số
          if (Number(dataReceived.ArrayUserId[i])) {
            listUserId.push(Number(dataReceived.ArrayUserId[i]));
          }
        }
      } else {
        listUserId = [];
      }
      const updatedUsersClassified = await UsersClassified.findByIdAndUpdate(
        String(dataReceived.IdClass),
        { $pull: { listUserId: { $in: listUserId } } },
        { new: true }
      );
      if (updatedUsersClassified) {
        res.status(200).json({
          data: {
            result: true,
            message: "Xóa user khỏi nhóm nhãn dán thành công",
            updatedUsersClassified,
          },
          error: null,
        });
      } else {
        res.status(200).json({
          data: null,
          error: "upload failed",
        });
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

// lấy danh sách user thuộc 1 nhãn dán
export const GetListUserByClassUserAndUserOwner = async (req, res, next) => {
  try {
    if (req.body && req.body.IdClass) {
      let classUser = await UsersClassified.findOne({
        _id: String(req.body.IdClass),
      });
      if (classUser) {
        if (classUser._id) {
          let listUserId = classUser.listUserId;
          let arrayUserDetail = await User.find(
            { _id: { $in: listUserId } },
            { userName: 1, avatarUser: 1 }
          );
          let listUserDetailFinal = [];
          for (let i = 0; i < arrayUserDetail.length; i++) {
            let a = arrayUserDetail[i];
            if (a.avatarUser != "") {
              a[
                "avatarUser"
              ] = `https://mess.timviec365.vn/avatarUser/${arrayUserDetail[i]._id}/${arrayUserDetail[i].avatarUser}`;
            } else {
              let t = getRandomInt(1, 4);
              a[
                "avatarUser"
              ] = `https://mess.timviec365.vn/avatarUser/${arrayUserDetail[i].userName[0]}_${t}.png`;
            }
            listUserDetailFinal.push(a);
          }
          res.status(200).json({
            data: {
              result: true,
              message: "Lấy danh sách user thành công",
              listUserDetailFinal,
            },
            error: null,
          });
        } else {
          res
            .status(200)
            .json(createError(200, "Không tìm thấy loại nhãn dán phù hợp"));
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

// kiểm tra xem 1 user này thuộc class nào
export const CheckClassUser = async (req, res, next) => {
  try {
    if (
      req.body &&
      req.body.HostId &&
      req.body.UserIdCheck &&
      Number(req.body.HostId) &&
      Number(req.body.UserIdCheck)
    ) {
      let classUsers = await UsersClassified.find(
        {
          IdOwner: Number(req.body.HostId),
          listUserId: Number(req.body.UserIdCheck),
        },
        { NameClass: 1, Color: 1 }
      );
      res.status(200).json({
        data: {
          result: true,
          message: "Lấy danh sách user thành công",
          classUsers,
        },
        error: null,
      });
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

// lấy danh sách nhãn dán của 1 user
export const GetListClassOfOneUser = async (req, res, next) => {
  try {
    if (req.body && req.body.HostId && Number(req.body.HostId)) {
      let classUsers = await UsersClassified.find(
        { IdOwner: Number(req.body.HostId) },
        { NameClass: 1, Color: 1 }
      );
      res.status(200).json({
        data: {
          result: true,
          message: "Lấy danh sách user thành công",
          classUsers,
        },
        error: null,
      });
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

export const EditClassUserName = async (req, res, next) => {
  try {
    if (req.body && req.body.IdClass && req.body.content) {
      const updatedUsersClassified = await UsersClassified.findByIdAndUpdate(
        String(req.body.IdClass),
        { $set: { NameClass: req.body.content } },
        { new: true }
      );
      if (updatedUsersClassified) {
        res.status(200).json({
          data: {
            result: true,
            message: "Sửa tên nhãn dán thành công",
            updatedUsersClassified,
          },
          error: null,
        });
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

export const EditClassUserColor = async (req, res, next) => {
  try {
    if (req.body && req.body.IdClass && req.body.Color) {
      const updatedUsersClassified = await UsersClassified.findByIdAndUpdate(
        String(req.body.IdClass),
        { $set: { Color: req.body.Color } },
        { new: true }
      );
      if (updatedUsersClassified) {
        res.status(200).json({
          data: {
            result: true,
            message: "Sửa màu nhãn dán thành công",
            updatedUsersClassified,
          },
          error: null,
        });
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

// xác định 1 list user thuộc loại nhãn dán, thẻ nào
// nếu 1 user có nhiều nhãn dán => chỉ lấy 1 loại nhãn dán
export const VerifyClassArrayUser = async (req, res, next) => {
  try {
    if (
      req.body &&
      req.body.HostId &&
      req.body.ArrayUserId &&
      String(req.body.ArrayUserId).includes("[")
    ) {
      let info = [];
      if (!req.body.ArrayUserId.includes("[")) {
        info = req.body.ArrayUserId;
      } else {
        let string = String(req.body.ArrayUserId).replace("[", "");
        string = String(string).replace("]", "");
        let info1 = string.split(",");
        for (let i = 0; i < info1.length; i++) {
          if (Number(info1[i])) {
            info.push(info1[i]);
          }
        }
      }
      let ListClass = await UsersClassified.find({
        IdOwner: Number(req.body.HostId),
        listUserId: { $in: info },
      });
      let listUserFinal = [];
      for (let i = 0; i < info.length; i++) {
        if (ListClass.find((e) => e.listUserId.includes(info[i]))) {
          let a = {};
          a.userId = info[i];
          a.Color = ListClass.find((e) =>
            e.listUserId.includes(a.userId)
          ).Color;
          a.NameClass = ListClass.find((e) =>
            e.listUserId.includes(a.userId)
          ).NameClass;
          a.IdClass = ListClass.find((e) =>
            e.listUserId.includes(a.userId)
          )._id;
          listUserFinal.push(a);
        }
      }
      res.json(listUserFinal);
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

// xóa nhẫn dán
export const DeleteClassUser = async (req, res, next) => {
  try {
    if (req.body && req.body.IdClass) {
      const DeletedUsersClassified = await UsersClassified.deleteOne({
        _id: String(req.body.IdClass),
      });
      if (DeletedUsersClassified) {
        res.status(200).json({
          data: {
            result: true,
            message: "Xóa nhãn dán thành công",
          },
          error: null,
        });
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

export const UpdatePhoneNumber = async (req, res, next) => {
  try {
    if (
      req.body &&
      Number(req.body.UserId) &&
      req.body.Phone &&
      Number(req.body.Phone)
    ) {
      const UserUpdate = await User.findByIdAndUpdate(
        Number(req.body.UserId),
        { $set: { phone: String(req.body.Phone) } },
        { new: true }
      );
      if (UserUpdate) {
        res.json({
          data: {
            result: true,
            message: "Cập nhật thông tin người dùng thành công",
            user_info: {
              id: UserUpdate._id,
              phone: UserUpdate.phone,
            },
          },
          error: null,
        });
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

//Lay id chat 365
// lay id chat
export const GetIdChat365 = async (req, res) => {
  try {
    const email = req.body.Email;
    const id365 = req.body.ID365;
    const type365 = req.body.Type365;
    const user = await User.findOne({
      email: email,
      id365: id365,
      type365: type365,
    }).select({ _id: 1 });
    const data = {
      result: true,
      message: user._id,
      error: null,
    };
    if (!user) return res.send(createError(200, "Tài khoản không tồn tại"));
    return res.send(data);
  } catch (err) {
    if (err) return res.send(createError(200, err.message));
  }
};

// Hải api
export const GetInfoUser = async (req, res) => {
  try {
    const ID = req.body._id
    const user_info = await User.findById({_id:ID});
    
    let t = getRandomInt(1, 4);
    if (user_info) {
      if (user_info.avatarUser) {
        user_info.avatarUser = `https://mess.timviec365.vn/avatarUser/${user_info.id}/${user_info.avatarUser}`;
      } else {
        user_info.avatarUser = `https://mess.timviec365.vn/avatar/${user_info.userName[0]}_${t}.png`;
      }
    }
    res.json({
      result: user_info,
    });
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

export const GetListContact = async (req, res) => {
  try {
    const userId = req.body.userId;
    console.log(userId);
    let listIdFriendOut = [];
    
    let listFriendOut = await Contact.find( {$or: [
        { userFist: userId },
        { userSecond: userId }
      ]});
    console.log(listFriendOut)
    
    if (listFriendOut) {
      for (let i = 0; i < listFriendOut.length; i++) {
        listIdFriendOut.push(listFriendOut[i].userFist);
        listIdFriendOut.push(listFriendOut[i].userSecond);
      }
    }
    listIdFriendOut = listIdFriendOut.filter((e) => e != userId);
    let FriendOut = await User.find({ _id: { $in: listIdFriendOut } }).limit(
      100
    );
    const obj = JSON.parse(FriendOut.length);
    if (FriendOut) {
      let listUser = [];
      let t = getRandomInt(1, 4);
      for (let i = 0; i < FriendOut.length; i++) {
        if (FriendOut[i].avatarUser == "") {
          let a = {};
          a._id = FriendOut[i]._id;
          a.userName = FriendOut[i].userName;
          a.avatarUser = `https://mess.timviec365.vn/avatar/${FriendOut[i].userName[0]}_${t}.png`;
          listUser.push(a);
        } else {
          let a = {};
          a._id = FriendOut[i]._id;
          a.userName = FriendOut[i].userName;
          a.avatarUser = `https://mess.timviec365.vn/avatar/${FriendOut[i]._id}/${FriendOut[i].avatarUser}`;
          listUser.push(a);
        }
      }
      res.json({
        count: obj,
        data: {
          FriendOut,
        },
        avatarUser: listUser,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};
export const GetListContactPrivate = async (req, res) => {
  try {
    const typeUser = Number(req.body.Type365);
    let userId = Number(req.body.ID);
    let listIdFriend = [];
    let listFriend = await Contact.find({
      $or: [{ userFist: userId }, { userSecond: userId }],
    });
    if (listFriend) {
      for (let i = 0; i < listFriend.length; i++) {
        listIdFriend.push(listFriend[i].userFist);
        listIdFriend.push(listFriend[i].userSecond);
      }
    }
    listIdFriend = listIdFriend.filter((e) => e != userId);
    let Friend = await User.find({
      _id: { $in: listIdFriend },
      type365: typeUser,
    });
    const obj = JSON.parse(Friend.length);
    if (Friend) {
      let listUser = [];
      let t = getRandomInt(1, 4);
      for (let i = 0; i < Friend.length; i++) {
        if (Friend[i].avatarUser == "") {
          let a = {};
          a._id = Friend[i]._id;
          a.userName = Friend[i].userName;
          a.avatarUser = `https://mess.timviec365.vn/avatar/${Friend[i].userName[0]}_${t}.png`;
          listUser.push(a);
        } else {
          let a = {};
          a._id = Friend[i]._id;
          a.userName = Friend[i].userName;
          a.avatarUser = `https://mess.timviec365.vn/avatar/${Friend[i]._id}/${Friend[i].avatarUser}`;
          listUser.push(a);
        }
      }
      res.json({
        count: obj,
        data: {
          Friend,
        },
        avatarUser: listUser,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};
export const GetContactCompany = async (req, res) => {
  try {
    const idCom = Number(req.body.CompanyId);
    let userId = Number(req.body.ID);
    let listIdFriendCom = [];
    let listFriendCom = await Contact.find({
      $or: [{ userFist: userId }, { userSecond: userId }],
    });

    if (listFriendCom) {
      for (let i = 0; i < listFriendCom.length; i++) {
        listIdFriendCom.push(listFriendCom[i].userFist);
        listIdFriendCom.push(listFriendCom[i].userSecond);
      }
    }
    listIdFriendCom = listIdFriendCom.filter((e) => e != userId);
    let FriendCom = await User.find({
      _id: { $in: listIdFriendCom },
      companyId: idCom,
    });
    const obj = JSON.parse(FriendCom.length);
    if (FriendCom) {
      let listUser = [];
      let t = getRandomInt(1, 4);
      for (let i = 0; i < FriendCom.length; i++) {
        if (FriendCom[i].avatarUser == "") {
          let a = {};
          a._id = FriendCom[i]._id;
          a.userName = FriendCom[i].userName;
          a.avatarUser = `https://mess.timviec365.vn/avatar/${FriendCom[i].userName[0]}_${t}.png`;
          listUser.push(a);
        } else {
          let a = {};
          a._id = FriendCom[i]._id;
          a.userName = FriendCom[i].userName;
          a.avatarUser = `https://mess.timviec365.vn/avatar/${FriendCom[i]._id}/${FriendCom[i].avatarUser}`;
          listUser.push(a);
        }
      }
      res.json({
        count: obj,
        data: {
          FriendCom,
        },
        avatarUser: listUser,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};
export const GetListOfferContactByPhone = async (req, res) => {
  try {
    const idCom = Number(req.body.CompanyId);
    const Phone = req.body.phone;
    let userId = Number(req.body.ID);
    let listIdFriend = [];
    let listFriend = await Contact.find({
      $or: [{ userFist: userId }, { userSecond: userId }],
    });

    if (listFriend) {
      for (let i = 0; i < listFriend.length; i++) {
        listIdFriend.push(listFriend[i].userFist);
        listIdFriend.push(listFriend[i].userSecond);
      }
    }
    listIdFriend = listIdFriend.filter((e) => e != userId);
    let Friend = await User.find({
      _id: { $in: listIdFriend }, 
      companyId: idCom,
      phone: Phone,
    });
    const obj = JSON.parse(Friend.length);
    if (Friend) {
      let listUser = [];
      let t = getRandomInt(1, 4);
      for (let i = 0; i < Friend.length; i++) {
        if (Friend[i].avatarUser == "") {
          let a = {};
          a._id = Friend[i]._id;
          a.userName = Friend[i].userName;
          a.avatarUser = `https://mess.timviec365.vn/avatar/${Friend[i].userName[0]}_${t}.png`;
          listUser.push(a);
        } else {
          let a = {};
          a._id = Friend[i]._id;
          a.userName = Friend[i].userName;
          a.avatarUser = `https://mess.timviec365.vn/avatar/${Friend[i]._id}/${Friend[i].avatarUser}`;
          listUser.push(a);
        }
      }
      res.json({
        count: obj,
        data: {
          Friend,
        },
        avatarUser: listUser,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};
export const GetAllUserOnline = async (req, res) => {
  try {
    let userId = Number(req.body.ID);
    let listIdFriend = [];
    let listFriend = await Contact.find({
      $or: [{ userFist: userId }, { userSecond: userId }],
    });
    if (listFriend) {
      for (let i = 0; i < listFriend.length; i++) {
        listIdFriend.push(listFriend[i].userFist);
        listIdFriend.push(listFriend[i].userSecond);
      }
    }
    listIdFriend = listIdFriend.filter((e) => e != userId);
    const user_onl = await User.find({
      _id: { $in: listIdFriend },
      isOnline: "1",
    });
    let listUser = [];
    let t = getRandomInt(1, 4);
    if (user_onl) {
      let a = {};
      for (let i = 0; i < user_onl.length; i++) {
        if (user_onl[i].avatarUser == "") {
          a._id = user_onl[i]._id;
          a.userName = user_onl[i].userName;
          a.avatarUser = `https://mess.timviec365.vn/avatar/${user_onl[i].userName[0]}_${t}.png`;
          listUser.push(a);
        } else {
          a._id = user_onl[i]._id;
          a.userName = user_onl[i].userName;
          a.avatarUser = `https://mess.timviec365.vn/avatar/${user_onl[i]._id}/${user_onl[i].avatarUser}`;
          listUser.push(a);
        }
      }
      res.json({
        data: {
          user_onl,
        },
        avatarUser: listUser,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

export const CheckContact = async (req, res) => {
  try {
    let userId = Number(req.body.ID);
    let ContactId = Number(req.body.ContactId);
    let listIdFriend = [];
    let listFriend = await Contact.find({
      $or: [{ userFist: userId }, { userSecond: userId }],
    });
    if (listFriend) {
      for (let i = 0; i < listFriend.length; i++) {
        listIdFriend.push(listFriend[i].userFist);
        listIdFriend.push(listFriend[i].userSecond);
      }
    }
    listIdFriend = listIdFriend.filter((e) => e != userId);
    // let Friend = await User.find({_id : {$in: listIdFriend }})
    const check = listIdFriend.includes(ContactId);
    if (check == true) {
      res.status(200).json({
        Message: "Là bạn",
      });
    } else {
      res.status(200).json({
        Message: "Không là bạn",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};
export const ChangeActive = async (req, res) => {
  try {
    const ID = req.body.ID;
    const Active = req.body.Active;
    let Activech = await User.updateOne({ _id: ID }, { active: Active });
    if (Activech.modifiedCount != 0) {
      if (Activech) {
        res.status(200).json({
          Message: `Cập nhật active thành ${Active}`,
        });
      }
    } else {
      res.status(200).json({
        Message: "Trùng dữ liệu đã có",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};
// export const ForgetPassword = async (req, res) => {
//   const email = req.body.Email
//   const type365 = req.body.Type365
//   const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
//   try{
//     if(email != "" && type365 != ""){
//       if(type365 == 0){
//         // By gmail
//         if (email.includes("@") == true){
//           var transporter = NodeMailer.createTransport({
//             service: 'Gmail',
//             auth: {
//               user: process.env.EMAILNAME,
//               pass: process.env.PASS
//             }
//           });
//           var mailOptions = {
//             from: process.env.EMAILNAME,
//             to: email,
//             subject: 'Confirm forget password AppChat Timviec365',
//             text: `Chúng tôi nhận được yêu cầu quên mật khẩu của bạn vui lòng nhập mã xác nhận để hoàn thành thiết lập, mã code xác nhận của bạn là: \n ${otp}`
//           };
//           transporter.sendMail(mailOptions, function(error, info){
//             if (error) {
//               console.log(error);
//             } else {
//               console.log('Email sent: ' + info.response);
//               res.json({
//                 "Message" : "Đã gửi mã xác nhận OTP"
//               });
//             }
//           });
//         }else{
//           // By phone
//         }
//       }else{
//           // Nhân viên với công ty
//       }
//     }else{
//         res.json({
//           "Message" : "Chưa nhập Email hoặc type"
//         })
//     }
//   }catch(err){
//       res.json({"Message": "Có lỗi xảy ra"})
//   }

// }
export const Logout = async (req, res) => {
  try {
  const ID = req.body.ID;
  const isonline = req.body.isonline;
  const check = await User.find({ _id: ID, isOnline: { $eq: isonline } });
  if (check.length === 1 ) {
  res.json({
  "Message": "Không thể đổi"
  })
  } else {
  const offline = await User.updateOne({ _id: ID }, { isOnline: isonline });
  if (offline) {
  res.json({ "Message": `Đã đổi thành ${isonline}` });
  }
  }
  } catch (err) {
  console.log(err);
  res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
  
  }
export const RegisterSuccess = async (req, res) => {
  try {
    const UserName = req.body.UserName;
    const Email = req.body.Email;
    const Password = req.body.Password;
    const check = await User.find({ email: Email });
    const findUser = await User.find({ userName: UserName, email: Email });
    const trungEmail = JSON.parse(check.length);
    console.log(trungEmail);
    if (trungEmail === 1) res.json({ Message: "Email đã tồn tại" });
    if (findUser) res.json({ Message: "DK thành công" });
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};


export const updateBirthday = async (req, res, next) => {
  try{
      const formData = { ...req.body }

      const updatebirthday = await Birthday.updateOne({ UserId: Number(req.body.UserId)}, 
                                                       {$set: { Dob:String(formData.Dob) }}, 
                                                       {upsert: true})
      if (updatebirthday){
          res.json({
              data:{
                  result: updatebirthday,
                  message: "Update Sinh Nhật Thành công"
              },
              error: null
          })
      }
      else{
          res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
      }
  } catch (err) {
      console.log(err);
      res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
}
  
export const GetAcceptMessStranger = async (req,res, next) =>{
  try{
    if(req.body && req.body.ID){
      let user = await User.findOne({
        _id: Number(req.body.ID)
      })
      
      if(user){
        if(user.acceptMessStranger === 1){
          res.json({
            data:{
              result: true,
              message: "Tài khoản có chặn người lạ"
          },
          error: null
          })
        }
        else res.json("Tài khoản không tồn tại hoặc đang tắt chức năng nhận tin nhắn từ người lạ")
      }
    }else{
      res.status(200).json(createError(200, "thông tin tuyền lên không đúng"))
    }
  }
  catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
}
}

export const UpdateAcceptMessStranger = async (req,res, next) =>{
  try{
    if(req.body && req.body.ID){

      let find = await User.findOne({_id: req.body.ID},{acceptMessStranger:1})
      if(find.acceptMessStranger === 1){
        let user = await User.findOneAndUpdate({
          _id: req.body.ID}, 
          {$set:{acceptMessStranger: 0}}, {new : true}
        )
        if(user){
            res.json({
              data:{
                result: true,
                message: "Thay đổi cài đặt chặn người lạ thành công"
            },
            error: null
            })
        }
      }
      else if(find.acceptMessStranger === 0){
        let user = await User.findOneAndUpdate({
          _id: req.body.ID}, 
          {$set:{acceptMessStranger: 1}}, {new :true}
        )
        if(user){
            res.json({
              data:{
                result: true,
                message: "Thay đổi cài đặt chặn người lạ thành công"
            },
            error: null
            })
        }
      }
    }else{
      res.status(200).json(createError(200, "thông tin tuyền lên không đúng"))
    }
  }
  catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
}
}

export const ChangeUserName = async (req, res) => {
  try {
    if(req && req.body && Number(req.body.ID) && String(req.body.UserName)){
      
      const find = await User.findOne({_id: req.body.ID} )
      if(find && find.userName !== req.body.UserName){
        const update = await User.findOneAndUpdate({_id: req.body.ID},{userName: req.body.UserName} )
        if(update){
          res.json({
            data:{
              result: true,
              message: "Thay đổi Tên thành công"
          },
          error: null
          })
        }
      }else res.status(200).json(createError(200, "Trùng tên"));
    }else  res.status(200).json(createError(200, "Thông tin truyền lên có vấn đề"));
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

export const GetListSuggesContact = async (req, res) => {
  try {
    if(req && req.body && req.body.ID && req.body.CompanyID ){

      const ID = req.body.ID;
      const CompanyID = req.body.CompanyID

      let conversation = await Conversation.find({"memberList.memberId":ID, },{"memberList.memberId":1}).limit(10)
      const ListUser1 =[];
      const ListUser2 =[];
      
      if(conversation){
        for(let i= 0; i < conversation.length; i++) {
          if(conversation[i] && conversation[i].memberList && conversation[i].memberList.length && (conversation[i].memberList.length >0)){
            for(let j= 0; j < conversation[i].memberList.length; j++){
              if( (ListUser1.length < 10) && (!isNaN(conversation[i].memberList[j].memberId)) && (conversation[i].memberList[j].memberId !=ID)  &&  (!ListUser1.includes(conversation[i].memberList[j].memberId)) ){
                ListUser1.push(conversation[i].memberList[j].memberId);
                if(ListUser1.length == 10){
                  break
                }
              }
            }
          }
        }
      };

      const findUser = await User.findOne({_id:ID},{removeSugges:1})

      const find = await Conversation.find({"memberList.memberId":{$in: ListUser1},isGroup:0},{"memberList.memberId":1}).limit(100)
      if(find){
        for(let i=0; i< find.length; i++){
          if(find[i] && find[i].memberList && find[i].memberList.length && find[i].memberList.length > 0){
            for(let j=0; j< find[i].memberList.length; j++){
              if( (ListUser2.length < 100) && (!isNaN(find[i].memberList[j].memberId)) && (find[i].memberList[j].memberId !=ID)  
              &&  (!ListUser2.includes(find[i].memberList[j].memberId)) && !findUser.removeSugges.includes(find[i].memberList[j].memberId)  ){
                ListUser2.push(find[i].memberList[j].memberId);
                if(ListUser2.length == 100){
                  break
                }
              }
          }
        }
      }
    }
    console.log(ListUser2)
      
      const result = await User.find({_id:{$in: ListUser2}, companyId: CompanyID})
      if(result){
        res.json({
          data: {
            result: result,
            message: "Gợi ý kết bạn thành công",
          },
          error: null,
        });
      }
      
    }else res.status(200).json(createError(200, "Thông tin truyền lên không đúng"));
  } catch (err) {
    console.log(err);``
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

export const RemoveSugges  = async (req, res) => {
  try {
    if(req && req.body && Number(req.body.userId) && Number(req.body.contactId)){

        const update = await User.findOneAndUpdate({_id: req.body.userId},{$push:{removeSugges: req.body.contactId}},{new: true})
        if(update){
          res.json({
            data:{
              result: true,
              message: "Xóa gợi ý kết bạn thành công"
          },
          error: null
          })
        }
      
    }else  res.status(200).json(createError(200, "Thông tin truyền lên có vấn đề"));
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

export const NewAccountFromQLC  = async (req, res) => {
  try {
    let list = [1,2]
    const find = await User.find({type365: list},{email: 1,type365: 1})
    
    for(let i = 0; i < find.length; i++) {
      let response = await axios.post('https://chamcong.24hpay.vn/api_chat365/check_email_exits2.php',  qs.stringify({
          'email':`${String(find[i].email)}`,
          'os':'os',
          'from':'chat365',
          'type':`${Number(find[i].type365)}` 
        }));
        
        if(response && response.data && response.data.data && (!isNaN(response.data.data.id)) ){
          const update = await User.updateOne({email: String(find[i].email)},{id365: Number(response.data.data.id)})
        
        }
    }  
        if(find){
          res.json({
            data:{
              result: true,
              message: "Thành công"
          },
          error: null
          })

        }else res.status(200).json(createError(200, "looix"));
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

export const AccountFrom_TimViec365  = async (req, res) => {
  try {
    if(req && req.body && req.body.Email && req.body.Password && req.body.UserName ){
      if(req.body.ID){
        const user = await User.findOne({email: req.body.Email, password: req.body.Password, userName: req.body.UserName, _id: req.body.ID})
        if(user){
          res.status(200).json(createError(200, "Đã có tài khoản hoặc trùng điều kiện truyền vào"));
        }

        else {
          const insert = new User({
            _id: req.body.ID,
            email: req.body.Email,
            password: req.body.Password,
            userName: req.body.UserName,
            NotificationCalendar:  1,
            NotificationPayoff : 1,
            NotificationReport : 1,
            NotificationOffer : 1,
            NotificationPersonnelChange : 1,
            NotificationRewardDiscipline : 1,
            NotificationNewPersonnel : 1,
            NotificationChangeProfile : 1,
            NotificationTransferAsset : 1,
            acceptMessStranger : 1,
            notificationAcceptOffer: 1,
            notificationAllocationRecall: 1,
            notificationChangeSalary:1,
            NotificationCommentFromTimViec : 1,
            NotificationCommentFromRaoNhanh : 1,
            NotificationTag : 1,
            NotificationSendCandidate : 1,
            notificationMissMessage:1,
            NotificationDecilineOffer : 1,
            NotificationNTDPoint : 1,
            NotificationNTDExpiredPin : 1,
            NotificationNTDExpiredRecruit: 1,
            fromWeb: "timviec365"
        })
        if(insert){
          const saved = await insert.save()
          if(saved){
            res.json({
              data:{
                result: saved,
                message: "Thành công"
            },
            error: null
            })
          }
        }
        
      } 
      }
      if(req.body.ID365){
        const user = await User.findOne({email: req.body.Email, password: req.body.Password, userName: req.body.UserName, id365: req.body.ID365})
        const userId = await User.find({},{_id:1}).sort({_id:-1}).limit(1)
        if(user){
          res.status(200).json(createError(200, "Đã có tài khoản hoặc trùng điều kiện truyền vào"));
        }

        else {
          const insert = new User({
            _id: userId[0]._id +1,
            id365: req.body.ID365,
            email: req.body.Email,
            password: req.body.Password,
            userName: req.body.UserName,
            NotificationCalendar:  1,
            NotificationPayoff : 1,
            NotificationReport : 1,
            NotificationOffer : 1,
            NotificationPersonnelChange : 1,
            NotificationRewardDiscipline : 1,
            NotificationNewPersonnel : 1,
            NotificationChangeProfile : 1,
            NotificationTransferAsset : 1,
            acceptMessStranger : 1,
            notificationAcceptOffer: 1,
            notificationAllocationRecall: 1,
            notificationChangeSalary:1,
            NotificationCommentFromTimViec : 1,
            NotificationCommentFromRaoNhanh : 1,
            NotificationTag : 1,
            NotificationSendCandidate : 1,
            notificationMissMessage:1,
            NotificationDecilineOffer : 1,
            NotificationNTDPoint : 1,
            NotificationNTDExpiredPin : 1,
            NotificationNTDExpiredRecruit: 1,
            fromWeb: "timviec365"
        })
        if(insert){
          const saved = await insert.save()
          if(saved){
            res.json({
              data:{
                result: saved,
                message: "Thành công"
            },
            error: null
            })
          }
        }
      } 
      }
      
    }
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};

export const UpdateInfomation365 = async (req, res) => {
  try {
    if(req && req.body && req.body.ID365 && req.body.Type365 && req.body.Email && req.body.Password && req.body.UserName && req.body.form && req.body.AvatarUser){

      const user1 = await User.findOne({email: req.body.Email, type365: req.body.Type365, id365: req.body.ID365})
      if(!user1){
        const user2 = await User.findOne({email: req.body.Email, type365: 0, id365: req.body.ID365})
        if(!user2){
          res.status(200).json(createError(200, "tài khoản không tồn tại"))
        }else if(req.body.form === "qlc365"){
          // if (!fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${user2._id}`)) {
          //   fs.mkdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${user2._id}`);
          // }
          if (!fs.existsSync(`public/avatarUser/${user2._id}`)) {
            fs.mkdirSync(`public/avatarUser/${user2._id}`);
          }
          const avatarUser = `${Date.now() * 10000 + 621355968000000000}_${user1._id}.jpg`
            // fs.writeFileSync(`C:/Chat365/publish/wwwroot/avatarUser/${user2._id}/${avatarUser}`, req.body.AvatarUser)
            fs.writeFileSync(`public/avatarUser/${user2._id}/${avatarUser}`, req.body.AvatarUser)
            const link = `https://mess.timviec365.vn/avatarUser/${user2._id}/${avatarUser}`
          const update = await User.updateOne({email: req.body.Email, type365: 0, id365: req.body.ID365},
                                              {userName:req.body.UserName, password:req.body.Password, avatarUser: avatarUser})
              
          let response1 = await axios.post('https://chamcong.24hpay.vn/api_chat365/update_user_info.php',  qs.stringify({
            'email':`${String(req.body.email)}`,
            'userName':`${String(req.body.UserName)}`,
            'type':0
          }));

          let response2 = await axios.post('https://chamcong.24hpay.vn/api_chat365/forget_pass.php',  qs.stringify({
            'email':`${String(req.body.email)}`,
            'new_pass':`${String(req.body.Password)}`,
            'type':0
          }));

          let response3 = axios.post('https://chamcong.24hpay.vn/api_chat365/update_avatar.php', qs.stringify({
            'email': `${String(req.body.email)}`,
            'link': link,
            'type': 0  
          }));

          if(update && response1 && response2 && response3){
            res.json({
              data:{
                result: true,
                message: "Thành công"
            },
            error: null
            })
          }
        }
      }
      else if(req.body.form === "qlc365"){
        // if (!fs.existsSync(`C:/Chat365/publish/wwwroot/avatarUser/${user1._id}`)) {
        //   fs.mkdirSync(`C:/Chat365/publish/wwwroot/avatarUser/${user1._id}`);
        // }
        if (!fs.existsSync(`public/avatarUser/${user1._id}`)) {
          fs.mkdirSync(`public/avatarUser/${user1._id}`);
        }
        const avatarUser = `${Date.now() * 10000 + 621355968000000000}_${user1._id}.jpg`
          // fs.writeFileSync(`C:/Chat365/publish/wwwroot/avatarUser/${user1._id}/${avatarUser}`, req.body.AvatarUser)
          fs.writeFileSync(`public/avatarUser/${user1._id}/${avatarUser}`, req.body.AvatarUser)
          const link = `https://mess.timviec365.vn/avatarUser/${user1._id}/${avatarUser}`
        const update = await User.updateOne({email: req.body.Email, type365: req.body.Type365, id365: req.body.ID365},
                                            {userName:req.body.UserName, avatarUser: avatarUser})
        let response1 = await axios.post('https://chamcong.24hpay.vn/api_chat365/update_user_info.php',  qs.stringify({
          'email':`${String(req.body.email)}`,
          'userName':`${String(req.body.UserName)}`,
          'type':`${Number(req.body.type365)}` 
        }));

        let response2 = await axios.post('https://chamcong.24hpay.vn/api_chat365/forget_pass.php',  qs.stringify({
            'email':`${String(req.body.email)}`,
            'new_pass':`${String(req.body.Password)}`,
            'type':`${Number(req.body.type365)}`
          }));

          let response3 = axios.post('https://chamcong.24hpay.vn/api_chat365/update_avatar.php', qs.stringify({
            'email': `${String(req.body.email)}`,
            'link': link,
            'type': 0  
          }));

          if(update && response1 && response2 && response3){
            res.json({
              data:{
                result: true,
                message: "Thành công"
            },
            error: null
            })
          }
      }
        
    }else  res.status(200).json(createError(200, "Thông tin truyền lên có vấn đề"));
  } catch (err) {
    console.log(err);
    res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
  }
};




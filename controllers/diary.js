import Diary from "../models/Diary.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import { createError } from "../utils/error.js";
import io from 'socket.io-client';
// let socket = io('http://localhost:3030');
const socket = io.connect('wss://socket.timviec365.vn', {
  secure: true,
  enabledTransports: ["wss"],
  transports: ['websocket', 'polling'],
});
import multer from 'multer';
import path from 'path'
import fs from 'fs'


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(`public/diaryUpload`)) {
            fs.mkdirSync(`public/diaryUpload`);
        }
        if (!fs.existsSync(`public/diaryUpload/${req.body.conversationId}`)) {
            fs.mkdirSync(`public/diaryUpload/${req.body.conversationId}`);
        }
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png' || file.mimetype === 'video/mp4' || file.mimetype === 'video/avi' || file.mimetype === 'video/mpeg') {
            cb(null, `public/diaryUpload/${req.body.conversationId}`)
        }
        else {
            cb(new Error('not image'), false)
        }
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${req.body.conversationId}_${req.body.userSender}${path.extname(file.originalname)}`);
    }
});

export const upload = multer({
    storage: storage,
})

export const createPostDiary = async (req, res, next) => {
    try {
        if (req.body.content || req.files.length > 0) {
            const formData = { ...req.body }
            // Thêm ảnh vào dữ liệu
            let files = [];
            if (req.files) {
                for (let i = 0; i < req.files.length; i++) {
                    files.push({
                        pathFile: req.files[i].filename,
                        sizeFile: req.files[i].size,
                    })
                }
            }
            formData.fileList = files

            formData.createAt = Date.now()
            const user = await User.findOne({ _id: Number(formData.userSender) }, { userName: 1, avatarUser: 1 });
            formData.avatarUserSender = user.avatarUser
            formData.userNameSender = user.userName

            const diary = new Diary(formData);
            const saveddiary = await diary.save()
            if (saveddiary) {
                saveddiary._doc.totalEmotion = saveddiary.emotion.split('/').length - 1 
                for (let i = 0; i < saveddiary.fileList.length; i++) {
                    saveddiary.fileList[i].pathFile = `http://43.239.223.142:9000/diaryUpload/${saveddiary.conversationId}/${saveddiary.fileList[i].pathFile}`
                }
                let conv = await Conversation.findOne({ _id: Number(req.body.conversationId) }, { memberList: 1 });
                let listUserId = [];
                if (conv) {
                    for (let i = 0; i < conv.memberList.length; i++) {
                        listUserId.push(conv.memberList[i].memberId);
                        console.log(conv.memberList[i].memberId)
                    }
                }
                const message = `${saveddiary.userNameSender} đã vừa đăng 1 bài viết`
                socket.emit("post", saveddiary, message, listUserId);
                res.json({
                    data: {
                        result: saveddiary,
                        message: 'Success'
                    },
                    error: null
                })
            }
        }
        else {
            res.status(200).json(createError(200, "Chưa nhập dữ liệu"));
        }

    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const getAllPostDiary = async (req, res, next) => {
    try {
        if (req && req.params && req.params.conversationId) {
            const conversationId = req.params.conversationId
            const diary = await Diary.find({ conversationId: conversationId }).sort({ createAt: 'desc' })
            if (diary) {
                if (diary.length > 0) {
                    for (let i = 0; i < diary.length; i++) {
                        diary[i]._doc.totalEmotion = diary[i].emotion.split('/').length - 1 
                        if (diary[i].avatarUserSender !== '') {
                            diary[i].avatarUserSender = `https://mess.timviec365.vn/avatarUser/${diary[i].userSenderId}/${diary[i].avatarUserSender}`
                        }
                        else {
                            diary[i].avatarUserSender = `https://mess.timviec365.vn/avatar/${diary[i].userNameSender[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                        }
                        for (let j = 0; j < diary[i].fileList.length; j++) {
                            diary[i].fileList[j].pathFile = `http://43.239.223.142:9000/diaryUpload/${diary[i].conversationId}/${diary[i].fileList[j].pathFile}`
                        }
                    }
                    res.status(200).json({
                        data: {
                            result: diary,
                            message: "Lấy thông tin thành công",
                        },
                        error: null
                    });
                }
                else {
                    res.status(200).json({
                        data: {
                            result: null,
                            message: "Lấy thông tin thành công",
                        },
                        error: null
                    });
                }
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }

    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const getPostDiary = async (req, res, next) => {
    try {
        if (req && req.params && req.params._id) {
            const postId = req.params._id
            const postDiary = await Diary.findOne({ _id: postId })

            if (postDiary) {
                if (postDiary) {
                    postDiary._doc.totalEmotion = postDiary.emotion.split('/').length - 1 
                    if (postDiary.avatarUserSender !== '') {
                        postDiary.avatarUserSender = `https://mess.timviec365.vn/avatarUser/${postDiary.userSenderId}/${postDiary.avatarUserSender}`
                    }
                    else {
                        postDiary.avatarUserSender = `https://mess.timviec365.vn/avatar/${postDiary.userNameSender[0]}_${Math.floor(Math.random() * 4) + 1}.png`
                    }
                    for (let i = 0; i < postDiary.fileList.length; i++) {
                        postDiary.fileList[i].pathFile = `http://43.239.223.142:9000/diaryUpload/${postDiary.conversationId}/${postDiary.fileList[i].pathFile}`
                    }
                    res.status(200).json({
                        data: {
                            result: postDiary,
                            message: "Lấy thông tin thành công",
                        },
                        error: null
                    });
                }
                else {
                    res.status(200).json({
                        data: {
                            result: null,
                            message: "Lấy thông tin thành công",
                        },
                        error: null
                    });
                }
            }
        }
        else {
            res.status(200).json(createError(200, "Chưa truyền đủ dữ liệu"));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const editPostDiary = async (req, res, next) => {
    try {
        const id = req.params.id;
        const content = req.body.content;
        // Thêm ảnh vào dữ liệu
        let files = new Array();
        if (req.files) {
            for (let i = 0; i < req.files.length; i++) {
                files.push({
                    pathFile: req.files[i].filename,
                    sizeFile: req.files[i].size,
                })
            }

        }
        const diary = await Diary.findOneAndUpdate({ _id: id }, { content: content, createAt: Date.now(), fileList: files }, { new: true })
        if (diary) {
            diary._doc.totalEmotion = diary.emotion.split('/').length - 1 
            for (let i = 0; i < saveddiary.fileList.length; i++) {
                diary.fileList[i].pathFile = `http://43.239.223.142:9000/diaryUpload/${diary.conversationId}/${diary.fileList[i].pathFile}`
            }
            let conv = await Conversation.findOne({ _id: Number(diary.conversationId) }, { memberList: 1 });
            let listUserId = [];
            if (conv) {
                for (let i = 0; i < conv.memberList.length; i++) {
                    listUserId.push(conv.memberList[i].memberId);
                    console.log(conv.memberList[i].memberId)
                }
            }
            const message = `${diary.userNameSender} vừa sửa 1 bài viết`
            socket.emit("post", diary, message, listUserId);
            res.json({
                data: {
                    result: diary,
                    message: 'Success'
                },
                error: null
            })
        }
        else {
            res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const deletePostDiary = async (req, res, next) => {
    try {
        if (req && req.params && req.params.id) {
            const idPost = req.params.id;
            const userSender = req.body.userSender
            const result = await Diary.findOneAndDelete({ _id: idPost })
            if (result) {
                if (result.length > 0) {
                    res.status(200).json({ "message": "Success" });
                }
                else {
                    res.status(200).json(createError(200, "Id không chính xác"))
                }
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

export const releaseEmotion = async (req, res, next) => {
    try {
        if (req && req.body) {
            const data = {}
            let totalEmotion, message
            data.userSendId = req.body.userSendId
            data.postId = req.body._id

            const postDiary = await Diary.findOne({ _id: data.postId })

            const currentTotalEmotion = postDiary.totalEmotions ? postDiary.emotion.split('/').length - 1 : 0

            if (postDiary.emotion) {
                if (postDiary.emotion.split('/').includes(data.userSendId)) {  //Xóa lượt thích
                    postDiary.emotion = postDiary.emotion.replace(`${data.userSendId}/`, '')
                }
                else {
                    postDiary.emotion = `${postDiary.emotion}${data.userSendId}/` //Thêm lượt thích
                }
            }
            else {
                postDiary.emotion = `${data.userSendId}/`  //Thêm lượt thích
            }

            if (postDiary.emotion) {
                totalEmotion = postDiary.emotion.split('/').length - 1
            }
            else {
                totalEmotion = 0
            }
            const diary = await Diary.findOneAndUpdate({ _id: data.postId }, { emotion: postDiary.emotion }, { new: true })
            if (diary) {
                const user = await User.findOne({ _id: Number(data.userSendId) }, { userName: 1, avatarUser: 1 });
                if (currentTotalEmotion < totalEmotion) {
                    message = `${user.userName} đã thích 1 bài viết của bạn`
                }

                const result = { ...diary }
                result._doc.totalEmotion = totalEmotion
                socket.emit("releasePost", result._doc, message, user, diary.userSender)
                res.status(200).json({
                    data: {
                        result: result._doc,
                        message: "Success",
                    },
                    error: null
                });
            }
            else {
                res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
            }
        }
        else {
            res.status(200).json(createError(200, "Thông tin truyền lên không đầy đủ"));
        }
    } catch (err) {
        console.log(err);
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"));
    }
}

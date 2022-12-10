import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import fs from 'fs'
import multer from 'multer';
import path from 'path'
import axios from 'axios'
import qs from 'qs'
import sharp from 'sharp'
import { createError } from "../utils/error.js";

//upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(`public/uploads`)) {
            fs.mkdirSync(`public/uploads`);
        }
        if (!fs.existsSync(`public/uploadsImageSmall`)) {
            fs.mkdirSync(`public/uploadsImageSmall`);
        }
        cb(null, `public/uploads`)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

export const uploadfiles = multer({
    storage: storage,
})

//api upload avatar nhóm
export const UploadAvatarGroup = async (req, res, next) => {
    try {
        if (req.body && req.file) {
            if (req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/jpg' || req.file.mimetype === 'image/png') {
                const conversationId = req.body.conversationId
                const userId = req.body.userId
                if (!fs.existsSync('public/avatarConversation')) {
                    fs.mkdirSync('public/avatarConversation');
                }
                if (!fs.existsSync(`public/avatarConversation/${String(req.body.conversationId)}`)) {
                    fs.mkdirSync(`public/avatarConversation/${String(req.body.conversationId)}`);
                }
                const avatarConversation = `${Date.now()}_${conversationId}${path.extname(req.file.originalname)}`
                await sharp(req.file.buffer)
                    .resize({ fit: sharp.fit.contain, width: 120, height: 120 })
                    .toFile(`public/avatarConversation/${conversationId}/${avatarConversation}`)
                const fileDelete = fs.readdirSync(`public/avatarConversation/${String(req.body.conversationId)}`)[0]
                if (fs.readdirSync(`public/avatarConversation/${String(req.body.conversationId)}`).length >= 10) {
                    fs.unlinkSync(`public/avatarConversation/${String(req.body.conversationId)}/${fileDelete}`)
                }
                const conversation = await Conversation.findOneAndUpdate({ _id: conversationId, "memberList.memberId": Number(userId) }, { avatarConversation: avatarConversation }, { new: true })
                if (conversation) {
                    conversation.avatarConversation = `https://mess.timviec365.vn/avatarConversation/${conversation._id}/${conversation.avatarConversation}`
                    res.json({
                        data: {
                            result: conversation,
                            message: 'Success'
                        },
                        error: null
                    })
                }
                else {
                    res.status(200).json(createError(200, "Thông tin truyền không chính xác"))
                }
            }
            else {
                res.status(200).json(createError(200, "File không phải là hình ảnh"))
            }
        }
        else {
            res.status(200).json(createError(200, "Dữ liệu truyền lên không đầy đủ"))
        }
    } catch (err) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

//api upload ảnh đại diện
export const UploadAvatar = async (req, res, next) => {
    if (req.body && req.file) {
        if (req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/jpg' || req.file.mimetype === 'image/png') {
            const userId = Number(req.body.userId)
            if (!fs.existsSync('public/avatarUser')) {
                fs.mkdirSync('public/avatarUser');
            }
            if (!fs.existsSync(`public/avatarUser/${String(req.body.userId)}`)) {
                fs.mkdirSync(`public/avatarUser/${String(req.body.userId)}`);
            }
            const avatarUser = `${Date.now()}_${userId}${path.extname(req.file.originalname)}`
            await sharp(req.file.buffer)
                .resize({ fit: sharp.fit.contain, width: 120, height: 120 })
                .toFile(`public/avatarUser/${userId}/${avatarUser}`)
            const fileDelete = fs.readdirSync(`public/avatarUser/${String(req.body.userId)}`)[0]
            if (fs.readdirSync(`public/avatarUser/${String(req.body.userId)}`).length >= 10) {
                fs.unlinkSync(`public/avatarUser/${String(req.body.userId)}/${fileDelete}`)
            }

            const user = await User.findByIdAndUpdate({ _id: userId }, { avatarUser: avatarUser }, { new: true })
            if (user) {
                user.avatarUser = `https://mess.timviec365.vn/avatarConversation/${user._id}/${user.avatarUser}`
                if (user.type365 != 0) {
                    let response = await axios.post('https://chamcong.24hpay.vn/api_chat365/update_avatar.php', qs.stringify({
                        'email': `${String(user.email)}`,
                        'link': user.avatarUser,
                        'type': `${String(user.type365)}`  // truyền sai type đúng  quản lý chung vẫn nhận 
                    }));
                }
                if (user.id365 != 0) {
                    if (user.type365 != 0) {
                        let response = await axios.post('https://timviec365.vn/api_app/update_tt_chat365.php', qs.stringify({
                            'email': `${String(user.email)}`,
                            'file': user.avatarUser,
                            'type': `${String(user.type365)}`  // truyền sai type đúng  quản lý chung vẫn nhận 
                        }));
                    }
                    else {
                        let response = await axios.post('https://timviec365.vn/api_app/update_tt_chat365.php', qs.stringify({
                            'id': `${String(user.type365)}`,
                            'file': user.avatarUser,
                        }));
                    }
                }
                res.json({
                    data: {
                        result: user,
                        message: 'Success'
                    },
                    error: null
                })
            }
            else {
                res.status(200).json(createError(200, "Thông tin truyền không chính xác"))
            }
        }
        else {
            res.status(200).json(createError(200, "File không phải là hình ảnh"))
        }
    }
    else {
        res.status(200).json(createError(200, "Dữ liệu truyền lên không đầy đủ"))
    }
}

// api upload File
export const UploadFile = async (req, res, next) => {
    try {
        if (req.files.length > 0) {
            let files = [];

            for (let i = 0; i < req.files.length; i++) {
                files.push({
                    pathFile: req.files[i].filename,
                    sizeFile: req.files[i].size,
                })
            }
            for (let i = 0; i < files.length; i++) {
                if (req.files[i].mimetype === 'image/jpeg' || req.files[i].mimetype === 'image/jpg' || req.files[i].mimetype === 'image/png') {
                    await sharp(`public/uploads/${files[i].pathFile}`).resize({ fit: sharp.fit.contain, width: 120, height: 120 })
                        .toFile(`public/uploadsImageSmall/${files[i].pathFile}`)
                }
            }
            res.json({
                data: {
                    result: files,
                    message: 'Upload File thành công'
                },
                error: null
            })
        }
        else {
            res.status(200).json(createError(200, "Vui lòng chọn file muốn Upload"))
        }
    } catch (err) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

//api cài ảnh đại diện mới
export const SetupNewAvatar = async (req, res, next) => {
    try {
        const user = await User.find({ avatarUser: { $ne: '' } })
        if (user) {
            for (let i = 0; i < user.length; i++) {
                if (fs.existsSync(`public/avatarUser/${String(user[i]._id)}`)) {
                    fs.readdirSync(`public/avatarUser/${String(user[i]._id)}`).forEach((file, index) => {
                        const curPath = path.join(`public/avatarUser/${String(user[i]._id)}`, file);
                        if (fs.readdirSync(`public/avatarUser/${String(user[i]._id)}`).length > 1) {
                            fs.unlinkSync(curPath);
                        }
                    });
                }
            }
            res.json({
                data: {
                    message: 'Setup thành công'
                },
                error: null
            })
        }
        else {
            res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
        }
    } catch (err) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

// api ảnh đại diện mới cho nhóm:
export const SetupNewAvatarGroup = async (req, res, next) => {
    try {
        const conversation = await Conversation.find({ avatarConversation: { $ne: '' } })
        if (conversation) {
            for (let i = 0; i < conversation.length; i++) {
                if (fs.existsSync(`public/avatarConversation/${String(conversation[i]._id)}`)) {
                    fs.readdirSync(`public/avatarConversation/${String(conversation[i]._id)}`).forEach((file, index) => {
                        const curPath = path.join(`public/avatarConversation/${String(conversation[i]._id)}`, file);
                        if (fs.readdirSync(`public/avatarConversation/${String(conversation[i]._id)}`).length > 1) {
                            fs.unlinkSync(curPath);
                        }
                    });
                }
            }
            res.json({
                data: {
                    message: 'Setup thành công'
                },
                error: null
            })
        }
        else {
            res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
        }
    } catch (err) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

//api upload file cho phần mất mạng: 
export const UploadNewFile = async (req, res, next) => {
    const MessageID = req.body.MessageID
    const ConversationID = req.body.ConversationID
    const SenderID = req.body.SenderID
    const MessageType = req.body.MessageType
    const ListFile = req.body.ListFile
    const DeleteTime = req.body.DeleteTime
    const MemberList = req.bodyMemberList
    let count = 0

    let files = [];

    for (let i = 0; i < req.files.length; i++) {
        files.push({
            pathFile: req.files[i].filename,
            sizeFile: req.files[i].size,
        })
    }
    for (let i = 0; i < files.length; i++) {
        if (req.files[i].mimetype === 'image/jpeg' || req.files[i].mimetype === 'image/jpg' || req.files[i].mimetype === 'image/png') {
            await sharp(`public/uploads/${files[i].pathFile}`).resize({ fit: sharp.fit.contain, width: 120, height: 120 })
                .toFile(`public/uploadsImageSmall/${files[i].pathFile}`)
        }
    }

    const conversation = await Conversation.findOne({_id: Number(ConversationID), })
    // const mess = [
    //     MessageID,
    //     Number(ConversationID),
    //     Number(SenderID),
    //     MessageType,
    //     '',
    //     0,
    //     (New Date())
    // ]
}

// api tải ảnh đại diện:
export const DownLoadAvatar = async (req, res, next) => {
    try {
        if (req.params) {
            const fileName = req.params.fileName
            const sfileName = fileName.slice(0, fileName.indexOf('.'))
            const user = sfileName.slice(sfileName.indexOf('_') + 1, sfileName.length)
            const filePath = `public/avatarUser/${user}/${fileName}`
            if (fs.existsSync(filePath)) {
                res.download(filePath)
            }
            else {
                res.status(200).json(createError(200, "Avatar không tồn tại"))
            }
        } else {
            res.status(200).json(createError(200, "Chưa truyền params"))
        }
    } catch (err) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

// api tải ảnh nhóm:
export const DownloadAvatarGroup = async (req, res, next) => {
    try {
        if (req.params) {
            const fileName = req.params.fileName
            const sfileName = fileName.slice(0, fileName.indexOf('.'))
            const conversation = sfileName.slice(sfileName.indexOf('_') + 1, sfileName.length)
            const filePath = `public/avatarConversation/${conversation}/${fileName}`
            if (fs.existsSync(filePath)) {
                res.download(filePath)
            }
            else {
                res.status(200).json(createError(200, "Avatar không tồn tại"))
            }

        } else {
            res.status(200).json(createError(200, "Chưa truyền params"))
        }
    } catch (err) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

// api tải file
export const DownloadFile = async (req, res, next) => {
    try {
        if (req.params) {
            const filePath = `pubic/uploads/${req.params.filename}`

            if (fs.existsSync(filePath)) {
                res.download(filePath)
            }
            else {
                res.status(200).json(createError(200, "File không tồn tại"))
            }
        } else {
            res.status(200).json(createError(200, "Chưa truyền params"))
        }
    } catch (err) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}

// api tải file
export const DownloadSmallFile = async (req, res, next) => {
    try {
        if (req.params) {
            const filePath = `pubic/uploadsImageSmall/${req.params.filename}`

            if (fs.existsSync(filePath)) {
                res.download(filePath)
            }
            else {
                res.status(200).json(createError(200, "File không tồn tại"))
            }
        } else {
            res.status(200).json(createError(200, "Chưa truyền params"))
        }
    } catch (err) {
        res.status(200).json(createError(200, "Đã có lỗi xảy ra"))
    }
}
import mongoose from "mongoose";
const DiarySchema = new mongoose.Schema(
    {
        userSenderId: {
            type: Number,
            default: 0,
        },
        avatarUserSender: {
            type: String,
            default: "",
        },
        userNameSender: {
            type: String,
            default: "",
        },
        conversationId: {
            type: Number,
            default: 0,
        },
        createAt: {
            type: Date,
            required: true,
        },
        content: {
            type: String,
        },
        fileList: [
            {
                pathFile: String,
                sizeFile: Number,
            }
        ],
        emotion: {
            type: String,
            default:"",
        },
        commentList: [
            {
                content: {
                    type: String,
                    required: true
                },
                
                commentatorId: {
                    type: Number,
                    required: true
                },
                createAt: {
                    type: Date,
                    required: true
                },
                commentName:{
                    type: String,
                },
                commentAvatar: {
                    type: String,
                },
                commentEmotion: {
                    type:String,
                    default: "",
                },
                commentLikeAvatar:{
                    type:String,
                    default: "",
                },
                commentLikeName:{
                    type:String,
                    default: "",
                },
                IdImage:{
                    type: String,
                },
                IdVideo:{
                    type: String,
                },
            }
        ],
    },
    {
        collection: 'Diarys',  // cài đặt tên cho conversations kết nối đến 
        versionKey: false   // loai bo version key 
    },
);

export default mongoose.model("Diary", DiarySchema);
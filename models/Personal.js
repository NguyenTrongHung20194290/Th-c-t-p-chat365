import mongoose from "mongoose";
const PersonalSchema = new mongoose.Schema(
    {   
        userId: {
            type: Number,
            default: 0,
        },
        createAt: {
            type: Date,
            required: true,
        },
        contentPost: {
            type: String,
        },
        imageList: [
            {
                pathFile: String,
                sizeFile: Number,
                imageEmotion: {
                    type: String,
                    default: ""
                },
                imageLikeName:{
                    type: String,
                    default: ""
                },
                imageLikeAvatar: {
                    type: String,
                    default: ""
                },
            }
        ],
        videoList: [
            {
                pathFile: String,
                sizeFile: Number,
                videoEmotion:{
                    type :String,
                    default: ""
                },
                videoLikeName:{
                    type: String,
                    default: ""
                },
                videoLikeAvatar: {
                    type: String,
                    default:""
                },
            }
        ],
        emotion: {
            type: String,
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
        albumName:{
            type: String
        },
        contentAlbum: {
            type: String
        },
        link: {
            type: String
        },
        raw: {
            type: String
            // 1: chỉ mình tôi
            // 2. bạn bè tôi
            // 3. bạn bè chỉ định
            // 4. bạn bè ngoại trừ
        },
        backgroundImage: [
            {
                pathFile: String,
                sizeFile: Number,
            }
        ],
        
        emotion: {
            type: String,
        },
        emotionName:{
            type: String,
            default:""
        },
        emotionAvatar:{
            type: String,
            default:""
        },
        link:{
            type: String,
        },
        listTag: {
            type: String,
            default:""
        },
        tagName:{
            type: Array,
            
        },
        tagAvatar:{
            type: Array,
            
        },
        imageListId:{
            type: Array,
            
        },
        videoListId:{
            type: Array,
            
        }
    },
{
    collection: 'Personal',  
    versionKey: false   
},
);

export default mongoose.model("Personal", PersonalSchema);
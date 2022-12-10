import mongoose from "mongoose";
const ConversationSchema = new mongoose.Schema(
  {
    _id:{
      type: Number,
      required: true,
    },
    isGroup: {
      type: Number,
      required: true,
    },
    typeGroup: {
      type: String,
      required: true,
    },
    avatarConversation: {
      type: String,
      default:""
    },
    adminId: {
      type: Number,
      default:0
    },
    shareGroupFromLinkOption: {
        type: Number,
        default:1
    },
    browseMemberOption: {
      type: Number,
      default:1
    },
    pinMessage: {
      type: String,
      default:""
    },
    memberList:[
       {    _id:{
                type: Number,
                required: true,
            },
            memberId:{
                type: Number,
                required: true,
            },
            conversationName:{
                type: String,
                required: true,
            },
            unReader:{
                type: Number,
                required: true,
            },
            messageDisplay:{
                type: Number,
                required: true,
            },
            isHidden:{
                type: Number,
                required: true,
            },
            isFavorite:{
                type: Number,
                required: true,
            },
            notification:{
                type: Number,
                required: true,
            },
            timeLastSeener:{
                type: Date,
                required: true,
            },
            deleteTime:{
                type: Number,
                required: true,
            },
            deleteType:{
                type: Number,
                required: true,
            },
            favoriteMessage:{
                type:[String]
            },
            liveChat:{
                clientId:{
                    type: String
                },
                clientName:{
                    type: String
                },
                fromWeb:{
                    type: String,
                },
            }
       }
    ],
    messageList:[
       {    _id:{
                type: String,
                required: true,
            },
            displayMessage:{
                type: Number,
                required: true,
            },
            senderId:{
                type: Number,
                required: true,
            },
            messageType:{
                type: String,
                required: true,
            },
            message:{
                type: String,
                required: true,
            },
            quoteMessage:{
                type: String,
                required: true,
            },
            messageQuote:{
                type: String,
                required: true,
            },
            createAt:{
                type: Date,
                required: true,
            },
            isEdited:{
                type: Number,
                required: true,
            },
            infoLink:{
                title: String,
                description: String,
                linkHome: String,
                image: String,
                isNotification:Number,
            },
            listFile:[
                {
                   sizeFile:Number,
                   nameFile:String,
                   height:Number,
                   width:Number,
                }
            ],
            emotion:{
               Emotion1:String,
               Emotion2:String,
               Emotion3:String,
               Emotion4:String,
               Emotion5:String,
               Emotion6:String,
               Emotion7:String,
               Emotion8:String,
            },
            deleteTime:{
                type: Number,
                required: true,
            },
            deleteType:{
                type: Number,
                required: true,
            },
            deleteDate:{
                type: Date,
                required: true,
            }
        }
    ],
    browseMemberList:[
        {
            memberAddId:Number,
            memberBrowseId:Number,
        }
    ],
  },
  { collection: 'Conversations' ,  // cài đặt tên cho conversations kết nối đến 
    versionKey: false   // loai bo version key 
  },  
);

export default mongoose.model("Conversation", ConversationSchema);
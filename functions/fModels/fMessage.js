export const Messages = (messageID,conversationID,senderID,messageType,message,listTag,deleteDate,deleteTime,deleteType,isFavorite) =>{
    return {
        MessageID : messageID,
        ConversationID : conversationID,
        SenderID : senderID,
        MessageType : messageType,
        Message : message,
        ListTag : listTag,
        DeleteTime : 0,
        DeleteType : 0,
        DeleteDate : deleteDate,
        IsFavorite : 0,
        QuoteMessage:{}
    }
}

export const MessageQuote = (messageID,senderName,senderID,messageType,message,createAt) =>
{   
    return {
        MessageID : messageID,
        SenderID : senderID,
        MessageType : messageType,
        Message : message,
        CreateAt : createAt,
        SenderName : senderName,
    }
}

export const MessagesDB = (id,displayMessage,senderId,messageType,message,quoteMessage,messageQuote,createAt,isEdited,infoLink,listFile,emotion,deleteTime,deleteType,deleteDate) =>
{   
    return {
        _id : id,
        displayMessage : displayMessage,
        senderId : senderId,
        messageType : messageType,
        message : message,
        quoteMessage : quoteMessage,
        messageQuote : messageQuote,
        createAt : createAt,
        isEdited : isEdited,
        infoLink : infoLink,
        listFile : listFile,
        emotion : emotion,
        deleteTime : deleteTime,
        deleteType : deleteType,
        deleteDate : deleteDate,
    }
}
   
 export const EmotionMessageDBDefault = () =>
 {   
     return {
        Emotion1:"",
        Emotion2:"",
        Emotion3:"",
        Emotion4:"",
        Emotion5:"",
        Emotion6:"",
        Emotion7:"",
        Emotion8:"",
     }
 }
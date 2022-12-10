export const Comment = (id,commentatorId,content,createAt,isEdited,commentEmotion,commentName,commentAvatar) =>
{   
    return {
        _id : id,
        commentatorId : commentatorId,
        content : content,
        createAt : createAt,
        commentEmotion :commentEmotion,
        commentName : commentName,
        commentAvatar : commentAvatar,
    }
}

export const EmotionCommentDBDefault = () =>
{   
    return {
       Emotion1:"",
    }
}

export const fEmotion = (type,listUserId,linkEmotion) => {
  
    return {
        Type:type,
        ListUserId:listUserId,
        LinkEmotion:linkEmotion,
        IsChecked:false
    }
 };
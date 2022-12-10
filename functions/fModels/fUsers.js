export const fUsers = (
    id, id365, idTimViec, type365, email, password, phone, userName, avatarUser, status, statusEmotion, lastActive, active, isOnline, looker, companyId,
    companyName, notificationPayoff, notificationCalendar, notificationReport,  notificationOffer, notificationPersonnelChange, notificationRewardDiscipline,  
    notificationNewPersonnel, notificationTransferAsset, notificationChangeProfile, notificationMissMessage,notificationCommentFromTimViec,notificationCommentFromRaoNhanh,
    notificationTag,notificationSendCandidate,
    notificationChangeSalary,notificationAllocationRecall,notificationAcceptOffer,
    notificationDecilineOffer,notificationNTDPoint,notificationNTDExpiredPin,notificationNTDExpiredRecruit) => {
   return {
    ID : id,
    Email : email,
    Password : password,
    Phone : phone,
    UserName:  userName,
    AvatarUser : avatarUser,
    Status : status,
    Active : active,
    isOnline : isOnline,
    Looker : looker,
    StatusEmotion : statusEmotion,
    LastActive : lastActive,
    CompanyId : companyId,
    NotificationCalendar:  notificationCalendar,
    NotificationPayoff : notificationPayoff,
    NotificationReport : notificationReport,
    NotificationOffer : notificationOffer,
    NotificationPersonnelChange : notificationPersonnelChange,
    NotificationRewardDiscipline : notificationRewardDiscipline,
    NotificationNewPersonnel : notificationNewPersonnel,
    NotificationChangeProfile : notificationChangeProfile,
    NotificationTransferAsset : notificationTransferAsset,
    CompanyName : companyName,
    ID365 : id365,
    Type365 : type365,
    IDTimViec : idTimViec,
    NotificationMissMessage : notificationMissMessage,
    NotificationCommentFromTimViec : notificationCommentFromTimViec,
    NotificationCommentFromRaoNhanh : notificationCommentFromRaoNhanh,
    NotificationTag : notificationTag,
    NotificationSendCandidate : notificationSendCandidate,
    NotificationChangeSalary : notificationChangeSalary,
    NotificationAllocationRecall : notificationAllocationRecall,
    NotificationAcceptOffer : notificationAcceptOffer,
    NotificationDecilineOffer : notificationDecilineOffer,
    NotificationNTDPoint : notificationNTDPoint,
    NotificationNTDExpiredPin : notificationNTDExpiredPin,
    NotificationNTDExpiredRecruit : notificationNTDExpiredRecruit,
   }
};

export const UsersModelExtra = ( id,  id365, idTimViec, type365,  email,  password,  phone,  userName,
                                avatarUser,  status,  statusEmotion,  lastActive,
                                active,  isOnline,  looker,companyId,  companyName)=>{
    return {
            ID : id,
            Email : email,
            Password : password,
            Phone : phone,
            UserName : userName,
            AvatarUser : avatarUser,
            Status : status,
            Active : active,
            isOnline : isOnline,
            Looker : looker,
            StatusEmotion: statusEmotion,
            LastActive : lastActive,
            CompanyId : companyId,
            CompanyName : companyName,
            ID365 : id365,
            Type365 : type365,
            IDTimViec : idTimViec,
    }
}

export const fUserConv = ( memberId, conversationName , unReader , messageDisplay, isHidden ,
                         isFavorite, notification, timeLastSeener, deleteTime, deleteType, favoriteMessage
                         ) =>{
   return {
    memberId, conversationName , unReader , messageDisplay, isHidden ,
    isFavorite, notification, timeLastSeener, deleteTime, deleteType, favoriteMessage
   }
}
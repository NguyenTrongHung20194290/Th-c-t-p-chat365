export const fInfoLink = (messageId,title,description,linkHome,image, isNotification) => {
   let HaveImage;
   let Image = image;
   if ((!image) || (String(image).trim() ==="") )
   {
       HaveImage = "False";
   }
   else
   {
       HaveImage = "True";
   }
   if(HaveImage == "True"){
    Image=  Image.replace("amp;","")
   }
   return {
    MessageID:messageId,
    Description:description,
    Title:title,
    LinkHome:linkHome,
    Image,
    HaveImage,
    IsNotification:isNotification
   }
};

export const fInfoFile = (typeFile,fullName,sizeFile,height, width) => {
    let nameDisplay = String(fullName).split("-")[1];
    if( (String(nameDisplay).trim() != "") && String(nameDisplay).length>25 ){
        nameDisplay = String(nameDisplay).slice(0,23);
    }
    let FileSizeInByte= Number(sizeFile);
    if(Number(sizeFile)<1024){
        FileSizeInByte = `${FileSizeInByte} bytes`;
    }
    else if( (Number(sizeFile)/1024 >= 1) && ( Number(sizeFile)/1024 < 1024 ) ){
        FileSizeInByte =  `${String(FileSizeInByte/1024).split(".")[0]}.${String((FileSizeInByte/1024)/1024).split(".")[1].slice(0,2)} KB`
    }
    else if( (Number(sizeFile)/1024)/1024 >= 1){
        FileSizeInByte =  `${String((FileSizeInByte/1024)/1024).split(".")[0]}.${String((FileSizeInByte/1024)/1024).split(".")[1].slice(0,2)} MB`
    }
    return {
        TypeFile:typeFile,
        FullName:fullName,
        SizeFile:sizeFile,
        Height:height,
        Width: width,
        nameDisplay,
        FileSizeInByte
    }
 };

export const fEmotion = (type,listUserId,linkEmotion) => {
  
    return {
        Type:type,
        ListUserId:listUserId,
        LinkEmotion:linkEmotion,
        IsChecked:false
    }
 };

 export const fMessageQuote = (messageID,senderName,senderID,messageType,message,createAt) => {
  
    return {
        MessageID : messageID,
        SenderID : senderID,
        MessageType : messageType,
        Message : message,
        CreateAt : createAt,
        SenderName : senderName
    }
 };
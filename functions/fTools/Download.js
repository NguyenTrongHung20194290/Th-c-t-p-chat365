// thư viện xử lý file 
import fs from 'fs'
import path from 'path'
import axios from 'axios'

// hàm xóa folder 
const deleteFolderRecursive = async  (directoryPath) => {
    if (fs.existsSync(directoryPath)) {
        fs.readdirSync(directoryPath).forEach((file, index) => {
          const curPath = path.join(directoryPath, file);
          if (fs.lstatSync(curPath).isDirectory()) {
            deleteFolderRecursive(curPath);
          } else {
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(directoryPath);
      }
    };

      
// lấy dữ liệu ảnh 
// có thể ghi đè nếu cùng tên file

// code thay đổi kích thước 
// await sharp('./public/avatarUser/test.jpg').resize({width:100})
// .toFile('./public/avatarUser/test1.jpg')
// .then(()=> console.log("done"))

// download và lưu ảnh vào thiết bị 
export const downloadImage = async (userId,imgUrl, saveRelPath,saveName) => {
    
    // xóa folder chứa ảnh 
    if (fs.existsSync(`../public/${String(userId)}`)){
        await deleteFolderRecursive(`../public/${String(userId)}`)
    }
   
    //Tạo folder chứa ảnh đại diện 
    if (!fs.existsSync(`../public/${String(userId)}`)){
        fs.mkdirSync(`../public/${String(userId)}`);
    }
    
    // tải ảnh và cắt ảnh 
    const _path = path.resolve(saveRelPath, saveName)
    const writer = fs.createWriteStream(_path)
    const response = await axios({
      url: imgUrl,
      method: 'GET',
      responseType: 'stream',
    })
    response.data.pipe(writer)
  
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
}




// test dowload and store image 
//  const IMG_URL = 'https://chamcong.24hpay.vn/upload/employee/ep12483/app_2022-08-16%2007:52:02.296741.jpg'
//  const REL_PATH = '.'
//  const NAME = 'test.jpg'
//  await downloadImage(IMG_URL, REL_PATH, NAME);
//  console.log('Image saving done, other stuff here');
//  let array_byte_img = await axios.get('https://chamcong.24hpay.vn/upload/employee/ep12483/app_2022-08-16%2007:52:02.296741.jpg')
//  console.log("Dữ liệu ảnh download về",array_byte_img.data);
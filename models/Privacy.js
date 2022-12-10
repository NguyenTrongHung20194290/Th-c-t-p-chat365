import mongoose from "mongoose";
const PrivacySchema = new mongoose.Schema(
{
userId: {
type: Number,
required: true
},
active: {
type: Number,
default: 0
},
showDateOfBirth: {
type: Number,
default: 0,
},
chat: {
type: Number,
default: 2,
},
call: {
type: Number,
default: 3,
},
post: {
type: String,
default: 0,
// 0 Toàn bộ bài đăng
// 1 6 tháng gần nhất
// 2 1 tháng gần nhất
// 3 7 ngày gần nhất
// mm/dd/yy từ khoảng thời gian
},
blockMessage: {
type: Array,
default: []
},
blockPost: {
type: Array,
default: []
},
hideDiary: {
type: Array,
default: []
}

},
{
collection: 'Privacys',
versionKey: false // loai bo version key
}
);

export default mongoose.model("Privacy", PrivacySchema);
import mongoose from "mongoose";
const ContactSchema = new mongoose.Schema(
  {
      userFist: {
        type: Number,
        default:0,
      },
      userSecond: {
        type: Number,
        default:0,
      },
  },
  { collection: 'Contacts', 
    versionKey: false   // loai bo version key 
  }
);

export default mongoose.model("Contact", ContactSchema);
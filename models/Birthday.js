import mongoose from "mongoose";
const BirthdaySchema = new mongoose.Schema(
  {
      UserId: {
        type: Number,
        required: true,
      },
      Dob: {
        type: String,
        required: true,
      },
      createAt: {
        type: Date,
        required: true,
    },
  },
  { collection: 'Birthday',
  versionKey: false }
);

export default mongoose.model("Birthday", BirthdaySchema);
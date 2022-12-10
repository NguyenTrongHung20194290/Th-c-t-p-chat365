import mongoose from "mongoose";
const CounterSchema = new mongoose.Schema(
  {
      name: {
        type: String,
        require:true,
      },
      countID: {
        type: Number,
        require:true,
      },
  },
  { collection: 'Counter', 
    versionKey: false   // loai bo version key 
  }
);

export default mongoose.model("Counter", CounterSchema);
import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import cookieParser from "cookie-parser"
import cors from "cors"
import formData from 'express-form-data';

import findmes from "./routes/findmes.js";
import auth from "./routes/auth.js";
import conversations from "./routes/conversations.js";
import users from "./routes/users.js";
import message from "./routes/message.js";
import calendarAppointment from "./routes/calendarAppointment.js";
import diary from "./routes/diary.js";
import file from "./routes/file.js";
import personal from "./routes/personal.js";
import notification from "./routes/notification.js";
// import {notificationBirthday} from "./controllers/message.js";
const app=express();

dotenv.config();

const connect = async () => {
    try {
      await mongoose.connect("mongodb+srv://Tuananhhust05:Tuananh050901@cluster0.aqpat.mongodb.net/Chat365?retryWrites=true&w=majority");
      console.log("Connected to mongoDB.");
    } catch (error) {
      throw error;
    }
  };

mongoose.connection.on("disconnected", () => {
  console.log("mongoDB disconnected!");
});

app.use(cors()) // cho phép truy cập từ mọi client 
app.use(cookieParser())

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(formData.parse());
app.use(express.static("public"));

app.use("/api/conv", findmes);
app.use("/api/conv/auth", auth);
app.use("/api/conversations", conversations);
app.use("/api/users", users);
app.use("/api/message", message);
app.use("/api/diary", diary);
app.use("/api/calendarappointment", calendarAppointment)
// app.use("/api/blockuser", blockUser)
app.use("/api/file", file)
app.use("/api/personal", personal);

app.use("/api/V2/Notification",notification)
// app.listen(process.env.PORT ||9000,()=>{
//     connect();
//     console.log("Connected to databse");
//     console.log("Backend is running on http://localhost:9000")
// })
app.listen(9000,()=>{
  connect();
  console.log("Connected to databse");
  console.log("Backend is running on http://localhost:9000")
})

// notificationBirthday()
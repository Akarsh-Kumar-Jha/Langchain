import express from "express";
import dotenv from "dotenv";
import { AI_Analysis, chatAI, getAnalysis, JD_match } from "./controllers/ai.js";
import { getMe, logout, signIn, Signup } from "./controllers/auth.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import { fileUplaod } from "./controllers/fileUpload.js";
import './utils/worker.js';
import cors from "cors";


dotenv.config({
    path:'.env'
});

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(fileUpload({
    useTempFiles : false,
}));
app.use(cors({
    origin:"http://localhost:5173",
    credentials: true
}));


const PORT = process.env.PORT || 5000;
app.listen(PORT,() => {
    console.log(`Server Running Fine On PORT:${PORT}`);
});

app.get('/',authMiddleware,(req,res) => {
    return res.status(200).json({
        success:true,
        message:"Server Working Fine."
    });
});

app.post('/analyze',authMiddleware,AI_Analysis);
app.post('/ask',authMiddleware,chatAI);
app.post('/match',authMiddleware,JD_match);
app.post('/signup',Signup);
app.post('/signin',signIn);
app.get('/getme',authMiddleware,getMe);
app.post('/logout',authMiddleware,logout);
app.post('/upload',authMiddleware,fileUplaod);
app.get('/get-report',authMiddleware,getAnalysis);
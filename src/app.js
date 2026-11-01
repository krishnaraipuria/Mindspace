import express from "express"
import cors from "cors"
import { errorHandler } from "./middlewares/error.middleware.js";

const app=express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))

import roomRouter from "./routes/room.routers.js";

app.use("/api/v1/room",roomRouter);
app.use(errorHandler);
export {app}
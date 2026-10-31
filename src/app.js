import express from "express"
import cors from "cors"
import { errorHandler } from "./middlewares/error.middleware.js";

const app=express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(errorHandler);
export {app}
import dotenv from "dotenv"
import http from "http";
import connectdb from "./db/index.js";
import { app } from "./app.js";
import {Server} from "socket.io";
import {socketConnection} from "./sockets/index.js";


dotenv.config({
    path: './env'
})

import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const server=http.createServer(app);
const io=new Server(server,{
    cors:{
        origin: process.env.CORS_ORIGIN,
        credentials:true
    }
});

app.set("io",io);

socketConnection(io);

server.on("error",(error)=>{
    console.log("Error in server:",error);
});

connectdb()
.then(()=>{
    server.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port :${process.env.PORT}`)
    })
    server.on("error",(error)=>{
        console.log("ERRR:",error);
        throw error
    })
})
.catch((err)=>{
    console.log("MONGO db connection failed!!",err)
})
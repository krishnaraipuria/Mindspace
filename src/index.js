import dotenv from "dotenv"
import http from "http";
import connectdb from "./db/index.js";
import { app } from "./app.js";
import {Server} from "socket.io";
import { Member } from "./models/member.models.js";
import { Room } from "./models/room.models.js";

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

io.on("connection",(socket)=>{
    console.log("Socket connected",socket.id);

    socket.on("disconnect", async ()=>{
        try{
            const member=Member.findOneAndDelete({socketId:socket.id});
            if(!member){
                console.log("Member not found for socketId:",socket.id);
                return;
            }
            console.log("Member deleted for socketId:",socket.id);
            const remainingMembers=Member.find({roomId:member.roomId});
            if(remainingMembers.length===0){
                const room=await Room.findById(member.roomId);
                if(room && !room.isSaved){
                    await Room.findByIdAndDelete(member.roomId);
                    console.log("Room deleted for roomId:",member.roomId);
                }
            }
        }catch(error){
            console.log("Error in disconnect event:",error);
        }
    });
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
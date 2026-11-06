import {removeMemberFromRoom} from "./room.socket.js";

import {addElementToRoom,removeElementFromRoom,updateElementInRoom} from "./board.socket.js";
//all socket connections are handled here;

const socketConnection=(io)=>{
    io.on("connection",(socket)=>{
        console.log("Socket connected:",socket.id);
        // event handlers for room and boards;
        socket.on("board:element:add",async(payload,ack)=>{
            try{
                const result=await addElementToRoom(payload?.roomId,payload?.element,socket);
                if(ack && typeof ack === "function"){
                    ack({success:true,data:result});
                }
            }catch(error){
                console.error("Error adding element to board:",error);
                if(ack && typeof ack === "function"){
                    ack({success:false,message:error.message});
                }
            }
        });
        socket.on("board:element:remove",async(payload,ack)=>{
            try{
                const result=await removeElementFromRoom(payload?.roomId,payload?.elementId,socket);
                if(ack && typeof ack === "function"){
                    ack({success:true,data:result});
                }
            }catch(error){
                console.error("Error removing element from board:",error);
                if(ack && typeof ack === "function"){
                    ack({success:false,message:error.message});
                }
            }
        });

        socket.on("board:element:update",async(payload,ack)=>{
            try{
                const result=await updateElementInRoom(payload?.roomId,payload?.oldElement,payload?.newElement,socket);
                if(ack && typeof ack === "function"){
                    ack({success:true,data:result});
                }
            }catch(error){
                console.error("Error updating element in board:",error);
                if(ack && typeof ack === "function"){
                    ack({success:false,message:error.message});
                }
            }
        });

        socket.on("board:draft", ({ roomId, element }) => {
            if(roomId && socket.rooms.has(roomId)) socket.to(roomId).emit("board:draft", element);
        });
        
        socket.on("disconnect",async()=>{
            console.log("Socket disconnected:",socket.id);
            try{
                const result=await removeMemberFromRoom(socket.id);
                console.log("Member removed on disconnect:",result);
            }catch(error){
                console.error("Error removing member on disconnect:",error);
            }
        });


    });
};

export {socketConnection};
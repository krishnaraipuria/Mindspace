import {removeMemberFromRoom} from "./room.socket.js";
//all socket connections are handled here;


const socketConnection=(io)=>{
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("disconnect", async () => {
            console.log("User disconnected:", socket.id);
            try{
                await removeMemberFromRoom(socket.id);
            }catch(error){
                console.log("Error in disconnect event:",error);
            }
        });
    });
}

export {socketConnection};
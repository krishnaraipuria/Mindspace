import {Member} from "../models/member.models.js";
import {Room} from "../models/room.models.js";
import {APIError} from "../utils/APIerror.js";


const broadcastMembers = async (io, room) => {
  const members = await Member.find({ roomId: room._id }).select("username role socketId");
  io.to(room.roomId).emit("room:members", members.map(m => ({
    id: m._id, socketId: m.socketId, username: m.username, role: m.role,
  })));
};

const removeMemberFromRoom=(async(socketId)=>{
    const member= await Member.findOneAndDelete({socketId:socketId});
    if(!member){
        console.log("Member not found for socketId:",socketId);
        return;
    }
    console.log("Member deleted for socketId:",socketId);
    const room=await Room.findById(member.roomId);
    if(room){
        console.log("Room updated for member:",socketId);
    }
    const remainingMembers=await Member.find({roomId:member.roomId}).countDocuments();
    if(remainingMembers===0){
        const room=await Room.findById(member.roomId);
        if(room && !room.isSaved){
            await Room.findByIdAndDelete(member.roomId);
            console.log("Room deleted for roomId:",member.roomId);
        }
    }
    await broadcastMembers(io, room);
    return {
        message:"Member removed from room successfully",
        remainingMembers:remainingMembers,
        roomId:room.roomId
    }
})

export {removeMemberFromRoom,broadcastMembers};
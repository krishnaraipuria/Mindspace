import {Member} from "../models/member.models.js";
import {Room} from "../models/room.models.js";
import {APIError} from "../utils/APIerror.js";


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
    return {
        message:"Member removed from room successfully",
        remainingMembers:remainingMembers,
        roomId:room.roomId
    }
})

export {removeMemberFromRoom};
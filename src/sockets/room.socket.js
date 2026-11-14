import {Member} from "../models/member.models.js";
import {Room} from "../models/room.models.js";

const ROOM_DISCONNECT_GRACE_MS = 10000;
const pendingRoomDeletion = new Map();

const cancelPendingRoomDeletion = (roomId) => {
  const timer = pendingRoomDeletion.get(roomId);
  if (!timer) return;
  clearTimeout(timer);
  pendingRoomDeletion.delete(roomId);
};

const scheduleRoomDeletion = (roomId) => {
  cancelPendingRoomDeletion(roomId);
  const timer = setTimeout(async () => {
    pendingRoomDeletion.delete(roomId);
    const remainingMembers = await Member.countDocuments({ roomId });
    const room = await Room.findById(roomId);
    if (room && remainingMembers === 0 && !room.isSaved) {
      await Room.findByIdAndDelete(roomId);
      console.log("Room deleted for roomId:", room.roomId);
    }
  }, ROOM_DISCONNECT_GRACE_MS);
  pendingRoomDeletion.set(roomId, timer);
};

const broadcastMembers = async (io, room) => {
  const members = await Member.find({ roomId: room._id }).select("username role socketId");
  io.to(room.roomId).emit("room:members", members.map(m => ({
    id: m._id, socketId: m.socketId, username: m.username, role: m.role,
  })));
};

const removeMemberFromRoom=(async(socketId, io)=>{
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
            scheduleRoomDeletion(member.roomId);
        }
    }
    if (room && io) await broadcastMembers(io, room);
    return {
        message:"Member removed from room successfully",
        remainingMembers:remainingMembers,
        roomId:room.roomId
    }
})

export {removeMemberFromRoom,broadcastMembers,cancelPendingRoomDeletion};
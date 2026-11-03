import {Member} from "../models/member.models.js";
import {Room} from "../models/room.models.js";
import {APIError} from "../utils/APIerror.js";

const AuthenticateRoom=async(roomId,socket)=>{
    if(!socket.connected || !socket.rooms.has(roomId)){
        throw new APIError(400,"Socket is not connected");
    }
    const room=await Room.findOne({roomId:roomId});
    if(!room){
        throw new APIError(404,"Room not found");
    }
    const member=await Member.findOne({roomId:room._id,socketId:socket.id});
    if(!member){
        throw new APIError(403,"Member not found in room");
    }
    return room;
}

const addElementToRoom=async(roomId,element,socket)=>{
    if(!roomId || !element){
        throw new APIError(400,"Room ID and Element are required");
    }
    if(!typeof element==="object" || !element.elementId){
        typeof element.elementId!=="string" || !element.elementId.trim()
        throw new APIError(400,"Element must be a non-empty string");
    }
    const room= await AuthenticateRoom(roomId,socket);
    const updatedRoom=await Room.findByIdAndUpdate(room._id,{$push:{elements:element}},{new:true});
    if(updatedRoom.modifiedCount===0){
        throw new APIError(500,"Failed to add element to room");
    }
    socket.to(roomId).emit("elementAdded",element);
    return {
        message:"Element added to room successfully",
        element:element,
        roomId:roomId
    }
}

const removeElementFromRoom=async(roomId,elementId,socket)=>{
    if(!roomId || !elementId){
        throw new APIError(400,"Room ID and Element ID are required");
    }
    if(typeof elementId!=="string" || !elementId.trim()){
        throw new APIError(400,"Element ID must be a non-empty string");
    }

    const room= await AuthenticateRoom(roomId,socket);
    const updatedRoom=await Room.findByIdAndUpdate(room._id,{$pull:{elements:{elementId:elementId}}},{new:true});
    if(updatedRoom.modifiedCount===0){
        throw new APIError(500,"Failed to remove element from room");
    }
    socket.to(roomId).emit("elementRemoved",elementId);
    return {
        message:"Element removed from room successfully",
        elementId:elementId,
        roomId:roomId
    }
}


export {addElementToRoom,removeElementFromRoom};

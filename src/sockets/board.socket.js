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
    if(!updatedRoom){
        throw new APIError(500,"Failed to add element to room");
    }
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

const removeElementFromRoom=async(roomId,element,socket)=>{
    if(!roomId || !element){
        throw new APIError(400,"Room ID and Element are required");
    }
    if(typeof element!=="object" || !element.elementId){
        throw new APIError(400,"Element must be an object with an elementId property");
    }
    if(typeof element.elementId!=="string" || !element.elementId.trim()){
        throw new APIError(400,"Element ID must be a non-empty string");
    }

    const room= await AuthenticateRoom(roomId,socket);
    const updatedRoom=await Room.findByIdAndUpdate(room._id,{$pull:{elements:element}},{new:true});
    if(updatedRoom.modifiedCount===0){
        throw new APIError(500,"Failed to remove element from room");
    }
    socket.to(roomId).emit("elementRemoved",element);
    return {
        message:"Element removed from room successfully",
        element:element,
        roomId:roomId
    }
}

const updateElementInRoom=async(roomId,oldElement,newElement,socket)=>{
    if(!roomId || !oldElement || !newElement){
        throw new APIError(400,"Room ID, old element, and new element are required");
    }
    if(typeof oldElement!=="object" || !oldElement.elementId){
        throw new APIError(400,"Old element must be an object with an elementId property");
    }
    if(typeof newElement!=="object" || !newElement.elementId){
        throw new APIError(400,"New element must be an object with an elementId property");
    }
    if(typeof oldElement.elementId!=="string" || !oldElement.elementId.trim()){
        throw new APIError(400,"Old element ID must be a non-empty string");
    }
    if(typeof newElement.elementId!=="string" || !newElement.elementId.trim()){
        throw new APIError(400,"New element ID must be a non-empty string");
    }

    const room= await AuthenticateRoom(roomId,socket);
    const updatedRoom=await Room.findByIdAndUpdate(room._id,{$pull:{elements:oldElement},$push:{elements:newElement}},{new:true});
    if(updatedRoom.modifiedCount===0){
        throw new APIError(500,"Failed to update element in room");
    }
    socket.to(roomId).emit("elementUpdated",{old:oldElement,new:newElement});
    return {
        message:"Element updated in room successfully",
        old:oldElement,
        new:newElement,
        roomId:roomId
    }
}

export {addElementToRoom,removeElementFromRoom,updateElementInRoom};
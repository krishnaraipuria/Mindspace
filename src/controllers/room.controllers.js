import crypto from "crypto";

import { APIError } from "../utils/APIerror.js";
import {APIResponse} from "../utils/APIResponse.js";
import {Room} from "../models/room.models.js";
import {Member} from "../models/member.models.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const createRoom=asyncHandler(async(req,res)=>{
    const {username}=req.body;
    if(!username || username.trim()===""){
        throw new APIError(400,"Username is required")
    }
    if(!req.socketId){
        throw new APIError(400,"Socket ID is required")
    }
    const createRoomId=crypto.randomBytes(4).toString("hex");
    const ownershipToken=crypto.randomBytes(32).toString("hex");
    const ownershipTokenHash=crypto.createHash("sha256").update(ownershipToken).digest("hex");
    const room=await Room.create({
        roomId:createRoomId,
        OwnershipToken:ownershipTokenHash
    })
    // console.log("Client IP:", req.ip);
    const member=await Member.create({
        username:username,
        roomId:room._id,
        socketId:req.socketId,
        role:"admin",
    })
    await req.ioSocket.join(createRoomId);
    return res.status(201).json(
        new APIResponse(201,{roomId:room.roomId, ownershipToken}, "Room created successfully")
    )
})

const JoinRoom=asyncHandler(async(req,res)=>{
    const {username,roomId}=req.body;
    const hostToken=req.headers["ownership-token"];
    const hostTokenHash=hostToken?crypto.createHash("sha256").update(hostToken).digest("hex"):null;

    if(!username || username.trim()===""){
        throw new APIError(400,"Username is required")
    }
    if(!roomId){
        throw new APIError(400,"Room ID is required")
    }
    if(!req.socketId){
        throw new APIError(400,"Socket ID is required")
    }
    const room=await Room.findOne({roomId:roomId}).select("+OwnershipToken");
    if(!room){
        throw new APIError(404,"Room not found")
    }
    if(hostToken && hostTokenHash===room.OwnershipToken){
        const Admin=await Member.create({
            username:username,
            roomId:room._id,
            socketId:req.socketId,
            role:"admin",
        })
        await req.ioSocket.join(roomId);
        return res.status(200).json(
            new APIResponse(200,{room,Admin}, "Room joined successfully as admin")
        )
    }
    const member=await Member.create({
        username:username,
        roomId:room._id,
        socketId:req.socketId,
        role:"member",
    })
    await req.ioSocket.join(roomId);
    return res.status(200).json(
        new APIResponse(200,{room,member}, "Room joined successfully")
    )
})

const saveRoom=asyncHandler(async(req,res)=>{
    const {roomId}=req.body;
    const hostToken=req.headers["ownership-token"];
    if(!roomId?.trim()){
        throw new APIError(400,"Room ID is required")
    }
    const room=await Room.findOne({roomId:roomId}).select("+OwnershipToken");
    if(!room){
        throw new APIError(404,"Room not found")
    }
    if(!hostToken?.trim()){
        throw new APIError(400,"Ownership token is required")
    }
    const hostTokenHash=crypto.createHash("sha256").update(hostToken).digest("hex");
    // console.log("hostTokenHash:",hostTokenHash);
    // console.log("room.OwnershipToken:",room.OwnershipToken);
    if(hostTokenHash!==room.OwnershipToken){
        throw new APIError(403,"Invalid ownership token")
    }
    const isAdmin=await Member.findOne({roomId:room._id,role:"admin"});
    if(!isAdmin){
        throw new APIError(403,"You are not the admin of this room")
    }
    room.isSaved=true;
    room.savedKey=crypto.randomBytes(16).toString("hex");
    await room.save();
    return res.status(200).json(
        new APIResponse(200,{roomId:room.roomId,savedKey:room.savedKey}, "Your room has been saved successfully. You can share the saved key with others to join the room.")
    )
})

const UnsaveRoom=asyncHandler(async(req,res)=>{
    const {roomId}=req.body;
    const hostToken=req.headers["ownership-token"];
    if(!roomId?.trim()){
        throw new APIError(400,"Room ID is required")
    }
    if(!hostToken?.trim()){
        throw new APIError(400,"Ownership token is required")
    }
    const room=await Room.findOne(
        {
            roomId:roomId.trim(),
        }
    ).select("+OwnershipToken");

    if(!room){
        throw new APIError(404,"Room not found")
    }
    const hostTokenHash=crypto.createHash("sha256").update(hostToken).digest("hex");
    if(hostTokenHash!==room.OwnershipToken){
        throw new APIError(403,"Invalid ownership token")
    }
    room.isSaved=false;
    room.savedKey=null;
    await room.save();
    return res.status(200).json(
        new APIResponse(200,{roomId:room.roomId}, "Your room has been unsaved successfully when everyone has left the room, the room will be deleted automatically. You can save it again if you want to keep it.")
    )
})
    
export {createRoom,JoinRoom,saveRoom,UnsaveRoom};
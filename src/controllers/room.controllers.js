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
    const room=await Room.create({
        roomId:createRoomId,
    })
    const member=await Member.create({
        username:username,
        roomId:room._id,
        socketId:req.socketId,
        role:"admin"
    })
    await req.socket.join(createRoomId);
    return res.status(201).json(
        new APIResponse(201,{room,member}, "Room created successfully")
    )
})

const JoinRoom=asyncHandler(async(req,res)=>{
    const {username,roomId}=req.body;
    if(!username || username.trim()===""){
        throw new APIError(400,"Username is required")
    }
    if(!roomId){
        throw new APIError(400,"Room ID is required")
    }
    if(!req.socketId){
        throw new APIError(400,"Socket ID is required")
    }
    const room=await Room.findOne({roomId:roomId});
    if(!room){
        throw new APIError(404,"Room not found")
    }
    const member=await Member.create({
        username:username,
        roomId:room._id,
        socketId:req.socketId,
        role:"member"
    })
    await req.socket.join(roomId);
    return res.status(200).json(
        new APIResponse(200,{room,member}, "Room joined successfully")
    )
})




export {createRoom,JoinRoom};
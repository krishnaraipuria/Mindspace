import { APIError } from "../utils/APIerror.js";
import {asyncHandler} from "../utils/asyncHandler.js";
const socket=asyncHandler(async(req,_,next)=>{
    
    const socketId=req.headers["socket-id"];
    if(!socketId){
        throw new APIError(400,"Socket ID is required")
    }
    const io=req.app.get("io");
    if(!io){
        throw new APIError(500,"Socket IO is not initialized")
    }
    const ioSocket=io.sockets.sockets.get(socketId);
    if(!ioSocket || ioSocket.disconnected){
        throw new APIError(404,"Socket not found")
    }
    req.ioSocket = ioSocket;
    req.socketId = ioSocket.id;
    next();
})

export {socket}
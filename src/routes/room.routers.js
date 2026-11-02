import { Router } from "express";
import { createRoom, JoinRoom,saveRoom,UnsaveRoom} from "../controllers/room.controllers.js";
import { socket } from "../middlewares/socket.middleware.js";
const router = Router();




router.delete("/delete-room",socket,UnsaveRoom);
router.patch("/save-room",socket,saveRoom);
router.post("/create-room",socket,createRoom);
router.post("/join-room",socket,JoinRoom);

export default router
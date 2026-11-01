import { Router } from "express";
import { createRoom, JoinRoom } from "../controllers/room.controllers.js";
import { socket } from "../middlewares/socket.middleware.js";
const router = Router();

router.use(socket);
router.post("/create-room",createRoom);
router.post("/join-room",JoinRoom);

export default router
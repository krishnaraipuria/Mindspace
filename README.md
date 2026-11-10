# MindSpace

**A real-time collaborative whiteboard. Think, draw and collaborate in one shared space.**

## Overview

MindSpace lets people create a whiteboard room or join an existing room using a room ID or saved key. Everyone in the same room can draw, add shapes and text, and see updates in real time. No account is required.

## Live Demo

- **Frontend:** https://mindspace-vhmt.onrender.com/
- **Backend:** https://mindspace-server-cuvi.onrender.com/
- **API Base URL:** https://mindspace-server-cuvi.onrender.com/api/v1/room

## Features

- **No sign-up required:** Enter a username and create a room or join using a Room ID or saved key.
- **Real-time collaboration:** Multiple participants can draw, write, and erase together, with instant synchronization.
- **Live drawing:** Strokes are visible to other participants while they are being drawn.
- **Drawing tools:** Select, pen, rectangle, ellipse, arrow, text, and eraser.
- **Custom styling:** Choose colours, stroke width, fill, and hand-drawn styles.
- **Room management:** Shareable room links, unique Room IDs, live participant lists, and host identification.
- **Host controls:** Host-only save and unsave permissions, with ownership verification.
- **Persistent boards:** Saved whiteboards can be reopened using a unique save key.
- **Reconnection:** Participants can rejoin after refreshing or losing connection, with host privileges restored through ownership verification.

## Tech Stack

| Part | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Drawing | HTML Canvas, Rough.js |
| Real-time communication | Socket.IO |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Deployment | Render |

## API Endpoints & Socket.IO Events

All REST endpoints use this base URL:

```text
https://mindspace-server-cuvi.onrender.com/api/v1/room
```

### REST API

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/create-room` | Create a room |
| `POST` | `/join-room` | Join a room using its ID or saved key |
| `PATCH` | `/save-room` | Save a room (host only) |
| `DELETE` | `/delete-room` | Unsave a room (host only) |

Room requests use the `socket-id` header. Host actions also use the `ownership-token` header.

### Socket.IO Events

| Direction | Event | Purpose |
|---|---|---|
| Client → Server | `board:element:add` | Add a drawing element |
| Client → Server | `board:element:remove` | Remove a drawing element |
| Client → Server | `board:element:update` | Update a drawing element |
| Client → Server | `board:draft` | Share an in-progress drawing preview |
| Server → Clients | `elementAdded` | Notify the room about a new element |
| Server → Clients | `elementRemoved` | Notify the room about a removed element |
| Server → Clients | `elementUpdated` | Notify the room about an updated element |
| Server → Clients | `room:members` | Send the current participant list |
| Server → Clients | `room:saveState` | Notify the room when save status changes |
| Server → Clients | `board:draft` | Show another participant's live drawing preview |

## Project Structure

```text
MindSpace/
├── src/                     
│   ├── controllers/
│   ├── db/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── sockets/
│   ├── utils/
│   ├── app.js
│   └── index.js
│
└── frontend/                 
    └── src/
        ├── components/
        ├── context/
        ├── hooks/
        ├── lib/
        ├── pages/
        ├── App.jsx
        └── main.jsx
```

## What I Learned

- Developed REST APIs for room creation, joining, and management using Node.js and Express.js.
- Implemented real-time room-based communication using Socket.IO.
- Designed MongoDB schemas for room, member, and whiteboard data using Mongoose.
- Implemented real-time synchronization of drawing elements between connected participants.
- Managed socket connections, participant disconnections, and automatic room cleanup.
- Implemented room access control and host verification using SHA-256 hashed ownership tokens.
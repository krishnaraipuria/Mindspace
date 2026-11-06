# MindSpace

🚧 **BUILD STATUS: IN PROGRESS**

MindSpace is a real-time collaborative whiteboard. Enter a name, create or join a room, and everyone in the room draws on the same board at the same time.

**Currently under development, with a focus on building a seamless real-time collaboration experience.**

## Features

- **No sign-up:** enter a name, then create a room or join one with a Room ID or saved key
- **Real-time drawing:** everyone in a room can draw, write and erase, and changes appear instantly for all members
- **Live strokes:** other people see your stroke while you are still drawing it
- **Tools:** select, pen, rectangle, ellipse, arrow, text and eraser
- **Styling:** colours, stroke width, fill, and an optional hand-drawn look
- **Members list:** avatars at the top right show who is in the room, with the host marked
- **Room ID for everyone:** always visible, with copy and a shareable invite link
- **Host controls:** only the host can save a room, see its saved key, or unsave it
- **Saved rooms:** a saved room survives after everyone leaves and can be reopened with its key
- **Reconnect:** a refresh or dropped connection rejoins the room automatically, and the host stays host

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, roughjs, socket.io-client
- **Backend:** Node.js, Express, Socket.IO, MongoDB (Mongoose)
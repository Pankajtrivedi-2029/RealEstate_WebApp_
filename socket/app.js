import { Server } from "socket.io";

const io = new Server({
  cors: {
    origin: process.env.NODE_ENV === "production" ? "https://frontend-url.com" : "http://localhost:5173",
  },
});

let onlineUser = {}; // Using an object for faster lookup

const addUser = (userId, socketId) => {
  if (!onlineUser[userId]) {
    onlineUser[userId] = socketId;
  }
};

const removeUser = (socketId) => {
  for (let userId in onlineUser) {
    if (onlineUser[userId] === socketId) {
      delete onlineUser[userId];
      break;
    }
  }
};

const getUser = (userId) => {
  return onlineUser[userId];
};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("newUser", (userId) => {
    addUser(userId, socket.id);
    socket.emit("userConnected", { userId, socketId: socket.id });
  });

  socket.on("sendMessage", ({ receiverId, data }) => {
    const receiver = getUser(receiverId);
    if (receiver) {
      io.to(receiver).emit("getMessage", data);
    } else {
      console.log("User not found or offline");
    }
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
    console.log("User disconnected:", socket.id);
  });
});

io.listen(4000,()=>{
  console.log('server is listening on port 4000')
});

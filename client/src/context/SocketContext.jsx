import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext();

export const SocketContextProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io("http://localhost:4000");

    // Handle socket connection errors
    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    setSocket(newSocket);

    // Cleanup the socket connection on component unmount
    return () => {
      newSocket.close();
    };
  }, []); // Empty dependency array ensures this effect runs only once when the component mounts

  useEffect(() => {
    // Emit event when currentUser and socket are available
    if (currentUser && socket) {
      socket.emit("newUser", currentUser.id);
    }
  }, [currentUser, socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

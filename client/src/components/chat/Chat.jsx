import { useContext, useEffect, useRef, useState } from "react";
import "./chat.scss";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import { format } from "timeago.js";
import { SocketContext } from "../../context/SocketContext";
import { useNotificationStore } from "../../lib/notificationStore";

function Chat({ chats }) {
  const [chat, setChat] = useState(null);
  const { currentUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const messageEndRef = useRef();
  const decreaseNotification = useNotificationStore((state) => state.decrease);

  // Scroll to the bottom of chat messages when they update
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  // Open a chat and fetch messages
  const handleOpenChat = async (id, receiver) => {
    try {
      const res = await apiRequest.get(`/chats/${id}`);
      if (!res.data.seenBy.includes(currentUser.id)) {
        decreaseNotification();
      }
      setChat({ ...res.data, receiver });
    } catch (err) {
      console.error("Error fetching chat:", err);
    }
  };

  // Handle sending a message
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const text = formData.get("text");

    if (!text) return;

    try {
      const res = await apiRequest.post(`/messages/${chat.id}`, { text });
      setChat((prev) => ({ ...prev, messages: [...prev.messages, res.data] }));
      e.target.reset();

      // Emit the message to the socket server
      socket.emit("sendMessage", {
        receiverId: chat.receiver.id,
        data: res.data,
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Handle receiving messages via socket
  useEffect(() => {
    const readChat = async () => {
      try {
        await apiRequest.put(`/chats/read/${chat.id}`);
      } catch (err) {
        console.error("Error marking chat as read:", err);
      }
    };

    if (chat && socket) {
      const messageListener = (data) => {
        if (chat.id === data.chatId) {
          setChat((prev) => ({ ...prev, messages: [...prev.messages, data] }));
          readChat();
        }
      };

      socket.on("getMessage", messageListener);

      return () => {
        socket.off("getMessage", messageListener);
      };
    }
  }, [socket, chat]);

  return (
    <div className="chat">
      {/* List of messages */}
      <div className="messages">
        <h1>Messages</h1>
        {chats?.length > 0 ? (
          chats.map((c) => (
            <div
              className="message"
              key={c.id}
              style={{
                backgroundColor:
                  c.seenBy.includes(currentUser.id) || chat?.id === c.id
                    ? "white"
                    : "#fecd514e",
              }}
              onClick={() => handleOpenChat(c.id, c.receiver)}
            >
              <img src={c.receiver.avatar || "/noavatar.jpg"} alt="" />
              <span>{c.receiver.username}</span>
              <p>{c.lastMessage}</p>
            </div>
          ))
        ) : (
          <p>No chats available.</p>
        )}
      </div>

      {/* Chat box for the selected chat */}
      {chat && (
        <div className="chatBox">
          <div className="top">
            <div className="user">
              <img src={chat.receiver.avatar || "/noavatar.jpg"} alt="" />
              {chat.receiver.username}
            </div>
            <span className="close" onClick={() => setChat(null)}>
              X
            </span>
          </div>
          <div className="center">
            {chat.messages.map((message) => (
              <div
                className="chatMessage"
                style={{
                  alignSelf:
                    message.userId === currentUser.id
                      ? "flex-end"
                      : "flex-start",
                  textAlign:
                    message.userId === currentUser.id ? "right" : "left",
                }}
                key={message.id}
              >
                <p>{message.text}</p>
                <span>{format(message.createdAt)}</span>
                {/* shows how much time it's been sending/receiving the msg */}
              </div>
            ))}
            <div ref={messageEndRef}></div>
          </div>
          <form onSubmit={handleSubmit} className="bottom">
            <textarea
              name="text"
              placeholder="Type a message..."
              required
            ></textarea>
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Chat;

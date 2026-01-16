import { useSelector } from "react-redux";
import ChatArea from "./components/chat";
import Header from "./components/header";
import Sidebar from "./components/sidebar";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";

const socket = io("https://quick-chat-app-rql3.onrender.com", {
  transports: ["websocket", "polling"],
});

function Home() {
  const { selectedChat, user } = useSelector(
    (state) => state.userReducer
  );

  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user) return;

    socket.emit("join-room", user._id);
    socket.emit("user-login", user._id);

    socket.on("online-users", setOnlineUsers);
    socket.on("online-users-updated", setOnlineUsers);

    return () => {
      socket.off("online-users");
      socket.off("online-users-updated");
    };
  }, [user]);

  return (
    <div className="home-page">
      <Header socket={socket} />
      <div className="main-content">
        <Sidebar socket={socket} onlineUsers={onlineUsers} />
        {selectedChat && <ChatArea socket={socket} />}
      </div>
    </div>
  );
}

export default Home;

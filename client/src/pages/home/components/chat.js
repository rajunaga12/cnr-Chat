import { useDispatch, useSelector } from "react-redux";
import { createNewMessage, getAllMessages } from "../../../apiCalls/message";
import { hideLoader, showLoader } from "../../../redux/loaderSlice";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { clearUnreadMessageCount } from "../../../apiCalls/chat";
import moment from "moment";
import store from "../../../redux/store";
import { setAllChats } from "../../../redux/usersSlice";
import EmojiPicker from "emoji-picker-react";

function ChatArea({ socket }) {
  // ✅ HOOKS FIRST (NO CONDITIONS)
  const dispatch = useDispatch();
  const { selectedChat, user, allChats } = useSelector(
    (state) => state.userReducer
  );

  const [message, setMessage] = useState("");
  const [allMessages, setAllMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [data, setData] = useState(null);

  // ✅ SAFE selected user
  const selectedUser =
    selectedChat?.members?.find((u) => u._id !== user?._id) || null;

  // ---------------- SEND MESSAGE ----------------
  const sendMessage = async (image = "") => {
    if (!selectedChat || (!message && !image)) return;

    try {
      const newMessage = {
        chatId: selectedChat._id,
        sender: user._id,
        text: message,
        image,
      };

      socket.emit("send-message", {
        ...newMessage,
        members: selectedChat.members.map((m) => m._id),
        read: false,
        createdAt: moment().toISOString(),
      });

      const response = await createNewMessage(newMessage);

      if (response.success) {
        setMessage("");
        setShowEmojiPicker(false);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ---------------- FORMAT TIME ----------------
  const formatTime = (timestamp) => {
    const diff = moment().diff(moment(timestamp), "days");
    if (diff < 1) return `Today ${moment(timestamp).format("hh:mm A")}`;
    if (diff === 1) return `Yesterday ${moment(timestamp).format("hh:mm A")}`;
    return moment(timestamp).format("MMM D, hh:mm A");
  };

  // ---------------- GET MESSAGES ----------------
  const getMessages = async () => {
    if (!selectedChat) return;

    try {
      dispatch(showLoader());
      const response = await getAllMessages(selectedChat._id);
      dispatch(hideLoader());
      if (response.success) setAllMessages(response.data);
    } catch (error) {
      dispatch(hideLoader());
      toast.error(error.message);
    }
  };

  // ---------------- CLEAR UNREAD ----------------
  const clearUnreadMessages = async () => {
    if (!selectedChat) return;

    try {
      socket.emit("clear-unread-messages", {
        chatId: selectedChat._id,
        members: selectedChat.members.map((m) => m._id),
      });

      const response = await clearUnreadMessageCount(selectedChat._id);

      if (response.success) {
        const updated = allChats.map((chat) =>
          chat._id === selectedChat._id
            ? { ...chat, unreadMessageCount: 0 }
            : chat
        );
        dispatch(setAllChats(updated));
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ---------------- SEND IMAGE ----------------
  const sendImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => sendMessage(reader.result);
  };

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    if (!selectedChat) return;

    getMessages();

    if (selectedChat.lastMessage?.sender !== user._id) {
      clearUnreadMessages();
    }

    const receiveHandler = (msg) => {
      const { selectedChat } = store.getState().userReducer;
      if (selectedChat?._id === msg.chatId) {
        setAllMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receive-message", receiveHandler);

    socket.on("started-typing", (typingData) => {
      setData(typingData);
      if (
        typingData.chatId === selectedChat._id &&
        typingData.sender !== user._id
      ) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    });

    return () => {
      socket.off("receive-message", receiveHandler);
    };
  }, [selectedChat]);

  useEffect(() => {
    const el = document.getElementById("main-chat-area");
    if (el) el.scrollTop = el.scrollHeight;
  }, [allMessages, isTyping]);

  // ✅ CONDITIONAL RENDER AFTER HOOKS
  if (!selectedChat || !selectedUser) {
    return <div className="empty-chat">Select a chat</div>;
  }

  // ---------------- RENDER ----------------
  return (
    <div className="app-chat-area">
      <div className="app-chat-area-header">
        {selectedUser.firstname} {selectedUser.lastname}
      </div>

      <div className="main-chat-area" id="main-chat-area">
        {allMessages.map((msg) => {
          const isMe = msg.sender === user._id;
          return (
            <div
              key={msg._id}
              className="message-container"
              style={{ justifyContent: isMe ? "end" : "start" }}
            >
              <div className={isMe ? "send-message" : "received-message"}>
                <div>{msg.text}</div>
                {msg.image && (
                  <img src={msg.image} alt="attachment" height="120" />
                )}
              </div>
              <div className="message-timestamp">
                {formatTime(msg.createdAt)}
              </div>
            </div>
          );
        })}
      </div>

      {showEmojiPicker && (
        <EmojiPicker onEmojiClick={(e) => setMessage(message + e.emoji)} />
      )}

      <div className="send-message-div">
        <input
          type="text"
          className="send-message-input"
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <label htmlFor="file">
          <i className="fa fa-picture-o send-image-btn" />
          <input
            type="file"
            id="file"
            hidden
            accept="image/*"
            onChange={sendImage}
          />
        </label>

        <button
          className="fa fa-smile-o send-emoji-btn"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        />
        <button
          className="fa fa-paper-plane send-message-btn"
          onClick={() => sendMessage()}
        />
      </div>
    </div>
  );
}

export default ChatArea;

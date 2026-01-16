import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { createNewChat } from "../../../apiCalls/chat";
import { hideLoader, showLoader } from "../../../redux/loaderSlice";
import { setAllChats, setSelectedChat } from "../../../redux/usersSlice";
import moment from "moment";
import { useEffect } from "react";
import store from "../../../redux/store";

function UsersList({ searchKey, socket, onlineUser = [] }) {
  const dispatch = useDispatch();

  const {
    allUsers = [],
    allChats = [],
    user: currentUser,
    selectedChat,
  } = useSelector((state) => state.userReducer);

  // ---------------- START CHAT ----------------
  const startNewChat = async (userId, e) => {
    e.stopPropagation(); // 🔥 IMPORTANT FIX

    if (!currentUser?._id || !userId) return;

    try {
      dispatch(showLoader());
      const res = await createNewChat([currentUser._id, userId]);
      dispatch(hideLoader());

      if (res.success) {
        dispatch(setAllChats([...allChats, res.data]));
        dispatch(setSelectedChat(res.data));
        toast.success(res.message);
      }
    } catch {
      dispatch(hideLoader());
      toast.error("Failed to start chat");
    }
  };

  // ---------------- OPEN CHAT ----------------
  const openChat = (userId) => {
    if (!userId || !currentUser?._id) return;

    const chat = allChats.find(
      (c) =>
        Array.isArray(c.members) &&
        c.members.some((m) => m._id === currentUser._id) &&
        c.members.some((m) => m._id === userId)
    );

    if (chat) dispatch(setSelectedChat(chat));
  };

  const isSelectedChat = (userId) =>
    selectedChat?.members?.some((m) => m._id === userId);

  // ---------------- LAST MESSAGE ----------------
  const getLastMessage = (userId) => {
    const chat = allChats.find((c) =>
      c.members?.some((m) => m._id === userId)
    );

    if (!chat?.lastMessage) return "";
    return (
      (chat.lastMessage.sender === currentUser._id ? "You: " : "") +
      chat.lastMessage.text?.slice(0, 25)
    );
  };

  const getLastTime = (userId) => {
    const chat = allChats.find((c) =>
      c.members?.some((m) => m._id === userId)
    );
    return chat?.lastMessage
      ? moment(chat.lastMessage.createdAt).format("hh:mm A")
      : "";
  };

  const getUnreadCount = (userId) => {
    const chat = allChats.find((c) =>
      c.members?.some((m) => m._id === userId)
    );

    if (
      chat?.unreadMessageCount &&
      chat.lastMessage?.sender !== currentUser._id
    ) {
      return (
        <div className="unread-message-counter">
          {chat.unreadMessageCount}
        </div>
      );
    }
    return null;
  };

  // ---------------- SOCKET LISTENER ----------------
  useEffect(() => {
    if (!socket) return;

    const handler = (message) => {
      const { selectedChat, allChats } = store.getState().userReducer;

      let updated = [...allChats];

      if (selectedChat?._id !== message.chatId) {
        updated = updated.map((c) =>
          c._id === message.chatId
            ? {
                ...c,
                unreadMessageCount: (c.unreadMessageCount || 0) + 1,
                lastMessage: message,
              }
            : c
        );
      }

      const latest = updated.find((c) => c._id === message.chatId);
      const rest = updated.filter((c) => c._id !== message.chatId);

      dispatch(setAllChats(latest ? [latest, ...rest] : updated));
    };

    socket.on("set-message-count", handler);
    return () => socket.off("set-message-count", handler);
  }, [socket, dispatch]);

  // ---------------- DATA SOURCE ----------------
  const data = searchKey
    ? allUsers.filter(
        (u) =>
          u.firstname?.toLowerCase().includes(searchKey.toLowerCase()) ||
          u.lastname?.toLowerCase().includes(searchKey.toLowerCase())
      )
    : allChats;

  // ---------------- RENDER ----------------
  return data.map((obj) => {
    let user = obj;

    if (obj.members) {
      user = obj.members.find((m) => m._id !== currentUser._id);
    }

    if (!user?._id) return null;

    return (
      <div
        key={user._id}
        className="user-search-filter"
        onClick={() => openChat(user._id)}
      >
        <div className={isSelectedChat(user._id) ? "selected-user" : "filtered-user"}>
          <div className="filter-user-display">

            {/* AVATAR + ONLINE DOT */}
            <div className="avatar-wrapper">
              {user.profilePic ? (
                <img src={user.profilePic} className="user-profile-image" />
              ) : (
                <div className="user-default-avatar">
                  {user.firstname?.[0]}
                  {user.lastname?.[0]}
                </div>
              )}
              {onlineUser.includes(user._id) && <span className="online-dot"></span>}
            </div>

            {/* DETAILS */}
            <div className="filter-user-details">
              <div className="user-display-name">
                {user.firstname} {user.lastname}
              </div>
              <div className="user-display-email">
                {getLastMessage(user._id) || user.email}
              </div>
            </div>

            {/* META */}
            <div>
              {getUnreadCount(user._id)}
              <div className="last-message-timestamp">
                {getLastTime(user._id)}
              </div>
            </div>

            {/* START CHAT BUTTON */}
            {!allChats.some((c) =>
              c.members?.some((m) => m._id === user._id)
            ) && (
              <div className="user-start-chat">
                <button
                  className="user-start-chat-btn"
                  onClick={(e) => startNewChat(user._id, e)}
                >
                  Start Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  });
}

export default UsersList;

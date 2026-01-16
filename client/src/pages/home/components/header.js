import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

function Header({ socket }) {
  const { user } = useSelector((state) => state.userReducer);
  const navigate = useNavigate();

  function getFullname() {
    if (!user?.firstname || !user?.lastname) return "";

    const fname =
      user.firstname.charAt(0).toUpperCase() +
      user.firstname.slice(1).toLowerCase();

    const lname =
      user.lastname.charAt(0).toUpperCase() +
      user.lastname.slice(1).toLowerCase();

    return `${fname} ${lname}`;
  }

  function getInitials() {
    if (!user?.firstname || !user?.lastname) return "";

    const f = user.firstname.charAt(0).toUpperCase();
    const l = user.lastname.charAt(0).toUpperCase();

    return `${f}${l}`;
  }

  const logout = () => {
    localStorage.removeItem("token");
    socket.emit("user-offline", user?._id);
    navigate("/login");
  };

  return (
    <div className="app-header">
      <div className="app-logo">
        <i className="fa fa-comments" aria-hidden="true"></i>
        CNR Chat
      </div>

      <div className="app-user-profile">
        {user?.profilePic ? (
          <img
            src={user.profilePic}
            alt="User avatar"
            className="logged-user-profile-pic"
            onClick={() => navigate("/profile")}
          />
        ) : (
          <div
            className="logged-user-profile-pic"
            onClick={() => navigate("/profile")}
          >
            {getInitials()}
          </div>
        )}

        <div className="logged-user-name">{getFullname()}</div>

        <button className="logout-button" onClick={logout}>
          <i className="fa fa-power-off"></i>
        </button>
      </div>
    </div>
  );
}

export default Header;

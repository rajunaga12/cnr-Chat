import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "./../../apiCalls/auth";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { hideLoader, showLoader } from "../../redux/loaderSlice";

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [user, setUser] = React.useState({
    email: "",
    password: "",
  });

  async function onFormSubmit(event) {
    event.preventDefault();

    try {
      dispatch(showLoader());

      const response = await loginUser(user);

      if (response.success) {
        toast.success(response.message);

        // Save token
        localStorage.setItem("token", response.token);

        // Navigate without reload
        navigate("/");
      } else {
        toast.error(response.message || "Login failed");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Something went wrong"
      );
    } finally {
      dispatch(hideLoader());
    }
  }

  return (
    <div className="container">
      <div className="container-back-img"></div>
      <div className="container-back-color"></div>

      <div className="card">
        <div className="card_title">
          <h1>Login Here</h1>
        </div>

        <div className="form">
          <form onSubmit={onFormSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={user.email}
              onChange={(e) =>
                setUser({ ...user, email: e.target.value })
              }
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={user.password}
              onChange={(e) =>
                setUser({ ...user, password: e.target.value })
              }
              required
            />

            <button type="submit">Login</button>
          </form>
        </div>

        <div className="card_terms">
          <span>
            Don't have an account yet?
            <Link to="/signup"> Signup Here</Link>
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;

import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getLoggedUser, getAllUsers } from "../apiCalls/users";
import { useDispatch, useSelector } from "react-redux";
import { hideLoader, showLoader } from "../redux/loaderSlice";
import toast from "react-hot-toast";
import { setAllUsers, setUser, setAllChats } from "../redux/usersSlice";
import { getAllChats } from "../apiCalls/chat";

function ProtectedRoute({ children }) {
  const { user } = useSelector((state) => state.userReducer);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const getLoggedInUser = useCallback(async () => {
    try {
      dispatch(showLoader());
      const response = await getLoggedUser();
      dispatch(hideLoader());

      if (response.success) {
        dispatch(setUser(response.data));
      } else {
        toast.error(response.message);
        navigate("/login");
      }
    } catch (error) {
      dispatch(hideLoader());
      navigate("/login");
    }
  }, [dispatch, navigate]);

  const getAllUsersFromDb = useCallback(async () => {
    try {
      dispatch(showLoader());
      const response = await getAllUsers();
      dispatch(hideLoader());

      if (response.success) {
        dispatch(setAllUsers(response.data));
      } else {
        toast.error(response.message);
        navigate("/login");
      }
    } catch (error) {
      dispatch(hideLoader());
      navigate("/login");
    }
  }, [dispatch, navigate]);

  const getCurrentUserChats = useCallback(async () => {
    try {
      const response = await getAllChats();
      if (response.success) {
        dispatch(setAllChats(response.data));
      }
    } catch (error) {
      navigate("/login");
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      getLoggedInUser();
      getAllUsersFromDb();
      getCurrentUserChats();
    } else {
      navigate("/login");
    }
  }, [
    getLoggedInUser,
    getAllUsersFromDb,
    getCurrentUserChats,
    navigate
  ]);

  return <>{children}</>;
}

export default ProtectedRoute;

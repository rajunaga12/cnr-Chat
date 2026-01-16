import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://cnr-chat-server.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Always attach latest token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

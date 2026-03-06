import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // e.g. http://localhost:5000
  withCredentials: true, // if your backend uses cookies
});

// api.interceptors.request.use((config) => {
//   // If you use JWT in localStorage
//   const token = localStorage.getItem("token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken"); // ✅ correct
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
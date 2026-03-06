// import axios from "axios";

// export const http = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
// });

// http.interceptors.request.use((config) => {
//   const token = localStorage.getItem("accessToken");
//   if (token) config.headers.Authorization = `Bearer ${token}`;

//   // active club context stored in localStorage
//   const activeClubId = localStorage.getItem("activeClubId");
//   if (activeClubId) config.headers["x-club-id"] = activeClubId;

//   return config;
// });
















import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  // withCredentials: true, 
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken"); // ✅ match login key
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const activeClubId = localStorage.getItem("activeClubId");
  if (activeClubId) config.headers["x-club-id"] = activeClubId;

  return config;

  
});
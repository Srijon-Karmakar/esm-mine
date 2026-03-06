import { http } from "./http";

export const authApi = {
  me: () => http.get("/auth/me").then(r => r.data),
};

export const dashboardApi = {
  overview: (as?: string) =>
    http.get("/dashboard/overview", { params: { as } }).then(r => r.data),

  charts: (range: string, as?: string) =>
    http.get("/dashboard/charts", { params: { range, as } }).then(r => r.data),

  recent: (limit = 10, as?: string) =>
    http.get("/dashboard/recent", { params: { limit, as } }).then(r => r.data),
};
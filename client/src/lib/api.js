import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
export const apiConfigurationError = apiBaseUrl
  ? null
  : "VITE_API_BASE_URL is required";

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status ?? 0;
    const message =
      error.response?.data?.message ??
      (status
        ? "The request could not be completed. Please try again."
        : "The server is unavailable. Try again in a moment.");
    const normalized = Object.assign(new Error(message), {
      status,
      fieldErrors: error.response?.data?.fieldErrors ?? {},
    });
    if (
      status === 401 &&
      !error.config?.url?.includes("/auth/me") &&
      !error.config?.url?.includes("/auth/login")
    )
      onUnauthorized?.();
    return Promise.reject(normalized);
  },
);

export const api = {
  login: (body) =>
    apiClient.post("/auth/login", body).then(({ data }) => data.user),
  me: () => apiClient.get("/auth/me").then(({ data }) => data.user),
  logout: () => apiClient.post("/auth/logout"),
  activeCycle: () =>
    apiClient.get("/cycles/active").then(({ data }) => data.cycle),
  employeeGoals: () =>
    apiClient.get("/employee/goals").then(({ data }) => data.goals),
  createGoal: (body) =>
    apiClient.post("/employee/goals", body).then(({ data }) => data.goal),
  updateGoal: (id, body) =>
    apiClient.put(`/employee/goals/${id}`, body).then(({ data }) => data.goal),
  deleteGoal: (id) => apiClient.delete(`/employee/goals/${id}`),
  submitPlan: () =>
    apiClient.post("/employee/goals/submit").then(({ data }) => data.goals),
  employeeCheckIns: () =>
    apiClient.get("/employee/check-ins").then(({ data }) => data.goals),
  saveCheckIn: (id, quarter, body) =>
    apiClient
      .put(`/employee/check-ins/${id}/${quarter}`, body)
      .then(({ data }) => data.checkIn),
  managerGoals: () =>
    apiClient.get("/manager/goals").then(({ data }) => data.goals),
  managerUpdate: (id, body) =>
    apiClient.patch(`/manager/goals/${id}`, body).then(({ data }) => data.goal),
  approveGoal: (id) =>
    apiClient
      .post(`/manager/goals/${id}/approve`)
      .then(({ data }) => data.goal),
  rejectGoal: (id, managerNote) =>
    apiClient
      .post(`/manager/goals/${id}/reject`, { managerNote })
      .then(({ data }) => data.goal),
  managerCheckIns: () =>
    apiClient.get("/manager/check-ins").then(({ data }) => data.goals),
  commentCheckIn: (id, managerComment) =>
    apiClient
      .post(`/manager/check-ins/${id}/comment`, { managerComment })
      .then(({ data }) => data.checkIn),
  users: () => apiClient.get("/admin/users").then(({ data }) => data.users),
  updateUser: (id, body) =>
    apiClient.patch(`/admin/users/${id}`, body).then(({ data }) => data.user),
  hierarchy: () =>
    apiClient.get("/admin/hierarchy").then(({ data }) => data.hierarchy),
  cycles: () =>
    apiClient.get("/admin/cycle-configs").then(({ data }) => data.cycles),
  saveCycle: (body) =>
    apiClient.post("/admin/cycle-configs", body).then(({ data }) => data.cycle),
  unlockable: () =>
    apiClient.get("/admin/goals/unlockable").then(({ data }) => data.goals),
  unlock: (id, reason) =>
    apiClient
      .post(`/admin/goals/${id}/unlock`, { reason })
      .then(({ data }) => data.goal),
  audit: () =>
    apiClient.get("/admin/audit-logs").then(({ data }) => data.auditLogs),
  report: (params) =>
    apiClient
      .get("/reports/dashboard", { params })
      .then(({ data }) => data.dashboard),
};

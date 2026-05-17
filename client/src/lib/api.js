import axios from "axios";

const fallbackApiBaseUrl = `${window.location.protocol}//${window.location.hostname}:4000/api`;

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || fallbackApiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message ?? "API server is unreachable. Check the backend URL and CORS origin.";
    return Promise.reject(new Error(message));
  }
);

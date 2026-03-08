import axios from "axios";

const envApiUrl = import.meta.env.VITE_API_URL;

const baseURL =
  typeof envApiUrl === "string" && envApiUrl.trim().length > 0
    ? envApiUrl.trim()
    : "http://localhost:3333/api";

export const api = axios.create({
  baseURL,
});

export function setApiAuthToken(token: string | null) {
  if (token && token.trim().length > 0) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}
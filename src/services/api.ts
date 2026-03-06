import { io } from "socket.io-client";

const API_URL = ""; // Relative to host
const socket = io(API_URL);

export const getAuthToken = () => localStorage.getItem("token");
export const setAuthToken = (token: string) => localStorage.setItem("token", token);
export const removeAuthToken = () => localStorage.removeItem("token");

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    if (response.status === 401) {
      removeAuthToken();
      window.location.reload();
    }
    throw new Error(await response.text());
  }
  return response.json();
};

export const api = {
  signup: (data: any) => fetchWithAuth("/api/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  login: (data: any) => fetchWithAuth("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
  getQuizzes: () => fetchWithAuth("/api/quizzes"),
  createQuiz: (data: any) => fetchWithAuth("/api/quizzes", { method: "POST", body: JSON.stringify(data) }),
  submitQuiz: (id: string, score: number, timeTaken?: number, accuracy?: number) => 
    fetchWithAuth(`/api/quizzes/${id}/submit`, { method: "POST", body: JSON.stringify({ score, timeTaken, accuracy }) }),
  getStudentStats: () => fetchWithAuth("/api/stats/student"),
  getQuizSubmissions: (id: string) => fetchWithAuth(`/api/quizzes/${id}/submissions`),
  launchQuiz: (id: string) => fetchWithAuth(`/api/quizzes/${id}/launch`, { method: "POST" }),
  deleteQuiz: (id: string) => fetchWithAuth(`/api/quizzes/${id}`, { method: "DELETE" }),
};

export { socket };

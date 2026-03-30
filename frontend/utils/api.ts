import * as SecureStore from "expo-secure-store";

export const API_URL = "http://localhost:5500/api";

export async function getAuthenticatedHeader() {
  const token = await SecureStore.getItemAsync("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const headers = await getAuthenticatedHeader();
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.message || "Something went wrong");
  }
  return json;
}

export const appointmentsApi = {
  getAppointments: (status: "upcoming" | "past") =>
    apiFetch(`/appointments?status=${status}`),
  getAppointmentById: (id: string) => apiFetch(`/appointments/${id}`),
  createAppointment: (data: any) =>
    apiFetch("/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAppointment: (id: string, data: any) =>
    apiFetch(`/appointments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteAppointment: (id: string) =>
    apiFetch(`/appointments/${id}`, {
      method: "DELETE",
    }),
  getCalendar: (startDate: string, endDate: string) =>
    apiFetch(`/appointments/calendar?startDate=${startDate}&endDate=${endDate}`),
};

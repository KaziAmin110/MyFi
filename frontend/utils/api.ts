import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

export const API_URL = "http://localhost:5500/api";

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

async function refreshTokens() {
  const refreshToken = await SecureStore.getItemAsync("refreshToken");
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await fetch(`${API_URL}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.message || "Failed to refresh token");
  }

  await SecureStore.setItemAsync("token", json.accessToken);
  // Backend returns accessToken on refresh, we keep the original refreshToken or backend might rotate it.
  // In our case, the backend doesn't seem to rotate it in the refreshAccess controller.
  
  return json.accessToken;
}

export async function getAuthenticatedHeader() {
  const token = await SecureStore.getItemAsync("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const headers = await getAuthenticatedHeader();
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await refreshTokens();
          isRefreshing = false;
          onRefreshed(newToken);
        } catch (error) {
          isRefreshing = false;
          await SecureStore.deleteItemAsync("token");
          await SecureStore.deleteItemAsync("refreshToken");
          await SecureStore.deleteItemAsync("user");
          router.replace("/login");
          throw error;
        }
      }

      return new Promise((resolve) => {
        subscribeTokenRefresh(async (token) => {
          const retryHeaders = {
            ...headers,
            ...options.headers,
            Authorization: `Bearer ${token}`,
          };
          const retryResponse = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: retryHeaders,
          });
          resolve(await retryResponse.json());
        });
      });
    }

    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.message || "Something went wrong");
    }
    return json;
  } catch (error) {
    throw error;
  }
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

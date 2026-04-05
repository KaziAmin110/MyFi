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

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<any> {
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
      // A refresh is already in progress from another concurrent call — queue behind it
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(async (token) => {
            try {
              const retryResponse = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers: {
                  ...headers,
                  ...options.headers,
                  Authorization: `Bearer ${token}`,
                },
              });
              const retryJson = await retryResponse.json();
              if (!retryResponse.ok) {
                const err = new Error(
                  retryJson.message || "Something went wrong",
                ) as any;
                if (retryJson.code) err.code = retryJson.code;
                reject(err);
              } else {
                resolve(retryJson);
              }
            } catch (err) {
              reject(err);
            }
          });
        });
      }

      // First caller to hit 401 — kick off refresh, then retry own request directly
      isRefreshing = true;
      let newToken: string;
      try {
        newToken = await refreshTokens();
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        await SecureStore.deleteItemAsync("token");
        await SecureStore.deleteItemAsync("refreshToken");
        await SecureStore.deleteItemAsync("user");
        router.replace("/login");
        throw refreshError;
      }

      isRefreshing = false;
      onRefreshed(newToken); // notify any queued concurrent callers

      // Retry this request with the fresh token
      const retryResponse = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
      const retryJson = await retryResponse.json();
      if (!retryResponse.ok) {
        const retryErr = new Error(
          retryJson.message || "Something went wrong",
        ) as any;
        if (retryJson.code) retryErr.code = retryJson.code;
        throw retryErr;
      }
      return retryJson;
    }

    const json = await response.json();
    if (!response.ok) {
      const error = new Error(json.message || "Something went wrong") as any;
      if (json.code) error.code = json.code;
      throw error;
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
    apiFetch(
      `/appointments/calendar?startDate=${startDate}&endDate=${endDate}`,
    ),
};

export const userApi = {
  updateProfile: (data: any) =>
    apiFetch("/users/me/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateAvatar: (formData: FormData) =>
    apiFetch("/users/me/avatar", {
      method: "PUT",
      body: JSON.stringify(formData),
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  updateExpoPushToken: (token: string) =>
    apiFetch("/users/me/expo-push-token", {
      method: "PUT",
      body: JSON.stringify({ expo_push_token: token }),
    }),
};

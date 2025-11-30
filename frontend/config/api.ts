// API Configuration
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export const API_ENDPOINTS = {
  signUp: `${API_BASE_URL}/api/auth/sign-up`,
  signIn: `${API_BASE_URL}/api/auth/sign-in`,
  oauthSignIn: `${API_BASE_URL}/api/auth/oauth`,
  signOut: `${API_BASE_URL}/api/auth/sign-out`,
  forgotPassword: `${API_BASE_URL}/api/auth/forgot-password`,
  resetPassword: `${API_BASE_URL}/api/auth/reset-password`,
};

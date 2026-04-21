import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { getUserContext } from "./user.service";
import { API_URL as API_BASE_URL } from "../utils/api";

export interface HabitudeResult {
  not_me: number;
  thats_me: number;
  sometimes_me: number;
}

export interface AssessmentResultsData {
  giving: HabitudeResult;
  status: HabitudeResult;
  carefree: HabitudeResult;
  planning: HabitudeResult;
  security: HabitudeResult;
  spontaneous: HabitudeResult;
}

interface AssessmentResultContextType {
  resultData: AssessmentResultsData | null;
  loading: boolean;
  hasFetched: boolean;
  error: string | null;
  loadAssessmentResults: () => Promise<AssessmentResultsData | null>;
  clearAssessmentResults: () => void;
  setAssessmentResults: (data: AssessmentResultsData | null) => void;
}

async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync("token");
}

async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

export async function getAssessmentResults(
  sessionId: number
): Promise<AssessmentResultsData | null> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/assessments/sessions/${sessionId}/results`
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || "Failed to fetch assessment results");
  }

  if (!json.success) {
    return null;
  }

  return json.data ?? null;
}

const AssessmentResultContext = createContext<
  AssessmentResultContextType | undefined
>(undefined);

export const AssessmentResultProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [resultData, setResultData] = useState<AssessmentResultsData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssessmentResults = useCallback(async () => {
    if (loading) {
      return resultData;
    }

    setLoading(true);
    setError(null);

    try {
      const context = await getUserContext();
      const sessionId = context?.user?.onboarding_session_id;

      if (!sessionId) {
        setResultData(null);
        setHasFetched(true);
        return null;
      }

      const data = await getAssessmentResults(sessionId);

      setResultData(data);
      setHasFetched(true);
      return data;
    } catch (err) {
      console.error("Failed to load assessment results:", err);
      setError("Failed to load assessment results");
      setResultData(null);
      setHasFetched(true);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const clearAssessmentResults = useCallback(() => {
    setResultData(null);
    setLoading(false);
    setHasFetched(false);
    setError(null);
  }, []);

  const setAssessmentResults = useCallback(
    (data: AssessmentResultsData | null) => {
      setResultData(data);
      setHasFetched(true);
      setError(null);
    },
    []
  );

  const value = useMemo(
    () => ({
      resultData,
      loading,
      hasFetched,
      error,
      loadAssessmentResults,
      clearAssessmentResults,
      setAssessmentResults,
    }),
    [
      resultData,
      loading,
      hasFetched,
      error,
      loadAssessmentResults,
      clearAssessmentResults,
      setAssessmentResults,
    ]
  );

  return (
    <AssessmentResultContext.Provider value={value}>
      {children}
    </AssessmentResultContext.Provider>
  );
};
export function useAssessmentResults() {
  const context = useContext(AssessmentResultContext);

  if (!context) {
    throw new Error(
      "useAssessmentResults must be used within an AssessmentResultProvider"
    );
  }

  return context;
}
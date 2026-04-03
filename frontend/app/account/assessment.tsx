import AssessmentSkeleton from "./AssessmentSkeleton";
import React, { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { getUserContext } from "../../services/user.service";
import { router, useFocusEffect } from "expo-router";
import { View } from "react-native";

export const API_URL = "http://localhost:5500/api";

const Assessment = () => {
  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading((currentLoading) => currentLoading || !resultData);

    try 
    {
      const context = await getUserContext();
      const sessionId = context.user.onboarding_session_id;

      if(!sessionId)
        {
            setResultData(null);
            return;
        }

      const token = await SecureStore.getItemAsync("token");

      const res = await fetch(
        `${API_URL}/assessments/sessions/${sessionId}/results`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (data.success) 
        {
            setResultData(data.data);
        } 
     else 
        {
            setResultData(null);
        }  
    } 
    catch (err) 
    {
      console.error(err);
      setResultData(null);
    } 
    finally 
    {
      setLoading(false);
    }
  }, [resultData]);

  useFocusEffect(
    useCallback(() => {
      if (resultData) {
        router.replace({
          pathname: "/account/assessmentResult",
          params: { resultData: JSON.stringify(resultData) },
        });
        return;
      }

      void loadData();
    }, [loadData, resultData])
  );

  useEffect(() => 
    {
    if (!loading && resultData) 
    {
      router.replace({
        pathname: "/account/assessmentResult",
        params: { resultData: JSON.stringify(resultData) },
      });
    }
  }, [loading, resultData]);

  if (loading) 
    {
    return <AssessmentSkeleton />;
  }

  if (resultData) {
    return null;
  }

  return <View />;
};

export default Assessment;

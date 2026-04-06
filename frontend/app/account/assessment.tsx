import AssessmentSkeleton from "./AssessmentSkeleton";
import React, { useCallback, useEffect } from "react";
import { router, useFocusEffect } from "expo-router";
import { View } from "react-native";
import { useAssessmentResults } from "../../services/assessmentResult.service";

const Assessment = () => {
  
  const { resultData, loading, hasFetched, loadAssessmentResults } =
    useAssessmentResults();

  useFocusEffect(
    useCallback(() => {
      if (loading) {
        return;
      }

      if (resultData) {
        router.replace("/account/assessmentResult");
        return;
      }

      if (!resultData) {
        void loadAssessmentResults();
      }
    }, [resultData, loading, loadAssessmentResults])
  );

  useEffect(() => 
    {
    if (loading) 
    {
      return;
    }
    if(resultData)
    {
      router.replace({
        pathname: "/account/assessmentResult",
      });
    }

    if(hasFetched && !resultData)
    {
      router.replace('/account/preAssessment');
    }
  }, [loading, hasFetched, resultData]);

  if (loading || !hasFetched) 
    {
    return <AssessmentSkeleton />;
  }


  return <View />;
};

export default Assessment;

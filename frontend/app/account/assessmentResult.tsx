import { router, useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import AssessmentSkeleton from "./AssessmentSkeleton";
import {
  useAssessmentResults,
} from "@/services/assessmentResult.service";
import AssessmentResultView from "../../components/assessment/AssessmentResultView";

const AssessmentResult = () => {
  const { resultData, loading, hasFetched } = useAssessmentResults();

  useFocusEffect(
    useCallback(() => {
      if (!loading && hasFetched && !resultData) {
        router.replace("/account/preAssessment");
      }
    }, [loading, hasFetched, resultData]),
  );

  if (loading || !hasFetched) return <AssessmentSkeleton />;
  if (!resultData) return null;

  return <AssessmentResultView resultData={resultData} />;
};

export default AssessmentResult;

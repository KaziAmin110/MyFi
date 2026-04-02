import AssessmentSkeleton from "./AssessmentSkeleton";
import PreAssessment from "./preAssessment";
import AssessmentResults from "./assessmentResult";
import React, {useEffect, useState} from 'react'
import * as SecureStore from "expo-secure-store";
import { getUserContext } from "../../services/user.service";

export const API_URL = "http://localhost:5500/api";


const Assessment = () => {

    const[loading, setLoading] = useState(true);
    const[resultData, setResultData] = useState<any>(null);

    const loadData = async() => {
        try
        {
            // Get user context to find the modern onboarding_session_id
            const context = await getUserContext();
            const sessionId = context.user.onboarding_session_id;

            if(!sessionId)
            {
                setResultData(null);
                return;
            }

            const token = await SecureStore.getItemAsync("token");

            // Fetch results using the dynamic session ID
            const res = await fetch(
                `${API_URL}/assessments/sessions/${sessionId}/results`,
                {
                    headers:
                    {
                        Authorization: `Bearer ${token}`,
                    },
                }

            );
           
            const data = await res.json();
            

            if(data.success)
            {
                setResultData(data.data);
            }
            else
            {
                setResultData(null);
            }
        
        }
        catch(err)
        {
            console.error(err);
            setResultData(null);
        }
        finally
        {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    },[]);
   
    if (loading)
        return <AssessmentSkeleton/>;

    if(resultData)
    {
        return <AssessmentResults resultData={resultData} />;
    }

    return <PreAssessment />;
    
};

export default Assessment;

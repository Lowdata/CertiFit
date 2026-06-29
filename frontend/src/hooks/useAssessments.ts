import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useStartAssessment() {
  return useMutation({
    mutationFn: async (applicationId: number) => {
      const { data } = await api.post(`/assessments/start/${applicationId}`);
      return data;
    }
  });
}

export function useCurrentQuestion(assessmentId: number) {
  return useQuery({
    queryKey: ["currentQuestion", assessmentId],
    queryFn: async () => {
      const { data } = await api.get(`/assessments/me/${assessmentId}/current-question`);
      return data;
    },
    enabled: !!assessmentId,
  });
}

export function usePresignedUrl() {
  return useMutation({
    mutationFn: async ({ assessmentId, questionId }: { assessmentId: number, questionId: number }) => {
      const { data } = await api.post(`/assessments/me/${assessmentId}/question/${questionId}/presigned-url`);
      return data;
    }
  });
}

export function useSubmitRecording() {
  return useMutation({
    mutationFn: async ({ assessmentId, questionId, objectKey, tabSwitches = 0 }: { assessmentId: number, questionId: number, objectKey: string, tabSwitches?: number }) => {
      const { data } = await api.post(`/assessments/me/${assessmentId}/question/${questionId}/submit`, {
        object_key: objectKey,
        tab_switches: tabSwitches
      });
      return data;
    }
  });
}

export function useAssessmentDetails(assessmentId: number) {
  return useQuery({
    queryKey: ["assessment", assessmentId],
    queryFn: async () => {
      const { data } = await api.get(`/assessments/${assessmentId}`);
      return data;
    },
    enabled: !!assessmentId,
  });
}

export function useAssessmentByApplication(applicationId: number) {
  return useQuery({
    queryKey: ["assessment", "application", applicationId],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/assessments/application/${applicationId}`);
        return data;
      } catch (err: any) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!applicationId,
  });
}

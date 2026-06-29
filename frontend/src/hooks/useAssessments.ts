import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchAuthSession } from "aws-amplify/auth";
import { API_BASE_URL } from "@/lib/constants";

async function getAuthToken() {
  const session = await fetchAuthSession();
  return session.tokens?.idToken?.toString();
}

async function getHeaders() {
  const token = await getAuthToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export function useStartAssessment() {
  return useMutation({
    mutationFn: async (applicationId: number) => {
      const res = await fetch(`${API_BASE_URL}/assessments/start/${applicationId}`, {
        method: "POST",
        headers: await getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to start assessment");
      return res.json();
    }
  });
}

export function useCurrentQuestion(assessmentId: number) {
  return useQuery({
    queryKey: ["currentQuestion", assessmentId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/assessments/me/${assessmentId}/current-question`, {
        headers: await getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch question");
      return res.json();
    },
    enabled: !!assessmentId,
  });
}

export function usePresignedUrl() {
  return useMutation({
    mutationFn: async ({ assessmentId, questionId }: { assessmentId: number, questionId: number }) => {
      const res = await fetch(`${API_BASE_URL}/assessments/me/${assessmentId}/question/${questionId}/presigned-url`, {
        method: "POST",
        headers: await getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to get presigned URL");
      return res.json();
    }
  });
}

export function useSubmitRecording() {
  return useMutation({
    mutationFn: async ({ assessmentId, questionId, objectKey }: { assessmentId: number, questionId: number, objectKey: string }) => {
      const res = await fetch(`${API_BASE_URL}/assessments/me/${assessmentId}/question/${questionId}/submit`, {
        method: "POST",
        headers: await getHeaders(),
        body: JSON.stringify({ object_key: objectKey })
      });
      if (!res.ok) throw new Error("Failed to submit recording");
      return res.json();
    }
  });
}

export function useAssessmentDetails(assessmentId: number) {
  return useQuery({
    queryKey: ["assessment", assessmentId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/assessments/${assessmentId}`, {
        headers: await getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch assessment");
      return res.json();
    },
    enabled: !!assessmentId,
  });
}

export function useAssessmentByApplication(applicationId: number) {
  return useQuery({
    queryKey: ["assessment", "application", applicationId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/assessments/application/${applicationId}`, {
        headers: await getHeaders(),
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch assessment");
      return res.json();
    },
    enabled: !!applicationId,
  });
}

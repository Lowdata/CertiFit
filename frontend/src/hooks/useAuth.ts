// useAuth
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { AuthResponse, LoginRequest, RegisterRequest } from "@/types/auth";

export function useAuth() {
  const { setAuth, clearAuth, user, token } = useAuthStore();
  const router = useRouter();

  const login = async (data: LoginRequest) => {
    const res = await api.post<AuthResponse>("/auth/login", data);
    setAuth(res.data.access_token, {
      id: res.data.user_id,
      name: res.data.name,
      email: res.data.email,
      user_type: res.data.user_type,
    });
    if (res.data.user_type === 1) {
      router.push("/recruiter");
    } else {
      router.push("/candidate");
    }
  };

  const register = async (data: RegisterRequest) => {
    const res = await api.post<AuthResponse>("/auth/register", data);
    setAuth(res.data.access_token, {
      id: res.data.user_id,
      name: res.data.name,
      email: res.data.email,
      user_type: res.data.user_type,
    });
    if (res.data.user_type === 1) {
      router.push("/recruiter");
    } else {
      router.push("/candidate");
    }
  };

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  return { login, register, logout, user, isAuthenticated: !!token };
}
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
      id: res.data.user.id,
      name: res.data.user.name,
      email: res.data.user.email,
      user_type: res.data.user.user_type,
    });
    if (res.data.user.user_type === 1) {
      router.push("/recruiter");
    } else {
      router.push("/candidate");
    }
  };

  const register = async (data: RegisterRequest) => {
    await api.post("/auth/register", data);
    router.push("/login");
  };

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  return { login, register, logout, user, isAuthenticated: !!token };
}
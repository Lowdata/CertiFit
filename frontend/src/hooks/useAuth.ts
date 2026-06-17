// useAuth
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { LoginResponse, RegisterResponse, LoginRequest, RegisterRequest } from "@/types/auth";

export function useAuth() {
  const { setAuth, clearAuth, user, token } = useAuthStore();
  const router = useRouter();

  const login = async (data: LoginRequest) => {
    const res = await api.post<LoginResponse>("/auth/login", data);
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
    await api.post<RegisterResponse>("/auth/register", data);
    // Auto-login after successful registration since register doesn't return a token
    await login({ email: data.email, password: data.password });
  };

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  return { login, register, logout, user, isAuthenticated: !!token };
}
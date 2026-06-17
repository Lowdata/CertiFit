export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  user_type: 1 | 2;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    name: string;
    email: string;
    user_type: 1 | 2;
  };
}

export interface RegisterResponse {
  id: number;
  name: string;
  email: string;
  user_type: 1 | 2;
}
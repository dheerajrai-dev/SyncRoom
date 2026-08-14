export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserProfile;
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number;
}

export interface RegisterResponse {
  user_id: string;
  username: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: UserProfile | null;
  accessToken: string | null;
  initializeSession: () => Promise<void>;
  login: (username: string, password: string) => Promise<UserProfile>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  setAccessToken: (token: string | null) => void;
}

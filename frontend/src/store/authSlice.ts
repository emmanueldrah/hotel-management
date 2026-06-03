import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser } from '@/types';
import { tokenStore } from '@/lib/api';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const storedUser = localStorage.getItem('hms_user');

const initialState: AuthState = {
  user: storedUser ? (JSON.parse(storedUser) as AuthUser) : null,
  isAuthenticated: Boolean(tokenStore.getAccess()),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser; accessToken: string; refreshToken: string }>,
    ) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.isAuthenticated = true;
      tokenStore.set(accessToken, refreshToken);
      localStorage.setItem('hms_user', JSON.stringify(user));
    },
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      localStorage.setItem('hms_user', JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      tokenStore.clear();
      localStorage.removeItem('hms_user');
    },
  },
});

export const { setCredentials, setUser, logout } = authSlice.actions;
export default authSlice.reducer;

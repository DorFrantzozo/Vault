import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IUser } from '../../types/api.js';

interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: IUser; token?: string }>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isInitialized = true;
      if (action.payload.token) {
        state.token = action.payload.token;
        localStorage.setItem('auth_token', action.payload.token);
      }
    },
    logoutUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.token = null;
      localStorage.removeItem('auth_token');
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
  },
});

export const { setCredentials, logoutUser, setInitialized } = authSlice.actions;
export default authSlice.reducer;

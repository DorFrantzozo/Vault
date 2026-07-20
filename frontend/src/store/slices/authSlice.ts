import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IUser } from '../../types/api.js';

interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: IUser }>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isInitialized = true;
    },
    logoutUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
  },
});

export const { setCredentials, logoutUser, setInitialized } = authSlice.actions;
export default authSlice.reducer;

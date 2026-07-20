import { baseApi } from './baseApi.js';
import { IUser } from '../../types/api.js';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<{ status: string; data: { user: IUser } }, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
    login: builder.mutation<{ status: string; data: { user: IUser; token: string } }, { username: string; password: string }>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),
    register: builder.mutation<{ status: string; data: { user: IUser; token: string } }, { username: string; password: string }>({
      query: (credentials) => ({
        url: '/auth/register',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),
    logout: builder.mutation<{ status: string; message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const { useGetMeQuery, useLoginMutation, useRegisterMutation, useLogoutMutation } = authApi;

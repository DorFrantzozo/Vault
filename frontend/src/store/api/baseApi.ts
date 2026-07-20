import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Auth', 'Client', 'ServiceEvent', 'Transaction', 'RecurringBilling', 'Settings'],
  endpoints: () => ({}),
});

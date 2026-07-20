import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    credentials: 'include',
  }),
  tagTypes: ['Auth', 'Client', 'ServiceEvent', 'Transaction', 'RecurringBilling', 'Settings'],
  endpoints: () => ({}),
});

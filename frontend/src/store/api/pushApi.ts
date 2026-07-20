import { baseApi } from './baseApi.js';

export const pushApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVapidPublicKey: builder.query<{ status: string; data: { publicKey: string } }, void>({
      query: () => '/push/vapid-public-key',
    }),
    subscribeToPush: builder.mutation<{ status: string; message: string }, any>({
      query: (subscription) => ({
        url: '/push/subscribe',
        method: 'POST',
        body: subscription,
      }),
    }),
    sendTestPush: builder.mutation<{ status: string; message: string }, { subscription: any }>({
      query: (body) => ({
        url: '/push/test',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetVapidPublicKeyQuery,
  useSubscribeToPushMutation,
  useSendTestPushMutation,
} = pushApi;

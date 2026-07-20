import { baseApi } from './baseApi.js';

export interface INotificationSettings {
  reminderDaysBefore: number;
  remindersPerDay: number;
  activeSubscriptionsCount: number;
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotificationSettings: builder.query<{ status: string; data: INotificationSettings }, void>({
      query: () => '/settings/notifications',
      providesTags: ['Settings'],
    }),
    updateNotificationSettings: builder.mutation<
      { status: string; data: INotificationSettings },
      { reminderDaysBefore?: number; remindersPerDay?: number }
    >({
      query: (body) => ({
        url: '/settings/notifications',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Settings'],
    }),
    subscribeToPushNotifications: builder.mutation<
      { status: string; message: string; data: { activeSubscriptionsCount: number } },
      any
    >({
      query: (subscription) => ({
        url: '/settings/notifications/subscribe',
        method: 'POST',
        body: subscription,
      }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const {
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
  useSubscribeToPushNotificationsMutation,
} = settingsApi;

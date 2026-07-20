import { baseApi } from './baseApi.js';
import { IServiceEvent } from '../../types/api.js';

export const eventApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEvents: builder.query<{ status: string; results: number; data: { events: IServiceEvent[] } }, { client?: string; status?: string } | void>({
      query: (params) => ({
        url: '/events',
        params: params || {},
      }),
      providesTags: ['ServiceEvent'],
    }),
    createEvent: builder.mutation<
      { status: string; data: { event: IServiceEvent } },
      { client: string; type: IServiceEvent['type']; date: string; description?: string; status?: IServiceEvent['status'] }
    >({
      query: (body) => ({
        url: '/events',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ServiceEvent'],
    }),
    updateEvent: builder.mutation<
      { status: string; data: { event: IServiceEvent } },
      { id: string; client?: string; type?: IServiceEvent['type']; date?: string; description?: string; status?: IServiceEvent['status'] }
    >({
      query: ({ id, ...body }) => ({
        url: `/events/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['ServiceEvent'],
    }),
    deleteEvent: builder.mutation<void, string>({
      query: (id) => ({
        url: `/events/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ServiceEvent'],
    }),
  }),
});

export const {
  useGetEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} = eventApi;

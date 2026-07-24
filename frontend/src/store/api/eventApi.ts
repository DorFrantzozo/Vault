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
      { client: string; type: IServiceEvent['type']; date: string; description?: string; status?: IServiceEvent['status']; amount?: number; isPaid?: boolean }
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
      { id: string; client?: string; type?: IServiceEvent['type']; date?: string; description?: string; status?: IServiceEvent['status']; amount?: number; isPaid?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/events/${id}`,
        method: 'PUT',
        body,
      }),
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          eventApi.util.updateQueryData('getEvents', undefined, (draft) => {
            const eventIndex = draft.data.events.findIndex((e) => e._id === id);
            if (eventIndex !== -1) {
              draft.data.events[eventIndex] = {
                ...draft.data.events[eventIndex],
                ...patch,
              } as IServiceEvent;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['ServiceEvent'],
    }),
    deleteEvent: builder.mutation<void, string>({
      query: (id) => ({
        url: `/events/${id}`,
        method: 'DELETE',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          eventApi.util.updateQueryData('getEvents', undefined, (draft) => {
            draft.data.events = draft.data.events.filter((e) => e._id !== id);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['ServiceEvent'],
    }),
    markClientEventsAsPaid: builder.mutation<
      { status: string; message: string; data: { eventsUpdated: number; totalAmount: number } },
      { clientId: string; eventIds?: string[] }
    >({
      query: ({ clientId, eventIds }) => ({
        url: `/events/client/${clientId}/mark-paid`,
        method: 'POST',
        body: eventIds ? { eventIds } : undefined,
      }),
      invalidatesTags: ['ServiceEvent', 'Transaction'],
    }),
  }),
});

export const {
  useGetEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useMarkClientEventsAsPaidMutation,
} = eventApi;

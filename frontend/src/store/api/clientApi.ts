import { baseApi } from './baseApi.js';
import { IClient } from '../../types/api.js';

export const clientApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClients: builder.query<{ status: string; results: number; data: { clients: IClient[] } }, void>({
      query: () => '/clients',
      providesTags: ['Client'],
    }),
    createClient: builder.mutation<
      { status: string; data: { client: IClient } },
      { name: string; type: IClient['type']; contactInfo?: { email?: string; phone?: string } }
    >({
      query: (body) => ({
        url: '/clients',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Client'],
    }),
    updateClient: builder.mutation<
      { status: string; data: { client: IClient } },
      { id: string; name?: string; type?: IClient['type']; contactInfo?: { email?: string; phone?: string } }
    >({
      query: ({ id, ...body }) => ({
        url: `/clients/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Client'],
    }),
    deleteClient: builder.mutation<void, string>({
      query: (id) => ({
        url: `/clients/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Client'],
    }),
  }),
});

export const {
  useGetClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = clientApi;

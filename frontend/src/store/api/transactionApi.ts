import { baseApi } from './baseApi.js';
import { ITransaction, ITransactionSummary } from '../../types/api.js';

export const transactionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query<
      { status: string; results: number; data: { transactions: ITransaction[] } },
      { startDate?: string; endDate?: string; type?: string; client?: string } | void
    >({
      query: (params) => ({
        url: '/transactions',
        params: params || {},
      }),
      providesTags: ['Transaction'],
    }),
    getTransactionSummary: builder.query<{ status: string; data: { summary: ITransactionSummary } }, void>({
      query: () => '/transactions/summary',
      providesTags: ['Transaction'],
    }),
    createTransaction: builder.mutation<{ status: string; data: { transaction: ITransaction } }, FormData>({
      query: (formData) => ({
        url: '/transactions',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Transaction'],
    }),
    updateTransaction: builder.mutation<
      { status: string; data: { transaction: ITransaction } },
      { id: string; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `/transactions/${id}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['Transaction'],
    }),
    deleteTransaction: builder.mutation<void, string>({
      query: (id) => ({
        url: `/transactions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Transaction'],
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  useGetTransactionSummaryQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} = transactionApi;

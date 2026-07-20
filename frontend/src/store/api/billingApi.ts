import { baseApi } from './baseApi.js';

export interface IRecurringBilling {
  _id: string;
  clientName: string;
  serviceDescription: string;
  amount: number;
  billingCycle: 'Monthly' | 'Yearly';
  nextBillingDate: string;
  isActive: boolean;
}

export const billingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUpcomingBillings: builder.query<{ status: string; results: number; data: { billings: IRecurringBilling[] } }, void>({
      query: () => '/billing/upcoming',
      providesTags: ['RecurringBilling'],
    }),
    getBillings: builder.query<{ status: string; results: number; data: { billings: IRecurringBilling[] } }, void>({
      query: () => '/billing',
      providesTags: ['RecurringBilling'],
    }),
    createBilling: builder.mutation<{ status: string; data: { billing: IRecurringBilling } }, Partial<IRecurringBilling>>({
      query: (body) => ({
        url: '/billing',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['RecurringBilling'],
    }),
    updateBilling: builder.mutation<{ status: string; data: { billing: IRecurringBilling } }, { id: string } & Partial<IRecurringBilling>>({
      query: ({ id, ...body }) => ({
        url: `/billing/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['RecurringBilling'],
    }),
    deleteBilling: builder.mutation<void, string>({
      query: (id) => ({
        url: `/billing/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['RecurringBilling'],
    }),
    markBillingAsPaid: builder.mutation<{ status: string; data: { billing: IRecurringBilling } }, string>({
      query: (id) => ({
        url: `/billing/${id}/paid`,
        method: 'PATCH',
      }),
      invalidatesTags: ['RecurringBilling'],
    }),
  }),
});

export const {
  useGetUpcomingBillingsQuery,
  useGetBillingsQuery,
  useCreateBillingMutation,
  useUpdateBillingMutation,
  useDeleteBillingMutation,
  useMarkBillingAsPaidMutation,
} = billingApi;

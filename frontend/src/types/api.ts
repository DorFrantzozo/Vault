export interface IUser {
  _id: string;
  username: string;
}

export interface IClient {
  _id: string;
  name: string;
  type: 'Club' | 'Producer' | 'Restaurant' | 'Private';
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  defaultEventPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IServiceEvent {
  _id: string;
  client: IClient | string;
  type: 'DJ Gig' | 'Software Development' | 'Maintenance' | 'Consulting';
  date: string;
  description?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  amount: number;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ITransaction {
  _id: string;
  type: 'Income' | 'Expense';
  serviceType?: 'DJ Gig' | 'Software Development' | 'Maintenance' | 'Consulting' | 'General';
  amount: number;
  date: string;
  client?: IClient | string;
  relatedEvent?: IServiceEvent | string;
  attachmentUrl?: string;
  publicId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITransactionSummary {
  monthlyIncome: number;
  monthlyExpenses: number;
  annualIncome: number;
  annualExpenses: number;
  annualNet: number;
}

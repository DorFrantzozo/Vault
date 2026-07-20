import { Document, Types } from 'mongoose';

export interface IUserPayload {
  _id: Types.ObjectId | string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUserPayload;
    }
  }
}

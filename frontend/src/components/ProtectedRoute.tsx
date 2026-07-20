import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store.js';
import { useGetMeQuery } from '../store/api/authApi.js';
import { setCredentials, setInitialized } from '../store/slices/authSlice.js';

export const ProtectedRoute: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);
  const { data, error, isLoading } = useGetMeQuery(undefined, {
    skip: isAuthenticated,
  });

  useEffect(() => {
    if (data?.data?.user) {
      dispatch(setCredentials({ user: data.data.user }));
    } else if (error) {
      dispatch(setInitialized());
    }
  }, [data, error, dispatch]);

  if (isLoading || (!isInitialized && !isAuthenticated)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

import { JSX, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-hot-toast';

type PrivateRouteProps = {
  children: JSX.Element;
  requiredRole?: 'ADMIN' | 'CHEF_PARK' | 'PARTICULIER';
  redirectTo?: string;
  checkApproval?: boolean; // Now more explicit
};

const PrivateRoute = ({ 
  children, 
  requiredRole, 
  redirectTo = '/signin', 
  checkApproval = true
}: PrivateRouteProps) => {
  const [status, setStatus] = useState<'loading'|'authorized'|'unauthorized'>('loading');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // 1. Check localStorage for immediate UI response
        const localUser = JSON.parse(localStorage.getItem('user') || 'null');

        if (!localUser) throw new Error('No local user');

        // 2. Verify with backend
        const response = await fetch('/api/auth/verify', {
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Session invalid');

        const user = await response.json();

        // 3. Check conditions
        if (checkApproval && (user.status == 'PENDING' || user.status == 'REJECTED')  && user.role !== 'ADMIN') {
          navigate('/error-403', { replace: true });
          return;
        }

        if (requiredRole && user.role !== requiredRole) {
          navigate('/error-404', { replace: true });
          return;
        }

        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(user));
        setStatus('authorized');
      } catch (error) {
        localStorage.removeItem('user');
        toast.error('Session expired. Please login again.');
        setStatus('unauthorized');
        navigate(redirectTo, { replace: true });
      }
    };

    verifyAuth();
  }, [navigate, redirectTo, requiredRole, checkApproval]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return status === 'authorized' ? children : null;
};

export default PrivateRoute;
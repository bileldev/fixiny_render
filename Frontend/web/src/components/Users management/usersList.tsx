import { useState, useEffect,} from 'react';
import { useNavigate } from 'react-router';
import { User} from '../types';
import { toast, Toaster } from 'react-hot-toast';

export default function UsersList() {

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();


  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {    
    fetchUsers();
  }, []);
  

  const handleApprove = async (userId: string, shouldApprove: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: shouldApprove }),
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error(`Failed to ${shouldApprove ? 'approve' : 'reject'} user`);
      
      const updatedUser = await response.json();
      
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, status: updatedUser.status } : u
        )
      );
      
      toast.success(`User ${shouldApprove ? 'approved' : 'rejected'} successfully`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      setUsers(users.filter(u => u.id !== userId));
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) return <div className="text-center py-8">Loading users...</div>;

  return (    
    <div className="container mx-auto p-6">
      <div>
        <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            //background: '#363636',
            //color: '#fff',
          },
        }}
        />
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>              
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.first_name} {user.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.status == 'PENDING' ? 'bg-yellow-100 text-green-800' : user.status=='APPROVED' ? 'bg-green-100 text-yellow-800' : 'bg-red-100 text-yellow-800'
                  }`}>
                    {user.status == 'PENDING' ? 'Pending' : user.status=='APPROVED' ? 'Approved' : 'Dispproved'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  {user.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleApprove(user.id, true)}
                        className="text-green-600 hover:text-green-900 mr-2"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprove(user.id, false)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        Reject
                      </button>
                    </>
                  ) : user.status === 'APPROVED' ? (
                    <button
                      onClick={() => handleApprove(user.id, false)}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      Reject
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApprove(user.id, true)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                  <button 
                    onClick={() => navigate(`/users/${user.id}/cars`)}
                    className="text-purple-600 hover:text-purple-900"
                  >
                    View Cars
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
    
}
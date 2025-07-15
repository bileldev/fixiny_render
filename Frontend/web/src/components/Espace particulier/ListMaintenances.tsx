import { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { Car } from '../types';
import { Modal } from '../ui/modal';
import Button from '../ui/button/Button';

type Maintenance = {
  id: string;
  car_id: string;
  type: string;
  date: string;
  recordedMileage: number;
  cost: number;
  description: string;
  status: string;
  factureUrl?: string;
  car?: {
    make: string;
    model: string;
    licensePlate: string;
  };
};


export default function ListMaintenances() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMaintenance, setCurrentMaintenance] = useState<Maintenance | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchMaintenances();
    fetchCars();
  }, []);

  const fetchMaintenances = async () => {
    try {
      const response = await fetch('/api/particulier/my-maintenances');
      const data = await response.json();
      setMaintenances(data);
    } catch (error) {
      toast.error('Failed to fetch maintenance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchCars = async () => {
    try {
      const response = await fetch('/api/particulier/my-cars');
      const data = await response.json();
      setCars(data);
    } catch (error) {
      toast.error('Failed to fetch cars');
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    
    try {
      await fetch(`/api/particulier/my-maintenances/delete/${id}`, {
        method: 'DELETE',
      });
      toast.success('Maintenance record deleted successfully');
      fetchMaintenances();
      setShowDeleteConfirm(null);
    } catch (error) {
      toast.error('Failed to delete maintenance record');
    }finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMaintenance) return;

    const url = currentMaintenance.id 
      ? `/api/particulier/my-maintenances/update/${currentMaintenance.id}`
      : '/api/particulier/my-maintenances/create-maintenance';
    const method = currentMaintenance.id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentMaintenance),
      });
      const data = await response.json();
      toast.success(currentMaintenance.id ? 'Maintenance updated successfully' : 'Maintenance added successfully');
      setIsEditing(false);
      setCurrentMaintenance(null);
      fetchMaintenances();
    } catch (error) {
      toast.error('Failed to save maintenance record');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Maintenance Records</h2>
        <button
          onClick={() => {
            setIsEditing(true);
            setCurrentMaintenance({
              id: '',
              car_id: cars[0]?.id || '',
              type: 'PREVENTIVE_MAINTENANCE',
              date: new Date().toISOString().split('T')[0],
              recordedMileage: 0,
              cost: 0,
              description: '',
              status: 'DONE',
            });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Maintenance
        </button>
      </div>

      {isEditing && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">
            {currentMaintenance?.id ? 'Edit Maintenance' : 'Add New Maintenance'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Car</label>
                <select
                  value={currentMaintenance?.car_id || ''}
                  onChange={(e) => setCurrentMaintenance({...currentMaintenance!, car_id: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {cars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.make} {car.model} ({car.licensePlate})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={currentMaintenance?.type || ''}
                  onChange={(e) => setCurrentMaintenance({...currentMaintenance!, type: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="PREVENTIVE_MAINTENANCE">Preventive Maintenance</option>
                  <option value="CORRECTIVE_MAINTENANCE">Corrective Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={currentMaintenance?.date ? currentMaintenance.date.split('T')[0] : ''}
                  onChange={(e) => setCurrentMaintenance({...currentMaintenance!, date: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className='relative'>
                <label className="block text-sm font-medium text-gray-700">Mileage (KM)</label>
                <input
                  type="number"
                  value={currentMaintenance?.recordedMileage || ''}
                  onChange={(e) => setCurrentMaintenance({...currentMaintenance!, recordedMileage: parseInt(e.target.value)})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <span className="absolute right-3 top-8 text-gray-500">KM</span>
              </div>
              <div className='relative'>
                <label className="block text-sm font-medium text-gray-700">Cost (TND)</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentMaintenance?.cost || ''}
                  onChange={(e) => setCurrentMaintenance({...currentMaintenance!, cost: parseFloat(e.target.value)})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <span className="absolute right-3 top-8 text-gray-500">TND</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={currentMaintenance?.status || ''}
                  onChange={(e) => setCurrentMaintenance({...currentMaintenance!, status: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="DONE">Done</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={currentMaintenance?.description || ''}
                  onChange={(e) => setCurrentMaintenance({...currentMaintenance!, description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setCurrentMaintenance(null);
                }}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Car</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mileage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {maintenances.map((maintenance) => (
              <tr key={maintenance.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {maintenance.car?.make} {maintenance.car?.model} ({maintenance.car?.licensePlate})
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{maintenance.type.replace('_', ' ')}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(maintenance.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{maintenance.recordedMileage.toLocaleString()} KM</td>
                <td className="px-6 py-4 whitespace-nowrap">{maintenance.cost?.toFixed(2)} TND</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    maintenance.status === 'DONE' ? 'bg-green-100 text-green-800' :
                    maintenance.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {maintenance.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setCurrentMaintenance(maintenance);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(maintenance.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this maintenance record? This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
              loading={isDeleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
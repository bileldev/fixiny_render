import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Car, Maintenance, MaintenanceType } from '../types';
import { toast, Toaster } from 'react-hot-toast';

export default function CarManagement() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true); 



  useEffect(() => {
    if (!userId) return;
    
    const fetchCars = async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}/cars`);
        const data = await response.json();
        setCars(data);
      } catch (error) {
        toast.error('Failed to load cars');
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [userId]);

  const fetchMaintenances = async (carId: string) => {
    try {
      const response = await fetch(`/api/admin/users/cars/${carId}/maintenances`);
      const data = await response.json();
      setMaintenances(data.history || []); // Extract the history array
    } catch (error) {
      toast.error('Failed to load maintenance records');
      setMaintenances([]); // Ensure it's always an array
    }
  };

  

  if (loading) return <div>Loading...</div>;

  const handleBack = () => {
    navigate('/users'); // Or wherever you want to go back to
  };


  return (    
    <div className="space-y-6">
      {/*<PageBreadcrumb pageTitle="Car Management" />*/}
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
      <button onClick={handleBack} className="mb-4">
        &larr; Back to Users
      </button>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Car Management</h2>
      </div>

      {/* Cars List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cars.map(car => (
          <div 
            key={car.id} 
            className="border p-4 rounded-lg cursor-pointer hover:bg-gray-50"
            onClick={() => {
              setSelectedCar(car);
              fetchMaintenances(car.id);
            }}
          >
            <h3 className="font-bold"> {car.licensePlate} • {car.make} {car.model} {car.year} </h3>
            <p> {car.initial_mileage} KM</p>
            <p className="text-sm text-gray-500">
              {car.maintenances?.length || 0} maintenance records
            </p>
          </div>
        ))}
      </div>

      {/* Maintenance Records */}
      {selectedCar && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">
              Maintenance for {selectedCar.licensePlate} - {selectedCar.vin_number}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mileage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(maintenances) ? (
                  maintenances.map(m => (
                    <tr key={m.id}>
                      <td className='px-6 py-4 whitespace-nowrap'>{(m.type || '').replace('_', ' ')}</td>
                      <td className='px-6 py-4 whitespace-nowrap'>{m.date ? new Date(m.date).toLocaleDateString() : 'N/A'}</td>
                      <td className='px-6 py-4 whitespace-nowrap'>{m.recordedMileage?.toLocaleString() || '0'} KM</td>
                      <td className='px-6 py-4 whitespace-nowrap'>{m.cost?.toFixed(2) || '0.00'} TND</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="text-center py-4">No maintenance records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    
    </div>
  );
}
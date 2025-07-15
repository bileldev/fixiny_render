import { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { Car } from '../types';
import { Modal } from '../ui/modal';
import Button from '../ui/button/Button';


type CarFormData = {
  id: string  
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin_number: string;
  initial_mileage: number;
};

export default function ListCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCar, setCurrentCar] = useState<CarFormData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [errors, setErrors] = useState<{
    licensePlate?: string;
    vin_number?: string;
  }>({});

  const validateLicensePlate = (value: string): boolean => {
    return /^(\d{0,3}\s?[A-Z]{0,2}\s?\d{0,4})?$/.test(value);
  };

  const validateVIN = (value: string): boolean => {
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(value);
  };

  const validateFields = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (currentCar && !validateLicensePlate(currentCar.licensePlate)) {
      newErrors.licensePlate = 'Invalid license plate format';
    }

    if (currentCar && !validateVIN(currentCar.vin_number)) {
      newErrors.vin_number = 'Invalid VIN format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const response = await fetch('/api/particulier/my-cars');
      const data = await response.json();
      setCars(data);
    } catch (error) {
      toast.error('Failed to fetch cars');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
   setIsDeleting(true);
    
    try {
      await fetch(`/api/particulier/my-cars/delete-car/${id}`, {
        method: 'DELETE',
      });
      toast.success('Car deleted successfully');
      fetchCars();
      setShowDeleteConfirm(null);
    } catch (error) {
      toast.error('Failed to delete car');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCar || !validateFields()) return;

    const url = currentCar.id 
      ? `/api/particulier/my-cars/update-car/${currentCar.id}`
      : '/api/particulier/my-cars/create-car';
    const method = currentCar.id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentCar),
      });
      const data = await response.json();
      toast.success(currentCar.id ? 'Car updated successfully' : 'Car added successfully');
      setIsEditing(false);
      setCurrentCar(null);
      fetchCars();
    } catch (error) {
      toast.error('Failed to save car');
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
        <h2 className="text-xl font-bold">My Cars</h2>
        <button
          onClick={() => {
            setIsEditing(true);
            setCurrentCar({
              id: '',
              make: '',
              model: '',
              year: new Date().getFullYear(),
              licensePlate: '',
              vin_number: '',
              initial_mileage: 0,
            });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Car
        </button>
      </div>

      {isEditing && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">
            {currentCar?.id ? 'Edit Car' : 'Add New Car'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Make*</label>
                <input
                  type="text"
                  value={currentCar?.make || ''}
                  onChange={(e) => setCurrentCar({...currentCar!, make: e.target.value.toUpperCase()})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Model*</label>
                <input
                  type="text"
                  value={currentCar?.model || ''}
                  onChange={(e) => setCurrentCar({...currentCar!, model: e.target.value.toUpperCase()})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <input
                  type="number"
                  value={currentCar?.year || ''}
                  onChange={(e) => setCurrentCar({...currentCar!, year: parseInt(e.target.value)})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">License Plate*</label>
                <input
                  type="text"
                  value={currentCar?.licensePlate || ''}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase()
                    setCurrentCar({...currentCar!, licensePlate: value});
                    if (!validateLicensePlate(value)) {
                      setErrors({...errors, licensePlate: 'Invalid license plate format'});
                    } else if (errors.licensePlate) {
                      setErrors({...errors, licensePlate: undefined});
                    }
                  }}
                  className={`mt-1 block w-full border ${
                    errors.licensePlate ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Format: XXX TU XXXX</p>
                {errors.licensePlate && (
                  <p className="mt-1 text-sm text-red-600">{errors.licensePlate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">VIN Number*</label>
                <input
                  type="text"
                  value={currentCar?.vin_number || ''}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase()
                    setCurrentCar({...currentCar!, vin_number: value});
                    if (!validateVIN(value)) {
                      setErrors({...errors, vin_number: 'Invalid VIN format'});
                    } else if (errors.vin_number) {
                      setErrors({...errors, vin_number: undefined});
                    }
                  }}
                  className={`mt-1 block w-full border ${
                    errors.vin_number ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {currentCar?.vin_number?.length || 0}/17 characters (alphanumeric only)
                </p>
                {errors.vin_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.vin_number}</p>
                )}
              </div>
              <div className='relative'>
                <label className="block text-sm font-medium text-gray-700">Initial Mileage (KM)*</label>
                <input
                  type="number"
                  value={currentCar?.initial_mileage || ''}
                  onChange={(e) => setCurrentCar({...currentCar!, initial_mileage: parseFloat(e.target.value)})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <span className="absolute right-3 top-8 text-gray-500">KM</span>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setCurrentCar(null);
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Plate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VIN</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mileage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cars.map((car) => (
              <tr key={car.id}>
                <td className="px-6 py-4 whitespace-nowrap">{car.make}</td>
                <td className="px-6 py-4 whitespace-nowrap">{car.model}</td>
                <td className="px-6 py-4 whitespace-nowrap">{car.year}</td>
                <td className="px-6 py-4 whitespace-nowrap">{car.licensePlate}</td>
                <td className="px-6 py-4 whitespace-nowrap">{car.vin_number}</td>
                <td className="px-6 py-4 whitespace-nowrap">{car.initial_mileage.toLocaleString()} KM</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setCurrentCar(car);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(car.id)}
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
          <p>Are you sure you want to delete this car? This action cannot be undone.</p>
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
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import ComponentCard from '../common/ComponentCard';
import Button from '../ui/button/Button';
import {Modal} from '../ui/modal';
import Alert from '../ui/alert/Alert';
import Badge from '../ui/badge/Badge';
import { Car, Zone } from '../types';
import DataTable from 'react-data-table-component';
import toast from "react-hot-toast";

const ZoneCarManagement = () => {
  const { zoneId } = useParams();
  const navigate = useNavigate();
  const [cars, setCars] = useState<Car[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState<{open: boolean, carId: string | null}>({open: false, carId: null});
  const [showEditModal, setShowEditModal] = useState<{open: boolean, car: Car | null}>({open: false, car: null});
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [newCar, setNewCar] = useState({
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    vin_number: '',
    initial_mileage: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCars = async () => {
    try {
        setLoading(true);
        setError('');

        const response = zoneId ? await fetch(`/api/chef-park/my-cars/zone/${zoneId}`, {
          method: 'GET',
          headers: {'Content-Type': 'application/json',},
          credentials: 'include'
        }) : await fetch('/api/chef-park/my-cars', {
          method: 'GET',
          headers: {'Content-Type': 'application/json',},
          credentials: 'include'
        })
        ;

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch cars');
        }

        const data = await response.json();
        setCars(data);
        return data;

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch cars');
      } finally {
        setLoading(false);
      }
    };

  const fetchZones = async () => {
    try {
      const res = await fetch('/api/chef-park/my-zones', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch zones');
      const data = await res.json();
      setZones(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch zones');
    }
  };

  useEffect(() => {
    fetchCars();
    fetchZones();
  }, [zoneId]);

  const handleCreateCar = async () => {
    setIsCreating(true);
    setError('');
    try {
      const res = await fetch('/api/chef-park/my-cars/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...newCar,
          year: parseInt(newCar.year),
          initial_mileage: parseFloat(newCar.initial_mileage),
          zone_id: zoneId
        })
      });
  
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create car');
      }

      const data = await res.json();
      
      setCars([...cars, data]);
      setShowCreateModal(false);
      setNewCar({
        make: '',
        model: '',
        year: '',
        licensePlate: '',
        vin_number: '',
        initial_mileage: ''
      });
      await fetchCars();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create car');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    setIsDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/chef-park/my-cars/delete/${carId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create car');
      }
      
      setCars(cars.filter(c => c.id !== carId));
      setShowDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete car');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTransferCar = async (carId: string, zoneId: string) => {
    try {
      const res = await fetch(`/api/chef-park/my-cars/transfer/${carId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ zone_id: zoneId })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to transfer car');
      }

      await fetchCars();
      toast.success('Car transferred successfully!');
      setSelectedZoneId('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to transfer car');
    }
  };

  const carHasHistory = (car: Car) => {
    return (car.mileages && car.mileages.length > 0) || 
           (car.maintenances && car.maintenances.length > 0);
  };

  const handleUpdateCar = async () => {
    if (!showEditModal.car) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/chef-park/my-cars/update/${showEditModal.car.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          make: showEditModal.car.make,
          model: showEditModal.car.model,
          year: showEditModal.car.year,
          // Only include editable fields based on car history
          ...(!carHasHistory(showEditModal.car) && {
            licensePlate: showEditModal.car.licensePlate,
            vin_number: showEditModal.car.vin_number
          })
        })
      });

      if (!res.ok) throw new Error('Failed to update car');

      fetchCars();
      setShowEditModal({open: false, car: null});
      toast.success('Car updated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update car');
    } finally {
      setIsUpdating(false);
    }    
  };

  return (
    <div className="space-y-4">
      <ComponentCard title={zoneId ? zones.find(zone => zone.id === zoneId)?.zone_name || 'All zones' : 'All zones'}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {zoneId ? 'Zone Cars' : 'All Cars'}
          </h2>
          {zoneId ? <Button onClick={() => setShowCreateModal(true)}>Add Car</Button> : <></>}
        </div>

        {error && (
          <Alert variant="error" title='Error' message={error} onClose={() => setError('')}/>
        )}

        <DataTable
          columns={[
            { name: 'License Plate', selector: (row: Car) => row.licensePlate, sortable: true },
            { name: 'Make', selector: (row: Car) => row.make, sortable: true },
            { name: 'Model', selector: (row: Car) => row.model, sortable: true},
            { name: 'Year', selector: (row: Car) => row.year, sortable: true },
            { name: 'Mileage', selector: (row: Car) => row.mileages?.[0].value.toLocaleString() + ' km', sortable: true },
            ...(!zoneId ? [{
              name: 'Current Zone',
              cell: (row: Car) => ( // Explicitly type the row parameter
                row.zone ? (
                  <Badge>{row.zone.zone_name}</Badge>
                ) : (
                  <Badge variant="solid">Unassigned</Badge>
                )
              )
            }] : []),
            {
              name: 'Actions',
              cell: row => (
                <div className="flex flex-wrap gap-1">
                  <Button 
                    size="xs"
                    variant="outline"
                    className="min-w-[30px]"                    
                    onClick={() => navigate(`/chef-park/cars/${row.id}`)}
                  >
                    Details
                  </Button>
                  <Button 
                    size="xs"
                    variant="outline"
                    className="min-w-[30px]"                    
                    onClick={() => setShowEditModal({open: true, car: row})}
                  >
                    Edit
                  </Button>
                  {zoneId && (
                    <Button 
                      size="xs"
                      variant="outline"
                      className="min-w-[30px]"
                      onClick={() => setShowTransferModal({open: true, carId: row.id})}
                    >
                      Transfer
                    </Button>
                  )}
                  <Button 
                    size="xs"
                    variant="danger"
                    className="min-w-[30px]"
                    onClick={() => setShowDeleteConfirm(row.id)}
                  >
                    Delete
                  </Button>
                </div>
              )
            }
          ]}
          data={cars}
          progressPending={loading}
          noDataComponent={error || 'No cars found'}
          pagination
          highlightOnHover
        />
      </ComponentCard>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Car"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Make*</label>
              <input
                type="text"
                value={newCar.make}
                onChange={(e) => setNewCar({...newCar, make: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label>Model*</label>
              <input
                type="text"
                value={newCar.model}
                onChange={(e) => setNewCar({...newCar, model: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year*</label>
              <select
                value={newCar.year}
                onChange={(e) => setNewCar({...newCar, year: e.target.value})}
                className="w-full border border-gray-300 p-2 rounded"
                required
              >
                {Array.from({length: 30}, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              
            </div>
            <div>
              
              <label>Initial Mileage*</label>
              <div className='relative'>
                <input
                  type="number"
                  min="0"
                  value={newCar.initial_mileage}
                  onChange={(e) => setNewCar({...newCar, initial_mileage: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
                <span className="absolute right-3 top-2 text-gray-500">KM</span>
              </div>              
            </div>
          </div>

          <div>
            <label>License Plate*</label>
            <input
              type="text"
              value={newCar.licensePlate}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                  if (/^(\d{0,3}\s?[A-Z]{0,2}\s?\d{0,4})?$/.test(value)) {
                    setNewCar({...newCar, licensePlate: value})
                  }
                }
              }
              className="w-full p-2 border rounded"
              required
            />
            <p className="text-xs text-red-500 mt-1">Format: XXX TU XXXX</p>
          </div>

          <div>
            <label>VIN Number*</label>
            <input
              type="text"
              maxLength={17}
              value={newCar.vin_number}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                if (/^[A-HJ-NPR-Z0-9]{17}$/.test(value)) {
                  setNewCar({...newCar, vin_number: value})}
                }                
              }
              className="w-full p-2 border rounded"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {newCar.vin_number?.length || 0}/17 characters (alphanumeric only)
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCar}
              loading={isCreating}
            >
              Add Car
            </Button>
          </div>
        </div>
      </Modal>

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
              onClick={() => showDeleteConfirm && handleDeleteCar(showDeleteConfirm)}
              loading={isDeleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showTransferModal.open}
        onClose={() => setShowTransferModal({open: false, carId: null})}
        title="Transfer Car"
      >
        <div className="space-y-4">
          <div>
            <label>Select Destination Zone</label>
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a zone</option>
              {zones
                .filter(zone => zone.id !== zoneId) // Exclude current zone
                .map(zone => (
                  <option key={zone.id} value={zone.id}>{zone.zone_name}</option>
                ))}
            </select>
          </div>
              
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowTransferModal({open: false, carId: null})}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (showTransferModal.carId && selectedZoneId) {
                  handleTransferCar(showTransferModal.carId, selectedZoneId);
                  setShowTransferModal({open: false, carId: null});
                }
              }}
            >
              Transfer
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal.open}
        onClose={() => setShowEditModal({open: false, car: null})}
        title="Edit Car Details"
      >
        {showEditModal.car && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Make*</label>
                <input
                  type="text"
                  value={showEditModal.car.make}
                  onChange={(e) => setShowEditModal(prev => ({
                    ...prev,
                    car: prev.car ? {...prev.car, make: e.target.value.toUpperCase()} : null
                  }))}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label>Model*</label>
                <input
                  type="text"
                  value={showEditModal.car.model}
                  onChange={(e) => setShowEditModal(prev => ({
                    ...prev,
                    car: prev.car ? {...prev.car, model: e.target.value.toUpperCase()} : null
                  }))}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>

            <div>
              <label>Year*</label>
              <select
                value={showEditModal.car.year}
                onChange={(e) => setShowEditModal(prev => ({
                  ...prev,
                  car: prev.car ? {...prev.car, year: parseInt(e.target.value)} : null
                }))}
                className="w-full p-2 border rounded"
                required
              >
                {Array.from({length: 30}, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
                
            {/* Conditionally render editable fields */}
            {!carHasHistory(showEditModal.car) && (
              <>
                <div>
                  <label>License Plate*</label>
                  <input
                    type="text"
                    value={showEditModal.car.licensePlate}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      if (/^(\d{0,3}\s?[A-Z]{0,2}\s?\d{0,4})?$/.test(value)) {
                        setShowEditModal(prev => ({
                          ...prev,
                          car: prev.car ? {...prev.car, licensePlate: e.target.value} : null
                        }));
                      }
                    }}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                  
                <div>
                  <label>VIN Number*</label>
                  <input
                    type="text"
                    maxLength={17}
                    value={showEditModal.car.vin_number}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      if (/^[A-HJ-NPR-Z0-9]{17}$/.test(value)) {
                        setShowEditModal(prev => ({
                          ...prev,
                          car: prev.car ? {...prev.car, vin_number: e.target.value} : null
                        }))
                      }
                    }}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </>
            )}

            {/* Show non-editable fields if car has history */}
            {carHasHistory(showEditModal.car) && (
              <div className="space-y-2">
                <div>
                  <label className="font-medium">License Plate</label>
                  <div className="p-2 bg-gray-100 rounded">{showEditModal.car.licensePlate}</div>
                </div>
                <div>
                  <label className="font-medium">VIN Number</label>
                  <div className="p-2 bg-gray-100 rounded">{showEditModal.car.vin_number}</div>
                </div>
                <p className="text-sm text-red-500">
                  These fields (License Plate & VIN number) cannot be modified because this car has mileage or maintenance records.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal({open: false, car: null})}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateCar} loading={isUpdating}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ZoneCarManagement;
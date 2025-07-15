import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import ComponentCard from '../common/ComponentCard';
import Button from '../ui/button/Button';
import {Modal} from '../ui/modal';
import Alert from '../ui/alert/Alert';
import { Maintenance, Car, MaintenanceType } from '../types';
import DataTable from 'react-data-table-component';

const MaintenanceManagement = () => {
  const { carId } = useParams();
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMaintenance, setNewMaintenance] = useState({
    type: 'PREVENTIVE_MAINTENANCE' as MaintenanceType,
    date: new Date().toISOString().split('T')[0],
    recordedMileage: '',
    cost: '',
    description: ''
  });

  const fetchMaintenances = async () => {
    setLoading(true);
    setError('');
    try {
      const url = carId 
        ? `/api/chef-park/my-maintenances/history/${carId}` 
        : '/api/chef-park/my-maintenances';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch maintenances');
      const data = await res.json();
      setMaintenances(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch maintenances');
    } finally {
      setLoading(false);
    }
  };

  const fetchCar = async () => {
    if (!carId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/chef-park/my-cars/${carId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch car details');
      const data = await res.json();
      setCar(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch car details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenances();
    if (carId) fetchCar();
  }, [carId]);

  const handleCreateMaintenance = async () => {
    setError('');
    try {
      const res = await fetch('/api/chef-park/my-maintenances/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...newMaintenance,
          car_id: carId,
          recordedMileage: parseInt(newMaintenance.recordedMileage),
          cost: parseFloat(newMaintenance.cost),
          date: new Date(newMaintenance.date).toISOString()
        })
      });
      if (!res.ok) throw new Error('Failed to create maintenance');
      const data = await res.json();
      
      setMaintenances([...maintenances, data]);
      setShowCreateModal(false);
      setNewMaintenance({
        type: 'PREVENTIVE_MAINTENANCE',
        date: new Date().toISOString().split('T')[0],
        recordedMileage: '',
        cost: '',
        description: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create maintenance');
    }
  };

  return (
    <div className="space-y-4">
      <ComponentCard title=''>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {carId ? `Maintenance for ${car?.licensePlate}` : 'All Maintenances'}
          </h2>
          {carId && <Button onClick={() => setShowCreateModal(true)}>Add Maintenance</Button>}
        </div>

        {error && (
          <Alert variant="error" title = "Error" message={error} onClose={() => setError('')}/>
        )}

        <DataTable
          columns={[
            { name: 'Date', selector: (row: Maintenance) => new Date(row.date).toLocaleDateString(), sortable: true },
            { name: 'Type', selector: (row: Maintenance) => row.type.replace('_', ' '), sortable: true },
            { name: 'Mileage', selector: (row: Maintenance) => row.recordedMileage.toLocaleString() + ' km', sortable: true },
            { name: 'Cost', selector: (row: Maintenance) => row.cost.toLocaleString() + ' TND', sortable: true },
            ...(!carId ? [{ name: 'Car', selector: (row: Maintenance) => `${row.car?.make} ${row.car?.model} (${row.car?.licensePlate})` }] : []),
            { name: 'Description', selector: row => row.description || 'N/A', sortable: true }
          ]}
          data={maintenances}
          progressPending={loading}
          noDataComponent={error || 'No maintenance records found'}
          pagination
          highlightOnHover
        />
      </ComponentCard>

      {carId && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Add Maintenance"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Type</label>
                <select
                  value={newMaintenance.type}
                  onChange={(e) => setNewMaintenance({
                    ...newMaintenance, 
                    type: e.target.value as MaintenanceType
                  })}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="PREVENTIVE_MAINTENANCE">Preventive</option>
                  <option value="CORRECTIVE_MAINTENANCE">Corrective</option>
                </select>
              </div>
              <div>
                <label>Date</label>
                <input
                  type="date"
                  value={newMaintenance.date}
                  onChange={(e) => setNewMaintenance({
                    ...newMaintenance, 
                    date: e.target.value
                  })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Mileage (km)</label>
                <input
                  type="number"
                  value={newMaintenance.recordedMileage}
                  onChange={(e) => setNewMaintenance({
                    ...newMaintenance, 
                    recordedMileage: e.target.value
                  })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label>Cost (TND)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newMaintenance.cost}
                  onChange={(e) => setNewMaintenance({
                    ...newMaintenance, 
                    cost: e.target.value
                  })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>

            <div>
              <label>Description</label>
              <textarea
                value={newMaintenance.description}
                onChange={(e) => setNewMaintenance({
                  ...newMaintenance, 
                  description: e.target.value
                })}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateMaintenance}
              >
                Add Maintenance
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MaintenanceManagement;
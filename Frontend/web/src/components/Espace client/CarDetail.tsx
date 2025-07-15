import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import ComponentCard from '../common/ComponentCard';
import Button from '../ui/button/Button';
import Badge from '../ui/badge/Badge';
import { Tabs, Tab } from '../ui/tabs';
import { Maintenance, Mileage } from '../types';
import DataTable from 'react-data-table-component';
import { Modal } from '../ui/modal';
import { toast, Toaster } from 'react-hot-toast';
import Input from '../form/input/InputField';

const CarDetail = () => {
  const { carId } = useParams();
  const [activeTab, setActiveTab] = useState('maintenance');
  const [carData, setCarData] = useState<{
    id: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    vin_number: string;
    initial_mileage: number;
    zone: {
      id: string;
      zone_name: string;
      chef_park_id: string;
    };
    mileages: Mileage[];
    maintenances: Maintenance[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  

  const [showAddMaintenanceModal, setShowAddMaintenanceModal] = useState(false);
  const [showAddMileageModal, setshowAddMileageModal] = useState(false);
  const [editingMaintenanceId, setEditingMaintenanceId] = useState<string | null>(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    type: 'CORRECTIVE_MAINTENANCE',
    date: new Date().toISOString().split('T')[0],
    recordedMileage: carData?.mileages[0]?.value || 0,
    cost: 0,
    description: '',
    facture: null as File | null
  });

  const [mileageForm, setmileageForm] = useState({
    value : carData?.mileages[0]?.value || 0,
    recordedAt: new Date().toISOString().split('T')[0],
  })

  const fetchCarData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/chef-park/my-cars/${carId}`, { 
        credentials: 'include',
        headers: {'Content-Type': 'application/json'}
      });

      if (!res.ok) throw new Error('Failed to fetch car details');

      const data = await res.json();

      // Plan maintenance if needed
      const planRes = await fetch('/api/chef-park/my-maintenances/plan', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({ car_id: carId })
      });

      if (planRes.ok) {
        const plannedMaintenances = await planRes.json();
        data.maintenances = [...plannedMaintenances, ...data.maintenances];
      }

      setCarData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch car details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarData();
  }, [carId]);

  useEffect(() => {
    if (carData) {
      setmileageForm(prev => ({
        ...prev,
        value: carData.mileages[0]?.value || 0
      }));
    }
  }, [carData]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!carData) return <div>Car not found</div>;

  const getMileageSinceLastMaintenance = () => {
    if (!carData.maintenances?.length || !carData.mileages?.length) {
      return 'N/A';
    }
    // Filter only DONE maintenances
    const doneMaintenances = carData.maintenances.filter(m => m.status === 'DONE');
    if (!doneMaintenances.length) return 'N/A';
    
    const lastMaintenance = doneMaintenances[0];
    const currentMileage = carData.mileages[0];
    return (currentMileage.value - lastMaintenance.recordedMileage).toLocaleString() + ' km';
  };

  // Add file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!validTypes.includes(file.type)) {
        toast.error('Only PDF, JPEG, and PNG files are allowed');
        return;
      }

      if (file.size > maxSize) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setMaintenanceForm({
        ...maintenanceForm,
        facture: file
      });
    }
  };

  const handleAddMaintenance = async () => {
    setError('');
    try {
      const formData = new FormData();
      formData.append('car_id', carId!);
      formData.append('maintenanceId', editingMaintenanceId!);
      formData.append('type', maintenanceForm.type);
      formData.append('date', maintenanceForm.date);
      formData.append('recordedMileage', maintenanceForm.recordedMileage.toString());
      formData.append('cost', maintenanceForm.cost.toString());
      formData.append('description', maintenanceForm.description);
      if (maintenanceForm.facture) {
        formData.append('facture', maintenanceForm.facture);
      }

      let response
    
      if (editingMaintenanceId) {
        // This is a completion of an existing maintenance
        response = await fetch(`/api/chef-park/my-maintenances/upcoming/complete/${editingMaintenanceId}`, {
          method: 'PUT',
          credentials: 'include',
          body: formData
        });
      } else {
        // This is adding a new maintenance
        response = await fetch('/api/chef-park/my-maintenances/add', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
      }
    
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add/update maintenance');
      }
    
      const updatedMaintenance = await response.json();
    
      // First update the maintenance list with the new/updated maintenance
      let updatedMaintenances = editingMaintenanceId
        ? carData?.maintenances.map(m => 
            m.id === editingMaintenanceId ? updatedMaintenance : m
          ) || []
        : [updatedMaintenance, ...(carData?.maintenances || [])];
        
      // Then plan new maintenances based on the updated mileage
      const planResponse = await fetch('/api/chef-park/my-maintenances/plan', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({ 
          car_id: carId
        })
      });
    
      if (!planResponse.ok) {
        const errorData = await planResponse.json();
        throw new Error(errorData.error || 'Failed to plan maintenance');
      }
    
      const plannedMaintenances = await planResponse.json();
    
      // Filter out any planned maintenances that already exist
      const newPlannedMaintenances = plannedMaintenances.filter((m: Maintenance) => 
        !updatedMaintenances.some(existing => existing.id === m.id)
      );
    
      // Update local state with both the completed/added maintenance and new planned ones
      if (carData) {
        setCarData({          
          ...carData,
          mileages: [...carData.mileages],
          maintenances: [...newPlannedMaintenances, ...updatedMaintenances]
        });
      }

      await fetchCarData();
    
      setShowAddMaintenanceModal(false);
      setEditingMaintenanceId(null);
      toast.success(editingMaintenanceId ? 'Maintenance completed successfully' : 'Maintenance added successfully');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add/update maintenance');
      toast.error(error instanceof Error ? error.message : 'Failed to add/update maintenance');
    }
  };

  const handleAddMileage = async () => {
    setError('');
    try {
      const response = await fetch('/api/chef-park/my-mileages/add', {
        method: 'POST',
        headers: {'Content-Type': 'application/json',},
        credentials: 'include',
        body: JSON.stringify({
          car_id: carId,
          value: mileageForm.value,
          recordedAt: new Date(mileageForm.recordedAt).toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add mileage');
      }

      const newMileage = await response.json();

      const planResponse = await fetch('/api/chef-park/my-maintenances/plan', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({ 
          car_id: carId,
        })
      });

      if (!planResponse.ok) {
        const errorData = await planResponse.json();
        throw new Error(errorData.error || 'Failed to plan maintenance');
      }

      const plannedMaintenances = await planResponse.json();

      // Update local state
      if (carData) {
        setCarData({
          ...carData,
          mileages: [newMileage, ...carData.mileages],
          maintenances: [
            ...plannedMaintenances.filter((m: Maintenance) => 
              !carData.maintenances.some(existing => existing.id === m.id)
            ),
            ...carData.maintenances
          ]
        });
      }

      setshowAddMileageModal(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add mileage');
      toast.error(error instanceof Error ? error.message : 'Failed to add mileage');
    }
  };

  const handleCompleteMaintenance = async (maintenanceId: string) => {
    setError('');
    try {
      // Set the maintenance ID we're editing
      setEditingMaintenanceId(maintenanceId);
      // Pre-fill the form with the maintenance being completed
      const maintenanceToComplete = carData?.maintenances.find(m => m.id === maintenanceId);
      if (maintenanceToComplete) {
        setMaintenanceForm({
          type: maintenanceToComplete.type,
          date: new Date().toISOString().split('T')[0],
          recordedMileage: carData?.mileages[0]?.value || 0,
          cost: 0,
          description: maintenanceToComplete.description || '',
          facture: null as File | null
        });
      }
      setShowAddMaintenanceModal(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to complete maintenance');
    }
  };

  return (
    <div className="space-y-6">
      <ComponentCard title=''>
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {carData.make} {carData.model} ({carData.year})
            </h1>
            <div className="flex gap-4 mt-2">
              <div>
                <span className="text-gray-500">License Plate:</span>{' '}
                <span className="font-medium">{carData.licensePlate}</span>
              </div>
              <div>
                <span className="text-gray-500">VIN:</span>{' '}
                <span className="font-medium">{carData.vin_number}</span>
              </div>
              <div>
                <span className="text-gray-500">Current Mileage:</span>{' '}
                <span className="font-medium">
                  {carData.mileages?.[0]?.value.toLocaleString()} km
                </span>
              </div>
            </div>
          </div>
          <Badge variant={carData.zone ? 'light' : 'solid'}>
            {carData.zone?.zone_name || 'No zone assigned'}
          </Badge>
        </div>
      </ComponentCard>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab value="maintenance" label="Maintenance History" />
        <Tab value="mileage" label="Mileage Records" />
        <Tab value="upcoming" label="Upcoming Maintenance" />
        <Tab value="details" label="Vehicle Details" />
      </Tabs>

      {activeTab === 'maintenance' && (
        <ComponentCard title='Maintenance History'>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Maintenance History</h2>
            <Button onClick={() => {
              setMaintenanceForm({
                type: 'CORRECTIVE_MAINTENANCE',
                date: new Date().toISOString().split('T')[0],
                recordedMileage: carData?.mileages[0]?.value || 0,
                cost: 0,
                description: '',
                facture: null as File | null
              });
              setShowAddMaintenanceModal(true);
            }}>Add Maintenance</Button>
          </div>
          <DataTable
            columns={[
              { name: 'Date', selector: row => new Date(row.date).toLocaleDateString(), sortable: true },
              { name: 'Type', selector: row => row.type.replace('_', ' '), sortable: true },
              { name: 'Mileage', selector: row => row.recordedMileage.toLocaleString() + ' km', sortable: true },
              { name: 'Cost', selector: row => row.cost.toLocaleString() + ' TND', sortable: true },
              { name: 'Description', selector: row => row.description || 'N/A', sortable: true },
              {
                name: 'Invoice',
                cell: (row) => row.factureUrl ? (
                  <a 
                    href={row.factureUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View Invoice
                  </a>
                ) : 'N/A'
              },
            ]}
            // Filter to only show DONE maintenances
            data={carData.maintenances.filter(m => m.status === 'DONE')}
            pagination
            highlightOnHover
          />
        </ComponentCard>
      )}

      {activeTab === 'mileage' && (
        <ComponentCard title='Mileage Records'>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold mb-4">Mileage Records</h2>
            <Button onClick={() => {setshowAddMileageModal(true)}}>Add Mileage</Button>
          </div>          
          <DataTable
            columns={[
              { name: 'Date', selector: row => new Date(row.recordedAt).toLocaleDateString(), sortable: false },
              { name: 'Mileage', selector: row => row.value.toLocaleString() + ' km', sortable: false },
              {
                name: 'Difference',
                cell: (row, index) => (
                  index < carData.mileages.length - 1
                    ? (row.value - carData.mileages[index + 1].value).toLocaleString() + ' km'
                    : 'N/A'
                )
              }
            ]}
            data={carData.mileages}
            pagination
            highlightOnHover
          />
        </ComponentCard>
      )}

      {activeTab === 'upcoming' && (
        <ComponentCard title='Upcoming Maintenance'>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Overdue</h3>
              <DataTable
                columns={[
                  { 
                    name: 'Maintenance', 
                    selector: row => row.description || row.type.replace('_', ' '), 
                    sortable: true 
                  },
                  { 
                    name: 'Due Since', 
                    cell: row => (
                      <Badge color ="error" variant="light" >
                        {Math.floor((new Date().getTime() - new Date(row.date).getTime()) / (1000 * 60 * 60 * 24))} days
                      </Badge>
                    )
                  },
                  { 
                    name: 'Mileage Difference', 
                    selector: row => `${row.recordedMileage - carData?.mileages[0]?.value} km`, 
                    sortable: true 
                  },
                  {
                    name: 'Actions',
                    cell: row => (
                      <Button 
                        size="sm" 
                        onClick={() =>  handleCompleteMaintenance(row.id)}
                      >
                        Mark as Done
                      </Button>
                    )
                  }
                ]}
                data={carData?.maintenances?.filter(m => m.status === 'OVERDUE') || []}
                noDataComponent="No overdue maintenance"
                pagination
                highlightOnHover
              />
            </div>
              
            <div>
              <h3 className="text-lg font-medium mb-2">Upcoming</h3>
              <DataTable
                columns={[
                  { 
                    name: 'Maintenance', 
                    selector: row => row.description || row.type.replace('_', ' '), 
                    sortable: true 
                  },
                  { 
                    name: 'Due In', 
                    cell: row => (
                      <Badge color ="warning" variant="light">
                        {Math.floor((new Date(row.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                      </Badge>
                    )
                  },
                  { 
                    name: 'Mileage Difference', 
                    selector: row => `${row.recordedMileage - carData?.mileages[0]?.value} km`, 
                    sortable: true 
                  },        

                  {
                    name: 'Actions',
                    cell: row => (
                      <Button 
                        size="sm" 
                        onClick={() => handleCompleteMaintenance(row.id)}
                      >
                        Mark as Done
                      </Button>
                    )
                  }
                ]}
                data={carData?.maintenances?.filter(m => m.status === 'UPCOMING') || []}
                noDataComponent="No upcoming maintenance"
                pagination
                highlightOnHover
              />
            </div>
          </div>
        </ComponentCard>
      )}

      {activeTab === 'details' && (
        <ComponentCard title='Vehivle details'>
          <h2 className="text-xl font-semibold mb-4">Vehicle Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Basic Information</h3>
              <div className="space-y-2">
                <p><span className="text-gray-500">Make:</span> {carData.make}</p>
                <p><span className="text-gray-500">Model:</span> {carData.model}</p>
                <p><span className="text-gray-500">Year:</span> {carData.year}</p>
                <p><span className="text-gray-500">VIN:</span> {carData.vin_number}</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Current Status</h3>
              <div className="space-y-2">
                <p>
                  <span className="text-gray-500">Current Zone:</span>{' '}
                  {carData.zone?.zone_name || 'Not assigned'}
                </p>
                <p>
                  <span className="text-gray-500">Last Maintenance:</span>{' '}
                  {carData.maintenances.length
                    ? new Date(carData.maintenances[0].date).toLocaleDateString()
                    : 'Never'}
                </p>
                <p>
                  <span className="text-gray-500">Mileage Since Last Maintenance:</span>{' '}
                  {getMileageSinceLastMaintenance()}
                </p>
              </div>
            </div>
          </div>
        </ComponentCard>
      )}
      {showAddMaintenanceModal && (
          <Modal
            isOpen={showAddMaintenanceModal}
            onClose={() => {
              setShowAddMaintenanceModal(false);
              setEditingMaintenanceId(null);
              setMaintenanceForm({
                type: 'CORRECTIVE_MAINTENANCE',
                date: new Date().toISOString().split('T')[0],
                recordedMileage: carData?.mileages[0]?.value || 0,
                cost: 0,
                description: '',
                facture: null as File | null
              });
            }}
            title={editingMaintenanceId ? "Complete Maintenance" : "Add Maintenance"}
          >
            <div className="space-y-4">
              <div>
                <label>Type</label>
                <Input
                  value={maintenanceForm.type}
                  //onChange={(e) => setMaintenanceForm({...maintenanceForm, type: e.target.value})}
                  className="w-full p-2 border rounded bg-gray-50 cursor-not-allowed"
                  readonly               
                />               
              </div>

              <div>
                <label>Date</label>
                <input
                  type="date"
                  value={maintenanceForm.date}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, date: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label>Mileage (Km)</label>
                <div className='relative'>
                   <input
                    type="number"
                    value={maintenanceForm.recordedMileage}
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, recordedMileage: Number(e.target.value)})}
                    className="w-full p-2 border rounded"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">KM</span>
                </div>               
              </div>

              <div>
                <label>Cost (TND)</label>
                <div className='relative'>
                  <input
                    type="number"
                    value={maintenanceForm.cost}
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, cost: Number(e.target.value)})}
                    className="w-full p-2 border rounded"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">TND</span>                  
                </div>                
              </div>

              <div>
                <label>Description</label>
                <textarea
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, description: e.target.value})}
                  className="w-full p-2 border rounded"
                  readOnly={!!editingMaintenanceId}
                />
              </div>

              <div>
                <label>Invoice (PDF/Image)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="w-full p-2 border rounded"
                />
                {maintenanceForm.facture && (
                  <p className="text-sm text-gray-500 mt-1">
                    Selected file: {maintenanceForm.facture.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button 
              variant="outline" 
              onClick={() =>{
                setEditingMaintenanceId(null);
                setShowAddMaintenanceModal(false)
                setMaintenanceForm({
                  type: 'CORRECTIVE_MAINTENANCE',
                  date: new Date().toISOString().split('T')[0],
                  recordedMileage: carData?.mileages[0]?.value || 0,
                  cost: 0,
                  description: '',
                  facture: null as File | null
                });
              }} 
              >
                Cancel
              </Button>
              <Button onClick={handleAddMaintenance}>
                Save
              </Button>
            </div>
        </Modal>
      )}
      {showAddMileageModal && (
        <Modal
          isOpen={showAddMileageModal}
          onClose={() => {
            setshowAddMileageModal(false);
            setmileageForm({
              value: carData?.mileages[0]?.value || 0,
              recordedAt: new Date().toISOString().split('T')[0]
            });
          }}
          title="Add Mileage"
        >
          <div className="space-y-4">
            <div>
              <label>Recording Date</label>
              <input
                type="date"
                value={mileageForm.recordedAt}
                onChange={(e) => setmileageForm({...mileageForm, recordedAt: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
            </div>
        
            <div>
              <label>Mileage (km)</label>
              <div className='relative'>
                <input
                  type="number"
                  value={mileageForm.value}
                  onChange={(e) => setmileageForm({...mileageForm, value: Number(e.target.value)})}
                  className="w-full p-2 border rounded"
                  min={carData?.mileages[0]?.value || 0}
                  required
                />
                <span className="absolute right-3 top-2 text-gray-500">KM</span>
              </div>              
            </div>
          </div>
        
          <div className="flex justify-end space-x-2 mt-4">
            <Button onClick={() => {              
              setshowAddMileageModal(false)
              setmileageForm({
                value: carData?.mileages[0]?.value || 0,
                recordedAt: new Date().toISOString().split('T')[0]
            });              
            }} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleAddMileage}>
              Save
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CarDetail;
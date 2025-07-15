import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Button from '../ui/button/Button';
import Alert from '../ui/alert/Alert';
import { Modal } from '../ui/modal';
import ComponentCard from '../common/ComponentCard';
import { Zone } from '../types';
import DataTable from 'react-data-table-component';

const ZonesManagement = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [newZoneName, setNewZoneName] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const response = await fetch('/api/chef-park/my-zones', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch zones');
      const data = await response.json();
      setZones(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleAddZone = async () => {
    try {
      // Validate input
      if (!newZoneName.trim()) {
        setError('Zone name is required');
        return;
      }
      const response = await fetch('/api/chef-park/zones/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          zone_name: newZoneName,
          description: ''
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add zone');
      }
      
      const newZone = await response.json();
      setZones([...zones, newZone]);
      setNewZoneName('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add zone');
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      const response = await fetch(`/api/chef-park/zones/delete/${zoneId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'Zone contains cars and cannot be deleted') {
          setError('Cannot delete zone with cars. Remove cars first.');
          return;
        }
        throw new Error(errorData.error || 'Failed to delete zone');
      }
      
      setZones(zones.filter(z => z.id !== zoneId));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete zone');
    }
  };

  return (
    <ComponentCard title='Zone Management'>
      <h2 className="text-xl font-semibold mb-4">Zone Management</h2>
      
      {error && <Alert variant="error" title='Error' message={error} onClose={() => setError('')}></Alert>}
      
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={newZoneName}
          onChange={(e) => setNewZoneName(e.target.value.toUpperCase())}
          placeholder="New zone name"
          className="flex-1 p-2 border rounded"
        />
        <Button onClick={handleAddZone} disabled={!newZoneName.trim()}>
          Add Zone
        </Button>
      </div>
      
      <DataTable
        columns={[
          { name: 'Zone Name', selector: row => row.zone_name, sortable: true },
          { name: 'Cars Count', selector: row => row.cars?.length || 0, sortable: true },
          {
            name: 'Actions',
            cell: row => (
              <div className="flex flex-wrap gap-1">
                <Button
                  size="md" 
                  variant="outline"
                  className="min-w-[30px]" 
                  onClick={() => navigate(`/chef-park/zones/${row.id}/cars`)}
                >
                  View Cars
                </Button>
                <Button
                  size="md" 
                  variant="danger"
                  className="min-w-[30px]"
                  onClick={() => setDeleteConfirm(row.id)}
                  disabled={row.cars?.length > 0}
                >
                  Delete
                </Button>
              </div>
            )
          }
        ]}
        data={zones}
        noDataComponent={error || 'No zones found'}
        pagination
        highlightOnHover
      />
      
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Deletion"
      >
        <p>Are you sure you want to delete this zone?</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => deleteConfirm && handleDeleteZone(deleteConfirm)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </ComponentCard>
  );
};

export default ZonesManagement;
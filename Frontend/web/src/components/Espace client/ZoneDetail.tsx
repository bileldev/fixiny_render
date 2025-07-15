import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import ComponentCard from '../common/ComponentCard';
import Button from '../ui/button/Button';
import Alert from '../ui/alert/Alert';
import Badge from '../ui/badge/Badge';
import { Zone, Car } from '../types';
import DataTable from 'react-data-table-component';

const ZoneDetail = () => {
  const { zoneId } = useParams();
  const [zoneData, setZoneData] = useState<{zone: Zone; cars: Car[]} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchZoneData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/chef-park/my-zones/${zoneId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch zone details');
      const data = await res.json();
      setZoneData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch zone details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZoneData();
  }, [zoneId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <Alert title='Error' message={error} variant="error"></Alert>;
  if (!zoneData) return <div>Zone not found</div>;

  return (
    <div className="space-y-4">
      <ComponentCard title=''>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{zoneData.zone.zone_name}</h1>
            <p className="text-gray-600 mt-1">
              {zoneData.zone.description || 'No description available'}
            </p>
            <div className="mt-2">
              <Badge variant="solid">
                {zoneData.cars.length} car(s) assigned
              </Badge>
            </div>
          </div>
          <Button variant="outline">Edit Zone</Button>
        </div>
      </ComponentCard>

      <ComponentCard title=''>
        <h2 className="text-xl font-semibold mb-4">Assigned Cars</h2>
        <DataTable
          columns={[
            { name: 'License Plate', selector: row => row.licensePlate, sortable: true },
            { name: 'Make/Model', selector: row => `${row.make} ${row.model}`, sortable: true },
            { name: 'Year', selector: row => row.year, sortable: true },
            { name: 'Current Mileage', selector: row => row.mileages?.[0]?.value.toLocaleString() + ' km', sortable: true },
            {
              name: 'Actions',
              cell: row => (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate(`/chef-park/cars/${row.id}`)}
                >
                  View
                </Button>
              )
            }
          ]}
          data={zoneData.cars}
          progressPending={loading}
          noDataComponent="No cars assigned to this zone"
          pagination
          highlightOnHover
        />
      </ComponentCard>
    </div>
  );
};

export default ZoneDetail;
import { useState, useEffect } from "react";
import { Car, Maintenance } from "../types";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";

export default function MaintenanceList () {

    const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    //const [currentCar, setCurrentCar] = useState<Car | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const navigate = useNavigate();

    const fetchMaintenances = async () => {
        try {
          const response = await fetch('/api/admin/users/cars/maintenances', {
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch maintenances');
          }
          
          const data = await response.json();
          setMaintenances(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
          toast.error('Failed to load maintenances');
        } finally {
          setLoading(false);
        }
    };
    
    useEffect(() => {    
      fetchMaintenances();
    }, []);

    // Define columns for the table
    const columns = [
        {
            name: 'Car',
            selector: (row: Maintenance) => row.car?.licensePlate || 'N/A',
            sortable: true,
        },
        {
            name: 'Type',
            selector: (row: Maintenance) => row.type,
            sortable: true,
        },
        {
            name: 'Date',
            selector: (row: Maintenance) => row.date,
            format: (row: Maintenance) => new Date(row.date).toLocaleDateString(),
            sortable: true
        },
        {
            name: 'Recorded Mileage',
            selector: (row: Maintenance) => row.recordedMileage?.toLocaleString() || '0',
            format: (row: Maintenance) => `${row.recordedMileage?.toLocaleString() || '0'} KM`,
            sortable: true,
            right: true,
        },
        {
            name: 'Cost',
            selector: (row: Maintenance) => row.cost.toString(), // Must return string
            format: (row: Maintenance) => `${row.cost.toFixed(2)} TND`,
            sortable: true,
            right: true,
        },
        {
            name: 'Description',
            selector: (row: Maintenance) => row.description || '',
        },
          
    ];

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">maintenances List</h1>
            </div>
            
            <DataTable
                columns={columns}
                data={maintenances}
                pagination
                responsive
                highlightOnHover
                striped
                progressPending={loading}
                noDataComponent={<div className="p-4">No maintenances found</div>}
                customStyles={{
                    headCells: {
                        style: {
                            fontWeight: 'bold',
                            fontSize: '16px',
                        },
                    },
                }}
            />
        </div>
    );
}
import { useState, useEffect } from "react";
import { Car, User } from "../types";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";

export default function CarsList () {

    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchCars = async () => {
        try {
          const response = await fetch('/api/admin/users/cars', {
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch cars');
          }
          
          const data = await response.json();
          setCars(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
          toast.error('Failed to load cars');
        } finally {
          setLoading(false);
        }
    };
    
    useEffect(() => {    
      fetchCars();
    }, []);

    const handleEdit = (carId: string) => {
        navigate(`/cars/edit/${carId}`);
    };



    const handleDelete = async (carId: string) => {
        if (window.confirm('Are you sure you want to delete this car?')) {
            try {
                await fetch(`/api/cars/${carId}`, { method: 'DELETE' });
                toast.success('Car deleted successfully');
                fetchCars(); // Refresh the list
            } catch (error) {
                toast.error('Failed to delete car');
            }
        }
    };

    // Define columns for the table
    const columns = [
        {
            name: 'User',
            selector: (row: Car) => row.user?.first_name + ' ' + row.user?.last_name || 'NA',
            sortable: true,
        },
        {
            name: 'Make',
            selector: (row: Car) => row.make,
            sortable: true,
        },
        {
            name: 'Model',
            selector: (row: Car) => row.model,
            sortable: true,
        },
        {
            name: 'Year',
            selector: (row: Car) => row.year,
            sortable: true,
        },
        {
            name: 'License Plate',
            selector: (row: Car) => row.licensePlate,
            sortable: true,
        },
        {
            name: 'VIN',
            selector: (row: Car) => row.vin_number,
        },
        {
            name: 'Mileage',
            selector: (row: Car) => row.initial_mileage?.toLocaleString() || '0',
            format: (row: Car) => `${row.initial_mileage?.toLocaleString() || '0'} KM`,
            sortable: true,
            right: true,
        },        
    ];

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Cars List</h1>
            </div>
            
            <DataTable
                columns={columns}
                data={cars}
                pagination
                responsive
                highlightOnHover
                striped
                progressPending={loading}
                noDataComponent={<div className="p-4">No cars found</div>}
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
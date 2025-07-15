import { useState, useEffect } from "react";
import { Car, Maintenance, User } from "../types";
import toast from "react-hot-toast";
import DataTable from 'react-data-table-component';
//import styled from 'styled-components';

export default function MyCars () {

    /*const StyledTable = styled(DataTable)`
        .rdt_TableHead {
        font-weight: bold;
        background-color: #f8f9fa;
    }
  
        .rdt_TableCell {
        padding: 12px 15px;
    }
  
        .rdt_TableRow:hover {
        background-color: #f5f5f5;
    }`;*/

    

    const [myCars, setMyCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [maintenances, setMaintenances] = useState<Maintenance[]>([]);

    const fetchMaintenances = async (carId: string) => {
        try {
          const response = await fetch(`/api/user/users/cars/${carId}/maintenances`);
          const data = await response.json();
          setMaintenances(data);
        } catch (error) {
          toast.error('Failed to load maintenance records');
        }
      };

    const getUserFromLocalStorage = (): User | null => {
        try {
          const userString = localStorage.getItem('user');
          if (!userString) return null;
          
          const user = JSON.parse(userString) as User;
          return user;
        } catch (error) {
          console.error('Error retrieving user from localStorage:', error);
          return null;
        }
      };
      const currentUser = getUserFromLocalStorage();

    const fetchCars = async () => {
        try {
          const response = await fetch(`/api/user/users/${currentUser?.id}/cars`, {
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch users');
          }
          
          const data = await response.json();
          setMyCars(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
          toast.error('Failed to load users');
        } finally {
          setLoading(false);
        }
      };
    
    useEffect(() => {
        fetchCars();
    }, []);

    useEffect(() => {
        if (!currentUser?.id) return;
        
        const fetchCars = async () => {
          try {
            const response = await fetch(`/api/user/users/${currentUser?.id}/cars`);
            const data = await response.json();
            setMyCars(data);
          } catch (error) {
            toast.error('Failed to load cars');
          } finally {
            setLoading(false);
          }
        };

        fetchCars();
    }, [currentUser?.id]);
    
    // Define columns for the table
    const columns = [
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
        // Optional: Add action buttons
        {
            name: 'Actions',
            cell: (row: Car) => (
                <div className="flex space-x-1">
                    <button 
                        onClick={() => {
                            setSelectedCar(row)
                            showMaintenance(row.id)
                        }
                    }
                        className="px-2 py-1 bg-blue-500 text-white rounded"
                    >
                        View maintenance
                    </button>
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
        },
    ];

    const showMaintenance = (carId: string) => {
        fetchMaintenances(carId);;
    };

    if (!currentUser) {
        return <div className="p-4 text-center">Please log in to view your cars</div>;
    }

    if (loading) {
        return <div className="p-4 text-center">Loading cars...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">My Cars</h1>
            </div>
            
            <DataTable
                columns={columns}
                data={myCars}
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
                      {/*maintenances.map(m => (
                        <tr key={m.id}>
                          <td>{m.type.replace('_', ' ')}</td>
                          <td>{new Date(m.date).toLocaleDateString()}</td>
                          <td>{m.recordedMileage.toLocaleString()}</td>
                          <td>${m.cost.toFixed(2)}</td>
                        </tr>
                      ))*/}
                      {maintenances?.map(m => (
                        <tr key={m.id}>
                          <td className='px-6 py-4 whitespace-nowrap'>{(m.type || '').replace('_', ' ')}</td>
                          <td className='px-6 py-4 whitespace-nowrap'>{m.date ? new Date(m.date).toLocaleDateString() : 'N/A'}</td>
                          <td className='px-6 py-4 whitespace-nowrap'>{m.recordedMileage?.toLocaleString() || '0'} KM</td>
                          <td className='px-6 py-4 whitespace-nowrap'>{m.cost?.toFixed(2) || '0.00'} TND</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>

    );

}


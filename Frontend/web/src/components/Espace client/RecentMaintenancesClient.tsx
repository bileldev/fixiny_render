import { useEffect, useState, } from "react";
import { useNavigate } from "react-router";
import { 
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { Maintenance } from "../types";


export default function RecentMaintenancesClient() {

  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMaintenances = async () => {
      try {
        const response = await fetch('/api/chef-park/my-maintenances/recent-maintenances', {
          credentials: 'include'
        });
        const data = await response.json();
        setMaintenances(data);
      } catch (error) {
        console.error("Failed to fetch maintenances:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenances();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatMaintenanceType = (type: string) => {
    return type.toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusBadge = (status: any) => {
    switch(status) {
      case 'DONE': return <Badge color="success">Completed</Badge>;
      case 'OVERDUE': return <Badge color="error">Overdue</Badge>;
      case 'UPCOMING': return <Badge color="warning">Upcoming</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  
  if (loading) return <div className="loading-spinner">Loading recent maintenances...</div>;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Maintenances
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/chef-park/maintenances')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            See all
          </button>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Vehicle
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Type
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Date
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Cost
              </TableCell>
              <TableCell 
                isHeader 
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">

            {maintenances.map((maintenance: Maintenance) => (
              <TableRow key={maintenance.id}>
                <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                  {maintenance.car?.make} {maintenance.car?.model} ({maintenance.car?.licensePlate})
                </TableCell>
                <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                  {formatMaintenanceType(maintenance.type)}
                </TableCell>
                <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                  {formatDate(maintenance.date)}
                </TableCell>
                <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                  {maintenance.cost.toFixed(2)} TND
                </TableCell>
                <TableCell className="py-3">
                  {getStatusBadge(maintenance.status)}
                </TableCell>
              </TableRow>
            ))}
            
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

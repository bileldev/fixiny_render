import { useState, useEffect } from 'react';
import ComponentCard from '../common/ComponentCard';
import Button from '../ui/button/Button';
import {Modal} from '../ui/modal';
import Alert from '../ui/alert/Alert';
import { Budget, Zone } from '../types';
import DataTable from 'react-data-table-component';

const BudgetManagement = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBudget, setNewBudget] = useState({
    zone_id: '',
    amount: '',
    fiscalYear: new Date().getFullYear().toString(),
    description: ''
  });

  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Add this function
  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setNewBudget({
      zone_id: budget.zone_id,
      amount: budget.amount.toString(),
      fiscalYear: budget.fiscalYear.toString(),
      description: budget.description || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateBudget = async () => {
    setError('');
    try {
      const res = await fetch(`/api/chef-park/budget/update/${editingBudget?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: parseFloat(newBudget.amount),
          description: newBudget.description
        })
      });

      if (!res.ok) throw new Error('Failed to update budget');

      const updatedBudget = await res.json();
      setBudgets(budgets.map(b => b.id === updatedBudget.id ? updatedBudget : b));
      setShowEditModal(false);
      setNewBudget({
        zone_id: '',
        amount: '',
        fiscalYear: new Date().getFullYear().toString(),
        description: ''
      });
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update budget');
    }
  };

  // Enhanced data fetching with dependency tracking

  const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch budgets and zones in parallel
        const [budgetsRes, zonesRes] = await Promise.all([
          fetch('/api/chef-park/budget', { credentials: 'include' }),
          fetch('/api/chef-park/my-zones', { credentials: 'include' })
        ]);

        if (!budgetsRes.ok || !zonesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [budgetsData, zonesData] = await Promise.all([
          budgetsRes.json(),
          zonesRes.json()
        ]);

        // Enrich budget data with zone names
        const enrichedBudgets = budgetsData.map((budget: Budget) => {
          const zone = zonesData.find((z: Zone) => z.id === budget.zone_id);
          return {
            ...budget,
            zone: zone ? { zone_name: zone.zone_name } : null
          };
        });

        setBudgets(enrichedBudgets);
        setZones(zonesData);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBudget = async () => {
    setError('');
    try {
      const res = await fetch('/api/chef-park/budget/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...newBudget,
          amount: parseFloat(newBudget.amount),
          fiscalYear: parseInt(newBudget.fiscalYear)
        })
      });
      if (!res.ok) throw new Error('Failed to create budget');
      const data = await res.json();
      
      setBudgets([...budgets, data]);
      setShowCreateModal(false);
      setNewBudget({
        zone_id: '',
        amount: '',
        fiscalYear: new Date().getFullYear().toString(),
        description: ''
      });
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create budget');
    }
  };

  return (
    <div className="space-y-4">
      <ComponentCard title='Budget Management'>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Budget Management</h2>
          <Button onClick={() => setShowCreateModal(true)}>Create Budget</Button>
        </div>

        {error && (
          <Alert 
            variant="error"
            title="Error"
            message={error} 
            onClose={() => setError('')}>            
          </Alert>
        )}

        <DataTable
          columns={[
            { name: 'Zone', selector: (row: Budget) => row.zone?.zone_name || 'N/A', sortable: true },
            { name: 'Amount (TND)', selector: (row: Budget) => row.amount.toLocaleString(), sortable: true },
            { name: 'Fiscal Year', selector: (row: Budget) => row.fiscalYear, sortable: true },
            { name: 'Description', selector: (row: Budget) => row.description || 'N/A', sortable: true },
            {
              name: 'Actions',
              cell: (row: Budget) => (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleEditBudget(row)}
                >
                  Edit
                </Button>
              )
            }
          ]}
          data={budgets}
          progressPending={loading}
          noDataComponent={error || 'No budgets found'}
          pagination
          highlightOnHover
        />
      </ComponentCard>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewBudget({
            zone_id: '',
            amount: '',
            fiscalYear: new Date().getFullYear().toString(),
            description: ''
          });
          }
        }
        title="Create Budget"
      >
        <div className="space-y-4">
          <div>
            <label>Zone</label>
            <select
              value={newBudget.zone_id}
              onChange={(e) => setNewBudget({...newBudget, zone_id: e.target.value})}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Zone</option>
              {zones.map(zone => (
                <option key={zone.id} value={zone.id}>
                  {zone.zone_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Amount (TND)</label>
              <input
                type="number"
                step="0.01"
                value={newBudget.amount}
                onChange={(e) => setNewBudget({...newBudget, amount: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label>Fiscal Year</label>
              <input
                type="number"
                value={newBudget.fiscalYear}
                onChange={(e) => setNewBudget({...newBudget, fiscalYear: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          <div>
            <label>Description</label>
            <textarea
              value={newBudget.description}
              onChange={(e) => setNewBudget({...newBudget, description: e.target.value})}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() =>{
                setShowCreateModal(false);
                setNewBudget({
                  zone_id: '',
                  amount: '',
                  fiscalYear: new Date().getFullYear().toString(),
                  description: ''
                });
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateBudget}
            >
              Create Budget
            </Button>
          </div>
        </div>
      </Modal>

      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setNewBudget({
              zone_id: '',
              amount: '',
              fiscalYear: new Date().getFullYear().toString(),
              description: ''
            });
            }
          }
          title="Edit Budget"
        >
          <div className="space-y-4">
            <div>
              <label>Zone</label>
              <select
                value={newBudget.zone_id}
                className="w-full p-2 border rounded"
                disabled // Zone shouldn't be editable
              >
                <option value={newBudget.zone_id}>
                  {budgets.find(b => b.id === editingBudget?.id)?.zone?.zone_name}
                </option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Amount (TND)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget({...newBudget, amount: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label>Fiscal Year</label>
                <input
                  type="number"
                  value={newBudget.fiscalYear}
                  className="w-full p-2 border rounded"
                  disabled // Fiscal year shouldn't be editable
                  required
                />
              </div>
            </div>

            <div>
              <label>Description</label>
              <textarea
                value={newBudget.description}
                onChange={(e) => setNewBudget({...newBudget, description: e.target.value})}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditModal(false);
                  setNewBudget({
                    zone_id: '',
                    amount: '',
                    fiscalYear: new Date().getFullYear().toString(),
                    description: ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateBudget}
              >
                Update Budget
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BudgetManagement;
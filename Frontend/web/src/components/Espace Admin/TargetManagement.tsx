import { useState, useEffect } from 'react';
import ComponentCard from '../common/ComponentCard';
import Button from '../ui/button/Button';
import {Modal} from '../ui/modal';
import Alert from '../ui/alert/Alert';
import { Budget } from '../types';
import DataTable from 'react-data-table-component';

const TargetManagement = () => {

    const [target, setTarget] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTarget, setNewTarget] = useState({
      amount: '',
      fiscalYear: new Date().getFullYear().toString(),
      description: ''
    });

    const [editingTarget, setEditingTarget] = useState<Budget | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const handleEditTarget = (target: Budget) => {
      setEditingTarget(target);
      setNewTarget({
        amount: target.amount.toString(),
        fiscalYear: target.fiscalYear.toString(),
        description: target.description || ''
      });
      setShowEditModal(true);
    };

    const handleUpdateBudget = async () => {
      setError('');
      try {
        const res = await fetch(`/api/admin/targets/update-target/${editingTarget?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            amount: parseFloat(newTarget.amount),
            description: newTarget.description,
          })
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to update target');
        }

        const updatedTarget = await res.json();

        // Update local state optimistically
        setTarget(target.map(b => 
          b.id === updatedTarget.id ? { 
            ...updatedTarget 
          } : b
        ));

        setShowEditModal(false);
        setNewTarget({
          amount: '',
          fiscalYear: new Date().getFullYear().toString(),
          description: ''
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update target');
        console.error('Target update error:', err);
      }
    };

     const fetchTarget = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/targets', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch Target');
        setTarget(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update target');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchTarget();
    }, []);

    const handleCreateBudget = async () => {
      setError('');
      try {
        const res = await fetch('/api/admin/targets/create-target', {  // Updated endpoint
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            amount: parseFloat(newTarget.amount),
            fiscalYear: parseInt(newTarget.fiscalYear),
            description: newTarget.description
          })
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to create budget');
        }

        const createdBudget = await res.json();

        // Optimistic update
        setTarget(prev => [...prev, createdBudget]);

        // Reset form
        setShowCreateModal(false);
        setNewTarget({
          amount: '',
          fiscalYear: new Date().getFullYear().toString(),
          description: ''
        });

        // Optional: Refresh data from server
        await fetchTarget();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create budget');
        console.error('Budget creation error:', err);
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
              onClose={() => setError('')}          
            />
          )}

          <DataTable
            columns={[
              { 
                name: 'Amount (TND)', 
                selector: (row: Budget) => row.amount.toLocaleString(), 
                sortable: true 
              },
              { 
                name: 'Fiscal Year', 
                selector: (row: Budget) => row.fiscalYear, 
                sortable: true 
              },
              { 
                name: 'Description', 
                selector: (row: Budget) => row.description || 'N/A', 
                sortable: true 
              },
              {
                name: 'Actions',
                cell: (row: Budget) => (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEditTarget(row)}
                  >
                    Edit
                  </Button>
                )
              }
            ]}
            data={target}
            progressPending={loading}
            noDataComponent={error || 'No Targets found'}
            pagination
            highlightOnHover
          />
        </ComponentCard>

        {/* Create Budget Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setNewTarget({
              amount: '',
              fiscalYear: new Date().getFullYear().toString(),
              description: ''
            });
          }}
          title="Create Budget"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Amount (TND)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newTarget.amount}
                  onChange={(e) => setNewTarget({...newTarget, amount: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label>Fiscal Year</label>
                <input
                  type="number"
                  value={newTarget.fiscalYear}
                  onChange={(e) => setNewTarget({...newTarget, fiscalYear: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>

            <div>
              <label>Description</label>
              <textarea
                value={newTarget.description}
                onChange={(e) => setNewTarget({...newTarget, description: e.target.value})}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTarget({
                    amount: '',
                    fiscalYear: new Date().getFullYear().toString(),
                    description: ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateBudget}>
                Create Budget
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Budget Modal */}
        {showEditModal && (
          <Modal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setNewTarget({
                amount: '',
                fiscalYear: new Date().getFullYear().toString(),
                description: ''
              });
            }}
            title="Edit Budget"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Amount (TND)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTarget.amount}
                    onChange={(e) => setNewTarget({...newTarget, amount: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label>Fiscal Year</label>
                  <input
                    type="number"
                    value={newTarget.fiscalYear}
                    className="w-full p-2 border rounded"
                    disabled
                    required
                  />
                </div>
              </div>

              <div>
                <label>Description</label>
                <textarea
                  value={newTarget.description}
                  onChange={(e) => setNewTarget({...newTarget, description: e.target.value})}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowEditModal(false);
                    setNewTarget({
                      amount: '',
                      fiscalYear: new Date().getFullYear().toString(),
                      description: ''
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateBudget}>
                  Update Budget
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
};

export default TargetManagement;
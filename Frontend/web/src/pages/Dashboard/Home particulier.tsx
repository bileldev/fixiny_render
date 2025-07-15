import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import ListCars from "../../components/Espace particulier/ListCars";
import ListMaintenances from "../../components/Espace particulier/ListMaintenances";


export default function HomeParticulier() {
  
  const [activeTab, setActiveTab] = useState<'cars' | 'maintenances'>('cars');

  return (
    <>
      <PageMeta
        title="Fixiny - Particulier Dashboard"
        description="Manage your cars and maintenance records"
      />
      
      <div className="space-y-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'cars' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('cars')}
          >
            My Cars
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'maintenances' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('maintenances')}
          >
            Maintenance Records
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'cars' ? <ListCars /> : <ListMaintenances />}
        </div>
      </div>
    </>
  );
}
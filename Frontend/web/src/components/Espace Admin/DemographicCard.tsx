import { useState, useEffect } from "react";
import 'leaflet/dist/leaflet.css'
import TunisiaMap from "../utils/tunisiaMapUtils";

export interface ZoneData {
  id: string;
  name: string;
  vehiclesInService: number;
  vehiclesUnderMaintenance: number;
}

export default function MaintenanceMap() {  

  const [zonesData, setZonesData] = useState<ZoneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredGov, setHoveredGov] = useState<string|null>(null);


  // Fetch zone data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/zones/maintenance-map-data', {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch zones');
        const zones = await response.json();
        const transformed = zones.map((zone: any) => ({
          id: zone.id,
          name: zone.name.toUpperCase(),
          vehiclesInService: zone.vehiclesInService || 0,
          vehiclesUnderMaintenance: zone.vehiclesUnderMaintenance || 0
        }));
        setZonesData(transformed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getFeatureProperties = (gouv_fr: string) => {
    const zoneData = zonesData.find(d => d.name === gouv_fr.toUpperCase());
    
    if (!zoneData) {
      return {
        vehiclesInService: 0,
        vehiclesUnderMaintenance: 0,
        maintenanceRatio: 0,
        color: '#e0e0e0' // No data color
      };
    }

    const totalVehicles = zoneData.vehiclesInService;
    const maintenanceRatio = totalVehicles > 0 
      ? zoneData.vehiclesUnderMaintenance / totalVehicles
      : 0;

    let color;
    if (maintenanceRatio === 0) {
      color = '#e0e0e0'; // No data
    } else if (maintenanceRatio > 0.3) {
      color = '#e53835'; // Critical (>30%)
    } else if (maintenanceRatio > 0.1) {
      color = '#f7c242'; // Warning (10-30%)
    } else {
      color = '#a1d76a'; // Good (<10%)
    }

    return {
      vehiclesInService: zoneData.vehiclesInService,
      vehiclesUnderMaintenance: zoneData.vehiclesUnderMaintenance,
      maintenanceRatio,
      color
    };
  };

  const getTooltipContent = (gouv_fr: string) => {
    const data = getFeatureProperties(gouv_fr.toUpperCase());
    return `
      <div>
        <strong>${gouv_fr}</strong><br/>
        In Service: ${data.vehiclesInService}<br/>
        Under Maintenance: ${data.vehiclesUnderMaintenance}<br/>
        Maintenance Ratio: ${(data.maintenanceRatio * 100).toFixed(1)}%
      </div>
    `;
  };

  if (loading) return <div className="loading-spinner">Loading maintenance data...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;
  
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Maintenance Demographic
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Vehicle Maintenance Status by Zone
          </p>
        </div>
      </div>
      
      {/* Replace the SVG map with TunisiaMap */}
      <div className="px-4 py-6 my-6 overflow-hidden border border-gray-200 rounded-2xl dark:border-gray-800 sm:px-6">
        <div className="relative h-96 w-full">
          <TunisiaMap 
            getFeatureStyle={(gouv_fr: string) => {
              const properties = getFeatureProperties(gouv_fr);
              return {
                fillColor: properties.color,
                fillOpacity: 0.8,
                color: "#ffffff",
                weight: 1,
                // You can add more styling properties here
              };
            }}
            onGovernorateHover={setHoveredGov}
            tooltipContent={getTooltipContent}
          />
        </div>
      </div>

      {hoveredGov && (
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md z-10">
          <h4 className="font-bold">{hoveredGov}</h4>
          <div dangerouslySetInnerHTML={{
            __html: getTooltipContent(hoveredGov)
          }} />
        </div>
      )}
      
      {/* Legend remains the same */}
      <div className="relative bottom-4 right-4 bg-white p-3 rounded-lg shadow-md">
        <h4 className="font-bold mb-2">Maintenance Status</h4>
        {[
          { label: 'Good (<10%)', color: '#a1d76a' },
          { label: 'Warning (10-30%)', color: '#f7c242' },
          { label: 'Critical (>30%)', color: '#e53835' },
          { label: 'No Data', color: '#e0e0e0' }
        ].map(item => (
          <div key={item.label} className="flex items-center mb-1">
            <div 
              className="w-4 h-4 mr-2 rounded-sm" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

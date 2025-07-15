import React, { useState, useEffect, ReactNode } from 'react';
import { MapContainer, TileLayer, GeoJSON, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Feature, GeoJsonProperties, Polygon, MultiPolygon, Geometry } from 'geojson';

// Type definitions

type GovernorateProperties = {
  gouv_id: string;
  gouv_fr: string;
  gouv_ar: string;
} & GeoJsonProperties;

type PolygonFeature = Feature<Polygon, GovernorateProperties>;
type MultiPolygonFeature = Feature<MultiPolygon, GovernorateProperties>;
type GovernorateFeature = PolygonFeature | MultiPolygonFeature;

interface GovernorateData {
  type: 'FeatureCollection';
  crs: {
    type: 'name';
    properties: {
      name: string;
    };
  };
  features: GovernorateFeature[];
}

interface TunisiaMapProps {
  getFeatureStyle: (gouv_fr: string) => {
    fillColor: string;
    fillOpacity: number;
    color: string;
    weight: number;
  };
  onGovernorateHover: (gouv_fr: string | null) => void;
  tooltipContent: (gouv_fr: string) => string;
}

// Helper type for our extended Path class
type ExtendedPath = L.Path & { feature: GovernorateFeature };

const TunisiaMap: React.FC<TunisiaMapProps> = ({ 
  getFeatureStyle, 
  onGovernorateHover, 
  tooltipContent 
}) => {
  const [governoratesData, setGovernoratesData] = useState<GovernorateData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const response = await fetch('data/TN-gouvernorats.geojson');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data: GovernorateData = await response.json();
        setGovernoratesData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const highlightFeature = (e: L.LeafletEvent): void => {
    const layer = e.target as ExtendedPath;
    layer.setStyle({
      weight: 3,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.9
    });
    layer.bringToFront();
    onGovernorateHover(layer.feature.properties.gouv_fr.toUpperCase());
  };

  const resetHighlight = (e: L.LeafletEvent): void => {
    const layer = e.target as ExtendedPath;
    const style = getFeatureStyle(layer.feature.properties.gouv_fr.toUpperCase());
    layer.setStyle(style);
    onGovernorateHover(null);
  };

  const onEachFeature = (feature: GovernorateFeature, layer: L.Layer): void => {
    if (layer instanceof L.Path) {
      (layer as ExtendedPath).feature = feature;
      layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
      });
    }
  };

  const getStyle: (feature?: Feature<Geometry, GovernorateProperties>) => L.PathOptions = (feature) => {
    const defaultStyle: L.PathOptions = {
      fillColor: '#e0e0e0',
      weight: 1,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };

    if (!feature) return defaultStyle;
    
    // Type guard to check if it's a GovernorateFeature
    const govFeature = feature as GovernorateFeature;
    return getFeatureStyle(govFeature.properties.gouv_fr.toUpperCase());
  };

  if (loading) return <div>Loading map data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!governoratesData) return <div>No data available</div>;

  return (
    <MapContainer
      center={[34, 9]}
      zoom={6}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <GeoJSON
        data={governoratesData}
        style={getStyle}
        onEachFeature={onEachFeature}
      >
        <Tooltip>
          {((layer: { feature: Feature<Geometry, GovernorateProperties> }) => (
            <div dangerouslySetInnerHTML={{
              __html: tooltipContent(layer.feature.properties.gouv_fr.toUpperCase())
            }} />
          )) as unknown as ReactNode}
        </Tooltip>        
      </GeoJSON>
    </MapContainer>
  );
};

export default TunisiaMap;
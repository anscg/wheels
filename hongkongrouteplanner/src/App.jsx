import { useState, useEffect } from 'react';
import { Map, Source, Layer } from 'react-map-gl/maplibre';
import osmtogeojson from 'osmtogeojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mtrLines } from './mtrLines'; // Import the configuration
import './App.css';

function App() {
  const [mtrData, setMtrData] = useState(null);

  useEffect(() => {
    // This function fetches and processes the MTR data from OpenStreetMap
    const fetchMtrData = async () => {
      console.log('Fetching MTR data...');
      const overpassApiUrl = 'https://overpass-api.de/api/interpreter';

      const promises = mtrLines.map(async (line) => {
        // This Overpass QL query gets a relation by its ID and all its members (routes, tracks, stations)
        const query = `[out:json][timeout:90];
                       relation(${line.relationId});
                       (._;>;);
                       out geom;`;

        try {
          const response = await fetch(`${overpassApiUrl}?data=${encodeURIComponent(query)}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for line ${line.code}`);
          }
          const osmData = await response.json();
          // Convert the OSM JSON data to GeoJSON format
          const geojsonData = osmtogeojson(osmData);
          
          console.log(`Processed data for ${line.name}:`, geojsonData);
          
          return {
            ...line,
            geojson: geojsonData,
          };
        } catch (error) {
          console.error(`Failed to fetch or process data for ${line.name}:`, error);
          return null; // Return null if a line fails to load
        }
      });

      // Wait for all lines to be fetched and processed
      const results = await Promise.all(promises);
      // Filter out any lines that failed to load
      setMtrData(results.filter(r => r !== null));
      console.log('MTR data loaded and processed.');
    };

    fetchMtrData();
  }, []); // The empty dependency array ensures this runs only once on mount

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <Map
        initialViewState={{
          longitude: 114.1694,
          latitude: 22.3193,
          zoom: 10.5, // Adjusted zoom to better see the whole network
          pitch: 0,
          bearing: 0
        }}
        mapStyle="/mapstyle.json"
      >
        {/* We only render the sources and layers once the data is available */}
        {mtrData && mtrData.map((line) => (
          <Source
            key={line.code}
            id={`${line.code}-source`}
            type="geojson"
            data={line.geojson}
          >
            <Layer
              id={`${line.code}-route`}
              type="line"
              filter={['==', '$type', 'LineString']}
              paint={{
                'line-color': line.color,
                'line-width': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10, 1,
                  15, 2,
                  18, 6,
                  20, 10
                ],
                'line-opacity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  14, 0,
                  15, 0.8,
                  16, 0.8
                ]
              }}
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
            />
          </Source>
        ))}
      </Map>
      {!mtrData && (
        <div className="loading-overlay">
          <h1>Loading MTR Data...</h1>
        </div>
      )}
    </div>
  );
}

export default App;
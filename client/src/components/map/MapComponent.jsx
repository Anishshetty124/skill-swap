import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';

const MapComponent = ({ skills }) => {
  const defaultPosition = [16.333, 75.283];
  const [mapCenter, setMapCenter] = useState(defaultPosition);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
      },
      () => {
        console.log("User denied geolocation. Using default map center.");
      }
    );
  }, []);

  const skillsWithLocation = skills.filter(
    skill => skill.geoCoordinates?.coordinates?.length === 2
  );
  
  return (
    <div className="h-[600px] rounded-lg overflow-hidden shadow-lg">
      <MapContainer key={mapCenter.toString()} center={mapCenter} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {skillsWithLocation.map(skill => (
          <Marker 
            key={skill._id} 
            position={[skill.geoCoordinates.coordinates[1], skill.geoCoordinates.coordinates[0]]}
          >
            <Popup>
              <div className="font-sans">
                <h3 className="font-bold text-lg mb-1">{skill.title}</h3>
                <p className="text-gray-600 mb-2">Category: {skill.category}</p>
                <Link to={`/skills/${skill._id}`} className="text-indigo-600 hover:underline font-semibold">
                  View Details &rarr;
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
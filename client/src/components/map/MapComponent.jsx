import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';

const MapComponent = ({ skills }) => {
  // Filter out skills that don't have valid coordinates
  const skillsWithLocation = skills.filter(
    skill => skill.user?.location?.coordinates?.length === 2
  );

  // Default center of the map (Mudhol, Karnataka)
  const defaultPosition = [16.333, 75.283];
  
  // Use the first skill's location as the center if available
  const mapCenter = skillsWithLocation.length > 0 
    ? [skillsWithLocation[0].user.location.coordinates[1], skillsWithLocation[0].user.location.coordinates[0]] // [lat, lon]
    : defaultPosition;

  return (
    <div className="h-[600px] rounded-lg overflow-hidden shadow-lg">
      <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {skillsWithLocation.map(skill => (
          <Marker 
            key={skill._id} 
            position={[skill.user.location.coordinates[1], skill.user.location.coordinates[0]]} // Leaflet uses [lat, lon]
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
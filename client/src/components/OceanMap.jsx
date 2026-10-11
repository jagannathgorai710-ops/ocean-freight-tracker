import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default Leaflet icon assets
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Port Pin Icons
const createPortIcon = (color, label) => L.divIcon({
  className: 'custom-port-pin',
  html: `
    <div style="
      background: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 0 14px ${color};
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 13px;
      font-weight: bold;
    ">
      ⚓
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

const createVesselIcon = () => L.divIcon({
  className: 'custom-vessel-pin',
  html: `
    <div style="
      background: #06b6d4;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 0 16px #06b6d4;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    ">
      🚢
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Helper component to auto-recenter map when active shipment changes
function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function OceanMap({ activeShipment }) {
  let origin = activeShipment?.originCoordinates || { lat: 18.9496, lng: 72.9515 };
  let dest = activeShipment?.destCoordinates || { lat: 33.7432, lng: -118.2673 };

  const progress = (activeShipment?.progress || 50) / 100;
  
  // Interpolate vessel coordinates
  const vesselLat = origin.lat + (dest.lat - origin.lat) * progress;
  let vesselLng = origin.lng + (dest.lng - origin.lng) * progress;
  if (dest.lng < 0 && origin.lng > 0 && Math.abs(dest.lng - origin.lng) > 180) {
    const span = (180 - origin.lng) + (180 + dest.lng);
    const moved = span * progress;
    vesselLng = origin.lng + moved;
    if (vesselLng > 180) vesselLng = vesselLng - 360;
  }

  const mapCenter = activeShipment ? [22, 20] : [20, 20];
  const zoomLevel = 2;

  // Polyline route coordinates
  const routePoints = activeShipment ? [
    [origin.lat, origin.lng],
    [8, 80],
    [2, 104],
    [16, 120],
    [32, 160],
    [dest.lat, dest.lng]
  ] : [];

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '340px', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer
        center={mapCenter}
        zoom={zoomLevel}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%', minHeight: '340px', background: '#060c1c' }}
      >
        <MapRecenter center={mapCenter} zoom={zoomLevel} />
        {/* OpenStreetMap with Dark CSS Filter or Carto Voyager No-Key */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles-dark"
        />

        {activeShipment && (
          <>
            <Polyline
              positions={routePoints}
              pathOptions={{
                color: activeShipment.status === 'Delayed' ? '#fb7185' : '#10b981',
                weight: 3,
                dashArray: '6, 8',
                opacity: 0.85
              }}
            />

            {/* Origin Port */}
            <Marker position={[origin.lat, origin.lng]} icon={createPortIcon('#10b981', 'Origin')}>
              <Popup>
                <div style={{ padding: '4px', fontSize: '12px', color: '#fff' }}>
                  <div style={{ fontWeight: 800, color: '#34d399' }}>{activeShipment.origin_port} (Origin)</div>
                  <div style={{ color: '#94a3b8', marginTop: '2px' }}>Departure: {activeShipment.departure_date}</div>
                  <div style={{ color: '#cbd5e1' }}>Carrier: {activeShipment.carrier}</div>
                </div>
              </Popup>
            </Marker>

            {/* Destination Port */}
            <Marker position={[dest.lat, dest.lng]} icon={createPortIcon('#06b6d4', 'Dest')}>
              <Popup>
                <div style={{ padding: '4px', fontSize: '12px', color: '#fff' }}>
                  <div style={{ fontWeight: 800, color: '#22d3ee' }}>{activeShipment.destination_port} (Destination)</div>
                  <div style={{ color: '#94a3b8', marginTop: '2px' }}>ETA: {activeShipment.expected_arrival}</div>
                  {activeShipment.delivered_date && (
                    <div style={{ color: '#34d399', fontWeight: 700 }}>Delivered: {activeShipment.delivered_date}</div>
                  )}
                </div>
              </Popup>
            </Marker>

            {/* Vessel Pin */}
            {activeShipment.status !== 'Delivered' && (
              <Marker position={[vesselLat, vesselLng]} icon={createVesselIcon()}>
                <Popup>
                  <div style={{ padding: '4px', fontSize: '12px', color: '#fff' }}>
                    <div style={{ fontWeight: 800, color: '#38bdf8' }}>🚢 Vessel {activeShipment.shipment_id}</div>
                    <div style={{ color: '#e2e8f0', marginTop: '2px' }}>Status: <strong>{activeShipment.status}</strong></div>
                    <div style={{ color: '#94a3b8' }}>Voyage Progress: {activeShipment.progress}%</div>
                  </div>
                </Popup>
              </Marker>
            )}
          </>
        )}
      </MapContainer>

      <style>{`
        .map-tiles-dark {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
        }
      `}</style>
    </div>
  );
}

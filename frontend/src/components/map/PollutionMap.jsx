import { MapContainer, TileLayer } from 'react-leaflet'
import HeatmapLayer from './HeatmapLayer'
import StationMarker from './StationMarker'

export default function PollutionMap({
  locations,
  heatPoints,
  showHeatmap,
  activeParameter,
  showLabels,
}) {
  return (
    <MapContainer
      center={[21.2787, 81.8661]}
      zoom={7}
      minZoom={6}
      maxZoom={14}
      zoomControl
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
      className="bg-slate-200"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {locations.map((location) => (
        <StationMarker
          key={location.locationId}
          location={location}
          activeParameter={activeParameter}
          showLabels={showLabels}
        />
      ))}

      {showHeatmap && <HeatmapLayer points={heatPoints} visible={showHeatmap} />}
    </MapContainer>
  )
}

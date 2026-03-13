import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet.heat'
import { useMap } from 'react-leaflet'

function HeatmapLayer({ points, visible }) {
  const map = useMap()
  const heatLayerRef = useRef(null)

  useEffect(() => {
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    if (!visible || !points?.length) {
      return undefined
    }

    heatLayerRef.current = L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 10,
      max: 1.0,
      gradient: {
        0.0: '#3b82f6',
        0.3: '#06b6d4',
        0.5: '#84cc16',
        0.7: '#f97316',
        1.0: '#ef4444',
      },
    })

    heatLayerRef.current.addTo(map)

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current)
        heatLayerRef.current = null
      }
    }
  }, [map, points, visible])

  useEffect(() => {
    const handleZoom = () => {
      if (!heatLayerRef.current || !visible) return

      const zoom = map.getZoom()
      let radius = 35
      if (zoom >= 9 && zoom < 11) radius = 20
      if (zoom >= 11) radius = 12
      heatLayerRef.current.setOptions({ radius })
    }

    map.on('zoomend', handleZoom)

    return () => {
      map.off('zoomend', handleZoom)
    }
  }, [map, visible])

  return null
}

export default HeatmapLayer

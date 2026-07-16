'use client'

import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon issues with Webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom icon for highlighted/searched locations
const highlightIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface CropMarker {
  _id: string
  name: string
  price: number
  isFree: boolean
  quantity: {
    amount: number
    unit: string
  }
  owner: {
    _id: string
    firstName: string
    lastName: string
    phoneNumber?: string
  }
  garden: {
    name: string
    location?: {
      coordinates?: {
        lat: number
        lng: number
      }
    }
  }
}

interface InteractiveMapProps {
  crops: CropMarker[]
  focusedSellerId: string | null
  searchedLocation: { lat: number; lng: number } | null
}

function MapController({
  crops,
  focusedSellerId,
  searchedLocation
}: InteractiveMapProps) {
  const map = useMap()
  const markersRef = useRef<{ [key: string]: L.Marker }>({})

  useEffect(() => {
    if (searchedLocation) {
      map.setView([searchedLocation.lat, searchedLocation.lng], 14, { animate: true })
    } else if (focusedSellerId) {
      const targetCrop = crops.find(c => c.owner._id === focusedSellerId && c.garden?.location?.coordinates)
      if (targetCrop?.garden?.location?.coordinates) {
        const coords = targetCrop.garden.location.coordinates
        map.setView([coords.lat, coords.lng], 16, { animate: true })
        
        // Open the popup automatically
        setTimeout(() => {
          const mapMarkers = (window as any)._mapMarkers || {}
          const marker = mapMarkers[focusedSellerId]
          if (marker) {
            marker.openPopup()
          }
        }, 500)
      }
    }
  }, [focusedSellerId, searchedLocation, crops, map])

  return null
}

export default function InteractiveMap({ crops, focusedSellerId, searchedLocation }: InteractiveMapProps) {
  const defaultCenter: [number, number] = [37.7749, -122.4194] // Default to SF or some central location

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {crops.map((crop) => {
          const coords = crop.garden?.location?.coordinates
          if (!coords || (coords.lat === 0 && coords.lng === 0)) return null

          const isFocused = crop.owner._id === focusedSellerId

          return (
            <Marker 
              key={crop._id} 
              position={[coords.lat, coords.lng]}
              icon={isFocused ? highlightIcon : new L.Icon.Default()}
              ref={(ref) => {
                if (ref && typeof window !== 'undefined') {
                  // We can't easily pass refs up, but we can hook them into the DOM or a global if absolutely necessary.
                  // For a cleaner approach, MapController handles view changes. We'll let the user click markers manually unless focused.
                  // Actually, to implement auto-open popup, we can use the ref directly.
                  // Since we have multiple crops for the same seller, we'll just store the first one.
                  const MapControllerComp = (window as any)._mapMarkers = (window as any)._mapMarkers || {}
                  if (!MapControllerComp[crop.owner._id]) {
                    MapControllerComp[crop.owner._id] = ref
                  }
                }
              }}
            >
              <Popup>
                <div className="p-2 text-sm min-w-[200px]">
                  <h3 className="font-bold text-gray-900 text-base mb-1">
                    {crop.owner.firstName} {crop.owner.lastName}
                  </h3>
                  {crop.garden?.name && (
                    <p className="text-green-700 font-semibold mb-2">{crop.garden.name}</p>
                  )}
                  
                  <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                    <p><span className="font-medium">Crop:</span> {crop.name}</p>
                    <p><span className="font-medium">Price:</span> {crop.isFree ? 'Free' : `$${crop.price}`}</p>
                    <p><span className="font-medium">Available:</span> {crop.quantity.amount} {crop.quantity.unit}</p>
                    {crop.owner.phoneNumber && (
                      <p><span className="font-medium">Phone:</span> {crop.owner.phoneNumber}</p>
                    )}
                  </div>

                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-3 text-center bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-md font-medium transition"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {searchedLocation && (
          <Marker position={[searchedLocation.lat, searchedLocation.lng]} icon={highlightIcon}>
            <Popup>
              <div className="p-2 font-medium text-gray-800">Searched Location</div>
            </Popup>
          </Marker>
        )}

        <MapController 
          crops={crops} 
          focusedSellerId={focusedSellerId} 
          searchedLocation={searchedLocation} 
        />
      </MapContainer>
    </div>
  )
}

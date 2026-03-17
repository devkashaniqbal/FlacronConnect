/**
 * LocationPicker — Google Maps address picker
 * Shows a text input + expandable map with Places Autocomplete and a
 * draggable marker. On location select, calls:
 *   onChange(fullAddress: string)
 *   onParts?({ address, city, state, country })
 *
 * Wraps itself in APIProvider so it can be used on any page.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { APIProvider, Map as GMap, AdvancedMarker, useMap, useMapsLibrary, type MapMouseEvent } from '@vis.gl/react-google-maps'
import { MapPin, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { cn } from '@/utils/cn'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

// Default center: geographic center of the continental US
const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 }
const DEFAULT_ZOOM   = 4

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AddressParts {
  address: string
  city:    string
  state:   string
  country: string
}

interface Props {
  value?:       string
  onChange:     (fullAddress: string) => void
  onParts?:     (parts: AddressParts) => void
  label?:       string
  placeholder?: string
  error?:       string
  className?:   string
}

// ── Address parser ────────────────────────────────────────────────────────────
function parseComponents(
  components: google.maps.GeocoderAddressComponent[],
  formatted: string,
): { full: string; parts: AddressParts } {
  const get = (...types: string[]) =>
    types.map(t => components.find(c => c.types.includes(t))?.long_name ?? '').find(v => v) ?? ''

  const streetNum = get('street_number')
  const route     = get('route')
  const city      = get('locality', 'sublocality_level_1', 'administrative_area_level_2')
  const state     = get('administrative_area_level_1')
  const country   = get('country')
  const address   = [streetNum, route].filter(Boolean).join(' ') || formatted.split(',')[0]

  return {
    full:  formatted,
    parts: { address, city, state, country },
  }
}

// ── Inner component (needs APIProvider context) ───────────────────────────────
function PickerInner({ value, onChange, onParts, placeholder, error }: Props) {
  const [expanded,    setExpanded]   = useState(false)
  const [markerPos,   setMarkerPos]  = useState<google.maps.LatLngLiteral | null>(null)
  const [mapCenter,   setMapCenter]  = useState(DEFAULT_CENTER)
  const [zoom,        setZoom]       = useState(DEFAULT_ZOOM)
  const searchRef = useRef<HTMLInputElement>(null)

  const map         = useMap()
  const placesLib   = useMapsLibrary('places')
  const geocodeLib  = useMapsLibrary('geocoding')

  // ── Try to get user's current location as default center ──────────────────
  useEffect(() => {
    if (!expanded) return
    navigator.geolocation?.getCurrentPosition(pos => {
      const center = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setMapCenter(center)
      setZoom(13)
    })
  }, [expanded])

  // ── Emit result ──────────────────────────────────────────────────────────
  const emit = useCallback((
    components: google.maps.GeocoderAddressComponent[],
    formatted:  string,
  ) => {
    const { full, parts } = parseComponents(components, formatted)
    onChange(full)
    onParts?.(parts)
  }, [onChange, onParts])

  // ── Reverse geocode ───────────────────────────────────────────────────────
  const reverseGeocode = useCallback((latLng: google.maps.LatLngLiteral) => {
    if (!geocodeLib) return
    const geocoder = new geocodeLib.Geocoder()
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        emit(results[0].address_components ?? [], results[0].formatted_address)
      }
    })
  }, [geocodeLib, emit])

  // ── Places Autocomplete on the search input ───────────────────────────────
  useEffect(() => {
    if (!placesLib || !searchRef.current || !expanded) return

    const ac = new placesLib.Autocomplete(searchRef.current, {
      fields: ['formatted_address', 'address_components', 'geometry'],
    })

    const listener = ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (!place.geometry?.location) return
      const pos = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
      setMarkerPos(pos)
      setMapCenter(pos)
      setZoom(16)
      map?.panTo(pos)
      map?.setZoom(16)
      emit(place.address_components ?? [], place.formatted_address ?? '')
    })

    return () => {
      google.maps.event.removeListener(listener)
    }
  }, [placesLib, expanded, map, emit])

  // ── Map click ────────────────────────────────────────────────────────────
  function handleMapClick(e: MapMouseEvent) {
    if (!e.detail.latLng) return
    const pos = { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng }
    setMarkerPos(pos)
    reverseGeocode(pos)
  }

  return (
    <div className="space-y-1">
      {/* Address text input (readonly display) */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <MapPin size={15} className="text-ink-400" />
        </div>
        <input
          readOnly
          value={value ?? ''}
          placeholder={placeholder ?? 'Click below to pick a location…'}
          onClick={() => setExpanded(v => !v)}
          className={cn(
            'input-base w-full pl-9 pr-10 cursor-pointer',
            error && 'border-red-400 focus:border-red-400',
          )}
        />
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-400 hover:text-ink-600"
          tabIndex={-1}
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Expandable map */}
      {expanded && (
        <div className="border border-ink-200 dark:border-ink-700 rounded-xl overflow-hidden shadow-lg">
          {/* Search bar */}
          <div className="relative bg-white dark:bg-ink-900 border-b border-ink-100 dark:border-ink-800">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search for an address…"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-transparent text-ink-900 dark:text-white placeholder-ink-400 outline-none"
            />
          </div>

          {/* Map */}
          <GMap
            mapId="location-picker"
            defaultCenter={mapCenter}
            defaultZoom={zoom}
            center={mapCenter}
            zoom={zoom}
            style={{ width: '100%', height: '280px' }}
            onClick={handleMapClick}
            disableDefaultUI={false}
            gestureHandling="greedy"
          >
            {markerPos && (
              <AdvancedMarker
                position={markerPos}
                draggable
                onDragEnd={(e) => {
                  const latLng = (e as unknown as { latLng: google.maps.LatLng | null }).latLng
                  if (!latLng) return
                  const pos = { lat: latLng.lat(), lng: latLng.lng() }
                  setMarkerPos(pos)
                  reverseGeocode(pos)
                }}
              />
            )}
          </GMap>
          <p className="text-xs text-ink-400 dark:text-ink-500 text-center py-1.5 bg-white dark:bg-ink-900">
            Search or click on the map to set location
          </p>
        </div>
      )}
    </div>
  )
}

// ── Fallback plain text input ─────────────────────────────────────────────────
function PlainInput({ value, onChange, placeholder, error, className }: Props) {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <MapPin size={15} className="text-ink-400" />
      </div>
      <input
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Enter address…'}
        className={cn('input-base w-full pl-9', error && 'border-red-400')}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ── Public component — wraps its own APIProvider ──────────────────────────────
export function LocationPicker(props: Props) {
  const [mapsError, setMapsError] = useState(false)

  // Catch gm-authfailure events fired by the Maps API on bad keys
  useEffect(() => {
    const handler = () => setMapsError(true)
    window.addEventListener('gm-authfailure', handler)
    return () => window.removeEventListener('gm-authfailure', handler)
  }, [])

  const showMap = MAPS_KEY && !mapsError

  return (
    <div className={props.className}>
      {props.label && (
        <label className="label mb-1 block">{props.label}</label>
      )}
      {showMap ? (
        <APIProvider apiKey={MAPS_KEY} libraries={['places', 'geocoding']}>
          <PickerInner {...props} />
        </APIProvider>
      ) : (
        <PlainInput {...props} />
      )}
    </div>
  )
}

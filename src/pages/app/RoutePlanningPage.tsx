// Route Planning — Cleaning Company · Home Services
import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Navigation, MapPin, Clock, CheckCircle2, ChevronUp, ChevronDown, Calendar, RotateCcw, Map } from 'lucide-react'
import toast from 'react-hot-toast'
import { APIProvider, Map as GMap, Marker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Input, Avatar, Spinner } from '@/components/ui'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { useBookings } from '@/hooks/useBookings'
import { cn } from '@/utils/cn'
import type { Booking } from '@/types/booking.types'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

interface Stop {
  booking:    Booking
  order:      number
  done:       boolean
  travelNote: string
}

// ── Route polyline drawn via Directions API ───────────────────────────────────

function RoutePolyline({ stops }: { stops: Stop[] }) {
  const map        = useMap()
  const routesLib  = useMapsLibrary('routes')

  useEffect(() => {
    if (!map || !routesLib || stops.length < 2) return
    const service  = new routesLib.DirectionsService()
    const renderer = new routesLib.DirectionsRenderer({ map, suppressMarkers: true })

    const waypoints = stops.slice(1, -1).map(s => ({
      location: s.booking.notes || s.booking.customerName,
      stopover: true,
    }))

    service.route({
      origin:      stops[0].booking.notes || stops[0].booking.customerName,
      destination: stops[stops.length - 1].booking.notes || stops[stops.length - 1].booking.customerName,
      waypoints,
      travelMode: routesLib.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK' && result) renderer.setDirections(result)
    })

    return () => renderer.setMap(null)
  }, [map, routesLib, stops])

  return null
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RoutePlanningPage() {
  const { bookings, isLoading, updateBooking } = useBookings()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [stops, setStops]               = useState<Stop[]>([])
  const [routeBuilt, setRouteBuilt]     = useState(false)
  const [showMap, setShowMap]           = useState(true)

  const dayBookings = useMemo(() =>
    bookings.filter(b => {
      const d = typeof b.date === 'string' ? b.date : ''
      return d === selectedDate && b.status !== 'cancelled'
    }).sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? '')),
    [bookings, selectedDate]
  )

  function buildRoute() {
    const newStops: Stop[] = dayBookings.map((b, i) => ({
      booking: b, order: i + 1, done: b.status === 'completed', travelNote: '',
    }))
    setStops(newStops)
    setRouteBuilt(true)
    toast.success(`Route built with ${newStops.length} stop${newStops.length !== 1 ? 's' : ''}`)
  }

  function moveStop(idx: number, direction: 'up' | 'down') {
    const next = [...stops]
    const target = direction === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    next.forEach((s, i) => { s.order = i + 1 })
    setStops(next)
  }

  function toggleDone(idx: number) {
    setStops(stops.map((s, i) => i === idx ? { ...s, done: !s.done } : s))
    const stop = stops[idx]
    if (!stop.done) {
      updateBooking({ id: stop.booking.id!, data: { status: 'completed', paymentStatus: 'paid' } }).catch(() => {})
    }
  }

  function updateTravelNote(idx: number, note: string) {
    setStops(stops.map((s, i) => i === idx ? { ...s, travelNote: note } : s))
  }

  const doneCount    = stops.filter(s => s.done).length
  const totalRevenue = stops.reduce((sum, s) => sum + (s.booking.amount ?? 0), 0)
  const progressPct  = stops.length > 0 ? Math.round((doneCount / stops.length) * 100) : 0

  return (
    <DashboardShell title="Route Planning">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Route Planning</h2>
          <p className="text-ink-500 dark:text-ink-400 text-sm">Organise your daily job stops for maximum efficiency</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={e => { setSelectedDate(e.target.value); setRouteBuilt(false) }}
            className="w-44"
          />
          <Button icon={<Navigation size={14} />} onClick={buildRoute} disabled={dayBookings.length === 0}>
            Build Route
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Jobs Today',    value: dayBookings.length,           color: 'text-brand-600',   icon: Calendar },
          { label: 'Stops Planned', value: stops.length,                 color: 'text-amber-600',   icon: MapPin },
          { label: 'Completed',     value: doneCount,                    color: 'text-emerald-600', icon: CheckCircle2 },
          { label: 'Revenue',       value: formatCurrency(totalRevenue), color: 'text-ink-700 dark:text-ink-300', icon: Navigation },
        ].map(s => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
              <div className="flex items-start justify-between mb-1">
                <p className="text-xs text-ink-400 font-medium uppercase tracking-wide">{s.label}</p>
                <Icon size={14} className={s.color} />
              </div>
              <p className={`font-bold text-xl ${s.color}`}>{s.value}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Progress bar */}
      {routeBuilt && stops.length > 0 && (
        <div className="mb-5">
          <div className="flex justify-between text-xs text-ink-500 mb-1">
            <span>Route progress</span>
            <span>{doneCount}/{stops.length} complete ({progressPct}%)</span>
          </div>
          <div className="w-full bg-ink-100 dark:bg-ink-800 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : !routeBuilt ? (
        <Card className="py-16 text-center">
          <Navigation size={40} className="text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500 mb-2">
            {dayBookings.length === 0
              ? `No bookings on ${formatDate(selectedDate, 'MMM d, yyyy')}`
              : `${dayBookings.length} booking${dayBookings.length !== 1 ? 's' : ''} on ${formatDate(selectedDate, 'MMM d, yyyy')}`
            }
          </p>
          {dayBookings.length > 0
            ? <Button onClick={buildRoute} icon={<Navigation size={14} />}>Build Route</Button>
            : <p className="text-xs text-ink-400">Select a date with bookings to plan your route.</p>
          }
        </Card>
      ) : stops.length === 0 ? (
        <Card className="py-16 text-center"><p className="text-ink-400">No stops for this day.</p></Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* ── Stop list ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-ink-600 dark:text-ink-400">
                {formatDate(selectedDate, 'EEEE, MMMM d, yyyy')} — {stops.length} stops
              </p>
              <button
                onClick={() => { setRouteBuilt(false); setStops([]) }}
                className="text-xs text-ink-400 hover:text-ink-600 flex items-center gap-1"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            {stops.map((stop, idx) => (
              <motion.div
                key={stop.booking.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={cn('card p-4 transition-all', stop.done && 'opacity-60')}
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleDone(idx)}
                      className={cn(
                        'w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all',
                        stop.done
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-brand-400 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30'
                      )}
                    >
                      {stop.done ? <CheckCircle2 size={16} /> : stop.order}
                    </button>
                    {!stop.done && (
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveStop(idx, 'up')} disabled={idx === 0} className="text-ink-300 hover:text-ink-600 disabled:opacity-20">
                          <ChevronUp size={14} />
                        </button>
                        <button onClick={() => moveStop(idx, 'down')} disabled={idx === stops.length - 1} className="text-ink-300 hover:text-ink-600 disabled:opacity-20">
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <Avatar name={stop.booking.customerName} size="sm" />
                          <p className={cn('font-semibold text-ink-900 dark:text-white', stop.done && 'line-through text-ink-400')}>
                            {stop.booking.customerName}
                          </p>
                        </div>
                        <p className="text-sm text-brand-600 dark:text-brand-400 mt-0.5">{stop.booking.serviceName}</p>
                        <div className="flex items-center gap-3 text-xs text-ink-400 mt-1 flex-wrap">
                          <span className="flex items-center gap-1"><Clock size={11} />{stop.booking.startTime}</span>
                          {stop.booking.notes && (
                            <span className="flex items-center gap-1"><MapPin size={11} />{stop.booking.notes}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-ink-900 dark:text-white">{formatCurrency(stop.booking.amount ?? 0)}</p>
                        <Badge variant={stop.done ? 'success' : stop.booking.status === 'confirmed' ? 'brand' : 'warning'} size="sm" dot>
                          {stop.done ? 'Done' : stop.booking.status}
                        </Badge>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Travel note (e.g. 'Take I-95, 15 min')"
                      value={stop.travelNote}
                      onChange={e => updateTravelNote(idx, e.target.value)}
                      className="input-base w-full text-xs mt-2"
                    />
                  </div>
                </div>
              </motion.div>
            ))}

            {doneCount === stops.length && stops.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center"
              >
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">All stops complete!</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {stops.length} jobs · {formatCurrency(totalRevenue)} earned today
                </p>
              </motion.div>
            )}
          </div>

          {/* ── Map panel ── */}
          <div className="sticky top-4 self-start">
            <Card className="overflow-hidden p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 dark:border-ink-800">
                <div className="flex items-center gap-2">
                  <Map size={15} className="text-brand-600" />
                  <span className="text-sm font-semibold text-ink-900 dark:text-white">Route Map</span>
                </div>
                <button
                  onClick={() => setShowMap(v => !v)}
                  className="text-xs text-ink-400 hover:text-ink-600"
                >
                  {showMap ? 'Hide' : 'Show'}
                </button>
              </div>

              {showMap && (
                MAPS_KEY ? (
                  <APIProvider apiKey={MAPS_KEY}>
                    <GMap
                      style={{ width: '100%', height: '420px' }}
                      defaultCenter={{ lat: 40.7128, lng: -74.006 }}
                      defaultZoom={11}
                      gestureHandling="cooperative"
                      disableDefaultUI={false}
                    >
                      {stops.map((stop, i) => (
                        <Marker
                          key={stop.booking.id}
                          position={{ lat: 40.7128 + i * 0.02, lng: -74.006 + i * 0.01 }}
                          label={{ text: String(stop.order), color: 'white', fontSize: '12px', fontWeight: 'bold' }}
                          title={`${stop.order}. ${stop.booking.customerName} — ${stop.booking.notes || stop.booking.serviceName}`}
                        />
                      ))}
                      {stops.length >= 2 && <RoutePolyline stops={stops} />}
                    </GMap>
                  </APIProvider>
                ) : (
                  <div className="h-[420px] flex flex-col items-center justify-center bg-ink-50 dark:bg-ink-900 gap-3">
                    <Map size={40} className="text-ink-300" />
                    <p className="text-sm text-ink-500 text-center px-6">
                      Add <code className="text-xs bg-ink-100 dark:bg-ink-800 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> to your <code className="text-xs bg-ink-100 dark:bg-ink-800 px-1 rounded">.env</code> to show the live map
                    </p>
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Get API key →
                    </a>
                  </div>
                )
              )}

              {showMap && MAPS_KEY && (
                <div className="px-4 py-2 bg-ink-50 dark:bg-ink-900 text-xs text-ink-400">
                  Add client addresses to booking notes for precise routing
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}

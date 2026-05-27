"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import createGlobe from "cobe"

interface InteractiveMarker {
  id: string
  location: [number, number]
  name: string
  users: number
}

interface GlobeInteractiveProps {
  markers?: InteractiveMarker[]
  className?: string
  speed?: number
}

const defaultMarkers: InteractiveMarker[] = [
  { id: "hq",      location: [37.78,  -122.44], name: "HQ",    users: 1420 },
  { id: "eu",      location: [52.52,    13.41], name: "EU",    users:  892 },
  { id: "asia",    location: [35.68,   139.65], name: "Asia",  users: 2103 },
  { id: "latam",   location: [-23.55,  -46.63], name: "LATAM", users:  567 },
  { id: "mena",    location: [25.2,     55.27], name: "MENA",  users:  734 },
  { id: "oceania", location: [-33.87,  151.21], name: "APAC",  users:  445 },
]

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

/**
 * Projects a lat/lon marker to canvas-relative (0–1) x/y coordinates.
 * Returns { px, py, visible } where visible = marker is on the front hemisphere.
 */
function projectMarker(
  location: [number, number],
  phi: number,
  theta: number,
  aspectRatio: number
): { px: number; py: number; visible: boolean } {
  const lat = toRad(location[0])
  const lon = toRad(location[1])

  // Unit sphere position
  const x0 = Math.cos(lat) * Math.cos(lon)
  const y0 = Math.sin(lat)
  const z0 = Math.cos(lat) * Math.sin(lon)

  // Rotate by theta (vertical tilt) then phi (horizontal spin) — matches cobe internals
  const cp = Math.cos(phi),  sp = Math.sin(phi)
  const ct = Math.cos(theta), st = Math.sin(theta)

  const x1 =  cp * x0 + sp * z0
  const y1 =  st * sp * x0 + ct * y0 - st * cp * z0
  const z1 = -ct * sp * x0 + st * y0 + ct * cp * z0

  const scale = 0.8
  const px = (x1 * scale / aspectRatio + 1) / 2
  const py = (-y1 * scale + 1) / 2

  return { px, py, visible: z1 > 0 }
}

export function GlobeInteractive({
  markers = defaultMarkers,
  className = "",
  speed = 0.003,
}: GlobeInteractiveProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const labelRefs    = useRef<Record<string, HTMLDivElement | null>>({})

  // Rotation state — all in refs so the animation loop reads the latest values
  const phiRef       = useRef(0)
  const phiOffRef    = useRef(0)
  const thetaOffRef  = useRef(0)
  const dragRef      = useRef({ phi: 0, theta: 0 })
  const isPausedRef  = useRef(false)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)

  const [expanded, setExpanded] = useState<string | null>(null)

  // ---------- pointer / drag handlers ----------

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    isPausedRef.current  = true
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grabbing"
      canvasRef.current.setPointerCapture(e.pointerId)
    }
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragStartRef.current) return
    dragRef.current = {
      phi:   (e.clientX - dragStartRef.current.x) / 300,
      theta: (e.clientY - dragStartRef.current.y) / 600,
    }
  }, [])

  const handlePointerUp = useCallback(() => {
    if (dragStartRef.current) {
      phiOffRef.current   += dragRef.current.phi
      thetaOffRef.current += dragRef.current.theta
      dragRef.current      = { phi: 0, theta: 0 }
    }
    dragStartRef.current = null
    isPausedRef.current  = false
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
  }, [])

  // ---------- globe + animation ----------

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let globe: ReturnType<typeof createGlobe> | null = null
    let animId: number

    function init() {
      const size = canvas!.offsetWidth
      if (size === 0 || globe) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      globe = createGlobe(canvas!, {
        devicePixelRatio: dpr,
        width:  size * dpr,
        height: size * dpr,
        phi: 0, theta: 0.2,
        dark: 0, diffuse: 1.5,
        mapSamples: 16000, mapBrightness: 10,
        baseColor:    [1, 1, 1],
        markerColor:  [0.1, 0.2, 0.45],
        glowColor:    [0.94, 0.93, 0.91],
        markerElevation: 0,
        markers: markers.map((m) => ({ location: m.location, size: 0.03 })),
        arcs: [], arcColor: [0.15, 0.3, 0.55],
        arcWidth: 0.5, arcHeight: 0.25, opacity: 0.7,
      })

      const aspectRatio = (canvas!.offsetWidth) / (canvas!.offsetHeight || canvas!.offsetWidth)

      function animate() {
        if (!isPausedRef.current) phiRef.current += speed

        const totalPhi   = phiRef.current   + phiOffRef.current   + dragRef.current.phi
        const totalTheta = 0.2              + thetaOffRef.current + dragRef.current.theta

        globe!.update({ phi: totalPhi, theta: totalTheta })

        // --- update label positions every frame ---
        const w = canvas!.offsetWidth
        const h = canvas!.offsetHeight

        markers.forEach((m) => {
          const el = labelRefs.current[m.id]
          if (!el) return

          const { px, py, visible } = projectMarker(
            m.location,
            totalPhi,
            totalTheta,
            aspectRatio
          )

          el.style.left    = `${px * w}px`
          el.style.top     = `${py * h - 8}px`
          el.style.opacity = visible ? "1" : "0"
          el.style.filter  = visible ? "none" : "blur(4px)"
          el.style.pointerEvents = visible ? "auto" : "none"
        })

        animId = requestAnimationFrame(animate)
      }

      animate()
      setTimeout(() => { if (canvas) canvas.style.opacity = "1" })
    }

    if (canvas.offsetWidth > 0) {
      init()
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) { ro.disconnect(); init() }
      })
      ro.observe(canvas)
    }

    return () => {
      cancelAnimationFrame(animId)
      globe?.destroy()
    }
  }, [markers, speed])

  // ---------- render ----------

  return (
    <div
      ref={containerRef}
      className={`relative aspect-square select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          opacity: 0,
          transition: "opacity 1.2s ease",
          borderRadius: "50%",
          touchAction: "none",
        }}
      />

      {/* Marker labels — positioned via manual projection in the animation loop */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {markers.map((m) => (
          <div
            key={m.id}
            ref={(el) => { labelRefs.current[m.id] = el }}
            onClick={() => setExpanded((prev) => (prev === m.id ? null : m.id))}
            style={{
              position: "absolute",
              transform: "translate(-50%, -100%)",
              pointerEvents: "auto",
              cursor: "pointer",
              textAlign: "center",
              opacity: 0,
              transition: "opacity 0.3s, filter 0.3s",
            }}
          >
            <div
              style={{
                background: "#1a1a2e",
                color: "#fff",
                borderRadius: 4,
                padding: expanded === m.id ? "5px 8px" : "4px 7px",
                fontFamily: "monospace",
                fontSize: "0.6rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                transform: expanded === m.id ? "scale(1.05)" : "scale(1)",
                transition: "transform 0.2s, padding 0.2s",
              }}
            >
              {m.name}
              {expanded === m.id && (
                <div
                  style={{
                    fontFamily: "system-ui, sans-serif",
                    fontSize: "0.55rem",
                    fontWeight: 400,
                    letterSpacing: 0,
                    textTransform: "none",
                    opacity: 0.75,
                    marginTop: "0.15rem",
                  }}
                >
                  {m.users.toLocaleString()} users
                </div>
              )}
            </div>
            {/* caret */}
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "4px solid transparent",
                borderRight: "4px solid transparent",
                borderTop: "5px solid #1a1a2e",
                margin: "0 auto",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

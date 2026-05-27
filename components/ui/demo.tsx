"use client"

import { GlobeInteractive } from "./cobe-globe-interactive"

export default function GlobeInteractiveDemo() {
  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-white p-8 overflow-hidden">
      <div className="w-full max-w-lg">
        <GlobeInteractive />
      </div>
    </div>
  )
}

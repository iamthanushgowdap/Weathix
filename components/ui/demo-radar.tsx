import React from "react";
import LoadingRadar from "./loading-radar";

export default function DemoOne() {
  return (
    <div className="flex items-center justify-center w-full min-h-[250px] bg-[#030209] rounded-3xl p-8 border border-white/5 shadow-2xl">
      <LoadingRadar />
    </div>
  );
}

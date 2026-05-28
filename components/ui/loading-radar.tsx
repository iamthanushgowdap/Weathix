import React from "react";

interface LoadingRadarProps {
  size?: number;
}

const LoadingRadar: React.FC<LoadingRadarProps> = ({ size = 150 }) => {
  const innerDashedRingInset = size * 0.133; // 20px on 150px
  const centerDashedCircleSize = size * 0.333; // 50px on 150px

  return (
    <div 
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center rounded-full border border-[#333] shadow-[25px_25px_75px_rgba(0,0,0,0.55)] overflow-hidden"
    >
      {/* inner dashed ring */}
      <div 
        style={{
          top: innerDashedRingInset,
          bottom: innerDashedRingInset,
          left: innerDashedRingInset,
          right: innerDashedRingInset
        }}
        className="absolute rounded-full border border-dashed border-[#444] shadow-[inset_-5px_-5px_25px_rgba(0,0,0,0.25),inset_5px_5px_35px_rgba(0,0,0,0.25)]" 
      />

      {/* center dashed circle */}
      <div 
        style={{ width: centerDashedCircleSize, height: centerDashedCircleSize }}
        className="absolute rounded-full border border-dashed border-[#444] shadow-[inset_-5px_-5px_25px_rgba(0,0,0,0.25),inset_5px_5px_35px_rgba(0,0,0,0.25)]" 
      />

      {/* radar sweep */}
      <span className="absolute top-1/2 left-1/2 w-1/2 h-full bg-transparent origin-top-left border-t border-dashed border-white animate-[radar81_2s_linear_infinite]">
        <span className="absolute top-0 left-0 w-full h-full bg-[seagreen] origin-top-left rotate-[-55deg] blur-[30px] drop-shadow-[20px_20px_20px_seagreen]" />
      </span>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes radar81 {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}} />
    </div>
  );
};

export default LoadingRadar;


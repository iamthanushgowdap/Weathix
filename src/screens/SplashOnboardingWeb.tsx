import React, { useEffect } from 'react';
import { GlobeInteractive } from '../components/ui/cobe-globe-interactive';

interface SplashOnboardingProps {
  onComplete: () => void;
}

export const SplashOnboardingWeb: React.FC<SplashOnboardingProps> = ({ onComplete }) => {
  useEffect(() => {
    console.log("=== SplashOnboardingWeb.tsx (WEB) mounted ===");
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        *{
          margin:0;
          padding:0;
          box-sizing:border-box;
        }

        .splash-body {
          height: 100vh;
          width: 100vw;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #000;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          position: relative;
        }

        /* Cinematic Background */
        .bg{
          position:absolute;
          inset:0;
          background:
            radial-gradient(circle at top,#ffffff08 0%,transparent 35%),
            radial-gradient(circle at bottom,#2563eb10 0%,transparent 40%),
            #000;
          z-index: 1;
        }

        /* Aurora Glow */
        .aurora{
          position:absolute;
          width:700px;
          height:700px;
          border-radius:50%;
          background: radial-gradient(circle,#ffffff12 0%,transparent 70%);
          filter:blur(120px);
          animation:aurora 10s ease-in-out infinite;
          z-index: 1;
          top: 50%;
          left: 50%;
          margin-top: -350px;
          margin-left: -350px;
        }

        @keyframes aurora{
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.6;
          }
          50%{
            transform:scale(1.08) rotate(8deg);
            opacity:.8;
          }
        }

        /* Floating particles */
        .particle{
          position:absolute;
          border-radius:50%;
          background:white;
          opacity:.15;
          animation:particle linear infinite;
          z-index: 1;
        }

        @keyframes particle{
          0% {
            transform: translateY(0);
          }
          100%{
            transform:translateY(-120vh);
          }
        }

        /* Phone */
        .phone{
          position:relative;
          width:340px;
          height:720px;
          border-radius:52px;
          padding:14px;
          background: linear-gradient(145deg,#111,#000);
          box-shadow:
            0 50px 120px rgba(0,0,0,.95),
            inset 0 0 2px rgba(255,255,255,.12);
          overflow:hidden;
          z-index:2;
        }

        /* Screen */
        .screen{
          position:relative;
          width:100%;
          height:100%;
          overflow:hidden;
          border-radius:40px;
          background: radial-gradient(circle at top,#0a0a0a 0%,#000 65%);
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
        }

        /* Dynamic Island */
        .dynamic{
          position:absolute;
          top:12px;
          left:50%;
          transform:translateX(-50%);
          width:120px;
          height:34px;
          border-radius:20px;
          background:#000;
          border:1px solid rgba(255,255,255,.04);
          z-index:10;
        }

        /* Globe Section */
        .globe-wrap{
          position:relative;
          width:380px;
          height:380px;
          display:flex;
          justify-content:center;
          align-items:center;
          margin-top:-60px;
          margin-bottom:20px;
          z-index: 2;
        }

        /* Branding */
        .brand{
          position:relative;
          z-index:3;
          text-align:center;
        }

        .brand h1{
          font-size:58px;
          font-weight:900;
          letter-spacing:-4px;
          color:white;
          margin-bottom:14px;
        }

        .brand p{
          font-size:17px;
          color:#8b8b8b;
          letter-spacing:1px;
          font-weight:400;
        }

        /* Button wrap styles */
        .btn-wrap{
          position:absolute;
          bottom:72px;
          display:flex;
          justify-content:center;
          align-items:center;
          z-index: 10;
        }

        .arrow-btn{
          width:64px;
          height:64px;
          border-radius:50%;
          background:#ffffff;
          border:none;
          display:flex;
          justify-content:center;
          align-items:center;
          cursor:pointer;
          box-shadow: 0 4px 20px rgba(255,255,255,0.25);
          transition: transform 0.2s, box-shadow 0.2s;
          outline: none;
        }

        .arrow-btn:hover{
          transform: scale(1.05);
          box-shadow: 0 6px 24px rgba(255,255,255,0.4);
        }

        .arrow-btn:active{
          transform: scale(0.95);
        }
        .loader {
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top: 3px solid #ffffff;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
      <div className="splash-body">
        <div className="bg"></div>
        <div className="aurora"></div>

        {/* Floating particles */}
        <div className="particle" style={{ width: '4px', height: '4px', left: '18%', top: '100%', animationDuration: '18s' }}></div>
        <div className="particle" style={{ width: '2px', height: '2px', left: '34%', top: '100%', animationDuration: '12s' }}></div>
        <div className="particle" style={{ width: '6px', height: '6px', left: '68%', top: '100%', animationDuration: '20s' }}></div>
        <div className="particle" style={{ width: '3px', height: '3px', left: '84%', top: '100%', animationDuration: '16s' }}></div>

        <div className="phone">
          <div className="screen">
            <div className="dynamic"></div>

            {/* Globe Section */}
            <div className="globe-wrap">
              <GlobeInteractive className="w-full h-full" />
            </div>

            {/* Branding */}
            <div className="brand">
              <h1>Weathix</h1>
              <p>Atmospheric Intelligence</p>
            </div>

            {/* Entry Button */}
            <div className="btn-wrap">
              <button className="arrow-btn" onClick={onComplete}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

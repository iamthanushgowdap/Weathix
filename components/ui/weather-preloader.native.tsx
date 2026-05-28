import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export const WeatherPreloader: React.FC = () => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>Meteo Sync Loader</title>
        <style>
          :root {
            /* Palette Constants */
            --base-dark: #ffffff;      /* White for dark backgrounds */
            --cloud-initial: #efefef;  /* Light off-white / silver-gray */
            --matte-gray: #9ea1a4;     /* Medium-light matte gray */
            --white: #ffffff;          /* Final cloud fill color */
            --sun-orange: #FFAC1C;     /* Vibrant orange-yellowish for the sun */
            --bg-color: transparent;   /* Stage background */
          }

          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--bg-color);
            font-family: 'Helvetica Neue', Arial, sans-serif;
            overflow: hidden;
          }

          .loader-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          .stage-box {
            position: relative;
            width: 150px;
            height: 150px;
          }

          svg {
            width: 100%;
            height: 100%;
            overflow: visible;
          }

          /* --- STROKE / OUTLINE PATH --- */
          .outline-path {
            stroke-width: 8;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
            /* Starts gray, transitions to white after the sun reveals */
            animation: strokeTimeline 5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }

          /* --- CLOUD SOLID BODY FILL --- */
          .cloud-body {
            transform-origin: center;
            /* Starts gray/silver, transitions to white after the sun reveals */
            animation: cloudFillTimeline 5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }

          /* --- SUN ELEMENT --- */
          .sun-element {
            /* Rendered as an eye-catching orange-yellowish sun */
            fill: var(--sun-orange);
            stroke: var(--sun-orange);
            stroke-width: 4;
            stroke-linecap: round;
            transform-origin: 135px 65px;
            animation: sunTimeline 5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }

          /* --- RAIN DROPS --- */
          .rain-drop {
            fill: var(--matte-gray);
            animation: rainTimeline 5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
          .rain-1 { animation-delay: 0s; }
          .rain-2 { animation-delay: 0.1s; }
          .rain-3 { animation-delay: 0.2s; }

          /* --- TYPOGRAPHY --- */
          .app-title {
            margin-top: 20px;
            font-size: 11px;
            letter-spacing: 2px;
            color: var(--base-dark);
            text-transform: uppercase;
            font-weight: bold;
            text-align: center;
            max-width: 220px;
            line-height: 1.4;
            text-shadow: 0 2px 4px rgba(0,0,0,0.4);
          }

          /* 
             --- NEW CHRONOLOGICAL TIMELINE (5 Second Loop) --- 
          */

          /* Step 1: Outline draws in Grey -> Stays Grey -> Turns White alongside the White Fill */
          @keyframes strokeTimeline {
            0% {
              stroke: var(--matte-gray);
              stroke-dasharray: 600;
              stroke-dashoffset: 600; 
            }
            20% {
              stroke: var(--matte-gray);
              stroke-dashoffset: 0;
            }
            55% {
              stroke: var(--matte-gray); /* Stays gray while sun rises */
            }
            70%, 100% {
              stroke: var(--base-dark);  /* Flips to white after sun is up */
              stroke-dashoffset: 0;
            }
          }

          /* Step 2: Cloud fills with initial Grey -> Fips to White simultaneously with the White stroke */
          @keyframes cloudFillTimeline {
            0% {
              fill: var(--matte-gray);
              opacity: 0;
            }
            20% {
              fill: var(--matte-gray);
              opacity: 1;
            }
            35% {
              fill: var(--cloud-initial);
              opacity: 1;
            }
            55% {
              fill: var(--cloud-initial); /* Stays gray/silver while sun rises */
            }
            70%, 100% {
              fill: var(--white);        /* Synchronized turn to white */
              opacity: 1;
            }
          }

          /* Step 3: Orange sun glides out from under the initial gray cloud setup */
          @keyframes sunTimeline {
            0%, 25% {
              opacity: 0;
              transform: translateY(22px) scale(0.8);
            }
            45%, 100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          /* Step 4: Rain Drops fall cycle */
          @keyframes rainTimeline {
            0%, 45% {
              opacity: 0;
              transform: translateY(-10px);
            }
            60%, 75% {
              opacity: 1;
              transform: translateY(0px);
            }
            85%, 100% {
              opacity: 0;
              transform: translateY(15px);
            }
          }
        </style>
      </head>
      <body>
        <div class="loader-container">
          <div class="stage-box">
            <svg viewBox="0 0 200 200">
              <g id="meteo-sync-graphic">
                <!-- Orange Sun behind the cloud layers -->
                <g class="sun-element">
                  <circle cx="135" cy="65" r="22" />
                  <line x1="135" y1="33" x2="135" y2="23" />
                  <line x1="135" y1="97" x2="135" y2="107" />
                  <line x1="103" y1="65" x2="93" y2="65" />
                  <line x1="167" y1="65" x2="177" y2="65" />
                  <line x1="112" y1="42" x2="105" y2="35" />
                  <line x1="158" y1="88" x2="165" y2="95" />
                  <line x1="158" y1="42" x2="165" y2="35" />
                  <line x1="112" y1="88" x2="105" y2="95" />
                </g>

                <!-- Rain Drops underneath -->
                <g>
                  <path class="rain-drop rain-1" d="M 75,140 C 75,145 71,148 68,148 C 65,148 63,145 65,140 L 70,130 Z" />
                  <path class="rain-drop rain-2" d="M 100,145 C 100,150 96,153 93,153 C 90,153 88,150 90,145 L 95,135 Z" />
                  <path class="rain-drop rain-3" d="M 125,140 C 125,145 121,148 118,148 C 115,148 113,145 115,140 L 120,130 Z" />
                </g>

                <!-- Dynamic Cloud Fill Layer -->
                <path class="cloud-body" d="M 50,115 A 25,25 0 0,1 60,67 A 32,32 0 0,1 120,60 A 28,28 0 0,1 145,115 Z" />

                <!-- Dynamic Cloud Outline Layer -->
                <path class="outline-path" d="M 50,115 A 25,25 0 0,1 60,67 A 32,32 0 0,1 120,60 A 28,28 0 0,1 145,115 Z" />
              </g>
            </svg>
          </div>
          
          <div class="app-title">Checking if the weather is as hot as you are... One sec!</div>
        </div>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        androidLayerType="hardware"
        opacity={0.99}
        transparent
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 240,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  webview: {
    width: 240,
    height: 300,
    backgroundColor: 'transparent',
  },
});

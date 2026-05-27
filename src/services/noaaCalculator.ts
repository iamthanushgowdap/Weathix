/**
 * NOAA Solar Position Calculation Engine
 * Replicating NOAA Global Monitoring Laboratory solar formulas
 */

const degToRad = (angle: number): number => (Math.PI * angle) / 180.0;
const radToDeg = (angle: number): number => (180.0 * angle) / Math.PI;

/**
 * Calculates Julian Date from standard Gregorian Date
 */
export function getJulianDate(date: Date): number {
  const time = date.getTime();
  const julianUnixEpoch = 2440587.5; // Julian Date at Unix Epoch (1970-01-01)
  const msInDay = 86400000;
  return julianUnixEpoch + time / msInDay;
}

interface SolarPosition {
  elevation: number; // Degrees above horizon
  azimuth: number;   // Degrees relative to North
}

/**
 * High-precision NOAA solar elevation and azimuth calculation
 */
export function calculateSolarPosition(
  lat: number,
  lon: number,
  time: Date = new Date()
): SolarPosition {
  const jd = getJulianDate(time);
  const jc = (jd - 2451545.0) / 36525.0; // Julian Century since 2000

  // 1. Geometric Mean Longitude & Anomaly
  let geomMeanLongSun = (280.46646 + jc * (36000.76983 + jc * 0.0003032)) % 360;
  if (geomMeanLongSun < 0) geomMeanLongSun += 360;

  const geomMeanAnomSun = 357.52911 + jc * (35999.05029 - jc * 0.0001537);
  const eccentEarthOrbit = 0.016708634 - jc * (0.000042037 + jc * 0.0000001267);

  // 2. Sun Equation of Center
  const sunEqOfCtr =
    Math.sin(degToRad(geomMeanAnomSun)) * (1.914602 - jc * (0.004817 + jc * 0.000014)) +
    Math.sin(degToRad(2.0 * geomMeanAnomSun)) * (0.019993 - jc * 0.000101) +
    Math.sin(degToRad(3.0 * geomMeanAnomSun)) * 0.000289;

  const sunTrueLong = geomMeanLongSun + sunEqOfCtr;
  const sunTrueAnom = geomMeanAnomSun + sunEqOfCtr;

  const sunRadVector = (1.000001018 * (1.0 - eccentEarthOrbit * eccentEarthOrbit)) / (1.0 + eccentEarthOrbit * Math.cos(degToRad(sunTrueAnom)));

  // 3. Apparent Longitude & Obliquity
  const sunAppLong = sunTrueLong - 0.00569 - 0.00478 * Math.sin(degToRad(125.04 - 1934.136 * jc));
  const meanObliqEcliptic = 23.439291 - jc * (0.01300416 + jc * 0.00000164);
  const obliqCorr = meanObliqEcliptic + 0.00256 * Math.cos(degToRad(125.04 - 1934.136 * jc));

  // 4. Sun Declination & Equation of Time
  const declination = radToDeg(Math.asin(Math.sin(degToRad(obliqCorr)) * Math.sin(degToRad(sunAppLong))));

  const y = Math.tan(degToRad(obliqCorr / 2.0)) * Math.tan(degToRad(obliqCorr / 2.0));
  const eqOfTime =
    4.0 *
    radToDeg(
      y * Math.sin(2.0 * degToRad(geomMeanLongSun)) -
        2.0 * eccentEarthOrbit * Math.sin(degToRad(geomMeanAnomSun)) +
        4.0 * eccentEarthOrbit * y * Math.sin(degToRad(geomMeanAnomSun)) * Math.cos(2.0 * degToRad(geomMeanLongSun)) -
        0.5 * y * y * Math.sin(4.0 * degToRad(geomMeanLongSun)) -
        1.25 * eccentEarthOrbit * eccentEarthOrbit * Math.sin(2.0 * degToRad(geomMeanAnomSun))
    );

  // 5. Hour Angle Calculations
  const timezoneOffsetHrs = time.getTimezoneOffset() / 60.0;
  const utcTimeMinutes = time.getUTCHours() * 60.0 + time.getUTCMinutes() + time.getUTCSeconds() / 60.0;
  
  // Local Solar Time
  const solarTimeFix = eqOfTime + 4.0 * lon - 60.0 * (-timezoneOffsetHrs);
  const trueSolarTime = (utcTimeMinutes + solarTimeFix) % 1440;

  let hourAngle = trueSolarTime / 4.0 - 180.0;
  if (hourAngle < -180) hourAngle += 360;

  // 6. Solar Zenith & Elevation Angle
  const zenithRad = Math.acos(
    Math.sin(degToRad(lat)) * Math.sin(degToRad(declination)) +
      Math.cos(degToRad(lat)) * Math.cos(degToRad(declination)) * Math.cos(degToRad(hourAngle))
  );

  const elevation = 90.0 - radToDeg(zenithRad);

  // 7. Solar Azimuth Angle
  let azimuth = 0;
  const csz = Math.sin(degToRad(lat)) * Math.sin(degToRad(declination)) + Math.cos(degToRad(lat)) * Math.cos(degToRad(declination)) * Math.cos(degToRad(hourAngle));
  if (csz > 1.0) azimuth = 180.0;
  else if (csz < -1.0) azimuth = 0.0;
  else {
    const azRad = Math.acos(
      (Math.sin(degToRad(declination)) - Math.sin(degToRad(lat)) * csz) /
        (Math.cos(degToRad(lat)) * Math.sin(Math.acos(csz)))
    );
    azimuth = radToDeg(azRad);
    if (hourAngle > 0) {
      azimuth = (360.0 - azimuth) % 360;
    } else {
      azimuth = (azimuth + 180.0) % 360;
    }
  }

  return { elevation, azimuth };
}

export interface AtmosphericColors {
  colors: string[]; // Gradient hex array
  ambientGlow: string; // Dynamic card shadow/accent color
  skyBlur: number;
}

/**
 * Translates Solar Elevation to Atmospheric sky parameters
 * Integrates cloud densities to darken the ambient colors in bad weather conditions
 */
export function getSkyColorsForSolarElevation(
  elevation: number,
  cloudDensity: number = 0,
  conditionText: string = '',
  selectedTheme: string = 'Polar Mist'
): AtmosphericColors {
  let colors: string[] = [];
  let ambientGlow = '#0F172A';
  let skyBlur = 20;

  const isNightTime = elevation < -4;

  switch (selectedTheme) {
    case 'Arctic Night':
      colors = ['#020205', '#0A0E1A', '#180E24'];
      ambientGlow = '#C084FC';
      skyBlur = 32;
      break;

    case 'Desert Gold':
      // Orange for Sunny Day / Clear. Indigo for Clear Night.
      colors = isNightTime ? ['#020205', '#0A0E1A', '#180E24'] : ['#FFD84D', '#FFB36B', '#F6C7E2'];
      ambientGlow = '#FB923C';
      skyBlur = 18;
      break;

    case 'Monsoon Slate':
      // Slate Gray for Drizzle / Heavy Rain
      colors = ['#475569', '#1E293B', '#0F172A'];
      ambientGlow = '#60A5FA';
      skyBlur = 28;
      break;

    case 'Midnight Storm':
      // Purple for Thunderstorms
      colors = ['#7A6BFF', '#5A5DE6', '#A76EFF'];
      ambientGlow = '#06B6D4';
      skyBlur = 30;
      break;

    case 'Tropical Cyan':
      // Cyan for Rain Showers
      colors = ['#06B6D4', '#083344', '#020617'];
      ambientGlow = '#06B6D4';
      skyBlur = 25;
      break;

    case 'Polar Mist':
    default:
      // Soft Blue for Cloudy Skies / Partly Cloudy
      colors = ['#93C5FD', '#3B82F6', '#1E3A8A'];
      ambientGlow = '#93C5FD';
      skyBlur = 25;
      break;
  }

  return { colors, ambientGlow, skyBlur };
}


/**
 * Hex color linear interpolator (weights: 0 = c1, 1 = c2)
 */
function blendHexColors(c1: string, c2: string, weight: number): string {
  const parse = (c: string) => {
    const clean = c.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return [r, g, b];
  };

  const [r1, g1, b1] = parse(c1);
  const [r2, g2, b2] = parse(c2);

  const r = Math.round(r1 + (r2 - r1) * weight);
  const g = Math.round(g1 + (g2 - g1) * weight);
  const b = Math.round(b1 + (b2 - b1) * weight);

  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

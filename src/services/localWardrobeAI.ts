export interface ActivityScores {
  jogging: number; // 0 to 10
  cycling: number; // 0 to 10
  photography: number; // 0 to 10
  stargazing: number; // 0 to 10
}

export interface WardrobeRecommendation {
  layers: string[];
  aestheticVibe: string;
  umbrellaScore: number; // 0 to 10 scale
  outdoorComfortText: string;
  hydrationAlert: string;
  activities: ActivityScores;
  sleepComfortIndex: {
    score: number; // 0 to 100
    recommendation: string;
  };
  drivingAlert: string | null;
  summaryText: string;
  uvAdvice: string;
  hairFrizz: {
    level: string;
    percent: number;
    tip: string;
  };
  skinHydration: {
    level: string;
    tip: string;
  };
  creativeSpark: string;
}

/**
 * Local Wardrobe & Lifestyle AI Engine
 * Operates deterministically without server processing or third-party AI keys.
 * Offers rich, unique, and aesthetically premium atmospheric intelligence.
 */
export function computeWardrobeIntelligence(
  tempCelsius: number,
  rainProbability: number,
  windSpeedKph: number,
  humidity: number,
  uvIndex: number,
  aqi: number,
  isDay: boolean,
  cloudDensity: number
): WardrobeRecommendation {
  
  // 1. Layered Clothing Strategy & Aesthetic Styling Vibe
  let layers: string[] = [];
  let aestheticVibe = 'Tokyo Minimalist';

  if (tempCelsius < 5) {
    layers = [
      'Base: Heavy thermal compression long-sleeve shirt',
      'Mid: Double-faced cashmere knit sweater',
      'Outer: Gore-Tex seam-sealed down-insulated parka',
      'Accessories: Ribbed merino wool beanie & fleece-lined gloves',
    ];
    aestheticVibe = 'Polar Explorer / Technical Avant-Garde';
  } else if (tempCelsius >= 5 && tempCelsius < 12) {
    layers = [
      'Base: Lightweight organic cotton thermal undershirt',
      'Mid: 100% fine-gauge merino wool crewneck sweater',
      'Outer: Cinematic double-breasted heavy wool trenchcoat',
      'Accessories: Premium soft-knit cashmere scarf & leather gloves',
    ];
    aestheticVibe = 'Heritage British Academic / Quiet Luxury';
  } else if (tempCelsius >= 12 && tempCelsius < 18) {
    layers = [
      'Base: Heavyweight 240GSM Supima cotton tee',
      'Mid: Structured French terry hoodie or corduroy overshirt',
      'Outer: Premium distressed leather cafe-racer or denim trucker jacket',
      'Bottom: Structured tailored chinos or relaxed indigo selvedge denim',
    ];
    aestheticVibe = 'Tokyo Streetwear / Cinematic Utility';
  } else if (tempCelsius >= 18 && tempCelsius < 25) {
    layers = [
      'Base: Breathable cotton-linen slub polo or linen tee',
      'Mid: Relaxed-fit lightweight linen utility chore jacket (worn open)',
      'Bottom: High-drape fluid cotton-linen trousers',
      'Accessories: Minimalist silver or brass wristwear',
    ];
    aestheticVibe = 'Mediterranean Linen / Effortless Riviera Coastal';
  } else {
    layers = [
      'Base: Ultra-lightweight open-weave linen camp-collar shirt',
      'Bottom: Relaxed-fit breathable linen shorts or silk midi skirt',
      'Accessories: UV400 polarized black acetate sunglasses',
    ];
    aestheticVibe = 'Amalfi Coast Casual / High-Summer Resort Minimalist';
  }

  // 2. Umbrella Utility Scoring (0 to 10)
  let umbrellaScore = 0;
  if (rainProbability > 10) {
    let base = Math.round((rainProbability / 100) * 8);
    if (humidity > 80) base += 1;
    if (windSpeedKph > 42) {
      // High wind breaks umbrellas: recommend a waterproof hooded jacket instead
      umbrellaScore = Math.max(0, base - 5);
    } else {
      umbrellaScore = Math.min(10, base + (windSpeedKph > 20 ? -1 : 1));
    }
  }

  // 3. Hydration Guidelines
  let hydrationAlert = 'Maintain standard baseline hydration of 2L daily.';
  if (tempCelsius > 30) {
    hydrationAlert = 'High thermal load active. Keep 500ml water with electrolyte formulations on hand hourly during physical efforts.';
  } else if (humidity < 30) {
    hydrationAlert = 'Extremely dry atmospheric conditions. Dermal and respiratory moisture is depleting; hydrate continuously.';
  }

  // 4. Dermal UV Protection Advice
  let uvAdvice = 'Safe solar spectrum. Minimal UV radiation. Standard skin defense.';
  if (uvIndex >= 3 && uvIndex <= 5) {
    uvAdvice = 'Moderate UV load. Melanin-friendly spectrum active. Apply organic mineral SPF 30 every 120 mins if outdoors.';
  } else if (uvIndex >= 6 && uvIndex <= 7) {
    uvAdvice = 'High actinic load. Solar radiation is intense. Wear wide-brimmed headwear and double-layer SPF 50 blocks.';
  } else if (uvIndex >= 8) {
    uvAdvice = 'Extreme actinic hazard. Rapid dermal photo-damage active. Avoid direct sun exposure. Seeking shade is critical.';
  }

  // 5. Hair Frizz Risk Assessment
  let hairFrizz = {
    level: 'Optimal Balance',
    percent: 15,
    tip: 'Stable moisture bounds. Style freely with minimal finish sprays.'
  };
  if (humidity > 80) {
    hairFrizz = {
      level: 'Extreme Frizz Threat',
      percent: 85,
      tip: 'High water vapor triggers follicle swelling. Apply strong polymer anti-humidity serums or opt for a sleek styled bun.'
    };
  } else if (humidity >= 65 && humidity <= 80) {
    hairFrizz = {
      level: 'Elevated Moisture Load',
      percent: 60,
      tip: 'Moderate ambient moisture. Lightweight smoothing oils or light texture sprays recommended.'
    };
  } else if (humidity < 35) {
    hairFrizz = {
      level: 'Dry / Static Flight Risk',
      percent: 45,
      tip: 'Low air moisture leads to static flyaways. Use a leave-in conditioner cream and a wood/horn comb to ground static charge.'
    };
  }

  // 6. Skin Hydration Index
  let skinHydration = {
    level: 'Dermal Harmony',
    tip: 'Atmospheric humidity is beautifully balanced. The skin barrier functions optimally with baseline hydration.'
  };
  if (humidity < 30) {
    skinHydration = {
      level: 'Critical Dryness Warning',
      tip: 'Accelerated transepidermal moisture loss active. Seal with rich lipid-based ceramide barrier creams and lip oils.'
    };
  } else if (humidity >= 30 && humidity < 45) {
    skinHydration = {
      level: 'Mild Dehydration Risk',
      tip: 'Dry breeze absorbing dermal moisture. Boost skin barrier with lightweight hyaluronic acid serums.'
    };
  } else if (humidity > 75) {
    skinHydration = {
      level: 'Sebum Dilution State',
      tip: 'Saturated air slows perspiration evaporation. Use oil-free non-comedogenic gel moisturizers to avoid congestion.'
    };
  }

  // 7. Weather-Influenced Creative Spark
  let creativeSpark = 'A beautiful atmospheric background for fresh perspectives. Walk outside and notice the light shifting.';
  if (rainProbability > 60) {
    creativeSpark = 'The geosmin released in pluvial air is a natural neural pacifier. It is the perfect atmospheric alignment to brew warm tea and indulge in creative writing, sketching, or coding with ambient lofi.';
  } else if (cloudDensity > 0.75) {
    creativeSpark = ' Diffused, soft overcast skies act as a giant cinematic softbox. This is prime street-photography weather—soft shadows, brilliant color saturations, and dramatic shadows are beautifully eliminated.';
  } else if (isDay && cloudDensity < 0.15 && rainProbability < 15) {
    creativeSpark = 'Direct, crisp sunlight casts sharp geometric shadows. Seek brutalist concrete architectures, sharp urban structures, or shoot graphic silhouettes for high-contrast noir-style photography.';
  } else if (!isDay && cloudDensity < 0.2) {
    creativeSpark = 'Clear atmospheric canopy with minimal light-scatter. A stellar night for deep-sky observation, tracing stellar patterns, or locking a camera trip for beautiful long-exposure star trails.';
  } else if (windSpeedKph > 35) {
    creativeSpark = 'The fast-moving atmosphere is perfect for capturing motion—try shooting low shutter-speed landscape exposures of swaying branches or high-contrast kinetic cloud drifts.';
  }

  // 8. Detailed Sleep Comfort Index (0 to 100)
  let sleepScore = 95;
  let sleepRec = 'Atmospheric conditions represent perfect deep sleep potential.';
  
  if (tempCelsius > 24) {
    const penalty = (tempCelsius - 24) * 8;
    sleepScore -= penalty;
  } else if (tempCelsius < 14) {
    const penalty = (14 - tempCelsius) * 5;
    sleepScore -= penalty;
  }
  
  if (humidity > 70) {
    sleepScore -= (humidity - 70) * 0.6;
  } else if (humidity < 35) {
    sleepScore -= (35 - humidity) * 0.4;
  }

  sleepScore = Math.max(10, Math.min(100, Math.round(sleepScore)));
  if (sleepScore < 50) {
    sleepRec = 'Highly unfavorable sleep climate. Active cooling, HVAC support, or dehumidification is highly advised.';
  } else if (sleepScore < 75) {
    sleepRec = 'Moderate comfort. Consider lightweight natural linen bedding or enabling a subtle ceiling fan breeze.';
  }

  // 9. Activity Suitability Scoring
  const jogging = Math.round(
    Math.max(0, 10 - (aqi > 100 ? (aqi - 100) * 0.08 : 0) - (rainProbability > 30 ? rainProbability * 0.08 : 0) - (tempCelsius > 30 || tempCelsius < 4 ? 3 : 0))
  );

  const cycling = Math.round(
    Math.max(0, 10 - (windSpeedKph > 28 ? (windSpeedKph - 28) * 0.2 : 0) - (rainProbability > 20 ? rainProbability * 0.1 : 0) - (aqi > 120 ? 3 : 0))
  );

  const photography = Math.round(
    Math.max(0, 10 - (cloudDensity > 0.85 ? 4 : cloudDensity < 0.15 ? 2 : 0) - (rainProbability > 40 ? 5 : 0))
  );

  const stargazing = isDay
    ? 0
    : Math.round(Math.max(0, 10 - cloudDensity * 8 - (rainProbability > 10 ? 3 : 0)));

  const activities: ActivityScores = { jogging, cycling, photography, stargazing };

  // 10. Driving and Commute Alert Warning
  let drivingAlert: string | null = null;
  if (rainProbability > 70 && windSpeedKph > 35) {
    drivingAlert = 'Severe hydroplaning risk. Reduce highway cruise speeds and double follow intervals.';
  } else if (humidity > 90 && tempCelsius - feelsLikeCelsiusDiff(tempCelsius, humidity) < 2) {
    drivingAlert = 'Thick horizontal fog advisory. Keep fog lights active and avoid rapid maneuvers.';
  }

  // 11. General Comfort Overview Text
  let outdoorComfortText = 'Outdoor temperatures are beautifully balanced, crisp, and comfortable.';
  if (tempCelsius < 8) outdoorComfortText = 'Biting high-latitude chill. Envelop yourself in high-micron natural wool fibers.';
  else if (tempCelsius > 32) outdoorComfortText = 'Intense solar radiation. Stay inside climate-controlled structures during standard peak daylight.';

  // 12. Dynamic Conversational Summary Synthesis
  let summaryText = `The atmosphere is beautifully balanced and comfortable for outdoor endeavors today.`;
  if (rainProbability > 50) {
    summaryText = `Expect active pluvial fronts today. Layer with structured water-repelling outerwear.`;
    if (windSpeedKph > 30) {
      summaryText += ` High kinetic wind limits umbrella utility; trust a technical hood shell instead.`;
    }
  } else if (aqi > 150) {
    summaryText = `Air particulates are highly elevated. Safeguard your respiratory health and avoid strenuous outdoor exercise.`;
  } else if (tempCelsius > 28) {
    summaryText = `Subtropical warmth is taking over. Select breathable organic linen fabrics, protect skin barriers, and hydrate well.`;
  } else if (tempCelsius < 10) {
    summaryText = `A crisp, cooling drift is sweep in. Select heavy wool knits and protective scarves to preserve core warmth tonight.`;
  }

  return {
    layers,
    aestheticVibe,
    umbrellaScore,
    outdoorComfortText,
    hydrationAlert,
    activities,
    sleepComfortIndex: { score: sleepScore, recommendation: sleepRec },
    drivingAlert,
    summaryText,
    uvAdvice,
    hairFrizz,
    skinHydration,
    creativeSpark,
  };
}

/**
 * Simple mock calculations for dew point / feels like discrepancy
 */
function feelsLikeCelsiusDiff(t: number, h: number): number {
  return t - ((100 - h) / 5);
}

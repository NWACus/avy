const Unknown = 'Unknown';

function reverseLookup<T extends PropertyKey, U extends PropertyKey>(mapping: Record<T, U>, lookup: U): string {
  return Object.entries(mapping)
    .filter(([_, value]) => value === lookup)
    .map(([key, _]) => key)
    .reduce((accumulator, currentValue) => currentValue, Unknown);
}

export const Activity = {
  'Skiing/Snowboarding': 'skiing_snowboarding',
  'Snowmobiling/Snowbiking': 'snowmobiling_snowbiking',
  'XC Skiing/Snowshoeing': 'xcskiing_snowshoeing',
  Climbing: 'climbing',
  'Walking/Hiking': 'walking',
  Driving: 'driving',
  Other: 'other',
} as const;
export type Activity = typeof Activity[keyof typeof Activity];

export const FormatActivity = (value: Activity): string => {
  return reverseLookup(Activity, value);
};

export const DangerTrend = {
  Increasing: 'increasing',
  Steady: 'steady',
  Decreasing: 'decreasing',
} as const;
export type DangerTrend = typeof DangerTrend[keyof typeof DangerTrend];

export const FormatDangerTrend = (value: DangerTrend): string => {
  return reverseLookup(DangerTrend, value);
};

export const DangerConfidence = {
  High: 'high',
  Moderate: 'moderate',
  Low: 'low',
} as const;
export type DangerConfidence = typeof DangerConfidence[keyof typeof DangerConfidence];

export const FormatDangerConfidence = (value: DangerConfidence): string => {
  return reverseLookup(DangerConfidence, value);
};

export const InstabilityDistribution = {
  Isolated: 'isolated',
  Widespread: 'widespread',
  Low: 'low',
} as const;
export type InstabilityDistribution = typeof InstabilityDistribution[keyof typeof InstabilityDistribution];

export const FormatInstabilityDistribution = (value: InstabilityDistribution): string => {
  return reverseLookup(InstabilityDistribution, value);
};

export const CloudCover = {
  Clear: 'clear',
  Few: 'few',
  Scattered: 'scattered',
  Broken: 'broken',
  Overcast: 'overcast',
  Obscured: 'obscured',
} as const;
export type CloudCover = typeof CloudCover[keyof typeof CloudCover];

export const FormatCloudCover = (value: CloudCover): string => {
  return reverseLookup(CloudCover, value);
};

export const SnowAvailableForTransport = {
  None: 'none',
  'Small Amounts': 'small smounts',
  'Moderate Amounts': 'moderate amounts',
  'Large Amounts': 'large amounts',
} as const;
export type SnowAvailableForTransport = typeof SnowAvailableForTransport[keyof typeof SnowAvailableForTransport];

export const FormatSnowAvailableForTransport = (value: SnowAvailableForTransport): string => {
  return reverseLookup(SnowAvailableForTransport, value);
};

export const WindLoading = {
  None: 'none',
  Light: 'light',
  Moderate: 'moderate',
  Intense: 'intense',
  Previous: 'previous',
  Unknown: 'unknown',
} as const;
export type WindLoading = typeof WindLoading[keyof typeof WindLoading];

export const FormatWindLoading = (value: WindLoading): string => {
  return reverseLookup(WindLoading, value);
};

export const AvalancheDateUncertainty = {
  Exact: '0',
  '+/- 1 day': '1',
  '+/- 3 days': '3',
  '+/- 1 week': '7',
  '+/- 1 month': '30',
  Estimated: 'estimated',
} as const;
export type AvalancheDateUncertainty = typeof AvalancheDateUncertainty[keyof typeof AvalancheDateUncertainty];

export const FormatAvalancheDateUncertainty = (value: AvalancheDateUncertainty): string => {
  return reverseLookup(AvalancheDateUncertainty, value);
};

export const AvalancheAspect = {
  N: 'N',
  NE: 'NE',
  E: 'E',
  SE: 'SE',
  S: 'S',
  SW: 'SW',
  W: 'W',
  NW: 'NW',
} as const;
export type AvalancheAspect = typeof AvalancheAspect[keyof typeof AvalancheAspect];

export const FormatAvalancheAspect = (value: AvalancheAspect): string => {
  return reverseLookup(AvalancheAspect, value);
};

export const AvalancheType = {
  'SS-Soft Slab': 'SS',
  'HS-Hard Slab': 'HS',
  'L-Dry Loose': 'L',
  'WL-Wet Loose': 'WL',
  'WS-Wet Slab': 'WS',
  'C-Cornice': 'C',
  'R-Roof': 'R',
  'SF-Slush Flow': 'SF',
  'I-Ice Fall': 'I',
  'U-Unknown': 'U',
} as const;
export type AvalancheType = typeof AvalancheType[keyof typeof AvalancheType];

export const FormatAvalancheType = (value: AvalancheType): string => {
  return reverseLookup(AvalancheType, value);
};

export const AvalancheBedSurface = {
  'S-New Snow': 'S',
  'I-New/Old Interface': 'I',
  'O-Old Snow': 'O',
  'G-Ground': 'G',
  'U-Unknown': 'U',
} as const;
export type AvalancheBedSurface = typeof AvalancheBedSurface[keyof typeof AvalancheBedSurface];

export const FormatAvalancheBedSurface = (value: AvalancheBedSurface): string => {
  return reverseLookup(AvalancheBedSurface, value);
};

export const AvalancheTrigger = {
  'N-Natural': 'N',
  'U-Unknown': 'U',
  'AS-Skier': 'AS',
  'AR-Snowboarder': 'AR',
  'AM-Snowmobile': 'AM',
  'AW-Wildlife': 'AW',
  'AV-Vehicle': 'AV',
  '--': 'disabled',
  'NC-Cornice Fall': 'NC',
  'NE-Earthquake': 'NE',
  'NI-Ice fall': 'NI',
  'NL-Triggered by Loose Snow Avalanche': 'NL',
  'NS-Triggered by Slab Avalanche': 'NS',
  'NR-Rock fall': 'NR',
  'AI-Snowshoer': 'AI',
  'AF-Foot penetration': 'AF',
  'AK-Snowcat': 'AK',
  'NO-Unclassified natural trigger': 'NO',
  'AU-Unknown artificial trigger': 'AU',
  'AO-Unclassified artificial trigger': 'AO',
  'AA-Artillery': 'AA',
  'AE-Explosive triggered': 'AE',
  'AL-Avalauncher': 'AL',
  'AB-Air blast': 'AB',
  'AC-Human-caused cornice fall': 'AC',
  'AX-Gas exploder': 'AX',
  'AH-Explosives from helicopter': 'AH',
  'AP-Pre-placed, remotely detonated explosive': 'AP',
} as const;
export type AvalancheTrigger = typeof AvalancheTrigger[keyof typeof AvalancheTrigger];

export const FormatAvalancheTrigger = (value: AvalancheTrigger): string => {
  return reverseLookup(AvalancheTrigger, value);
};

export const AvalancheCause = {
  'c-Intentional': 'c',
  'u-Unintentional': 'u',
  'r-Remote': 'r',
  'y-Sympathetic': 'y',
} as const;
export type AvalancheCause = typeof AvalancheCause[keyof typeof AvalancheCause];

export const FormatAvalancheCause = (value: AvalancheCause): string => {
  return reverseLookup(AvalancheCause, value);
};

export const AvalancheProblemDistribution = {
  Unknown: 'unknown',
  Isolated: 'isolated',
  Specific: 'specific',
  Widespread: 'widespread',
} as const;
export type AvalancheProblemDistribution = typeof AvalancheProblemDistribution[keyof typeof AvalancheProblemDistribution];

export const FormatAvalancheProblemDistribution = (value: AvalancheProblemDistribution): string => {
  return reverseLookup(AvalancheProblemDistribution, value);
};

export const AvalancheProblemSensitivity = {
  Unknown: 'unknown',
  Unreactive: 'unreactive',
  Stubborn: 'stubborn',
  Reactive: 'reactive',
  Touchy: 'touchy',
} as const;
export type AvalancheProblemSensitivity = typeof AvalancheProblemSensitivity[keyof typeof AvalancheProblemSensitivity];

export const FormatAvalancheProblemSensitivity = (value: AvalancheProblemSensitivity): string => {
  return reverseLookup(AvalancheProblemSensitivity, value);
};

export const PartnerType = {
  Forecaster: 'forecaster',
  Intern: 'intern',
  Professional: 'professional',
  Volunteer: 'volunteer',
  Public: 'public',
  Other: 'other',
} as const;
export type PartnerType = typeof PartnerType[keyof typeof PartnerType];

export const FormatPartnerType = (value: PartnerType): string => {
  return reverseLookup(PartnerType, value);
};

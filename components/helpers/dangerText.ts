import {DangerLevel} from 'types/nationalAvalancheCenter';

export const dangerName = (level: DangerLevel | null): string => {
  switch (level) {
    case DangerLevel.Extreme:
      return 'Extreme';
    case DangerLevel.High:
      return 'High';
    case DangerLevel.Considerable:
      return 'Considerable';
    case DangerLevel.Moderate:
      return 'Moderate';
    case DangerLevel.Low:
      return 'Low';
    case DangerLevel.None:
    case DangerLevel.GeneralInformation:
    default:
      return 'No rating';
  }
};

export const dangerShortName = (level: DangerLevel | null): string => {
  switch (level) {
    case DangerLevel.Extreme:
      return 'Extr';
    case DangerLevel.High:
      return 'High';
    case DangerLevel.Considerable:
      return 'Cons';
    case DangerLevel.Moderate:
      return 'Mod';
    case DangerLevel.Low:
      return 'Low';
    case DangerLevel.None:
    case DangerLevel.GeneralInformation:
    default:
      return 'None';
  }
};

export const dangerValue = (level: DangerLevel | null): DangerLevel => {
  switch (level) {
    case DangerLevel.Extreme:
    case DangerLevel.High:
    case DangerLevel.Considerable:
    case DangerLevel.Moderate:
    case DangerLevel.Low:
    case DangerLevel.None:
      return level;
    case DangerLevel.GeneralInformation:
    default:
      return DangerLevel.None;
  }
};

export const dangerText = (level: DangerLevel | null): string => {
  let display: DangerLevel = level ?? DangerLevel.None;
  let prefix: string;
  switch (level) {
    case DangerLevel.Extreme:
      prefix = 'Extreme';
      break;
    case DangerLevel.High:
      prefix = 'High';
      break;
    case DangerLevel.Considerable:
      prefix = 'Considerable';
      break;
    case DangerLevel.Moderate:
      prefix = 'Moderate';
      break;
    case DangerLevel.Low:
      prefix = 'Low';
      break;
    case DangerLevel.None:
    case DangerLevel.GeneralInformation:
    default:
      prefix = 'No rating';
      display = DangerLevel.None;
  }
  return `${display} - ${prefix}`;
};

export const dangerShortText = (level: DangerLevel): string => {
  let display: DangerLevel = level;
  let prefix: string;
  switch (level) {
    case DangerLevel.Extreme:
      prefix = 'Extr';
      break;
    case DangerLevel.High:
      prefix = 'High';
      break;
    case DangerLevel.Considerable:
      prefix = 'Cons';
      break;
    case DangerLevel.Moderate:
      prefix = 'Mod';
      break;
    case DangerLevel.Low:
      prefix = 'Low';
      break;
    case DangerLevel.None:
    case DangerLevel.GeneralInformation:
    default:
      prefix = 'None';
      display = DangerLevel.None;
  }
  return `${prefix} (${display})`;
};

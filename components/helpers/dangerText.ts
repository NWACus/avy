import {DangerLevel} from 'types/nationalAvalancheCenter';

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
  return `${prefix} (${display})`;
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

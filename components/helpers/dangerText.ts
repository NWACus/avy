import {DangerLevel} from '../../types/nationalAvalancheCenter';

export const dangerText = (level: DangerLevel): string => {
  let display: DangerLevel = level;
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

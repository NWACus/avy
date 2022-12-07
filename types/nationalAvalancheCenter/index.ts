export * from './enums';
export * from './schemas';

// TODO(brian) move these two methods somewhere else, they're not types-related
import {DangerLevel} from './enums';

export const dangerIcon = (level: DangerLevel): string => {
  let display: number = level;
  if (level === DangerLevel.GeneralInformation) {
    display = DangerLevel.None;
  }
  return `https://nac-web-platforms.s3.us-west-1.amazonaws.com/assets/danger-icons/${display}.png`;
};

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

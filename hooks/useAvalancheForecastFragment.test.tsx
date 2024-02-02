import {isBetween} from 'hooks/useAvalancheForecastFragment';
jest.mock('react-native/Libraries/LogBox/LogBox', () => ({
  __esModule: true,
  default: {
    ignoreLogs: jest.fn(),
    ignoreAllLogs: jest.fn(),
  },
}));

describe('useAvalancheForecastFragment', () => {
  describe('isBetween', () => {
    // this represents an interval between midnight of the given day and midnight of the next day
    const today = new Date('2023-01-20Z');

    it('returns true for a forecast published later in the given day', () => {
      const publishedDate = new Date('2023-01-20T02:00:00.000Z');
      const expiresDate = new Date('2023-01-21T02:00:00.000Z');
      expect(isBetween(publishedDate, expiresDate, today)).toBe(true);
    });

    it('returns true for a forecast published in the middle of the given day', () => {
      const publishedDate = new Date('2023-01-20T02:00:00.000Z');
      const expiresDate = new Date('2023-01-20T08:00:00.000Z');
      expect(isBetween(publishedDate, expiresDate, today)).toBe(true);
    });

    it('returns true for a forecast expiring later in the given day', () => {
      const publishedDate = new Date('2023-01-19T02:00:00.000Z');
      const expiresDate = new Date('2023-01-20T02:00:00.000Z');
      expect(isBetween(publishedDate, expiresDate, today)).toBe(true);
    });

    it('returns false for a forecast expiring before the given day', () => {
      const publishedDate = new Date('2023-01-19T02:00:00.000Z');
      const expiresDate = new Date('2023-01-19T23:59:59.999Z');
      expect(isBetween(publishedDate, expiresDate, today)).toBe(false);
    });

    it('returns false for a forecast published after the given day', () => {
      const publishedDate = new Date('2023-01-23Z');
      const expiresDate = new Date('2023-01-24Z');
      expect(isBetween(publishedDate, expiresDate, today)).toBe(false);
    });
  });
});

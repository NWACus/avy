import {captureDateFromExif} from 'components/observations/uploader/uploadImage';

describe('captureDateFromExif', () => {
  it('should return null if exif is undefined', () => {
    const result = captureDateFromExif(undefined);
    expect(result).toBeNull();
  });

  it('should return null if exif.DateTimeOriginal is undefined', () => {
    const exif = {
      Orientation: 1,
    };
    const result = captureDateFromExif(exif);
    expect(result).toBeNull();
  });

  test.each(['2023-12-14', '2023/12/14', '2023/12/14T20:15:05.250Z', '2023:12:14', '2023-12-14T20:15:05.250Z'])(
    `should return null if exif.DateTimeOriginal does not follow the expected format (input: %s)`,
    DateTimeOriginal => {
      const exif = {
        DateTimeOriginal,
      };
      const result = captureDateFromExif(exif);
      expect(result).toBeNull();
    },
  );

  it('should return the date string if exif.DateTimeOriginal is defined correctly', () => {
    const exif = {
      DateTimeOriginal: '2023:12:14 11:39:48',
    };
    const result = captureDateFromExif(exif);
    expect(result).toBe('2023-12-14');
  });
});

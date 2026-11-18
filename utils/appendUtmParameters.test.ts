import {appendUtmParameters} from 'utils/appendUtmParameters';

describe('appendUtmParameters', () => {
  it('adds a query string to a URL without one', () => {
    expect(appendUtmParameters('https://nwac.us/', 'center-website')).toEqual('https://nwac.us/?utm_source=avy-app&utm_medium=app&utm_content=center-website');
  });

  it('keeps existing query parameters', () => {
    expect(appendUtmParameters('https://www.paypal.com/donate?hosted_button_id=MS3VKF6EKNRSA', 'Donate')).toEqual(
      'https://www.paypal.com/donate?hosted_button_id=MS3VKF6EKNRSA&utm_source=avy-app&utm_medium=app&utm_content=Donate',
    );
  });

  it('does not add a separator when the URL ends with a bare question mark', () => {
    expect(appendUtmParameters('https://nwac.us/?', 'center-website')).toEqual('https://nwac.us/?utm_source=avy-app&utm_medium=app&utm_content=center-website');
  });

  it('keeps the hash after the query string', () => {
    expect(appendUtmParameters('https://nwac.us/observations/#/view/observations/fb5bb19a-2b89-4c9c-91d2-eb673c5ab877', 'observation-share')).toEqual(
      'https://nwac.us/observations/?utm_source=avy-app&utm_medium=app&utm_content=observation-share#/view/observations/fb5bb19a-2b89-4c9c-91d2-eb673c5ab877',
    );
  });

  it('keeps the hash after an existing query string', () => {
    expect(appendUtmParameters('https://example.com/page?tab=1#section', 'link')).toEqual(
      'https://example.com/page?tab=1&utm_source=avy-app&utm_medium=app&utm_content=link#section',
    );
  });

  it('encodes the content name', () => {
    expect(appendUtmParameters('https://cbavalanchecenter.org/membership/', 'Donate/Join')).toEqual(
      'https://cbavalanchecenter.org/membership/?utm_source=avy-app&utm_medium=app&utm_content=Donate%2FJoin',
    );
  });

  it('passes through URLs that already carry UTM parameters', () => {
    const sponsorUrl = 'https://na.nokiantyres.com/?utm_medium=referral&utm_source=3rd%20Party&utm_campaign=Nokian_Tyres_Avy';
    expect(appendUtmParameters(sponsorUrl, 'sponsor')).toEqual(sponsorUrl);
  });

  it('ignores UTM-like text in the hash', () => {
    expect(appendUtmParameters('https://example.com/#utm_source=other', 'link')).toEqual(
      'https://example.com/?utm_source=avy-app&utm_medium=app&utm_content=link#utm_source=other',
    );
  });
});

export {IntlProvider} from 'react-intl';

// These polyfills are in a specific order, don't change it
// organize-imports-ignore
import '@formatjs/intl-getcanonicallocales/polyfill';
import '@formatjs/intl-locale/polyfill';
import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-pluralrules/locale-data/en'; // locale-data for en

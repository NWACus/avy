import log from 'logger';
const ENABLE_PREFETCH_LOGGING = false;
const prefetch = ENABLE_PREFETCH_LOGGING ? log.info : () => undefined;

export default {
  prefetch,
};

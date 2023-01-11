const ENABLE_PREFETCH_LOGGING = false;
const prefetch = ENABLE_PREFETCH_LOGGING ? console.log : () => undefined;

export default {
  prefetch,
};

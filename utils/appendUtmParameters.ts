const UTM_SOURCE = 'avy-app';
const UTM_MEDIUM = 'app';

export const appendUtmParameters = (url: string, content: string): string => {
  const hashIndex = url.indexOf('#');
  const urlWithoutHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex);

  const queryIndex = urlWithoutHash.indexOf('?');
  const query = queryIndex === -1 ? '' : urlWithoutHash.slice(queryIndex + 1);
  if (query.split('&').some(parameter => parameter.toLowerCase().startsWith('utm_'))) {
    return url;
  }

  const separator = queryIndex === -1 ? '?' : urlWithoutHash.endsWith('?') || urlWithoutHash.endsWith('&') ? '' : '&';
  const utmQuery = `utm_source=${UTM_SOURCE}&utm_medium=${UTM_MEDIUM}&utm_content=${encodeURIComponent(content)}`;
  return `${urlWithoutHash}${separator}${utmQuery}${hash}`;
};

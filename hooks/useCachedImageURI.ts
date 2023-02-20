import {QueryClient, useQuery} from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system';
import md5 from 'md5';
import Log from 'network/log';

export const useCachedImageURI = (uri: string) => {
  return useQuery<string, Error>({
    queryKey: queryKey(uri),
    queryFn: async () => fetchCachedImageURI(uri),
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
    staleTime: 24 * 60 * 60 * 1000, // do not refresh this data
  });
};

function queryKey(uri: string) {
  return ['image', {uri: uri}];
}

const fetchCachedImageURI = async (uri: string) => {
  if (!uri.startsWith('http')) {
    // this is already a local file, no need to download
    return uri;
  }
  const destination = FileSystem.cacheDirectory + '/' + md5(uri);
  const result = await FileSystem.downloadAsync(uri, destination);
  if (result.status !== 200) {
    throw new Error(`Failed to fetch remote image at ${uri}: ${result.status}`);
  }
  return result.uri;
};

const prefetchCachedImageURI = async (queryClient: QueryClient, uri: string) => {
  await queryClient.prefetchQuery({
    queryKey: queryKey(uri),
    queryFn: async () => {
      Log.prefetch(`prefetching image ${uri}`);
      const result = await fetchCachedImageURI(uri);
      Log.prefetch(`finished prefetching image ${uri} to ${result}`);
      return result;
    },
  });
};

// we clean up data in our filesystem cache when react-query removes our reference
const cleanupCachedImage = async event => {
  if (event.type !== 'removed') {
    return;
  }

  const key = event.query.queryKey;
  if (!(key instanceof Array) || key.length < 2 || key[0] !== 'image') {
    return;
  }

  if (!('uri' in key[1]) || !key['uri'].startsWith('http')) {
    return;
  }

  const data = event.query.state.data as string;
  await FileSystem.deleteAsync(data, {idempotent: true});
  // TODO: handle errors?
};

export default {
  queryKey,
  fetch: fetchCachedImageURI,
  prefetch: prefetchCachedImageURI,
  cleanup: cleanupCachedImage,
};

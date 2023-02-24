import {QueryCache, QueryClient, useQuery} from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system';
import md5 from 'md5';
import Log from 'network/log';

const rootDirectory = FileSystem.cacheDirectory + 'image-cache/';
const queryKeyPrefix = 'image';
let promise = null;
export const initialize = async () => {
  if (!promise) {
    promise = new Promise(resolve => {
      (async () => {
        const info = await FileSystem.getInfoAsync(rootDirectory);
        if (!info.exists || !info.isDirectory) {
          await FileSystem.makeDirectoryAsync(rootDirectory);
        }
        resolve(true);
      })();
    });
  }
  return promise;
};

export const useCachedImageURI = (uri: string) => {
  return useQuery<string, Error>({
    queryKey: queryKey(uri),
    queryFn: async () => fetchCachedImageURI(uri),
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
    staleTime: 24 * 60 * 60 * 1000, // do not refresh this data
  });
};

function queryKey(uri: string) {
  return [queryKeyPrefix, {uri: uri}];
}

const fetchCachedImageURI = async (uri: string) => {
  if (!uri.startsWith('http')) {
    // this is already a local file, no need to download. We hit this case in production
    // with locally-bundled assets, for which we must use this hook in developer mode, as
    // they are served over the local network in Expo Go, not bundled into the app.
    return uri;
  }
  await initialize();
  const destination = rootDirectory + md5(uri);
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
  if (!(key instanceof Array) || key.length < 2 || key[0] !== queryKeyPrefix) {
    return;
  }

  if (!('uri' in key[1]) || !key['uri'].startsWith('http')) {
    return;
  }

  const data = event.query.state.data as string;
  await FileSystem.deleteAsync(data, {idempotent: true});
  // TODO: handle errors?
};

const reconcileCachedImages = async (queryClient: QueryClient, queryCache: QueryCache) => {
  // first, figure out all the links we know about in react-query
  const queries = queryCache.findAll({queryKey: [queryKeyPrefix], fetchStatus: 'idle'}); // see comment below for why we only select idle queries
  const fileLinks = queries.map(query => query.state.data as string);
  const fileLinksToQueryKeys = queries.reduce((accumulator, query) => (accumulator[query.state.data as string] = query.queryKey), {});
  // then, figure out all the files we have on disk
  const files = await FileSystem.readDirectoryAsync(rootDirectory);
  // now, we can reconcile the two caches

  // first, remove links from react-query that do not have corresponding files on disk.
  const linksToRemove = fileLinks.filter(link => !files.includes(link));
  linksToRemove.forEach(link => queryClient.invalidateQueries({queryKey: fileLinksToQueryKeys[link]}));

  // then, remove files from disk that do not have links in react-query
  // We need to keep in mind that there is no lock here, so we should not invalidate in-flight queries
  // as those could have written the file to disk but not yet returned, putting their values into the
  // cache. We could also be removing files for queries that have finished but have not yet dehydrated,
  // but it's not clear that we can fix that race condition.
  const filesToRemove = files.filter(file => !fileLinks.includes(file));
  await Promise.all(
    filesToRemove
      .map(async file => {
        await FileSystem.deleteAsync(file, {idempotent: true});
      })
      .flat(),
  );
};

export default {
  queryKey,
  fetch: fetchCachedImageURI,
  prefetch: prefetchCachedImageURI,
  cleanup: cleanupCachedImage,
  reconcile: reconcileCachedImages,
};

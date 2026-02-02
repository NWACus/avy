import {QueryCache, QueryClient, QueryKey, useQuery} from '@tanstack/react-query';
import {Logger} from 'browser-bunyan';
import {formatDistanceToNowStrict} from 'date-fns';
import * as FileSystem from 'expo-file-system';
import {LoggerContext, LoggerProps} from 'loggerContext';
import md5 from 'md5';
import React, {useEffect, useState} from 'react';

const rootDirectory = `${FileSystem.cacheDirectory ?? '/'}image-cache/`;
export const queryKeyPrefix = 'image';
let promise: Promise<boolean> | null = null;
export const initialize = (): Promise<boolean> => {
  if (promise == null) {
    promise = new Promise(resolve => {
      void (async () => {
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
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const key = queryKey(uri);
  const [thisLogger] = useState(logger.child({query: key}));
  useEffect(() => {
    thisLogger.debug('initiating query');
  }, [thisLogger]);

  // NetworkImage (which uses this hook) is also used to display file:// URIs, for
  // images to upload for example. In that case, we should still run the query even when offline.
  const requiresNetwork = uri.startsWith('http');

  return useQuery<string, Error>({
    queryKey: key,
    queryFn: async () => fetchCachedImageURI(uri, thisLogger),
    cacheTime: 24 * 60 * 60 * 1000, // hold on to this cached data for a day (in milliseconds)
    networkMode: requiresNetwork ? 'online' : 'always',
  });
};

function queryKey(uri: string) {
  return [queryKeyPrefix, {uri: uri}];
}

/**
 * react-native iOS image component seems to be adding ".png" to any image URL that doesn't have
 * a file extension. This was discovered by adding an `onError` callback prop to the <Image />
 * component that reported "no such file MD5HASH.png".
 *
 * The work around here is to always append one. The extension doesnt't matter and doesn't change
 * how the actual bits of the file are treated when rendering an image.
 */
const CACHE_FILE_EXTENSION = '.cache';

const fetchCachedImageURI = async (uri: string, logger: Logger): Promise<string> => {
  if (!uri.startsWith('http')) {
    // this is already a local file, no need to download. We hit this case in production
    // with locally-bundled assets, for which we must use this hook in developer mode, as
    // they are served over the local network in Expo Go, not bundled into the app.
    logger.debug({source: uri}, 'skipping download for local image');
    return uri;
  }
  await initialize();

  const destination = rootDirectory + md5(uri) + CACHE_FILE_EXTENSION;
  logger.debug({source: uri, destination: destination}, 'caching remote image');
  const result = await FileSystem.downloadAsync(uri, destination);
  if (result.status !== 200) {
    throw new Error(`Failed to fetch remote image at ${uri}: ${result.status}`);
  }

  return result.uri;
};

const prefetchCachedImageURI = async (queryClient: QueryClient, logger: Logger, uri: string) => {
  const key = queryKey(uri);
  const thisLogger = logger.child({query: key});
  thisLogger.debug('initiating query');

  await queryClient.prefetchQuery({
    queryKey: key,
    queryFn: async () => {
      const start = new Date();
      thisLogger.trace(`prefetching`);
      const result = await fetchCachedImageURI(uri, thisLogger);
      thisLogger.trace({duration: formatDistanceToNowStrict(start), destination: result}, `finished prefetching`);
      return result;
    },
    cacheTime: 24 * 60 * 60 * 1000, // hold this in the query cache for a day
    staleTime: 24 * 60 * 60 * 1000, // don't bother prefetching again for a day
  });
};

const reconcileCachedImages = async (queryClient: QueryClient, queryCache: QueryCache, logger: Logger): Promise<void> => {
  const start = new Date();
  logger.info('reconciling cached images');
  // first, figure out all the links we know about in react-query
  const queries = queryCache.findAll({queryKey: [queryKeyPrefix], fetchStatus: 'idle'}); // see comment below for why we only select idle queries
  const fileLinks = queries.map(query => query.state.data as string);
  logger.info({fileLinks: fileLinks}, 'found file links in query cache');
  const fileLinksToQueryKeys = queries.reduce(
    (accumulator, query) => {
      accumulator[query.state.data as string] = query.queryKey;
      return accumulator;
    },
    {} as Record<string, QueryKey>,
  );
  // then, figure out all the files we have on disk
  const fileNames = await FileSystem.readDirectoryAsync(rootDirectory);
  const files = fileNames.map(fileName => rootDirectory + fileName);
  logger.info({files: files}, 'found files in image cache');
  // now, we can reconcile the two caches

  // first, remove links from react-query that do not have corresponding files on disk.
  const linksToRemove = fileLinks.filter(link => !files.includes(link));
  logger.info({linksToRemove: linksToRemove}, 'removing dangling links from query cache');
  linksToRemove.forEach(link => void queryClient.invalidateQueries({queryKey: fileLinksToQueryKeys[link]}));

  // then, remove files from disk that do not have links in react-query
  // We need to keep in mind that there is no lock here, so we should not invalidate in-flight queries
  // as those could have written the file to disk but not yet returned, putting their values into the
  // cache. We could also be removing files for queries that have finished but have not yet dehydrated,
  // but it's not clear that we can fix that race condition.
  const filesToRemove = files.filter(file => !fileLinks.includes(file));
  logger.info({filesToRemove: filesToRemove}, 'removing orphaned files from image cache');
  await Promise.all(
    filesToRemove
      .map(async file => {
        await FileSystem.deleteAsync(file, {idempotent: true});
      })
      .flat(),
  );
  logger.info({duration: formatDistanceToNowStrict(start)}, 'finished reconciling cached images');
};

export default {
  queryKey,
  fetch: fetchCachedImageURI,
  prefetch: prefetchCachedImageURI,
  reconcile: reconcileCachedImages,
};

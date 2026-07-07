import {Image, ImageResolvedAssetSource, ImageSourcePropType} from 'react-native';

// Image.resolveAssetSource exists on React Native but not on react-native-web.
// On web, the value returned by `require('./foo.png')` is already a resolved
// asset descriptor (an object with `uri`/`width`/`height`, or a bare string
// URI), so this helper normalizes both platforms to an ImageResolvedAssetSource.
export function resolveAssetSource(source: ImageSourcePropType): ImageResolvedAssetSource {
  const resolve = (Image as unknown as {resolveAssetSource?: (s: ImageSourcePropType) => ImageResolvedAssetSource}).resolveAssetSource;
  if (typeof resolve === 'function') {
    return resolve(source);
  }
  // react-native-web fallback
  if (typeof source === 'string') {
    return {uri: source, width: 0, height: 0, scale: 1};
  }
  const asset = source as {uri?: string; default?: string; width?: number; height?: number; scale?: number};
  return {
    uri: asset.uri ?? asset.default ?? '',
    width: asset.width ?? 0,
    height: asset.height ?? 0,
    scale: asset.scale ?? 1,
  };
}

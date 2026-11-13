import {Image, ImageResolvedAssetSource, ImageSourcePropType} from 'react-native';

export type BundledAssetSource = ImageResolvedAssetSource & {width: number; height: number};

export function resolveAssetSource(source: ImageSourcePropType): BundledAssetSource {
  const resolved = Image.resolveAssetSource(source);
  if (!resolved?.uri || !resolved.width || !resolved.height) {
    throw new Error(`Unable to resolve bundled asset: ${JSON.stringify(source)}`);
  }
  return {uri: resolved.uri, scale: resolved.scale, width: resolved.width, height: resolved.height};
}

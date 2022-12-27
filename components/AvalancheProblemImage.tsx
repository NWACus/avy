import React from 'react';

import {Text, Image, StyleSheet, TouchableHighlight, useWindowDimensions, View, ActivityIndicator} from 'react-native';
import RenderHTML from 'react-native-render-html';

import {MediaItem} from 'types/nationalAvalancheCenter';

export interface AvalancheProblemImageProps {
  media: MediaItem;
}

interface dimensions {
  height: number;
  width: number;
}

const baseStyle = Object.freeze({
  fontStyle: 'italic',
  fontWeight: '300',
});

export const AvalancheProblemImage: React.FunctionComponent<AvalancheProblemImageProps> = ({media}) => {
  const [gallery, setGallery] = React.useState<boolean>(false);
  const {width} = useWindowDimensions();
  const [imageDimensions, setImageDimensions] = React.useState<dimensions>({height: 0, width: 0});
  const [error, setError] = React.useState<string>('');
  const toGallery = React.useCallback(() => setGallery(true), []);

  React.useEffect(() => {
    Image.getSize(
      media.url.original,
      (imageWidth, imageHeight) => setImageDimensions({width: imageWidth, height: imageHeight}),
      err => setError(String(err)),
    );
  }, [media.url.original]);

  if (error) {
    return (
      <View>
        <Text>{`Failed to load image: ${error}`}</Text>
      </View>
    );
  }

  if (imageDimensions.height === 0) {
    return <ActivityIndicator />;
  }

  return (
    <>
      {!gallery ? (
        <View style={styles.container}>
          <TouchableHighlight onPress={toGallery}>
            <Image source={{uri: media.url.original}} style={{width: '70%', aspectRatio: imageDimensions.height / imageDimensions.width}} />
          </TouchableHighlight>
          <RenderHTML source={{html: media.caption}} baseStyle={baseStyle} contentWidth={width} />
        </View>
      ) : (
        <></>
        // <ImageView
        //   images={[{uri: media.url.original}]}
        //   imageIndex={0}
        //   visible={gallery}
        //   onRequestClose={toImage}
        //   FooterComponent={imageIndex => <Text>{String(imageIndex)}</Text>}
        // />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});

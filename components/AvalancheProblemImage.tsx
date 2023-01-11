import React from 'react';

import {Text, Image, StyleSheet, View, ActivityIndicator} from 'react-native';

import {MediaItem} from 'types/nationalAvalancheCenter';
import {HTML} from 'components/text/HTML';

export interface AvalancheProblemImageProps {
  media: MediaItem;
}

interface dimensions {
  height: number;
  width: number;
}

export const AvalancheProblemImage: React.FunctionComponent<AvalancheProblemImageProps> = ({media}) => {
  const [gallery] = React.useState<boolean>(false);
  const [imageDimensions, setImageDimensions] = React.useState<dimensions>({height: 0, width: 0});
  const [error, setError] = React.useState<string>('');

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
          <Image source={{uri: media.url.original}} style={{width: '70%', aspectRatio: imageDimensions.height / imageDimensions.width}} />
          <HTML source={{html: `<em>${media.caption}</em>`}} />
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

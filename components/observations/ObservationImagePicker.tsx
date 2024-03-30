import {AntDesign, MaterialIcons} from '@expo/vector-icons';
import * as Sentry from '@sentry/react-native';

import * as ImagePicker from 'expo-image-picker';
import React, {useCallback} from 'react';
import {useController} from 'react-hook-form';
import {ColorValue} from 'react-native';

import {Button} from 'components/content/Button';
import {ImageList} from 'components/content/carousel/ImageList';
import {HStack, VStack} from 'components/core';
import {ObservationFormData} from 'components/observations/ObservationFormData';
import {getUploader} from 'components/observations/uploader/ObservationsUploader';
import {Body, BodyBlack, BodySm} from 'components/text';
import {LoggerContext, LoggerProps} from 'loggerContext';
import Toast from 'react-native-toast-message';
import {colorLookup} from 'theme';
import {ImageMediaItem, MediaType} from 'types/nationalAvalancheCenter';

const ImageListOverlay: React.FC<{
  index: number;
  onRemove: (index: number) => void;
}> = ({index, onRemove}) => {
  const onRemoveHandler = useCallback(() => {
    onRemove(index);
  }, [index, onRemove]);

  return (
    <HStack position="absolute" top={8} right={8} space={4}>
      <AntDesign.Button
        size={16}
        name="close"
        color="white"
        backgroundColor="rgba(0, 0, 0, 0.3)"
        iconStyle={{marginRight: 0}}
        style={{textAlign: 'center'}}
        onPress={onRemoveHandler}
      />
    </HStack>
  );
};

export const ObservationImagePicker = ({maxImageCount, disable}: {maxImageCount: number; disable: boolean}) => {
  const {field} = useController<ObservationFormData, 'images'>({name: 'images', defaultValue: []});
  const images = field.value;
  const {logger} = React.useContext<LoggerProps>(LoggerContext);

  const [imagePermissions] = ImagePicker.useMediaLibraryPermissions();
  const missingImagePermissions = imagePermissions !== null && !imagePermissions.granted && !imagePermissions.canAskAgain;

  const removeImage = useCallback(
    (index: number) => {
      field.onChange(images?.filter((_v, i) => i !== index));
    },
    [images, field],
  );

  const renderOverlay = useCallback((index: number) => <ImageListOverlay index={index} onRemove={removeImage} />, [removeImage]);

  const renderAddImageButton = useCallback(
    ({textColor}: {textColor: ColorValue}) => (
      <HStack alignItems="center" space={4}>
        <MaterialIcons name="add" size={24} color={textColor} style={{marginTop: 1}} />
        <BodyBlack color={textColor}>Add images</BodyBlack>
      </HStack>
    ),
    [],
  );

  const pickImage = useCallback(() => {
    void (async () => {
      try {
        // No permissions request is necessary for launching the image library
        const result = await ImagePicker.launchImageLibraryAsync({
          allowsMultipleSelection: true,
          exif: true,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
          quality: 0.9,
          selectionLimit: maxImageCount - (images?.length ?? 0),
        });

        if (!result.canceled) {
          const newImages = (images ?? []).concat(result.assets.map(image => ({image}))).slice(0, maxImageCount);
          field.onChange(newImages);
        }
      } catch (error) {
        logger.error('ImagePicker error', {error});
        Sentry.captureMessage(`ImagePicker encountered an error: ${JSON.stringify(error)}`);
        // Are we offline? Things might be ok if they go online again.
        const {networkStatus} = getUploader().getState();
        Toast.show({
          type: 'error',
          text1:
            networkStatus === 'offline'
              ? `An unexpected error occurred when loading your images. Try again when you’re back online.`
              : `An unexpected error occurred when loading your images.`,
          position: 'bottom',
        });
      }
    })();
  }, [images, logger, field, maxImageCount]);

  const imageCount = images?.length ?? 0;
  const isDisabled = imageCount === maxImageCount || disable || missingImagePermissions;

  return (
    <>
      <Body>You can add up to {maxImageCount} images.</Body>
      {imageCount > 0 && (
        <ImageList
          imageWidth={(4 * 140) / 3}
          imageHeight={140}
          media={
            images?.map(
              ({image, caption}): ImageMediaItem => ({
                url: {original: image.uri, large: '', medium: '', thumbnail: ''},
                type: MediaType.Image,
                caption: caption ?? null,
              }),
            ) ?? []
          }
          displayCaptions={true}
          imageSize="original"
          renderOverlay={renderOverlay}
        />
      )}
      <VStack space={4}>
        <Button buttonStyle="normal" onPress={pickImage} disabled={isDisabled} renderChildren={renderAddImageButton} />
        {missingImagePermissions && <BodySm color={colorLookup('error.900')}>We need permission to access your photos to upload images. Please check your system settings.</BodySm>}
      </VStack>
    </>
  );
};

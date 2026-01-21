import {AntDesign, MaterialIcons} from '@expo/vector-icons';
import * as Sentry from '@sentry/react-native';

import * as ImagePicker from 'expo-image-picker';
import React, {useCallback, useEffect, useState} from 'react';
import {useController} from 'react-hook-form';
import {ColorValue, LayoutChangeEvent, Modal, StyleSheet, TouchableHighlight, View} from 'react-native';

import {Button} from 'components/content/Button';
import {NetworkImage} from 'components/content/carousel/NetworkImage';
import {HStack, VStack, ViewProps} from 'components/core';
import {ObservationImageEditView} from 'components/form/ImageCaptionFieldEditView';
import {ImageAndCaption, ObservationFormData} from 'components/observations/ObservationFormData';
import {getUploader} from 'components/observations/uploader/ObservationsUploader';
import {Body, BodyBlack, BodySm} from 'components/text';
import {LoggerContext, LoggerProps} from 'loggerContext';
import Toast from 'react-native-toast-message';
import {colorLookup} from 'theme';

export const ImageCaptionField: React.FC<{
  image: ImageAndCaption | null;
  onUpdateImage: (image: ImageAndCaption) => void;
  onDismiss: () => void;
  onModalDisplayed: (isDisplayed: boolean) => void;
}> = ({image, onUpdateImage, onDismiss, onModalDisplayed}) => {
  const onSetCaption = useCallback(
    (caption: string) => {
      if (image == null) {
        return;
      }
      onUpdateImage({
        image: image.image,
        caption,
      });
      onDismiss();
    },
    [image, onUpdateImage, onDismiss],
  );

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (image != null) {
      setVisible(true);
    }
  }, [image]);

  const handleDismiss = useCallback(() => {
    onDismiss();
    setVisible(false);
  }, [onDismiss]);

  useEffect(() => {
    onModalDisplayed(visible);
  }, [visible, onModalDisplayed]);

  return (
    <Modal visible={visible} animationType="none" transparent presentationStyle="overFullScreen" onRequestClose={onDismiss}>
      <ObservationImageEditView onDismiss={handleDismiss} onViewDismissed={handleDismiss} onSetCaption={onSetCaption} initialCaption={image?.caption} />
    </Modal>
  );
};

export const useObservationPickImages = ({maxImageCount, disable}: {maxImageCount: number; disable: boolean}) => {
  const [imagePermissions] = ImagePicker.useMediaLibraryPermissions();
  const missingImagePermissions = imagePermissions !== null && !imagePermissions.granted && !imagePermissions.canAskAgain;

  const {field} = useController<ObservationFormData, 'images'>({name: 'images', defaultValue: []});
  const images = field.value;
  const imageCount = images?.length ?? 0;

  const isDisabled = imageCount === maxImageCount || disable || missingImagePermissions;

  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const pickImage = useCallback(() => {
    void (async () => {
      try {
        // No permissions request is necessary for launching the image library
        const result = await ImagePicker.launchImageLibraryAsync({
          allowsMultipleSelection: true,
          exif: true,
          mediaTypes: ['images', 'videos', 'livePhotos'],
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

  return {onPickImage: pickImage, isDisabled};
};

interface ObservationAddImageButtonProps extends ViewProps {
  maxImageCount: number;
  disable?: boolean;
  space?: number;
}

export const ObservationAddImageButton: React.FC<ObservationAddImageButtonProps> = ({maxImageCount, disable = false, space = 4, ...props}) => {
  const renderAddImageButton = useCallback(
    ({textColor}: {textColor: ColorValue}) => (
      <HStack alignItems="center" space={space}>
        <MaterialIcons name="add" size={24} color={textColor} style={{marginTop: 1}} />
        <BodyBlack color={textColor}>Add images</BodyBlack>
      </HStack>
    ),
    [space],
  );

  const {onPickImage, isDisabled} = useObservationPickImages({maxImageCount, disable});

  return <Button buttonStyle="normal" onPress={onPickImage} disabled={isDisabled} renderChildren={renderAddImageButton} {...props} />;
};

export const ObservationImagePicker: React.FC<{
  maxImageCount: number;
  onModalDisplayed: (isOpen: boolean) => void;
}> = ({maxImageCount, onModalDisplayed}) => {
  const {field} = useController<ObservationFormData, 'images'>({name: 'images', defaultValue: []});
  const images = field.value;

  const [editingImage, setEditingImage] = useState<ImageAndCaption | null>(null);

  const onEditImage = useCallback(
    (index: number) => {
      const image = images?.[index] ?? null;
      setEditingImage(image);
    },
    [images],
  );

  const onDismiss = useCallback(() => {
    setEditingImage(null);
  }, []);

  const [imagePermissions] = ImagePicker.useMediaLibraryPermissions();
  const missingImagePermissions = imagePermissions !== null && !imagePermissions.granted && !imagePermissions.canAskAgain;

  const removeImage = useCallback(
    (index: number) => {
      field.onChange(images?.filter((_v, i) => i !== index));
    },
    [images, field],
  );

  const onUpdateImageCaption = useCallback(
    (image: ImageAndCaption) => {
      field.onChange(
        images?.map(existingImage => {
          if (existingImage.image === image.image) {
            return {image: existingImage.image, caption: image.caption};
          }
          return existingImage;
        }),
      );
    },
    [images, field],
  );

  const handlePressItem = (i: number) => () => onEditImage(i);
  const handleRemoveItem = (i: number) => () => removeImage(i);

  return (
    <>
      <HStack flexWrap="wrap">
        {images?.map(({image, caption}, i) => {
          return (
            <View style={[styles.column, i % 2 == 0 ? styles.left : styles.right]} key={i}>
              <TouchableHighlight onPress={handlePressItem(i)} style={styles.cell}>
                <>
                  <ImageSizingView style={styles.view}>
                    {({width, height}) => (
                      <NetworkImage
                        index={i}
                        key={image.assetId ?? i}
                        uri={image.uri}
                        width={width}
                        height={height}
                        resizeMode="cover"
                        imageStyle={{
                          borderRadius: 0,
                          borderWidth: 0,
                        }}
                      />
                    )}
                  </ImageSizingView>
                  <View style={styles.caption}>
                    {caption == null ? (
                      <Body numberOfLines={1} color="text.tertiary">
                        Add description…
                      </Body>
                    ) : (
                      <Body numberOfLines={1}>{caption}</Body>
                    )}
                  </View>
                </>
              </TouchableHighlight>
              <View style={[styles.remove, i % 2 == 0 ? styles.trashLeft : styles.trashRight]}>
                <AntDesign.Button
                  size={16}
                  name="delete"
                  color="white"
                  backgroundColor="rgba(0, 0, 0, 0.3)"
                  iconStyle={{marginRight: 0}}
                  style={{textAlign: 'center'}}
                  onPress={handleRemoveItem(i)}
                />
              </View>
            </View>
          );
        })}
      </HStack>
      {missingImagePermissions && (
        <VStack space={4}>
          <BodySm color={colorLookup('error.900')}>We need permission to access your photos to upload images. Please check your system settings.</BodySm>
        </VStack>
      )}
      {images?.length === 0 && <Body>You can add up to {maxImageCount} images.</Body>}
      <ImageCaptionField image={editingImage} onUpdateImage={onUpdateImageCaption} onDismiss={onDismiss} onModalDisplayed={onModalDisplayed} />
    </>
  );
};

type SizingProps = Omit<ViewProps, 'onLayout' | 'children'> & {
  children: (size: {width: number; height: number}) => React.ReactNode;
};

export const ImageSizingView: React.FC<SizingProps> = ({children, ...props}) => {
  const [state, setState] = useState<{width: number; height: number} | null>(null);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setState(current => {
      if (event.nativeEvent.layout == null) {
        return current;
      }
      const next = {width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height};
      if (current == null) {
        return next;
      }

      if (next.height === current.height && next.width === current.width) {
        return current;
      }
      return next;
    });
  }, []);
  return (
    <View onLayout={handleLayout} {...props}>
      {state != null && children(state)}
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    flexBasis: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    height: 140,
  },
  cell: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    borderColor: colorLookup('light.300'),
    overflow: 'hidden',
  },
  view: {
    flex: 1,
  },
  left: {
    paddingRight: 4,
  },
  right: {
    paddingLeft: 4,
  },
  caption: {
    padding: 6,
    paddingHorizontal: 12,
    backgroundColor: colorLookup('white'),
  },
  remove: {
    position: 'absolute',
    top: 12,
  },
  trashLeft: {
    right: 16,
  },
  trashRight: {
    right: 12,
  },
});

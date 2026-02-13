import {AntDesign, MaterialIcons} from '@expo/vector-icons';
import * as Sentry from '@sentry/react-native';

import * as ImagePicker from 'expo-image-picker';
import React, {useCallback, useEffect, useState} from 'react';
import {FieldPathByValue, FieldValues, useController} from 'react-hook-form';
import {ColorValue, LayoutChangeEvent, Modal, StyleSheet, TouchableHighlight} from 'react-native';

import {Button} from 'components/content/Button';
import {NetworkImage} from 'components/content/carousel/NetworkImage';
import {HStack, VStack, View, ViewProps} from 'components/core';
import {ImageCaptionFieldEditView} from 'components/form/ImageCaptionFieldEditView';
import {ImageAndCaption, ImagePickerAssetWithCaption} from 'components/observations/ObservationFormData';
import {getUploader} from 'components/observations/uploader/ObservationsUploader';
import {Body, BodyBlack, BodySm} from 'components/text';
import {LoggerContext, LoggerProps} from 'loggerContext';
import Toast from 'react-native-toast-message';
import {colorLookup} from 'theme';

type ImageAssetArray = ImagePickerAssetWithCaption[] | undefined | null;

const EditImageCaptionField: React.FC<{
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
      <ImageCaptionFieldEditView onDismiss={handleDismiss} onViewDismissed={handleDismiss} onSetCaption={onSetCaption} initialCaption={image?.caption} />
    </Modal>
  );
};

interface ImagePickerProps {
  images: ImageAssetArray;
  maxImageCount: number;
  disable: boolean;
  onSaveImages: (newImages: ImageAssetArray) => void;
}

const useImagePicker = ({images, maxImageCount, disable, onSaveImages}: ImagePickerProps) => {
  const [imagePermissions] = ImagePicker.useMediaLibraryPermissions();
  const missingImagePermissions = imagePermissions !== null && !imagePermissions.granted && !imagePermissions.canAskAgain;

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
          mediaTypes: ['images', 'livePhotos'],
          preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
          quality: 0.9,
          selectionLimit: maxImageCount - imageCount,
        });

        if (!result.canceled) {
          const newImages = result.assets.map(image => ({image}));
          const updatedImages = (images ?? []).concat(newImages).slice(0, maxImageCount);
          onSaveImages(updatedImages);
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
  }, [images, logger, imageCount, maxImageCount, onSaveImages]);

  return {onPickImage: pickImage, isDisabled};
};

interface AddImageFromPickerButtonProps<TFieldValues extends FieldValues, TKey extends FieldPathByValue<TFieldValues, ImageAssetArray>> extends ViewProps {
  name: TKey;
  maxImageCount: number;
  disable?: boolean;
  space?: number;
}

const _AddImageFromPickerButton = <TFieldValues extends FieldValues, TKey extends FieldPathByValue<TFieldValues, ImageAssetArray>>({
  name,
  maxImageCount,
  disable = false,
  space = 4,
  ...props
}: AddImageFromPickerButtonProps<TFieldValues, TKey>) => {
  const {field} = useController<TFieldValues, TKey>({name: name});
  const images = field.value;

  const renderAddImageButton = useCallback(
    ({textColor}: {textColor: ColorValue}) => (
      <HStack alignItems="center" space={space}>
        <MaterialIcons name="add" size={24} color={textColor} style={{marginTop: 1}} />
        <BodyBlack color={textColor}>Add images</BodyBlack>
      </HStack>
    ),
    [space],
  );

  const onSaveImages = useCallback(
    (updatedImages: ImageAssetArray) => {
      field.onChange(updatedImages);
    },
    [field],
  );

  const {onPickImage, isDisabled} = useImagePicker({images, maxImageCount, disable, onSaveImages});

  return <Button buttonStyle="normal" onPress={onPickImage} disabled={isDisabled} renderChildren={renderAddImageButton} {...props} />;
};

export type AddImageFromPickerButtonComponent<TFieldValues extends FieldValues> = <TFieldName extends FieldPathByValue<TFieldValues, ImageAssetArray>>(
  props: React.PropsWithoutRef<AddImageFromPickerButtonProps<TFieldValues, TFieldName>>,
) => JSX.Element;

export const AddImageFromPickerButton = _AddImageFromPickerButton as (<TFieldValues extends FieldValues, TFieldName extends FieldPathByValue<TFieldValues, ImageAssetArray>>(
  props: React.PropsWithoutRef<AddImageFromPickerButtonProps<TFieldValues, TFieldName>>,
) => JSX.Element) & {displayName?: string};

AddImageFromPickerButton.displayName = 'AddImagePickerButton';

interface ImageCaptionFieldProps<TFieldValues extends FieldValues, TKey extends FieldPathByValue<TFieldValues, ImageAssetArray>> {
  name: TKey;
  maxImageCount: number;
  onModalDisplayed: (isOpen: boolean) => void;
}

const _ImageCaptionField = <TFieldValues extends FieldValues, TKey extends FieldPathByValue<TFieldValues, ImageAssetArray>>({
  name,
  maxImageCount,
  onModalDisplayed,
}: ImageCaptionFieldProps<TFieldValues, TKey>) => {
  const {field} = useController<TFieldValues, TKey>({name: name});
  const images = field.value as ImageAssetArray;

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
      <EditImageCaptionField image={editingImage} onUpdateImage={onUpdateImageCaption} onDismiss={onDismiss} onModalDisplayed={onModalDisplayed} />
    </>
  );
};

export type ImageCaptionFieldComponent<TFieldValues extends FieldValues> = <TFieldName extends FieldPathByValue<TFieldValues, ImageAssetArray>>(
  props: React.PropsWithoutRef<ImageCaptionFieldProps<TFieldValues, TFieldName>>,
) => JSX.Element;

export const ImageCaptionField = _ImageCaptionField as (<TFieldValues extends FieldValues, TFieldName extends FieldPathByValue<TFieldValues, ImageAssetArray>>(
  props: React.PropsWithoutRef<ImageCaptionFieldProps<TFieldValues, TFieldName>>,
) => JSX.Element) & {displayName?: string};

ImageCaptionField.displayName = 'ImageCaptionField';

type SizingProps = Omit<ViewProps, 'onLayout' | 'children'> & {
  children: (size: {width: number; height: number}) => React.ReactNode;
};

const ImageSizingView: React.FC<SizingProps> = ({children, ...props}) => {
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

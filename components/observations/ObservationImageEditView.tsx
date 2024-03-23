import {zodResolver} from '@hookform/resolvers/zod';
import {useHeaderHeight} from '@react-navigation/elements';
import {Button} from 'components/content/Button';
import {NetworkImage} from 'components/content/carousel/NetworkImage';
import {VStack} from 'components/core';
import {TextField} from 'components/form/TextField';
import {BodySemibold, BodySm, Title3Semibold} from 'components/text';
import React, {useCallback} from 'react';
import {FormProvider, useForm} from 'react-hook-form';
import {KeyboardAvoidingView, Platform, ScrollView, StyleSheet} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {z} from 'zod';

interface CaptionFormData {
  caption: string;
}

interface Props {
  uri: string;
  onSetCaption: (caption: string) => void;
  initialCaption?: string;
}

const DefaultCaptionData: CaptionFormData = {
  caption: '',
};

const captionForm = z.object({
  caption: z.string(),
});

// Behavior for KeyboardAvoidingView
const BEHAVIOR = Platform.OS === 'ios' ? 'padding' : 'height';

// Edges for safe area. This view is used in a modal view controller which already accounts for the
// safe area at the top of the device (iOS).
const EDGE_MODE = {top: 'off', left: 'additive', right: 'additive', bottom: 'additive'} as const;

// These are the same values as SimpleForm for now.
const IMAGE_WIDTH = (4 * 140) / 3;
const IMAGE_HEIGHT = 140;

export const ObservationImageEditView: React.FC<Props> = ({uri, onSetCaption, initialCaption}) => {
  // There is only one value, but using `<TextField />` requires the use of a <FormProvider />
  const formContext = useForm<CaptionFormData>({
    defaultValues: initialCaption ? {caption: initialCaption} : DefaultCaptionData,
    resolver: zodResolver(captionForm),
    mode: 'onBlur',
    shouldFocusError: false,
    shouldUnregister: true,
  });

  const onSubmitPress = useCallback(() => {
    void (async () => {
      await formContext.trigger();

      const submit = formContext.handleSubmit(values => {
        onSetCaption(values.caption);
      });

      await submit();
    })();
  }, [formContext, onSetCaption]);

  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  return (
    <FormProvider {...formContext}>
      <SafeAreaView style={[styles.form]} edges={EDGE_MODE}>
        {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there, or top edge since StackHeader is sitting there */}
        <KeyboardAvoidingView keyboardVerticalOffset={insets.top + headerHeight} behavior={BEHAVIOR} style={[styles.container]}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <VStack space={16} px={16} mb={16}>
              <VStack space={4} justifyContent="flex-start">
                <Title3Semibold>Add photo description</Title3Semibold>
                <BodySm>Add details about your photo</BodySm>
              </VStack>
              <NetworkImage width={IMAGE_WIDTH} height={IMAGE_HEIGHT} uri={uri} index={1} />
              <TextField
                flex={1}
                height={240}
                flexBasis={'auto'}
                name="caption"
                label="Caption"
                textInputProps={{
                  placeholder: 'What does this photo show?',
                  autoFocus: true,
                  multiline: true,
                }}
              />
              <Button mx={0} mt={8} buttonStyle="primary" onPress={onSubmitPress}>
                <BodySemibold>Save</BodySemibold>
              </Button>
            </VStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </FormProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    backgroundColor: 'white',
  },
  scroll: {
    borderWidth: 0,
    height: '100%',
    width: '100%',
    backgroundColor: 'white',
  },
  scrollContent: {
    backgroundColor: 'white',
  },
});

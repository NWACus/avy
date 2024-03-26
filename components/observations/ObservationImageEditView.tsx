import {zodResolver} from '@hookform/resolvers/zod';
import {Button} from 'components/content/Button';
import {TextField} from 'components/form/TextField';
import {BodySemibold} from 'components/text';
import React, {useCallback} from 'react';
import {FormProvider, useForm} from 'react-hook-form';
import {KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {z} from 'zod';

interface CaptionFormData {
  caption: string;
}

interface Props {
  onSetCaption: (caption: string) => void;
  onDismiss: () => void;
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

export const ObservationImageEditView: React.FC<Props> = ({onSetCaption, onDismiss, initialCaption}) => {
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

  const onPressOverlay = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  return (
    <>
      <Pressable style={styles.fixedOverlay} onPress={onPressOverlay} />
      <ScrollView scrollsToTop onScrollToTop={onPressOverlay} />
      <View style={styles.overlay}>
        <FormProvider {...formContext}>
          <KeyboardAvoidingView behavior={BEHAVIOR} style={styles.container}>
            <Pressable style={styles.dismissArea} onPress={onPressOverlay} />
            <View style={styles.form}>
              <TextField
                flex={1}
                flexBasis={200}
                name="caption"
                label="Caption"
                textInputProps={{
                  placeholder: 'Write a short image description…',
                  autoFocus: true,
                  multiline: true,
                }}
              />
              <Button mx={0} mt={8} buttonStyle="primary" onPress={onSubmitPress}>
                <BodySemibold>Save</BodySemibold>
              </Button>
              <Button mx={0} mt={8} buttonStyle="normal" borderWidth={0} onPress={onDismiss}>
                <BodySemibold>Cancel</BodySemibold>
              </Button>
            </View>
          </KeyboardAvoidingView>
        </FormProvider>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    display: 'flex',
    flexDirection: 'column',
    flexBasis: 'auto',
    justifyContent: 'flex-start',
  },
  dismissArea: {
    flexGrow: 1,
    flexShrink: 1,
  },
  fixedOverlay: {
    position: 'absolute',
    top: -2000,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'black',
    opacity: 0.75,
  },
  container: {
    flex: 1,
    flexBasis: '100%',
    paddingTop: 72,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    flexBasis: 'auto',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
});

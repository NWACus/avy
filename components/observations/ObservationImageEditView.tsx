import {zodResolver} from '@hookform/resolvers/zod';
import {Button} from 'components/content/Button';
import {TextField} from 'components/form/TextField';
import {BodySemibold} from 'components/text';
import React, {useCallback, useRef, useState} from 'react';
import {FormProvider, useForm} from 'react-hook-form';
import {Animated, KeyboardAvoidingView, LayoutChangeEvent, PanResponder, Platform, Pressable, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
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
const BEHAVIOR = Platform.OS === 'ios' ? 'padding' : undefined;

const INITIAL_HEIGHT = 320;
const AUTO_DISMISS_DRAGGING_HEIGHT = 260;

export const ObservationImageEditView: React.FC<Props> = ({onSetCaption, onDismiss, initialCaption}) => {
  // There is only one value, but using <TextField /> requires the use of a <FormProvider />
  const ref = useRef<View>(null);
  const rootRef = useRef<View>(null);

  const formContext = useForm<CaptionFormData>({
    defaultValues: initialCaption ? {caption: initialCaption} : DefaultCaptionData,
    resolver: zodResolver(captionForm),
    mode: 'onBlur',
    shouldFocusError: false,
    shouldUnregister: true,
  });

  const dragAnimationRef = useRef(new Animated.Value(0, {useNativeDriver: false}));
  const basisAnimationRef = useRef(Animated.add<number>(INITIAL_HEIGHT, Animated.multiply<number>(-1, dragAnimationRef.current)));
  const [clampedAnimation, setClampedAnimation] = useState(basisAnimationRef.current);

  const edges = useSafeAreaInsets();
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      const maxHeight = height - edges.top;
      setClampedAnimation(Animated.diffClamp(basisAnimationRef.current, 0, maxHeight));
    },
    [edges.top],
  );

  const dismissedRef = useRef(false);

  const autoDismiss = useCallback(() => {
    if (dismissedRef.current) return;
    ref.current?.measure((_x, _y, _w, h) => {
      if (h < AUTO_DISMISS_DRAGGING_HEIGHT) {
        dismissedRef.current = true;
        onDismiss();
      }
    });
  }, [onDismiss]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,

      onPanResponderMove: Animated.event([null, {dy: dragAnimationRef.current}], {useNativeDriver: false}),
      onPanResponderRelease: (_, gestureState) => {
        autoDismiss();
        Animated.decay(dragAnimationRef.current, {
          velocity: gestureState.vy,
          deceleration: 0.98,
          useNativeDriver: false,
        }).start(() => {
          dragAnimationRef.current.extractOffset();
          // also dismiss if the form is too small
          autoDismiss();
        });
      },
    }),
  ).current;

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
    <KeyboardAvoidingView behavior={BEHAVIOR} style={[styles.flexV, styles.container]}>
      <View onLayout={onLayout} ref={rootRef} style={(styles.flexV, {height: '100%'})}>
        <FormProvider {...formContext}>
          <Pressable style={styles.dismissArea} onPress={onPressOverlay} />
          <Animated.View collapsable={false} ref={ref} style={[styles.flexV, styles.form, {flexBasis: clampedAnimation}]}>
            <View style={styles.formHeader} {...panResponder.panHandlers}>
              <BodySemibold>Photo Description</BodySemibold>
              <View style={styles.grip}>
                <View style={styles.handle} />
              </View>
            </View>
            <View style={[styles.flexV, styles.formFields]}>
              <TextField
                style={styles.textField}
                name="caption"
                label="Caption"
                hideLabel
                textInputProps={{
                  placeholder: 'Write a short image description…',
                  multiline: true,
                  autoFocus: true,
                }}
              />
              <Button mx={0} mt={8} buttonStyle="primary" onPress={onSubmitPress}>
                <BodySemibold>Save</BodySemibold>
              </Button>
              <Button mx={0} mt={8} buttonStyle="normal" borderWidth={0} onPress={onDismiss}>
                <BodySemibold>Cancel</BodySemibold>
              </Button>
            </View>
          </Animated.View>
        </FormProvider>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flexV: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  scrollHack: {
    position: 'absolute',
    top: 0,
  },
  dismissArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    justifyContent: 'flex-start',
    backgroundColor: '#000C',
    height: '100%',
  },
  form: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexBasis: 300,
  },
  textField: {
    flex: 1,
    flexShrink: 0,
    minHeight: 46,
  },
  formHeader: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 24,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    overflow: 'hidden',
  },
  formFields: {
    gap: 8,
    padding: 16,
    flex: 1,
  },
  grip: {
    display: 'flex',
    flexDirection: 'row',
    marginHorizontal: 24,
    height: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  handle: {
    backgroundColor: '#DDD',
    flexBasis: 48,
    borderRadius: 2,
    height: 4,
  },
});

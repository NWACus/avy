import {zodResolver} from '@hookform/resolvers/zod';
import {Button} from 'components/content/Button';
import {TextField, TextFieldComponent} from 'components/form/TextField';
import {BodySemibold} from 'components/text';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FormProvider, useForm} from 'react-hook-form';
import {Animated, Keyboard, KeyboardAvoidingView, LayoutChangeEvent, PanResponder, Platform, Pressable, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {z} from 'zod';

interface CaptionFormData {
  caption: string;
}

interface Props {
  onSetCaption: (caption: string) => void;
  onDismiss: () => void;
  onViewDismissed: () => void;
  initialCaption?: string;
  autoDismiss?: boolean;
}

const DefaultCaptionData: CaptionFormData = {
  caption: '',
};

const CaptionFormTextField = TextField as TextFieldComponent<CaptionFormData>;

const captionForm = z.object({
  caption: z.string(),
});

// Behavior for KeyboardAvoidingView
const BEHAVIOR = Platform.OS === 'ios' ? 'padding' : undefined;

const INITIAL_HEIGHT = 320;
const AUTO_DISMISS_DRAGGING_HEIGHT = 40;
const AUTO_DISMISS_VELOCITY = 3;

export const ObservationImageEditView: React.FC<Props> = ({onSetCaption, onDismiss, initialCaption, autoDismiss = true}) => {
  const ref = useRef<View>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial value for opacity: 0

  // There is only one value, but using <TextField /> requires the use of a <FormProvider />
  const formContext = useForm<CaptionFormData>({
    defaultValues: initialCaption ? {caption: initialCaption} : DefaultCaptionData,
    resolver: zodResolver(captionForm),
    mode: 'onBlur',
    shouldFocusError: false,
    shouldUnregister: true,
  });

  const dragAnimationRef = useRef(new Animated.Value(INITIAL_HEIGHT, {useNativeDriver: false}));
  const basisAnimationRef = useRef(Animated.add<number>(INITIAL_HEIGHT, Animated.multiply<number>(-1, dragAnimationRef.current)));

  const edges = useSafeAreaInsets();

  const [isDismissing, setDismissing] = useState(false);
  const [minMaxHeight, setMinMaxHeight] = useState({min: 0, max: 0});

  /**
   * When the keyboard is presented of dismissed, onLayout will fire with the containing view
   * that determines the maximum height the draggable view can be.
   */
  const finalHeight = useRef(INITIAL_HEIGHT);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (isDismissing) {
        setMinMaxHeight(current => ({min: 0, max: current.max}));
        return;
      }
      const height = event.nativeEvent.layout.height;
      finalHeight.current = height;
      const maxHeight = height - edges.top;
      setMinMaxHeight({min: 24, max: maxHeight});
    },
    [edges.top, isDismissing],
  );

  const clampedAnimation = useMemo(() => {
    const {min, max} = minMaxHeight;
    return Animated.diffClamp(basisAnimationRef.current, min, max);
  }, [minMaxHeight]);

  const dismissedRef = useRef(false);
  const onDragDismiss = useCallback((velocity?: number) => {
    if (dismissedRef.current) return;
    if (velocity != null && velocity > AUTO_DISMISS_VELOCITY) {
      Keyboard.dismiss();
    }
    ref.current?.measure((_x, _y, _w, h) => {
      if (h < AUTO_DISMISS_DRAGGING_HEIGHT) {
        dismissedRef.current = true;
        Keyboard.dismiss();
      }
    });
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, {dy: dragAnimationRef.current}], {useNativeDriver: false}),
      onPanResponderRelease: (_, gestureState) => {
        onDragDismiss(gestureState.vy);
        Animated.decay(dragAnimationRef.current, {
          velocity: gestureState.vy,
          deceleration: 0.98,
          useNativeDriver: false,
        }).start(() => {
          dragAnimationRef.current.extractOffset();
          onDragDismiss();
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

      if (autoDismiss) {
        Keyboard.dismiss();
      }
    })();
  }, [formContext, onSetCaption, autoDismiss]);

  const onPressOverlay = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  useEffect(() => {
    const keyboardSubscriptions = [
      Keyboard.addListener('keyboardWillShow', () => {
        setDismissing(false);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(dragAnimationRef.current, {
            toValue: 0,
            useNativeDriver: false,
          }),
        ]).start();
      }),

      Keyboard.addListener('keyboardWillHide', () => {
        setDismissing(true);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(dragAnimationRef.current, {
            toValue: finalHeight.current,
            useNativeDriver: false,
          }),
        ]).start(() => {
          onDismiss();
        });
      }),

      Keyboard.addListener('keyboardDidHide', () => {
        onDismiss();
      }),
    ];

    return () => {
      for (const subscription of keyboardSubscriptions) {
        subscription.remove();
      }
    };
  }, [fadeAnim, onDismiss]);

  return (
    <KeyboardAvoidingView behavior={BEHAVIOR} style={[styles.flexV, styles.container]}>
      <Animated.View style={[styles.overlay, {opacity: fadeAnim}]} />

      <View onLayout={onLayout} style={[styles.flexV, {height: '100%'}]}>
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
              <CaptionFormTextField
                name="caption"
                style={styles.textField}
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
              <Button mx={0} mt={8} buttonStyle="normal" borderWidth={0} onPress={onPressOverlay}>
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
  /**
   * Using these styles is the equivalent of using VStack
   */
  flexV: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  /**
   * The transparent area above the bottom sheet view, used as a Pressable for closing
   * the view.
   */
  dismissArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  /**
   * The keyboard avoiding containing view.
   */
  container: {
    justifyContent: 'flex-start',
    height: '100%',
    width: '100%',
  },
  /**
   * Positioned under all the views.
   */
  overlay: {
    backgroundColor: '#000C',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  /**
   * Contains the view header and the form controls
   */
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
  /**
   * Contains the handle which is the grey pill at the top of the form to indicate the form
   * can be dragged.
   */
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
  /**
   * Pill shaped handle at the top of the view.
   */
  handle: {
    backgroundColor: '#DDD',
    flexBasis: 48,
    borderRadius: 2,
    height: 4,
  },
});

import {zodResolver} from '@hookform/resolvers/zod';
import {Button} from 'components/content/Button';
import {TextField, TextFieldComponent} from 'components/form/TextField';
import {BodySemibold} from 'components/text';
import {useEditViewState} from 'hooks/useEditViewState';
import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {FormProvider, Resolver, useForm} from 'react-hook-form';
import {Animated, Keyboard, KeyboardAvoidingView, LayoutChangeEvent, PanResponder, Platform, Pressable, StyleSheet, TextInput, View} from 'react-native';
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
const MAX_FORM_HEIGHT = 400;
const AUTO_DISMISS_DRAGGING_COMPLETE_HEIGHT = 320;
const AUTO_DISMISS_DRAGGING_HEIGHT = 200;
const AUTO_DISMISS_VELOCITY = 3;

export const ImageCaptionFieldEditView: React.FC<Props> = ({onSetCaption, onDismiss, initialCaption, autoDismiss = true}) => {
  const ref = useRef<View>(null);
  const fadeAnim = useRef(new Animated.Value(0)); // Initial value for opacity: 0

  const textInputRef = useRef<TextInput | null>(null);
  const [state, _dispatch, actions] = useEditViewState();

  // There is only one value, but using <TextField /> requires the use of a <FormProvider />
  const formContext = useForm<CaptionFormData>({
    defaultValues: initialCaption ? {caption: initialCaption} : DefaultCaptionData,
    resolver: zodResolver(captionForm) as Resolver<CaptionFormData>,
    mode: 'onBlur',
    shouldFocusError: false,
    shouldUnregister: true,
  });

  // Animated value that corresponds to the height of the non-form area
  const dragRef = useRef(new Animated.Value(INITIAL_HEIGHT, {useNativeDriver: false}));
  const heightAnimationRef = useRef(Animated.add<number>(INITIAL_HEIGHT, Animated.multiply<number>(-1, dragRef.current)));

  const positionRef = useRef(new Animated.Value(0, {useNativeDriver: false}));

  // Create an animated based on the view boundary. If the view is dragged to high or
  // to low it won't go past min or max values.
  const clampedAnimation = useMemo(() => {
    return Animated.diffClamp(heightAnimationRef.current, state.viewBoundary.min, Math.min(state.viewBoundary.max, MAX_FORM_HEIGHT));
  }, [state.viewBoundary]);

  useEffect(() => {
    if (state.mode === 'dismissed') {
      actions.reset();
      onDismiss();
    }
  }, [onDismiss, state.mode, actions]);

  const edges = useSafeAreaInsets();

  useEffect(() => {
    if (state.mode === 'dismissRequested') {
      actions.setViewBoundary({min: -edges.bottom});
    }
  }, [state.mode, actions, edges.bottom]);

  // When the view is layed out calculate the max boundary size we'll animate
  // all the way
  const finalHeight = useRef(INITIAL_HEIGHT);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      // If the layout is resized while the view is dismissing (e.g. the keyboard is going away)
      // just set them minimum view size to 0 because we want it to animate all the way out
      if (state.mode === 'dismissing') {
        actions.setViewBoundary({min: -edges.bottom});
        return;
      }

      // Calculate the max height base on the safe area
      const height = event.nativeEvent.layout.height;
      finalHeight.current = height;
      const maxHeight = height - edges.top;
      actions.setViewBoundary({max: maxHeight});
    },
    [edges.top, state.mode, actions, edges.bottom],
  );

  // Called when the panResponder completes, if it's dragged far enough or fast enough
  // it will request the view to be dismissed
  const onDragDismiss = (velocity?: number) => {
    if (velocity != null && velocity > AUTO_DISMISS_VELOCITY) {
      actions.dismissRequest();
      return;
    }
    ref.current?.measure((_x, _y, _w, h) => {
      if (h < AUTO_DISMISS_DRAGGING_COMPLETE_HEIGHT) {
        actions.dismissRequest();
      }
    });
  };

  const handlePanResponderMove = Animated.event([null, {dy: dragRef.current}], {useNativeDriver: false});
  // listen to dragging gestures and set the dragRef value to move the inter view
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponder: () => true,
      onPanResponderStart: () => {
        dragRef.current.stopAnimation();
      },
      onPanResponderMove: (event, gestureState) => {
        handlePanResponderMove(event, gestureState);
        ref.current?.measure((_x, _y, _w, h) => {
          if (h < AUTO_DISMISS_DRAGGING_HEIGHT) {
            dragRef.current.stopAnimation(() => {
              dragRef.current.extractOffset();
            });
            actions.dismissRequest();
          }
        });
      },
      onPanResponderRelease: (_, gestureState) => {
        onDragDismiss(gestureState.vy);
        dragRef.current.extractOffset();
        Animated.decay(dragRef.current, {
          velocity: gestureState.vy,
          deceleration: 0.99,
          useNativeDriver: false,
        }).start(() => {
          dragRef.current.extractOffset();
          onDragDismiss();
        });
      },
    }),
  ).current;

  // validate the form and dismiss if autoDismiss is true which is the default
  const onSubmitPress = useCallback(() => {
    void (async () => {
      await formContext.trigger();

      const submit = formContext.handleSubmit(values => {
        onSetCaption(values.caption);
      });

      await submit();

      if (autoDismiss && state.mode !== 'dismissing') {
        actions.dismissRequest();
      }
    })();
  }, [formContext, onSetCaption, autoDismiss, actions, state.mode]);

  const onPressOverlay = useCallback(() => {
    actions.dismissRequest();
  }, [actions]);

  const transitionAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (state.mode !== 'dismissRequested') {
      return;
    }
    actions.dismiss();

    transitionAnimationRef.current?.stop();
    textInputRef.current?.blur();
    transitionAnimationRef.current = Animated.parallel([
      Animated.timing(fadeAnim.current, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(positionRef.current, {
        toValue: finalHeight.current,
        bounciness: 0,
        useNativeDriver: false,
      }),
    ]);

    transitionAnimationRef.current.start(() => {
      actions.dismissCompleted();
    });
  }, [state.mode, actions]);

  // Storing the mutated timestamp in a ref so the keyboard listeners aren't
  // invalidated
  const mutatedRef = useRef(Date.now());
  useEffect(() => {
    mutatedRef.current = state.mutatedAt ?? mutatedRef.current;
  }, [state.mutatedAt]);

  // If the input is blurred and keyboardWillHide is fired, close the view
  // only iOS emits keyboardWillHide
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardWillHide', () => {
      const delta = Date.now() - (mutatedRef.current ?? Number.MAX_SAFE_INTEGER);

      // HACK: on iOS, if a hardware keyboard is attached, we're seeing this event
      // fired immediately upon presenting the view, so we're noop-ing here
      if (state.mode === 'presentRequested' && delta < 100) {
        return;
      }

      if (state.mode !== 'dismissing') {
        actions.dismissRequest();
      }
    });

    return () => sub.remove();
  }, [state.mode, state.previousMode, actions]);

  // Auto presenting if in resting state we're just going to open.
  useEffect(() => {
    if (state.mode === 'resting') {
      actions.presentRequest();
    }
  }, [actions, state.mode]);

  useEffect(() => {
    if (state.mode !== 'presentRequested') {
      return;
    }

    actions.present();

    transitionAnimationRef.current?.stop();

    let timeoutId: NodeJS.Timeout | undefined;

    transitionAnimationRef.current = Animated.parallel([
      Animated.timing(fadeAnim.current, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(dragRef.current, {
        toValue: 0,
        bounciness: 0,
        useNativeDriver: false,
      }),
    ]);

    transitionAnimationRef.current?.start(() => {
      actions.presentCompleted();
    });

    return () => {
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [state.mode, actions]);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => {
      const delta = Date.now() - mutatedRef.current;

      if (state.mode === 'presentRequested' && delta < 100) {
        return;
      }

      if (state.mode !== 'dismissing') {
        actions.dismissRequest();
      }
    });

    return () => sub.remove();
  }, [state.mode, actions]);

  const onHeaderLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (state.mode === 'dismissing') {
        return;
      }
      actions.setViewBoundary({min: event.nativeEvent.layout.height});
    },
    [actions, state.mode],
  );

  return (
    <KeyboardAvoidingView behavior={BEHAVIOR} style={[styles.flexV, styles.container]}>
      <Animated.View style={[styles.overlay, {opacity: fadeAnim.current}]} />

      <View onLayout={onLayout} style={[styles.flexV, {height: '100%'}]}>
        <FormProvider {...formContext}>
          <Pressable style={styles.dismissArea} onPress={onPressOverlay} />
          <Animated.View collapsable={false} ref={ref} style={[styles.flexV, styles.form, {height: clampedAnimation, transform: [{translateY: positionRef.current}]}]}>
            <View onLayout={onHeaderLayout} style={styles.formHeader} {...panResponder.panHandlers}>
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
                textInputRef={textInputRef}
                textInputProps={{
                  placeholder: 'Write a short image description…',
                  multiline: true,
                  // On Android, the autoFocus doesn't seem to work when the view is being animated
                  // or perhaps presented within a modal.
                  autoFocus: Platform.OS !== 'android',
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
  scrollView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0,
  },
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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

import {useEffect, useState} from 'react';
import {Keyboard, KeyboardAvoidingViewProps, Platform} from 'react-native';

// This is a workaround to fix a known issue on Android where bottom padding is left over when the keyboard is dismissed
// https://github.com/facebook/react-native/issues/52596
export function useKeyboardBehavior() {
  const defaultValue: KeyboardAvoidingViewProps['behavior'] = Platform.OS === 'ios' ? 'padding' : 'height';

  const [behaviour, setBehaviour] = useState<KeyboardAvoidingViewProps['behavior']>(defaultValue);

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => {
      setBehaviour(defaultValue);
    });
    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      setBehaviour(undefined);
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [defaultValue]);

  return behaviour;
}

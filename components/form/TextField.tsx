import {HStack, View, ViewProps, VStack} from 'components/core';
import {FieldLabel} from 'components/form/FieldLabel';
import {BodySm, BodyXSm} from 'components/text';
import {combineRefs} from 'hooks/combineRefs';
import React, {Ref, useCallback, useLayoutEffect, useRef, useState} from 'react';
import {FieldPathByValue, FieldValues, useController} from 'react-hook-form';
import {Platform, Pressable, View as RNView, StyleSheet, TextInput, TextInputProps} from 'react-native';
import {colorLookup} from 'theme';

export type KeysMatching<T, V> = {[K in keyof T]-?: T[K] extends V ? K : never}[keyof T];

/**
 * TFieldValues and TFieldName match the generics of useController's with one additional constraint:
 *
 *  - TFieldName _must_ extends a key whose value is a `string | null | undefined` type because TextField at this time
 *    only works with string values.
 *
 * FieldPathByValue is a utility type provided by react-hook-form that computes the keys whose values are constrained to that type.
 */
interface TextFieldProps<TFieldValues extends FieldValues, TFieldName extends FieldPathByValue<TFieldValues, StringFieldValue>> extends ViewProps {
  name: TFieldName;
  label: string;
  comment?: string;
  textTransform?: (text: string) => string;
  textInputProps?: Omit<TextInputProps, 'style'>;
  disabled?: boolean;
  hideLabel?: boolean;
  required?: boolean;
  textInputRef?: React.Ref<TextInput>;
}

const textInputDefaultStyle = {
  color: colorLookup('text'),
  fontSize: 16,
  fontFamily: Platform.select({
    android: 'Lato_400Regular',
    ios: 'Lato-Regular',
  }),
};

/**
 * TextField can work with any form key with a value of this type.
 */
type StringFieldValue = string | null | undefined;

/**
 * To be used with forwardRef to create a generic component.
 */
const _TextField = <TFieldValues extends FieldValues, TFieldName extends FieldPathByValue<TFieldValues, StringFieldValue>>(
  {name, label, comment, textTransform, textInputProps = {}, disabled, textInputRef, hideLabel = false, required = false, ...props}: TextFieldProps<TFieldValues, TFieldName>,
  ref: Ref<RNView>,
) => {
  const {field, fieldState} = useController<TFieldValues, TFieldName>({name});

  const onChangeText = useCallback(
    (text: string): void => {
      if (textTransform) {
        field.onChange(textTransform(text));
      } else {
        field.onChange(text);
      }
    },
    [textTransform, field],
  );

  const onBlur = useCallback(() => {
    setFocused(false);
    field.onBlur();
  }, [field]);

  const onFocus = useCallback(() => {
    setFocused(true);
  }, []);

  const textFieldRef = useRef<TextInput>(null);
  const inputRef = combineRefs([textFieldRef, textInputRef]);

  const [isFocused, setFocused] = useState(() => textFieldRef?.current?.isFocused ?? false);

  useLayoutEffect(() => {
    setFocused(textFieldRef?.current?.isFocused ?? false);
  }, []);

  const handleFocusField = useCallback(() => {
    textFieldRef.current?.focus();
  }, []);

  return (
    <VStack width="100%" space={4} {...props} ref={ref}>
      {!hideLabel && (
        <HStack space={4}>
          <FieldLabel label={label} required={required} />
          {comment && <BodySm>{comment}</BodySm>}
        </HStack>
      )}
      <Pressable style={styles.pressContainer} onPress={handleFocusField}>
        <View
          p={8}
          flexBasis={'auto'}
          flexGrow={1}
          flexShrink={0}
          display="flex"
          borderWidth={2}
          borderColor={isFocused ? colorLookup('border.active') : colorLookup('border.base')}
          borderRadius={4}
          backgroundColor={fieldState.error && colorLookup('error.outline')}>
          <TextInput
            ref={inputRef}
            onBlur={onBlur}
            onFocus={onFocus}
            onChangeText={onChangeText}
            value={field.value}
            style={textInputDefaultStyle}
            placeholderTextColor={colorLookup('text.tertiary')}
            editable={!disabled}
            textAlignVertical="top"
            {...textInputProps}
          />
        </View>
      </Pressable>
      {/* TODO: animate the appearance/disappearance of the error string */}
      {fieldState.error && <BodyXSm color={colorLookup('error.active')}>{fieldState.error.message}</BodyXSm>}
    </VStack>
  );
};

/**
 * The type of TFieldValues cannot be inferred by the use of <TextField />, it has to be supplied as a generic.
 *
 * It's usually nicer to have generic types inferred. This type allows alias TextField types to provide the TFieldValues
 * and let the name prop be inferred based off of that.
 *
 * Example, the use of name="age" will be a compiler failure because the value of age is a number.
 *
 *    const MyCoolTextField = TextField as TextFieldComponent<{ firstName: string, age: number }>;
 *
 *    const Component = () => {
 *      return (
 *         <>
 *          <MyCoolTextField name="firstName" .../>
 *          <MyCoolTextField name="age" .../>
 *         </>
 *      );
 *    };
 */
export type TextFieldComponent<TFieldValues extends FieldValues> = <TFieldName extends FieldPathByValue<TFieldValues, StringFieldValue>>(
  props: React.PropsWithRef<TextFieldProps<TFieldValues, TFieldName>> & {ref?: Ref<RNView>},
) => JSX.Element;

export const TextField = React.forwardRef(_TextField) as (<TFieldValues extends FieldValues, TFieldName extends FieldPathByValue<TFieldValues, StringFieldValue>>(
  props: React.PropsWithoutRef<TextFieldProps<TFieldValues, TFieldName>> & {ref?: Ref<RNView>},
) => JSX.Element) & {displayName?: string};

TextField.displayName = 'TextField';

const styles = StyleSheet.create({
  pressContainer: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
});

import {AntDesign} from '@expo/vector-icons';
import DateTimePicker, {DateTimePickerAndroid, DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {Button} from 'components/content/Button';
import {HStack, VStack, ViewProps} from 'components/core';
import {FieldLabel, HelpText} from 'components/form/FieldLabel';
import {Body, BodyBlack, BodyXSm} from 'components/text';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useController, useFormContext} from 'react-hook-form';
import {Platform} from 'react-native';
import {colorLookup} from 'theme';
import {utcDateToLocalDateString} from 'utils/date';

interface DateItem {
  label: string;
  value: Date;
}

interface QuickPickDateFieldProps extends ViewProps {
  name: string;
  label?: string;
  quickPickDates: DateItem[];
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  labelSpace?: number;
  required?: boolean;
  helpText?: HelpText;
}

/**
 * This component renders a horizontal stack of quick select dates for the user to select from. The
 * final option in the list will open a native date picker allowing the user to select an arbitrary
 * value.
 */
export function QuickPickDateField({
  name,
  label,
  quickPickDates,
  minimumDate,
  maximumDate,
  disabled = false,
  labelSpace = 4,
  required = false,
  helpText,
  ...props
}: QuickPickDateFieldProps) {
  const {setValue} = useFormContext();
  const {field, fieldState} = useController({name});
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const currentValue: Date | undefined = field.value as Date | undefined;

  // If the field is required default to first item in list
  useEffect(() => {
    if (required && quickPickDates.length > 0 && !currentValue) {
      setValue(name, quickPickDates[0].value, {shouldValidate: true, shouldDirty: true, shouldTouch: true});
    }
  }, [name, required, quickPickDates, setValue, currentValue]);

  const quickPickSelectionHandlers = useMemo(
    () =>
      quickPickDates.map(item => () => {
        if (item.value.toDateString() === currentValue?.toDateString()) {
          // Deselect value if not a required field
          if (!required) {
            setValue(name, undefined, {shouldValidate: false, shouldDirty: false, shouldTouch: false});
          }
          return;
        }
        setValue(name, item.value, {shouldValidate: true, shouldDirty: true, shouldTouch: true});
      }),
    [name, quickPickDates, required, setValue, currentValue],
  );

  const onDateSelected = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (event.type === 'set') {
        setValue(name, date, {shouldValidate: true, shouldDirty: true, shouldTouch: true});
      }
      setDatePickerVisible(false);
    },
    [name, setValue, setDatePickerVisible],
  );

  const toggleDatePicker = useCallback(() => {
    setDatePickerVisible(!datePickerVisible);
    if (Platform.OS === 'android') {
      if (datePickerVisible) {
        void DateTimePickerAndroid.dismiss('date');
      } else {
        void DateTimePickerAndroid.open({mode: 'date', display: 'default', onChange: onDateSelected, value: currentValue ?? new Date(), minimumDate, maximumDate});
      }
    }
  }, [datePickerVisible, setDatePickerVisible, onDateSelected, currentValue, minimumDate, maximumDate]);

  // RowMargin is the space between rows if the list of buttons wraps onto a second row. We subtract
  // it from top margin of the HStack to stop the first row of buttons from being offset down.
  const rowMargin = 5;

  const isQuickPickSelected = useMemo(() => {
    for (const item of quickPickDates) {
      if (field.value instanceof Date && item.value.getUTCDate() === field.value.getUTCDate()) {
        return true;
      }
    }
    return false;
  }, [field.value, quickPickDates]);

  return (
    <VStack width="100%" space={labelSpace} flex={1} flexGrow={1} bg={'white'} {...props}>
      <FieldLabel label={label ?? name} required={required} helpText={helpText} />
      <Body>{utcDateToLocalDateString(currentValue)}</Body>
      <HStack space={5} flexWrap="wrap" marginTop={-rowMargin} backgroundColor={fieldState.error && colorLookup('error.outline')} {...props}>
        {quickPickDates.map((item, index) => {
          const selected = field.value instanceof Date && item.value.getUTCDate() === field.value.getUTCDate();
          const LabelFont = selected ? BodyBlack : Body;
          return (
            <Button
              key={item.label}
              onPress={quickPickSelectionHandlers[index]}
              buttonStyle={selected ? 'primary' : 'normal'}
              px={8}
              py={4}
              marginTop={rowMargin}
              borderWidth={1}
              disabled={disabled}>
              <LabelFont>{item.label}</LabelFont>
            </Button>
          );
        })}
        <Button
          key={'other'}
          onPress={toggleDatePicker}
          buttonStyle={!isQuickPickSelected && field.value ? 'primary' : 'normal'}
          px={8}
          py={4}
          marginTop={rowMargin}
          borderWidth={1}
          disabled={disabled}>
          {!isQuickPickSelected ? (
            <BodyBlack>
              Other&nbsp;
              <AntDesign name="calendar" size={20} />
            </BodyBlack>
          ) : (
            <Body>
              Other&nbsp;
              <AntDesign name="calendar" size={20} />
            </Body>
          )}
        </Button>
      </HStack>
      {fieldState.error && <BodyXSm color={colorLookup('error.active')}>{fieldState.error.message}</BodyXSm>}

      {datePickerVisible && Platform.OS === 'ios' && (
        <DateTimePicker
          value={currentValue || new Date()}
          mode="date"
          display="inline"
          themeVariant="light"
          onChange={onDateSelected}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          disabled={disabled}
        />
      )}
    </VStack>
  );
}

QuickPickDateField.displayName = 'QuickPickDateField';

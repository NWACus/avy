import {AntDesign} from '@expo/vector-icons';
import DateTimePicker, {DateTimePickerAndroid, DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {Button} from 'components/content/Button';
import {InfoTooltip} from 'components/content/InfoTooltip';
import {HStack, VStack, ViewProps} from 'components/core';
import {Body, BodyBlack, BodySmBlack, BodyXSm} from 'components/text';
import React, {useCallback, useMemo, useState} from 'react';
import {useController} from 'react-hook-form';
import {Platform} from 'react-native';
import {colorLookup} from 'theme';
import {utcDateToLocalDateString} from 'utils/date';

interface DateItem {
  label: string;
  value: Date;
}

interface HelpText {
  title: string;
  contentHtml: string;
}

interface ButtonSelectDateFieldProps extends ViewProps {
  name: string;
  label?: string;
  quickPickDates: DateItem[];
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  labelSpace?: number;
  helpText?: HelpText;
}

/**
 * This component renders a horizontal stack of quick select dates for the user to select from. It's
 * a variation of the ButtonSelectField component designed for date fields. The final option in the
 * list will open a native date picker allowing the user to select an arbitrary value.
 */
export function ButtonSelectDateField({name, label, quickPickDates, minimumDate, maximumDate, disabled = false, labelSpace = 4, helpText, ...props}: ButtonSelectDateFieldProps) {
  const {field, fieldState} = useController({name});
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const currentValue: Date | undefined = field.value as Date | undefined;

  const quickPickSelectionHandlers = useMemo(
    () =>
      quickPickDates.map(item => () => {
        field.onChange(item.value);
      }),
    [quickPickDates, field],
  );

  const onDateSelected = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (event.type === 'set') {
        field.onChange(date);
      }
      setDatePickerVisible(false);
    },
    [field, setDatePickerVisible],
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

  let isQuickPick = false;
  return (
    <VStack width="100%" space={labelSpace} flex={1} flexGrow={1} bg={'white'} {...props}>
      <HStack>
        <BodySmBlack>{label ?? name}</BodySmBlack>
        {helpText && <InfoTooltip title={helpText.title} content={helpText.contentHtml} size={14} htmlStyle={{textAlign: 'left'}} />}
      </HStack>
      <Body>{utcDateToLocalDateString(currentValue)}</Body>
      <HStack space={5} flexWrap="wrap" marginTop={-rowMargin} {...props}>
        {quickPickDates.map((item, index) => {
          const selected = field.value instanceof Date && item.value.getUTCDate() === field.value.getUTCDate();
          isQuickPick = isQuickPick || selected;
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
        <Button key={'other'} onPress={toggleDatePicker} buttonStyle={!isQuickPick ? 'primary' : 'normal'} px={8} py={4} marginTop={rowMargin} borderWidth={1} disabled={disabled}>
          <BodyBlack>
            <AntDesign name="calendar" />
          </BodyBlack>
        </Button>
      </HStack>
      {fieldState.error && <BodyXSm color={colorLookup('error.900')}>{fieldState.error.message}</BodyXSm>}

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

ButtonSelectDateField.displayName = 'ButtonSelectDateField';

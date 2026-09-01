import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, {DateTimePickerAndroid, DateTimePickerChangeEvent, DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {Button} from 'components/content/Button';
import {Center, HStack, View, ViewProps, VStack} from 'components/core';
import {FieldLabel} from 'components/form/FieldLabel';
import {Body, bodySize} from 'components/text';
import React, {useCallback, useState} from 'react';
import {useController} from 'react-hook-form';
import {ColorValue, Platform, TouchableOpacity} from 'react-native';
import {colorLookup} from 'theme';
import {utcDateToLocalDateString} from 'utils/date';

interface DateFieldProps extends ViewProps {
  name: string;
  label?: string;
  minimumDate?: Date;
  maximumDate: Date;
  disabled?: boolean;
}

export const DateField: React.FC<DateFieldProps> = ({name, label, minimumDate, maximumDate, disabled, ...props}) => {
  const {field} = useController({name: name});
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const value: Date | undefined = field.value as Date | undefined;
  const [pendingDate, setPendingDate] = useState<Date>(value ?? new Date());

  const onDateSelectedAndroid = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (event.type === 'set') {
        field.onChange(date);
      }
      setDatePickerVisible(false);
    },
    [field, setDatePickerVisible],
  );

  const onDateSelectedIOS = useCallback((_: DateTimePickerChangeEvent, date: Date) => {
    setPendingDate(date);
  }, []);

  const confirmDateIOS = useCallback(() => {
    field.onChange(pendingDate);
    setDatePickerVisible(false);
  }, [field, pendingDate, setDatePickerVisible]);

  const renderConfirmButtonContent = useCallback(
    (style: {backgroundColor: ColorValue | undefined; textColor: ColorValue}) => (
      <HStack space={4} alignItems="center">
        <Ionicons name="checkmark" color={style.textColor} size={bodySize} />
        <Body color={style.textColor}>Confirm</Body>
      </HStack>
    ),
    [],
  );

  const toggleDatePicker = useCallback(() => {
    setDatePickerVisible(!datePickerVisible);
    if (Platform.OS === 'android') {
      if (datePickerVisible) {
        void DateTimePickerAndroid.dismiss('date');
      } else {
        void DateTimePickerAndroid.open({mode: 'date', display: 'default', onChange: onDateSelectedAndroid, value: value ?? new Date(), minimumDate, maximumDate});
      }
    } else if (!datePickerVisible) {
      setPendingDate(value ?? new Date());
    }
  }, [datePickerVisible, setDatePickerVisible, onDateSelectedAndroid, value, minimumDate, maximumDate]);

  return (
    <VStack width="100%" space={4} {...props}>
      {label && <FieldLabel label={label} />}
      <TouchableOpacity onPress={toggleDatePicker} disabled={disabled}>
        <HStack borderWidth={2} borderColor={colorLookup('border.base')} borderRadius={4} justifyContent="space-between" alignItems="stretch">
          <View p={8}>
            <Body>{utcDateToLocalDateString(value)}</Body>
          </View>
          <Center px={8} borderLeftWidth={2} borderColor={colorLookup('border.base')}>
            <Ionicons name="calendar-outline" color={colorLookup('text')} size={bodySize} />
          </Center>
        </HStack>
      </TouchableOpacity>

      {datePickerVisible && Platform.OS === 'ios' && (
        <VStack space={8}>
          <DateTimePicker
            value={pendingDate}
            mode="date"
            display="inline"
            themeVariant="light"
            onValueChange={onDateSelectedIOS}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            disabled={disabled}
          />
          <Button onPress={confirmDateIOS} buttonStyle="primary" alignSelf="flex-end" px={16} py={8} disabled={disabled} renderChildren={renderConfirmButtonContent} />
        </VStack>
      )}
    </VStack>
  );
};

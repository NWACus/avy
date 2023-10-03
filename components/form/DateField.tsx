import {AntDesign} from '@expo/vector-icons';
import DateTimePicker, {DateTimePickerAndroid, DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {Center, HStack, VStack, View} from 'components/core';
import {Body, BodyXSmBlack, bodySize} from 'components/text';
import React, {useCallback, useState} from 'react';
import {useController} from 'react-hook-form';
import {Platform, TouchableOpacity} from 'react-native';
import {colorLookup} from 'theme';
import {utcDateToLocalDateString} from 'utils/date';

interface DateFieldProps {
  name: string;
  label: string;
}

export const DateField: React.FC<DateFieldProps> = ({name, label}) => {
  const {field} = useController({name: name});
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const onDateSelected = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (event.type === 'set') {
        field.onChange(date);
      }
      setDatePickerVisible(false);
    },
    [field, setDatePickerVisible],
  );

  const value: Date | undefined = field.value as Date | undefined;

  const toggleDatePicker = useCallback(() => {
    setDatePickerVisible(!datePickerVisible);
    if (Platform.OS === 'android') {
      if (datePickerVisible) {
        void DateTimePickerAndroid.dismiss('date');
      } else {
        void DateTimePickerAndroid.open({mode: 'date', display: 'default', onChange: onDateSelected, value: value ?? new Date()});
      }
    }
  }, [datePickerVisible, setDatePickerVisible, onDateSelected, value]);

  // TODO: maximum/minimum date
  return (
    <VStack width="100%" space={4}>
      <BodyXSmBlack>{label}</BodyXSmBlack>
      <TouchableOpacity onPress={toggleDatePicker}>
        <HStack borderWidth={2} borderColor={colorLookup('border.base')} borderRadius={4} justifyContent="space-between" alignItems="stretch">
          <View p={8}>
            <Body>{utcDateToLocalDateString(value)}</Body>
          </View>
          <Center px={8} borderLeftWidth={2} borderColor={colorLookup('border.base')}>
            <AntDesign name="calendar" color={colorLookup('text')} size={bodySize} />
          </Center>
        </HStack>
      </TouchableOpacity>

      {datePickerVisible && Platform.OS === 'ios' && <DateTimePicker value={value || new Date()} mode="date" display="inline" themeVariant="light" onChange={onDateSelected} />}
    </VStack>
  );
};

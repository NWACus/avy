import {AntDesign} from '@expo/vector-icons';
import DateTimePicker, {DateTimePickerAndroid, DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {Center, HStack, View, VStack} from 'components/core';
import {Body, bodySize, BodyXSmBlack} from 'components/text';
import {add} from 'date-fns';
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
  const {
    field: {onChange, value},
    formState: {defaultValues},
  } = useController({name});
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [minimumDate] = useState<Date>(add(defaultValues[name], {months: -1}));
  const [maximumDate] = useState<Date>(defaultValues[name]);

  const onDateSelected = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (event.type === 'set') {
        onChange(date);
      }
      setDatePickerVisible(false);
    },
    [onChange, setDatePickerVisible],
  );

  const toggleDatePicker = useCallback(() => {
    setDatePickerVisible(!datePickerVisible);
    if (Platform.OS === 'android') {
      if (datePickerVisible) {
        DateTimePickerAndroid.dismiss('date');
      } else {
        DateTimePickerAndroid.open({mode: 'date', display: 'default', onChange: onDateSelected, minimumDate, maximumDate, value});
      }
    }
  }, [datePickerVisible, setDatePickerVisible, onDateSelected, minimumDate, maximumDate, value]);

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

      {datePickerVisible && Platform.OS === 'ios' && (
        <DateTimePicker value={value || new Date()} mode="date" display="inline" onChange={onDateSelected} minimumDate={minimumDate} maximumDate={maximumDate} />
      )}
    </VStack>
  );
};

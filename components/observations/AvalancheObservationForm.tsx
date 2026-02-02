import {zodResolver} from '@hookform/resolvers/zod';
import {useFocusEffect} from '@react-navigation/native';

import React, {useCallback, useEffect, useState} from 'react';
import {FieldErrors, FormProvider, Resolver, useForm} from 'react-hook-form';
import {KeyboardAvoidingView, Modal, Platform, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';

import {AntDesign} from '@expo/vector-icons';
import {SelectModalProvider} from '@mobile-reality/react-native-select-pro';
import {Button} from 'components/content/Button';
import {Card} from 'components/content/Card';
import {Divider, HStack, VStack, View} from 'components/core';
import {DateField} from 'components/form/DateField';
import {AddImageFromPickerButton, AddImageFromPickerButtonComponent, ImageCaptionField, ImageCaptionFieldComponent} from 'components/form/ImageCaptionField';
import {LocationField} from 'components/form/LocationField';
import {SelectField} from 'components/form/SelectField';
import {SwitchField} from 'components/form/SwitchField';
import {TextField, TextFieldComponent} from 'components/form/TextField';
import {AvalancheObservationFormData, avalancheObservationFormSchema, defaultAvalancheObservationFormData} from 'components/observations/ObservationFormData';
import {BodySemibold, Title3Semibold} from 'components/text';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {usePostHog} from 'posthog-react-native';
import {
  AvalancheAspect,
  AvalancheCenterID,
  AvalancheTrigger,
  AvalancheType,
  FormatAvalancheAspect,
  FormatAvalancheTrigger,
  FormatAvalancheType,
  reverseLookup,
} from 'types/nationalAvalancheCenter';

/**
 * AvalancheObservationTextField can only have a name prop that is a key of a string value.
 */
const AvalancheObservationTextField = TextField as TextFieldComponent<AvalancheObservationFormData>;

/**
 * The image picker components expect that the name prop is a key of an Array<imageAssetWithCaptionSchema>
 */
const AvalancheObservationImagePicker = AddImageFromPickerButton as AddImageFromPickerButtonComponent<AvalancheObservationFormData>;
const AvalancheObservationImageCaptionField = ImageCaptionField as ImageCaptionFieldComponent<AvalancheObservationFormData>;

export const AvalancheObservationForm: React.FC<{
  visible: boolean;
  initialData?: AvalancheObservationFormData;
  center_id: AvalancheCenterID;
  onClose: () => void;
  onSave: (data: AvalancheObservationFormData) => void;
}> = ({visible, center_id, initialData, onClose, onSave}) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);

  const formContext = useForm<AvalancheObservationFormData>({
    resolver: zodResolver(avalancheObservationFormSchema) as Resolver<AvalancheObservationFormData>,
    mode: 'onBlur',
    shouldFocusError: false,
    shouldUnregister: true,
  });

  useEffect(() => {
    formContext.reset(initialData != null ? initialData : defaultAvalancheObservationFormData());
  }, [formContext, initialData]);

  const insets = useSafeAreaInsets();

  const postHog = usePostHog();

  const recordAnalytics = useCallback(() => {
    if (postHog && center_id) {
      postHog.screen('avalancheObservationForm', {
        center: center_id,
      });
    }
  }, [postHog, center_id]);
  useFocusEffect(recordAnalytics);

  const today = new Date();

  const onSaveHandler = useCallback(
    (data: AvalancheObservationFormData) => {
      onSave(data);
    },
    [onSave],
  );

  const onSaveError = useCallback(
    (errors: FieldErrors<Partial<AvalancheObservationFormData>>) => {
      logger.error({errors: errors, formValues: formContext.getValues()}, 'submit error');
    },
    [formContext, logger],
  );

  const onSavePress = useCallback(() => {
    void (async () => {
      // Set fields that haven't been visited yet
      formContext.setValue('status', 'published');
      formContext.setValue('private', false);
      formContext.setValue('media', []);
      await formContext.trigger();
      // Then try to submit the form
      void formContext.handleSubmit(onSaveHandler, onSaveError)();
    })();
  }, [formContext, onSaveHandler, onSaveError]);

  const onCloseHandler = useCallback(() => {
    formContext.reset();
    onClose();
  }, [formContext, onClose]);

  const [_, setIsImagePickerDisplayed] = useState(false);

  const formFieldSpacing = 16;

  const maxImageCount = 4;

  return (
    <FormProvider {...formContext}>
      <SafeAreaProvider>
        <Modal visible={visible} animationType="slide" onRequestClose={onCloseHandler}>
          <SelectModalProvider>
            <View flex={1} style={{paddingTop: insets.top}}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1, height: '100%'}}>
                <ScrollView style={{flex: 1}} contentContainerStyle={{paddingBottom: insets.bottom}} keyboardShouldPersistTaps="handled">
                  <AvalancheObservationFormHeader onClose={onCloseHandler} />
                  <VStack>
                    <VStack space={formFieldSpacing} paddingBottom={32} paddingHorizontal={16}>
                      <Title3Semibold>Details</Title3Semibold>
                      <Divider />
                      <AvalancheObservationTextField
                        name="location"
                        label="Location"
                        textInputProps={{
                          placeholder: 'Describe the location of the avalanche.',
                          multiline: true,
                        }}
                      />
                      <LocationField name="location_point" label="Latitude/Longitude" center={center_id} />
                      <DateField name="date" label="Occurance date" maximumDate={today} />
                      <SwitchField
                        name="date_known"
                        label="Date Accuracy"
                        items={[
                          {label: 'Estimated', value: false},
                          {label: 'Known', value: true},
                        ]}
                      />

                      <SelectField
                        name="trigger"
                        label="Trigger"
                        prompt="What caused the avalanche to release?"
                        minItemsShown={5}
                        items={Object.values(AvalancheTrigger).map(trigger => ({label: FormatAvalancheTrigger(trigger), value: trigger}))}
                      />

                      <SelectField
                        name="aspect"
                        label="Aspect"
                        prompt="Primary or average aspect of the slope"
                        minItemsShown={5}
                        items={Object.values(AvalancheAspect).map(aspect => ({label: FormatAvalancheAspect(aspect), value: aspect}))}
                      />

                      <SelectField
                        name="d_size"
                        label="Avalanche Size"
                        prompt="Avalanche Size - Destructive Potential"
                        minItemsShown={5}
                        items={Object.values(AvalancheSize).map(size => ({label: FormatAvalancheSize(size), value: size}))}
                      />

                      <SelectField
                        name="avalanche_type"
                        label="Problem Type"
                        prompt="What type of avalanche did you observe?"
                        minItemsShown={5}
                        items={Object.values(AvalancheType).map(type => ({label: FormatAvalancheType(type), value: type}))}
                      />

                      <AvalancheObservationTextField
                        name="elevation"
                        label="Elevation (ft)"
                        textInputProps={{
                          placeholder: 'Elevation of the top of the crown.',
                          keyboardType: 'number-pad',
                          returnKeyType: 'done',
                        }}
                      />

                      <AvalancheObservationTextField
                        name="number"
                        label="Number (of avalanches)"
                        textInputProps={{
                          placeholder: 'Use if submitting general information for multipe avalanches',
                          keyboardType: 'number-pad',
                          returnKeyType: 'done',
                        }}
                      />
                    </VStack>
                    <Card
                      borderRadius={0}
                      borderColor="white"
                      header={
                        <HStack justifyContent="space-between">
                          <Title3Semibold>Photos</Title3Semibold>
                          <AvalancheObservationImagePicker name="images" maxImageCount={maxImageCount} space={4} py={4} pl={4} pr={8} />
                        </HStack>
                      }>
                      <VStack space={formFieldSpacing} mt={8}>
                        <AvalancheObservationImageCaptionField name="images" maxImageCount={maxImageCount} onModalDisplayed={setIsImagePickerDisplayed} />
                      </VStack>
                    </Card>
                    <Button mx={16} mt={8} buttonStyle="primary" onPress={onSavePress}>
                      <BodySemibold>{'Save avalanche'}</BodySemibold>
                    </Button>
                  </VStack>
                </ScrollView>
              </KeyboardAvoidingView>
            </View>
          </SelectModalProvider>
        </Modal>
      </SafeAreaProvider>
    </FormProvider>
  );
};

const AvalancheObservationFormHeader: React.FC<{
  onClose: () => void;
}> = ({onClose}) => {
  return (
    <View style={{width: '100%'}}>
      <HStack flex={1} justifyContent="space-between" height={64} paddingHorizontal={16}>
        <TouchableOpacity onPress={onClose} style={{flex: 1}}>
          <AntDesign name="close" size={24} color="black" />
        </TouchableOpacity>
        <Title3Semibold style={{flex: 3}}>Avalanche sighting</Title3Semibold>
      </HStack>
    </View>
  );
};

const AvalancheSize = {
  'D1 - Relatively harmless to people.': '1',
  'D1.5': '1.5',
  'D2 - Could bury, injure, or kill a person.': '2',
  'D2.5': '2.5',
  'D3 - Could bury or destroy a car, damage a truck, destroy a wood frame house, or break a few trees.': '3',
  'D3.5': '3.5',
  'D4 - Could destroy a railway car, a large truck, several buildings, or substantial amount of forest.': '4',
  'D4.5': '4.5',
  'D5 - Could gouge the landscape. Largest snow avalanche known.': '5',
} as const;
type AvalancheSize = (typeof AvalancheSize)[keyof typeof AvalancheSize];
const FormatAvalancheSize = (value: AvalancheSize): string => {
  return reverseLookup(AvalancheSize, value);
};

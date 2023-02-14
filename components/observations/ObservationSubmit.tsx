import {Divider, HStack, View, VStack} from 'components/core';
import {Body, BodySemibold, Title3Black, Title3Semibold} from 'components/text';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {useNavigation} from '@react-navigation/native';
import {ObservationsStackNavigationProps} from 'routes';
import {Keyboard, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback} from 'react-native';
import {colorLookup} from 'theme';
import {AntDesign} from '@expo/vector-icons';
import {createObservation, observationSchema} from 'components/observations/ObservationSchema';
import {Button} from 'components/content/Button';
import {TextField} from 'components/form/TextField';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {SelectField} from 'components/form/SelectField';
import {uniq} from 'lodash';
import {useForm, FormProvider} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';

export const ObservationSubmit: React.FC<{
  center_id: AvalancheCenterID;
  onClose?: () => void;
}> = ({center_id, onClose}) => {
  const {data: center} = useAvalancheCenterMetadata(center_id);
  const zones = uniq(center?.zones?.filter(z => z.status === 'active')?.map(z => z.name));

  const navigation = useNavigation<ObservationsStackNavigationProps>();
  const formContext = useForm({
    defaultValues: createObservation(),
    resolver: yupResolver(observationSchema),
    mode: 'onBlur',
    shouldFocusError: false,
    shouldUnregister: true,
  });

  const onSubmitHandler = data => {
    console.log('onSubmitHandler -> success', {data});
  };
  const onSubmitErrorHandler = data => {
    console.log('onSubmitErrorHandler -> error', {data});
  };

  return (
    <FormProvider {...formContext}>
      <View width="100%" height="100%" bg="#F6F8FC">
        {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there */}
        <SafeAreaView edges={['top', 'left', 'right']} style={{height: '100%', width: '100%'}}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1, height: '100%'}}>
            <VStack style={{height: '100%', width: '100%'}} alignItems="stretch" bg="#F6F8FC">
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <HStack justifyContent="flex-start" pb={8}>
                  <AntDesign.Button
                    size={24}
                    color={colorLookup('text')}
                    name="arrowleft"
                    backgroundColor="#F6F8FC"
                    iconStyle={{marginLeft: 0, marginRight: 8}}
                    style={{textAlign: 'center'}}
                    onPress={() => {
                      formContext.reset();
                      onClose ? onClose() : navigation.goBack();
                    }}
                  />
                  <Title3Black>Submit an observation</Title3Black>
                </HStack>
              </TouchableWithoutFeedback>
              <ScrollView style={{height: '100%', width: '100%', backgroundColor: 'white'}}>
                <VStack width="100%" justifyContent="flex-start" alignItems="stretch" space={16} px={32} pt={8} pb={8}>
                  <Body>Help keep the NWAC community informed by submitting your observation.</Body>
                  <Divider direction="horizontal" />
                  <Title3Semibold>General Information</Title3Semibold>
                  <TextField name="name" label="Name" placeholder="Jane Doe" textContentType="name" />
                  <TextField
                    name="email"
                    label="Email address"
                    placeholder="you@domain.com"
                    textContentType="emailAddress"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TextField name="observationDate" label="Observation date" placeholder="this needs to be a date picker" keyboardType="numbers-and-punctuation" />
                  <SelectField name="zone" label="Zone/Region" prompt="Select a zone or region" items={zones} />
                  <TextField name="activity" label="Activity" placeholder="this needs to be an activity picker" />
                  <TextField name="location" label="Location" placeholder="Tell us more about your route or trailhead" multiline />
                  <Divider direction="horizontal" />
                  <Title3Semibold>Map location</Title3Semibold>
                  <Body>tbd</Body>
                  <Button
                    mt={16}
                    mb={32}
                    buttonStyle="primary"
                    onPress={async () => {
                      // Force validation errors to show up on fields that haven't been visited yet
                      await formContext.trigger();
                      // Then try to submit the form
                      formContext.handleSubmit(onSubmitHandler, onSubmitErrorHandler)();
                    }}>
                    <BodySemibold>Submit your observation</BodySemibold>
                  </Button>
                </VStack>
              </ScrollView>
            </VStack>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </FormProvider>
  );
};

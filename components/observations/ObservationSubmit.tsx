import {Divider, View, VStack} from 'components/core';
import {Body, BodySemibold, Title1, Title3Semibold} from 'components/text';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';
import {useNavigation} from '@react-navigation/native';
import {ObservationsStackNavigationProps} from 'routes';
import {ScrollView} from 'react-native';
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
}> = ({center_id}) => {
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
      <View width="100%" height="100%" bg="white">
        {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there */}
        <SafeAreaView edges={['top', 'left', 'right']} style={{height: '100%', width: '100%'}}>
          <VStack style={{height: '100%', width: '100%'}} alignItems="stretch">
            <ScrollView style={{height: '100%', width: '100%'}}>
              <VStack width="100%" justifyContent="flex-start" alignItems="stretch" space={16} p={32}>
                <View style={{alignSelf: 'flex-end', marginRight: -16, marginTop: -32}}>
                  <AntDesign.Button
                    size={32}
                    color={colorLookup('darkText')}
                    name="close"
                    backgroundColor="white"
                    iconStyle={{marginRight: 0}}
                    style={{textAlign: 'center'}}
                    onPress={() => navigation.goBack()}
                  />
                </View>
                <Title1>Submit an observation</Title1>
                <Body>Help keep the NWAC community informed by submitting your observation.</Body>
                <Divider direction="horizontal" />
                <Title3Semibold>General Information</Title3Semibold>
                <TextField name="name" label="Name" placeholder="John Doe" />
                <TextField name="email" label="Email address" placeholder="you@domain.com" />
                <TextField name="observationDate" label="Observation date" placeholder="this needs to be a date picker" />
                <SelectField name="zone" label="Zone/Region" prompt="Select a zone or region" items={zones} />
                <TextField name="activity" label="Activity" placeholder="this needs to be an activity picker" />
                <TextField name="location" label="Location" placeholder="Tell us more about your route or trailhead" />
                <Divider direction="horizontal" />
                <Title3Semibold>Map location</Title3Semibold>
                <Body>tbd</Body>
              </VStack>
            </ScrollView>
            <View width="100%" height={1} mx={8} mt={8} bg="light.200" />
            <Button
              mx={8}
              my={16}
              buttonStyle="primary"
              onPress={async () => {
                // Force validation errors to show up on fields that haven't been visited yet
                await formContext.trigger();
                // Then try to submit the form
                await formContext.handleSubmit(onSubmitHandler, onSubmitErrorHandler)();
              }}>
              <BodySemibold>Submit your observation</BodySemibold>
            </Button>
          </VStack>
        </SafeAreaView>
      </View>
    </FormProvider>
  );
};

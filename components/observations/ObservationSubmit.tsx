import {AntDesign} from '@expo/vector-icons';
import {yupResolver} from '@hookform/resolvers/yup';
import {useBackHandler} from '@react-native-community/hooks';
import {useNavigation} from '@react-navigation/native';
import {Button} from 'components/content/Button';
import {CollapsibleCard} from 'components/content/Card';
import {HStack, View, VStack} from 'components/core';
import {Conditional} from 'components/form/Conditional';
import {DateField} from 'components/form/DateField';
import {LocationField} from 'components/form/LocationField';
import {SelectField} from 'components/form/SelectField';
import {SwitchField} from 'components/form/SwitchField';
import {TextField} from 'components/form/TextField';
import {createObservation, observationSchema} from 'components/observations/ObservationSchema';
import {Body, BodySemibold, Title3Black, Title3Semibold} from 'components/text';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {uniq} from 'lodash';
import React, {useCallback} from 'react';
import {FormProvider, useForm} from 'react-hook-form';
import {Keyboard, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ObservationsStackNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

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

  const onCloseHandler = useCallback(() => {
    formContext.reset();
    onClose ? onClose() : navigation.goBack();
  }, [formContext, navigation, onClose]);

  useBackHandler(() => {
    onCloseHandler();
    // Returning true marks the event as processed
    return true;
  });

  const formFieldSpacing = 16;

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
                    onPress={onCloseHandler}
                  />
                  <Title3Black>Submit an observation</Title3Black>
                </HStack>
              </TouchableWithoutFeedback>
              <ScrollView style={{height: '100%', width: '100%', backgroundColor: 'white'}}>
                <VStack width="100%" justifyContent="flex-start" alignItems="stretch" pt={8} pb={8}>
                  <View px={16} pb={formFieldSpacing}>
                    <Body>Help keep the {center_id} community informed by submitting your observation.</Body>
                  </View>
                  <CollapsibleCard borderRadius={0} borderColor="white" startsCollapsed={false} header={<Title3Semibold>Privacy</Title3Semibold>}>
                    <VStack space={formFieldSpacing}>
                      <SwitchField name="visibility" label="Observation visibility" items={['Public', 'Private']} />
                      <SelectField
                        name="photoUsage"
                        label="Photo usage"
                        radio
                        items={[
                          {value: 'anonymous', label: 'Use anonymously'},
                          {value: 'credit', label: 'Use with photo credit'},
                          {value: 'private', label: "Don't use"},
                        ]}
                      />
                    </VStack>
                  </CollapsibleCard>
                  <CollapsibleCard borderRadius={0} borderColor="white" startsCollapsed={false} header={<Title3Semibold>General information</Title3Semibold>}>
                    <VStack space={formFieldSpacing}>
                      <TextField name="name" label="Name" textInputProps={{placeholder: 'Jane Doe', textContentType: 'name'}} />
                      <TextField
                        name="email"
                        label="Email address"
                        textInputProps={{
                          placeholder: 'you@domain.com',
                          textContentType: 'emailAddress',
                          keyboardType: 'email-address',
                          autoCapitalize: 'none',
                          autoCorrect: false,
                        }}
                      />
                      <DateField name="observationDate" label="Observation date" />
                      <SelectField name="zone" label="Zone/Region" prompt="Select a zone or region" items={zones} />
                      <SelectField
                        name="activity"
                        label="Activity"
                        prompt="What were you doing?"
                        items={[
                          {
                            label: 'Skiing/Snowboarding',
                            value: 'skiing_snowboarding',
                          },
                          {
                            label: 'Snowmobiling/Snowbiking',
                            value: 'snowmobiling_snowbiking',
                          },
                          {
                            label: 'XC Skiing/Snowshoeing',
                            value: 'xcskiing_snowshoeing',
                          },
                          {
                            label: 'Climbing',
                            value: 'climbing',
                          },
                          {
                            label: 'Walking/Hiking',
                            value: 'walking',
                          },
                          {
                            label: 'Driving',
                            value: 'driving',
                          },
                          {
                            label: 'Other',
                            value: 'other',
                          },
                        ]}
                      />
                      <TextField
                        name="location"
                        label="Location"
                        textInputProps={{
                          placeholder: 'Please describe your observation location using common geographical place names (drainages, peak names, etc).',
                          multiline: true,
                        }}
                      />
                      <LocationField name="mapLocation" label="Latitude/Longitude" />
                      <TextField
                        name="route"
                        label="Route"
                        textInputProps={{
                          placeholder: 'Enter details of route taken, including aspects and elevations observed.',
                          multiline: true,
                        }}
                      />
                    </VStack>
                  </CollapsibleCard>
                  <CollapsibleCard borderRadius={0} borderColor="white" startsCollapsed header={<Title3Semibold>Signs of instability</Title3Semibold>}>
                    <VStack>
                      <SwitchField name="recent" label="Did you see recent avalanches?" items={['No', 'Yes']} pb={formFieldSpacing} />
                      <Conditional name="recent" value="Yes">
                        <VStack>
                          <View pb={formFieldSpacing}>
                            <Body fontStyle="italic">Please provide more detail in the Avalanches section below.</Body>
                          </View>
                          <SwitchField name="trigger" label="Did you trigger an avalanche?" items={['No', 'Yes']} pb={formFieldSpacing} />
                          <Conditional name="trigger" value="Yes">
                            <SwitchField name="caught" label="Were you caught?" items={['No', 'Yes']} pb={formFieldSpacing} />
                          </Conditional>
                        </VStack>
                      </Conditional>
                      <SwitchField name="cracking" label="Did you experience snowpack cracking?" items={['No', 'Yes']} pb={formFieldSpacing} />
                      <Conditional name="cracking" value="Yes" space={formFieldSpacing}>
                        <SelectField name="crackingExtent" label="How widespread was the cracking?" items={['Isolated', 'Widespread']} prompt=" " />
                      </Conditional>
                      <SwitchField name="collapsing" label="Did you experience snowpack collapsing?" items={['No', 'Yes']} pb={formFieldSpacing} />
                      <Conditional name="collapsing" value="Yes" space={formFieldSpacing}>
                        <SelectField name="collapsingExtent" label="How widespread was the collapsing?" items={['Isolated', 'Widespread']} prompt=" " />
                      </Conditional>
                      <TextField
                        name="instabilityComments"
                        label="Instability comments"
                        textInputProps={{
                          placeholder: 'Note length and depth of cracking or collapsing, how recent were the observed avalanches, etc.',
                          multiline: true,
                        }}
                        pb={formFieldSpacing}
                      />
                    </VStack>
                  </CollapsibleCard>
                  <Conditional name="recent" value="Yes">
                    <CollapsibleCard borderRadius={0} borderColor="white" startsCollapsed header={<Title3Semibold>Avalanches</Title3Semibold>}>
                      <VStack space={formFieldSpacing}>
                        <Body fontStyle="italic">coming soon</Body>
                      </VStack>
                    </CollapsibleCard>
                  </Conditional>
                  <CollapsibleCard borderRadius={0} borderColor="white" startsCollapsed header={<Title3Semibold>Snowpack</Title3Semibold>}>
                    <VStack space={formFieldSpacing}>
                      <TextField
                        name="snowpackSummary"
                        label="Snowpack summary"
                        textInputProps={{
                          placeholder:
                            'Snowpack tests/location/relevancy/results, layer extent, penetration, etc. You can submit images of your pit or profile in the photos section.',
                          multiline: true,
                        }}
                      />
                    </VStack>
                  </CollapsibleCard>
                  <CollapsibleCard borderRadius={0} borderColor="white" startsCollapsed header={<Title3Semibold>Observation summary</Title3Semibold>}>
                    <VStack space={formFieldSpacing}>
                      <TextField
                        name="observationSummary"
                        label="Observation summary"
                        textInputProps={{
                          placeholder: 'Summarize the avalanche hazard; what are the key points of your observation? What avalanche problems did you observe?',
                          multiline: true,
                        }}
                      />
                    </VStack>
                  </CollapsibleCard>

                  <CollapsibleCard borderRadius={0} borderColor="white" startsCollapsed header={<Title3Semibold>Weather</Title3Semibold>}>
                    <VStack space={formFieldSpacing}>
                      <SelectField name="cloudCover" label="Cloud cover" items={['Clear', 'Few', 'Scattered', 'Broken', 'Overcast', 'Obscured']} />
                      <TextField name="temperature" label="Temperature (F)" textInputProps={{autoComplete: 'off', autoCorrect: false, keyboardType: 'decimal-pad'}} />
                      <TextField
                        name="newRecentSnowfall"
                        label="New/recent snowfall"
                        textInputProps={{
                          placeholder: 'Include new snow in the past 24 hours and/or recent storm totals.',
                        }}
                      />
                      <TextField
                        name="rainLineElevation"
                        label="Rain line elevation"
                        textInputProps={{
                          placeholder: 'To what elevation did it rain?',
                        }}
                      />
                      {/* TODO: make sure these values get lowercased when written */}
                      <SelectField
                        name="saft"
                        label="SAFT (snow available for transport)"
                        items={[
                          {
                            label: 'None',
                            value: 'none',
                          },
                          {
                            label: 'Small Amounts',
                            // TODO: opened https://github.com/NationalAvalancheCenter/nac-vue-component-library/pull/16
                            // to track fixing this typo
                            value: 'small smounts',
                          },
                          {
                            label: 'Moderate Amounts',
                            value: 'moderate amounts',
                          },
                          {
                            label: 'Large Amounts',
                            value: 'large amounts',
                          },
                        ]}
                      />
                      <SelectField
                        name="loading"
                        label="Wind Loading"
                        items={[
                          {
                            label: 'None',
                            value: 'none',
                          },
                          {
                            label: 'Light',
                            value: 'light',
                          },
                          {
                            label: 'Moderate',
                            value: 'moderate',
                          },
                          {
                            label: 'Intense',
                            value: 'intense',
                          },
                          {
                            label: 'Previous',
                            value: 'previous',
                          },
                          {
                            label: 'Unknown',
                            value: 'unknown',
                          },
                        ]}
                      />
                      <TextField
                        name="weatherSummary"
                        label="Weather summary"
                        textInputProps={{
                          placeholder: 'Include factors such as weather trends, wind speed and direction, precip type and rate. Elaborate on above weather observations if needed.',
                          multiline: true,
                        }}
                      />
                    </VStack>
                  </CollapsibleCard>

                  <CollapsibleCard borderRadius={0} borderColor="white" startsCollapsed header={<Title3Semibold>Photos</Title3Semibold>}>
                    <VStack space={formFieldSpacing}>
                      <Body fontStyle="italic">coming soon</Body>
                    </VStack>
                  </CollapsibleCard>

                  <Button
                    mx={16}
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

import {AntDesign} from '@expo/vector-icons';
import {yupResolver} from '@hookform/resolvers/yup';
import {useBackHandler} from '@react-native-community/hooks';
import {useNavigation} from '@react-navigation/native';
import {Button} from 'components/content/Button';
import {Card} from 'components/content/Card';
import {ImageList} from 'components/content/carousel/ImageList';
import {HStack, View, VStack} from 'components/core';
import {Conditional} from 'components/form/Conditional';
import {DateField} from 'components/form/DateField';
import {LocationField} from 'components/form/LocationField';
import {SelectField} from 'components/form/SelectField';
import {SwitchField} from 'components/form/SwitchField';
import {TextField} from 'components/form/TextField';
import {createObservation, observationSchema} from 'components/observations/ObservationSchema';
import {Body, BodySemibold, Title3Black, Title3Semibold} from 'components/text';
import * as ImagePicker from 'expo-image-picker';
import {useAvalancheCenterMetadata} from 'hooks/useAvalancheCenterMetadata';
import {uniq} from 'lodash';
import React, {useCallback, useRef, useState} from 'react';
import {FormProvider, useForm} from 'react-hook-form';
import {Keyboard, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, View as RNView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ObservationsStackNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID, MediaItem, MediaType} from 'types/nationalAvalancheCenter';

export const SimpleForm: React.FC<{
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

  const fieldRefs = useRef<{ref: RNView; field: string}[]>([]);
  const scrollViewRef = useRef(null);

  const onSubmitHandler = data => {
    console.log('onSubmitHandler -> success', {data});
  };
  const onSubmitErrorHandler = errors => {
    // scroll to the first field with an error
    fieldRefs.current.some(({ref, field}) => {
      if (errors[field]) {
        ref.measureLayout(
          scrollViewRef.current,
          (_left, top) => {
            scrollViewRef.current.scrollTo({y: top});
          },
          () => undefined,
        );
        return true;
      }
      return false;
    });
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

  const maxImageCount = 8;
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      aspect: [4, 3],
      quality: 1,
      orderedSelection: true,
      selectionLimit: maxImageCount,
    });

    if (!result.canceled) {
      const newImages = images.concat(result.assets).slice(0, maxImageCount);
      setImages(newImages);
    }
  };

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
              <ScrollView style={{height: '100%', width: '100%', backgroundColor: 'white'}} ref={scrollViewRef}>
                <VStack width="100%" justifyContent="flex-start" alignItems="stretch" pt={8} pb={8}>
                  <View px={16} pb={formFieldSpacing}>
                    <Body>Help keep the {center_id} community informed by submitting your observation.</Body>
                  </View>
                  <Card borderRadius={0} borderColor="white" header={<Title3Semibold>Privacy</Title3Semibold>}>
                    <VStack space={formFieldSpacing} mt={8}>
                      <SwitchField name="private" label="Observation visibility" items={['Public', 'Private']} />
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
                  </Card>
                  <Card borderRadius={0} borderColor="white" header={<Title3Semibold>General information</Title3Semibold>}>
                    <VStack space={formFieldSpacing} mt={8}>
                      <TextField
                        name="name"
                        label="Name"
                        textInputProps={{placeholder: 'Jane Doe', textContentType: 'name'}}
                        ref={element => {
                          fieldRefs.current.push({field: 'name', ref: element});
                        }}
                      />
                      <TextField
                        name="email"
                        label="Email address"
                        ref={element => {
                          fieldRefs.current.push({field: 'email', ref: element});
                        }}
                        textInputProps={{
                          placeholder: 'you@domain.com',
                          textContentType: 'emailAddress',
                          keyboardType: 'email-address',
                          autoCapitalize: 'none',
                          autoCorrect: false,
                        }}
                      />
                      <DateField name="start_date" label="Observation date" />
                      <SelectField
                        name="zone"
                        label="Zone/Region"
                        prompt="Select a zone or region"
                        items={zones}
                        ref={element => {
                          fieldRefs.current.push({field: 'zone', ref: element});
                        }}
                      />
                      <SelectField
                        name="activity"
                        label="Activity"
                        prompt="What were you doing?"
                        ref={element => {
                          fieldRefs.current.push({field: 'activity', ref: element});
                        }}
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
                        ref={element => {
                          fieldRefs.current.push({field: 'location', ref: element});
                        }}
                        textInputProps={{
                          placeholder: 'Please describe your observation location using common geographical place names (drainages, peak names, etc).',
                          multiline: true,
                        }}
                      />
                      <LocationField name="location_point" label="Latitude/Longitude" />
                    </VStack>
                  </Card>
                  <Card borderRadius={0} borderColor="white" header={<Title3Semibold>Signs of instability</Title3Semibold>}>
                    <VStack mt={8}>
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
                    </VStack>
                  </Card>
                  <Conditional name="recent" value="Yes">
                    <Card borderRadius={0} borderColor="white" header={<Title3Semibold>Avalanches</Title3Semibold>}>
                      <VStack space={formFieldSpacing} mt={8}>
                        <TextField
                          name="avalanches_summary"
                          label="Observed avalanches"
                          ref={element => {
                            fieldRefs.current.push({field: 'avalanches_summary', ref: element});
                          }}
                          textInputProps={{
                            placeholder: `• Location, aspect, and elevation
• How recently did it occur?
• Natural or triggered?
• Was anyone caught?
• Avalanche size, width, and depth`,
                            multiline: true,
                          }}
                          pb={formFieldSpacing}
                        />
                      </VStack>
                    </Card>
                  </Conditional>
                  <Card borderRadius={0} borderColor="white" header={<Title3Semibold>Field Notes</Title3Semibold>}>
                    <VStack space={formFieldSpacing} mt={8}>
                      <TextField
                        name="observation_summary"
                        label="What did you observe?"
                        ref={element => {
                          fieldRefs.current.push({field: 'observation_summary', ref: element});
                        }}
                        textInputProps={{
                          placeholder: `• Signs of instability
• Snowpack test results
• How cautiously or aggressively did you travel?
• Weather observations
• Overall impression of stability`,
                          multiline: true,
                        }}
                      />
                    </VStack>
                  </Card>
                  <Card borderRadius={0} borderColor="white" header={<Title3Semibold>Photos</Title3Semibold>}>
                    <VStack space={formFieldSpacing} mt={8}>
                      <Body>You can add up to {maxImageCount} images.</Body>
                      {images.length > 0 && (
                        <ImageList
                          imageWidth={(4 * 140) / 3}
                          imageHeight={140}
                          media={images.map((i): MediaItem => ({url: {original: i.uri}, type: MediaType.Image, caption: ''}))}
                          displayCaptions={false}
                          imageSize="original"
                          renderOverlay={index => (
                            <View position="absolute" top={8} right={8}>
                              <AntDesign.Button
                                size={16}
                                name="close"
                                color="white"
                                backgroundColor="rgba(0, 0, 0, 0.3)"
                                iconStyle={{marginRight: 0}}
                                style={{textAlign: 'center'}}
                                onPress={() => {
                                  setImages(images.filter((_v, i) => i !== index));
                                }}
                              />
                            </View>
                          )}
                        />
                      )}
                      <Button buttonStyle="normal" onPress={pickImage} disabled={images.length === maxImageCount}>
                        <BodySemibold>Select an image</BodySemibold>
                      </Button>
                    </VStack>
                  </Card>

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

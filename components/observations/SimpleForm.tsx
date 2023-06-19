import {AntDesign} from '@expo/vector-icons';
import {zodResolver} from '@hookform/resolvers/zod';
import {useBackHandler} from '@react-native-community/hooks';
import {useNavigation} from '@react-navigation/native';
import {useMutation} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import * as ImagePicker from 'expo-image-picker';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {FieldErrors, FormProvider, useForm, useWatch} from 'react-hook-form';
import {ActivityIndicator, findNodeHandle, KeyboardAvoidingView, Platform, ScrollView, View as RNView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {ClientContext, ClientProps} from 'clientContext';
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
import {defaultObservationFormData, ObservationFormData, simpleObservationFormSchema} from 'components/observations/ObservationFormData';
import {submitObservation} from 'components/observations/submitObservation';
import {Body, BodyBlack, BodySemibold, Title3Semibold} from 'components/text';
import {LoggerContext, LoggerProps} from 'loggerContext';
import Toast from 'react-native-toast-message';
import {ObservationsStackNavigationProps} from 'routes';
import {colorLookup} from 'theme';
import {AvalancheCenterID, ImageMediaItem, InstabilityDistribution, MediaType, Observation} from 'types/nationalAvalancheCenter';

export const SimpleForm: React.FC<{
  center_id: AvalancheCenterID;
  onClose?: () => void;
}> = ({center_id, onClose}) => {
  const navigation = useNavigation<ObservationsStackNavigationProps>();
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const formContext = useForm({
    defaultValues: defaultObservationFormData(),
    resolver: zodResolver(simpleObservationFormSchema),
    mode: 'onBlur',
    shouldFocusError: false,
    shouldUnregister: true,
  });

  // When collapsing/cracking are toggled off, make sure the dependent fields are also cleared
  const collapsing = useWatch({control: formContext.control, name: 'instability.collapsing'});
  useEffect(() => {
    if (!collapsing) {
      formContext.setValue('instability.collapsing_description', undefined);
    }
  }, [collapsing, formContext]);
  const cracking = useWatch({control: formContext.control, name: 'instability.cracking'});
  useEffect(() => {
    if (!cracking) {
      formContext.setValue('instability.cracking_description', undefined);
    }
  }, [cracking, formContext]);

  const fieldRefs = useRef<{ref: RNView; field: keyof ObservationFormData}[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const {nationalAvalancheCenterHost} = React.useContext<ClientProps>(ClientContext);

  const mutation = useMutation<Observation, AxiosError, Partial<ObservationFormData>>({
    mutationFn: async (observationFormData: Partial<ObservationFormData>) => {
      logger.info({formValues: observationFormData}, 'submitting observation');
      return submitObservation(logger, {center_id, apiPrefix: nationalAvalancheCenterHost, observationFormData});
    },
    onMutate: () => {
      Toast.show({
        type: 'info',
        text1: 'Uploading your observation...',
        position: 'bottom',
      });
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Your observation was received!',
        position: 'bottom',
      });
    },
    onError: error => {
      Toast.show({
        type: 'error',
        text1: 'There was an error uploading your observation',
        position: 'bottom',
      });
      logger.error({error: error}, 'mutation failed');
    },
    retry: true,
  });

  const onSubmitHandler = (data: Partial<ObservationFormData>) => {
    // Submit button turns into a cancel button
    if (mutation.isLoading) {
      mutation.reset();
      return;
    }
    data.images = images;
    mutation.mutate(data);
  };

  const onSubmitErrorHandler = (errors: FieldErrors<Partial<ObservationFormData>>) => {
    logger.error({errors: errors, formValues: formContext.getValues()}, 'submit error');
    // scroll to the first field with an error
    fieldRefs.current.some(({ref, field}) => {
      if (errors[field] && scrollViewRef.current) {
        const handle = findNodeHandle(scrollViewRef.current);
        if (handle) {
          ref.measureLayout(
            handle,
            (_left, top) => {
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({y: top});
              }
            },
            () => undefined,
          );
          return true;
        }
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
      exif: true,
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
        {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there, or top edge since StackHeader is sitting there */}
        <SafeAreaView edges={['left', 'right']} style={{height: '100%', width: '100%'}}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1, height: '100%'}}>
            <VStack style={{height: '100%', width: '100%'}} alignItems="stretch" bg="#F6F8FC">
              <ScrollView style={{height: '100%', width: '100%', backgroundColor: 'white'}} ref={scrollViewRef}>
                <VStack width="100%" justifyContent="flex-start" alignItems="stretch" pt={8} pb={8}>
                  <View px={16} pb={formFieldSpacing}>
                    <Body>Help keep the {center_id} community informed by submitting your observation.</Body>
                  </View>
                  <Card borderRadius={0} borderColor="white" header={<Title3Semibold>Privacy</Title3Semibold>}>
                    <VStack space={formFieldSpacing} mt={8}>
                      <SwitchField
                        name="private"
                        label="Observation visibility"
                        items={[
                          {label: 'Public', value: false},
                          {label: 'Private', value: true},
                        ]}
                      />
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
                          if (element) {
                            fieldRefs.current.push({field: 'name', ref: element});
                          }
                        }}
                      />
                      <TextField
                        name="email"
                        label="Email address"
                        ref={element => {
                          if (element) {
                            fieldRefs.current.push({field: 'email', ref: element});
                          }
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
                        name="activity"
                        label="Activity"
                        prompt="What were you doing?"
                        ref={element => {
                          if (element) {
                            fieldRefs.current.push({field: 'activity', ref: element});
                          }
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
                        name="location_name"
                        label="Location"
                        ref={element => {
                          if (element) {
                            fieldRefs.current.push({field: 'location_name', ref: element});
                          }
                        }}
                        textInputProps={{
                          placeholder: 'Please describe your observation location using common geographical place names (drainages, peak names, etc).',
                          multiline: true,
                        }}
                      />
                      <LocationField
                        name="location_point"
                        label="Latitude/Longitude"
                        center={center_id}
                        ref={element => {
                          if (element) {
                            fieldRefs.current.push({field: 'location_point', ref: element});
                          }
                        }}
                      />
                    </VStack>
                  </Card>
                  <Card borderRadius={0} borderColor="white" header={<Title3Semibold>Signs of instability</Title3Semibold>}>
                    <VStack mt={8}>
                      <SwitchField
                        name="instability.avalanches_observed"
                        label="Did you see recent avalanches?"
                        items={[
                          {label: 'No', value: false},
                          {label: 'Yes', value: true},
                        ]}
                        pb={formFieldSpacing}
                      />
                      <Conditional name="instability.avalanches_observed" value={true}>
                        <VStack>
                          <View pb={formFieldSpacing}>
                            <Body fontStyle="italic">Please provide more detail in the Avalanches section below.</Body>
                          </View>
                          <SwitchField
                            name="instability.avalanches_triggered"
                            label="Did you trigger an avalanche?"
                            items={[
                              {label: 'No', value: false},
                              {label: 'Yes', value: true},
                            ]}
                            pb={formFieldSpacing}
                          />
                          <Conditional name="instability.avalanches_triggered" value={true}>
                            <SwitchField
                              name="instability.avalanches_caught"
                              label="Were you caught?"
                              items={[
                                {label: 'No', value: false},
                                {label: 'Yes', value: true},
                              ]}
                              pb={formFieldSpacing}
                            />
                          </Conditional>
                        </VStack>
                      </Conditional>
                      <SwitchField
                        name="instability.cracking"
                        label="Did you experience snowpack cracking?"
                        items={[
                          {label: 'No', value: false},
                          {label: 'Yes', value: true},
                        ]}
                        pb={formFieldSpacing}
                      />
                      <Conditional name="instability.cracking" value={true} space={formFieldSpacing}>
                        <SelectField
                          name="instability.cracking_description"
                          label="How widespread was the cracking?"
                          items={[
                            {value: InstabilityDistribution.Isolated, label: 'Isolated'},
                            {value: InstabilityDistribution.Widespread, label: 'Widespread'},
                          ]}
                          prompt=" "
                        />
                      </Conditional>
                      <SwitchField
                        name="instability.collapsing"
                        label="Did you experience snowpack collapsing?"
                        items={[
                          {label: 'No', value: false},
                          {label: 'Yes', value: true},
                        ]}
                        pb={formFieldSpacing}
                      />
                      <Conditional name="instability.collapsing" value={true} space={formFieldSpacing}>
                        <SelectField
                          name="instability.collapsing_description"
                          label="How widespread was the collapsing?"
                          items={[
                            {value: InstabilityDistribution.Isolated, label: 'Isolated'},
                            {value: InstabilityDistribution.Widespread, label: 'Widespread'},
                          ]}
                          prompt=" "
                        />
                      </Conditional>
                    </VStack>
                  </Card>
                  <Conditional name="instability.avalanches_observed" value={true}>
                    <Card borderRadius={0} borderColor="white" header={<Title3Semibold>Avalanches</Title3Semibold>}>
                      <VStack space={formFieldSpacing} mt={8}>
                        <TextField
                          name="avalanches_summary"
                          label="Observed avalanches"
                          ref={element => {
                            if (element) {
                              fieldRefs.current.push({field: 'avalanches_summary', ref: element});
                            }
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
                          if (element) {
                            fieldRefs.current.push({field: 'observation_summary', ref: element});
                          }
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
                          media={images.map((i): ImageMediaItem => ({url: {original: i.uri, large: '', medium: '', thumbnail: ''}, type: MediaType.Image, caption: ''}))}
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
                      <Button buttonStyle="normal" onPress={void pickImage} disabled={images.length === maxImageCount}>
                        <BodyBlack>Select an image</BodyBlack>
                      </Button>
                    </VStack>
                  </Card>

                  <Button
                    mx={16}
                    mt={16}
                    buttonStyle="primary"
                    disabled={mutation.isSuccess}
                    onPress={
                      void (async () => {
                        // Force validation errors to show up on fields that haven't been visited yet
                        await formContext.trigger();
                        // Then try to submit the form
                        void formContext.handleSubmit(onSubmitHandler, onSubmitErrorHandler)();
                      })()
                    }>
                    {mutation.isLoading && (
                      <HStack space={8} alignItems="center" pt={3}>
                        <ActivityIndicator size="small" />
                        <BodyBlack color={colorLookup('white')}>Cancel submission</BodyBlack>
                      </HStack>
                    )}
                    {!mutation.isLoading && <BodySemibold>Submit your observation</BodySemibold>}
                  </Button>
                  <VStack mx={16} mt={16} mb={32}>
                    {mutation.isSuccess && <Body>Thanks for your observation!</Body>}
                    {mutation.isError && <Body color={colorLookup('error.900')}>There was an error submitting your observation.</Body>}
                  </VStack>
                </VStack>
              </ScrollView>
            </VStack>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </FormProvider>
  );
};

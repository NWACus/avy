import log from 'logger';
import React from 'react';

import {AntDesign} from '@expo/vector-icons';
import {zodResolver} from '@hookform/resolvers/zod';
import {SelectModalProvider} from '@mobile-reality/react-native-select-pro';
import {useBackHandler} from '@react-native-community/hooks';
import {Button} from 'components/content/Button';
import {Card} from 'components/content/Card';
import {HStack, VStack} from 'components/core';
import {Conditional} from 'components/form/Conditional';
import {DateField} from 'components/form/DateField';
import {SelectField} from 'components/form/SelectField';
import {SwitchField} from 'components/form/SwitchField';
import {BodyBlack, BodySemibold, Title3Semibold} from 'components/text';
import {geoContains} from 'd3-geo';
import {getMonth, getYear, isAfter, isBefore, parseISO, sub} from 'date-fns';
import {OverviewFragment} from 'hooks/useObservations';
import {FormProvider, useForm} from 'react-hook-form';
import {KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, TouchableOpacity, View as RNView} from 'react-native';
import {colorLookup} from 'theme';
import {MapLayer, PartnerType} from 'types/nationalAvalancheCenter';
import {z} from 'zod';

const avalancheInstabilitySchema = z.enum(['observed', 'triggered', 'caught']);
type avalancheInstability = z.infer<typeof avalancheInstabilitySchema>;

const observationFilterConfigSchema = z
  .object({
    zone: z.string(),
    dates: z.object({
      value: z.enum(['past_day', 'past_3_days', 'past_week', 'past_month', 'past_season', 'custom']),
      from: z.date(),
      to: z.date(),
    }),
    observerType: z.nativeEnum(PartnerType),
    instability: z.object({
      avalanches: avalancheInstabilitySchema,
      cracking: z.boolean(),
      collapsing: z.boolean(),
    }),
  })
  .deepPartial();
export type ObservationFilterConfig = z.infer<typeof observationFilterConfigSchema>;

const matchesDates = (dates: z.infer<typeof observationFilterConfigSchema.shape.dates>, observation: OverviewFragment): boolean => {
  let matches = true;
  switch (dates.value) {
    case 'past_day':
      dates.to = new Date();
      dates.from = sub(dates.to, {days: 1});
      break;
    case 'past_3_days':
      dates.to = new Date();
      dates.from = sub(dates.to, {days: 3});
      break;
    case 'past_week':
      dates.to = new Date();
      dates.from = sub(dates.to, {weeks: 1});
      break;
    case 'past_month':
      dates.to = new Date();
      dates.from = sub(dates.to, {months: 1});
      break;
    case 'past_season':
      dates.to = new Date();
      // the season starts Nov 1st, that's either this year or last year depending on when we are asking
      if (getMonth(dates.to) <= 11) {
        dates.from = new Date(`${getYear(sub(dates.to, {years: 1}))}-11-01`);
      } else {
        dates.from = new Date(`${getYear(dates.to)}-11-01`);
      }
      break;
    case 'custom':
  }
  if (dates.from) {
    matches = matches && isAfter(parseISO(observation.createdAt), dates.from);
  }
  if (dates.to) {
    matches = matches && isBefore(parseISO(observation.createdAt), dates.to);
  }
  return matches;
};

const matchesInstability = (instability: z.infer<typeof observationFilterConfigSchema.shape.instability>, observation: OverviewFragment): boolean => {
  let matches = false;
  if (instability.avalanches) {
    matches = matches || matchesAvalancheInstability(instability.avalanches, observation);
  }

  if (instability.cracking) {
    matches = matches || observation.instability.cracking;
  }

  if (instability.collapsing) {
    matches = matches || observation.instability.collapsing;
  }

  return matches;
};

const matchesAvalancheInstability = (instability: avalancheInstability, observation: OverviewFragment): boolean => {
  switch (instability) {
    case 'observed':
      return observation.instability?.avalanches_observed;
    case 'triggered':
      return observation.instability?.avalanches_triggered;
    case 'caught':
      return observation.instability?.avalanches_caught;
  }

  const invalid: never = instability;
  throw new Error(`Unknown instability: ${invalid}`);
};

export const filtersForConfig = (mapLayer: MapLayer, config: ObservationFilterConfig): ((OverviewFragment) => boolean)[] => {
  if (!config) {
    return [];
  }

  const filterFuncs: ((OverviewFragment) => boolean)[] = [];
  if (config.zone) {
    filterFuncs.push(observation => config.zone === zone(mapLayer, observation.locationPoint?.lat, observation.locationPoint?.lng));
  }

  if (config.dates && config.dates.value) {
    filterFuncs.push(observation => matchesDates(config.dates, observation));
  }

  if (config.observerType) {
    filterFuncs.push(observation => config.observerType === observation.observerType);
  }

  if (config.instability && (config.instability.avalanches || config.instability.cracking || config.instability.collapsing)) {
    filterFuncs.push(observation => matchesInstability(config.instability, observation));
  }

  return filterFuncs;
};

interface ObservationsFilterFormProps {
  mapLayer: MapLayer;
  initialFilterConfig: ObservationFilterConfig;
  currentFilterConfig: ObservationFilterConfig;
  setFilterConfig: React.Dispatch<React.SetStateAction<ObservationFilterConfig>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const formFieldSpacing = 16;

export const ObservationsFilterForm: React.FunctionComponent<ObservationsFilterFormProps> = ({mapLayer, initialFilterConfig, currentFilterConfig, setFilterConfig, setVisible}) => {
  const formContext = useForm({
    defaultValues: initialFilterConfig,
    resolver: zodResolver(observationFilterConfigSchema),
    mode: 'onBlur',
    shouldFocusError: false,
    shouldUnregister: true,
  });
  React.useEffect(() => {
    formContext.reset(currentFilterConfig);
  }, [formContext, currentFilterConfig]);

  const onCloseHandler = React.useCallback(() => {
    formContext.reset(initialFilterConfig);
    setVisible(false);
  }, [initialFilterConfig, formContext, setVisible]);

  useBackHandler(() => {
    onCloseHandler();
    // Returning true marks the event as processed
    return true;
  });

  const onSubmitHandler = async (data: ObservationFilterConfig) => {
    setFilterConfig(data);
  };

  const fieldRefs = React.useRef<{ref: RNView; field: string}[]>([]);
  const scrollViewRef = React.useRef(null);

  const onSubmitErrorHandler = errors => {
    log.error('filters error', {errors: errors, formValues: formContext.getValues()});
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

  return (
    <FormProvider {...formContext}>
      <SelectModalProvider>
        <SafeAreaView style={{flex: 1, height: '100%'}}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1, height: '100%'}}>
            <ScrollView style={{height: '100%', width: '100%', backgroundColor: 'white'}} ref={scrollViewRef}>
              <VStack space={12} backgroundColor={colorLookup('background.base')} pt={4}>
                <Card
                  borderRadius={0}
                  borderColor="white"
                  header={
                    <HStack justifyContent={'space-between'} alignItems={'center'}>
                      <TouchableOpacity onPress={() => setVisible(false)}>
                        <AntDesign name="close" size={24} color="black" />
                      </TouchableOpacity>
                      <Title3Semibold>Filters</Title3Semibold>
                      <TouchableOpacity onPress={() => formContext.reset(initialFilterConfig)}>
                        <BodyBlack color={colorLookup('blue2')}>Reset</BodyBlack>
                      </TouchableOpacity>
                    </HStack>
                  }>
                  <VStack space={formFieldSpacing} mt={8}>
                    <SelectField name="zone" label="Zone" radio items={mapLayer.features.map(feature => feature.properties.name)} disabled={Boolean(initialFilterConfig.zone)} />
                    <SelectField
                      name="dates.value"
                      label="Dates"
                      radio
                      items={[
                        {value: 'past_day', label: 'Past Day'},
                        {value: 'past_3_days', label: 'Past 3 Days'},
                        {value: 'past_week', label: 'Past Week'},
                        {value: 'past_month', label: 'Past Month'},
                        {value: 'custom', label: 'Custom Range'},
                      ]}
                    />
                    <Conditional name="dates.value" value={'custom'}>
                      <DateField name="dates.from" label="Published After" />
                      <DateField name="dates.to" label="Published Before" />
                    </Conditional>
                    <SelectField name="observerType" label="Observer Type" radio items={Object.keys(PartnerType).map(label => ({value: PartnerType[label], label: label}))} />
                    <SelectField
                      name="instability.avalanches"
                      label="Avalanches"
                      radio
                      items={[
                        {value: 'observed', label: 'Observed'},
                        {value: 'triggered', label: 'Triggered'},
                        {value: 'caught', label: 'Caught'},
                      ]}
                    />
                    <SwitchField
                      name="instability.cracking"
                      label="Snowpack Cracking"
                      items={[
                        {label: 'No', value: false},
                        {label: 'Yes', value: true},
                      ]}
                      pb={formFieldSpacing}
                    />
                    <SwitchField
                      name="instability.collapsing"
                      label="Snowpack Collapsing"
                      items={[
                        {label: 'No', value: false},
                        {label: 'Yes', value: true},
                      ]}
                      pb={formFieldSpacing}
                    />
                  </VStack>
                </Card>
              </VStack>
            </ScrollView>
            <Button
              mx={16}
              mt={16}
              buttonStyle="primary"
              onPress={async () => {
                // Force validation errors to show up on fields that haven't been visited yet
                await formContext.trigger();
                // Then try to submit the form
                await formContext.handleSubmit(onSubmitHandler, onSubmitErrorHandler)();
                // Finally, close the modal
                setVisible(false);
              }}>
              <BodySemibold>Apply Filters</BodySemibold>
            </Button>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SelectModalProvider>
    </FormProvider>
  );
};

export const zone = (mapLayer: MapLayer, lat: number, long: number): string => {
  const matchingFeatures = mapLayer.features.filter(feature => geoContains(feature.geometry, [long, lat])).map(feature => feature.properties.name);
  if (matchingFeatures.length === 0) {
    return 'Not in any Forecast Zone';
  } else if (matchingFeatures.length > 1) {
    // TODO: this happens almost 100% ... why?
    // also, seems like the widget is naming things with more specificity than just the forecast zones? e.g. teton village
    log.info(`(${long},${lat}) matched ${matchingFeatures.length} features: ${matchingFeatures}`);
  }
  return matchingFeatures[0];
};
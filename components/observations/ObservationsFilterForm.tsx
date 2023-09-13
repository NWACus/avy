import React from 'react';

import {startCase} from 'lodash';

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
import {LoggerContext, LoggerProps} from 'loggerContext';
import {FieldErrors, FormProvider, useForm} from 'react-hook-form';
import {findNodeHandle, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, TouchableOpacity, View as RNView} from 'react-native';
import {colorLookup} from 'theme';
import {MapLayer, ObservationFragment, PartnerType} from 'types/nationalAvalancheCenter';
import {z} from 'zod';

const avalancheInstabilitySchema = z.enum(['observed', 'triggered', 'caught']);
type avalancheInstability = z.infer<typeof avalancheInstabilitySchema>;

const dateValueSchema = z.enum(['past_day', 'past_3_days', 'past_week', 'past_month', 'past_season', 'custom']);
type DateValue = z.infer<typeof dateValueSchema>;

const observationFilterConfigSchema = z
  .object({
    zone: z.string(),
    dates: z.object({
      value: dateValueSchema,
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

type FilterFunction = (observation: ObservationFragment) => boolean;

const DATE_LABELS: Record<DateValue, string> = {
  past_day: 'Last 24 hours',
  past_3_days: 'Last 72 hours',
  past_week: 'Last 7 days',
  past_month: 'Last month',
  past_season: 'Last forecast season',
  custom: 'Custom range',
};

export const dateLabelForFilterConfig = (dates: z.infer<typeof observationFilterConfigSchema.shape.dates>): string => {
  const value = dates?.value || 'past_week';
  switch (value) {
    case 'past_day':
    case 'past_3_days':
    case 'past_week':
    case 'past_month':
    case 'past_season':
      return DATE_LABELS[value];
    case 'custom':
      if (!dates?.from || !dates?.to) {
        throw new Error('custom date range requires from and to dates');
      }
      return `${dates.from.toDateString()} - ${dates.to.toDateString()}`;
  }
};

export const datesForFilterConfig = (dates: z.infer<typeof observationFilterConfigSchema.shape.dates>, currentDate: Date): {startDate: Date; endDate: Date} => {
  const value = dates?.value || 'past_week';
  switch (value) {
    case 'past_day':
      return {startDate: sub(currentDate, {days: 1}), endDate: currentDate};
    case 'past_3_days':
      return {startDate: sub(currentDate, {days: 3}), endDate: currentDate};
    case 'past_week':
      return {startDate: sub(currentDate, {weeks: 1}), endDate: currentDate};
    case 'past_month':
      return {startDate: sub(currentDate, {months: 1}), endDate: currentDate};
    case 'past_season':
      return {
        endDate: currentDate,
        // the season starts Nov 1st, that's either this year or last year depending on when we are asking
        startDate: getMonth(currentDate) <= 11 ? new Date(`${getYear(sub(currentDate, {years: 1}))}-11-01`) : new Date(`${getYear(currentDate)}-11-01`),
      };
    case 'custom':
      // TODO we should validate that these values don't span more than a month, for the same reason as above
      if (!dates?.from || !dates?.to) {
        throw new Error('custom date range requires from and to dates');
      }
      return {startDate: dates.from, endDate: dates.to};
  }
};

const matchesDates = (currentDate: Date, dates: z.infer<typeof observationFilterConfigSchema.shape.dates>): FilterFunction => {
  if (!dates) {
    return () => true;
  }
  const {startDate, endDate} = datesForFilterConfig(dates, currentDate);
  return (observation: ObservationFragment) => isAfter(parseISO(observation.createdAt), startDate) && isBefore(parseISO(observation.createdAt), endDate);
};

const matchesInstability = (instability: z.infer<typeof observationFilterConfigSchema.shape.instability>, observation: ObservationFragment): boolean => {
  let matches = false;
  if (!instability) {
    return matches;
  }
  if (instability.avalanches) {
    matches = matches || matchesAvalancheInstability(instability.avalanches, observation);
  }

  if (instability.cracking) {
    matches = matches || (observation.instability.cracking ?? false);
  }

  if (instability.collapsing) {
    matches = matches || (observation.instability.collapsing ?? false);
  }

  return matches;
};

const matchesAvalancheInstability = (instability: avalancheInstability, observation: ObservationFragment): boolean => {
  switch (instability) {
    case 'observed':
      return observation.instability?.avalanches_observed ?? false;
    case 'triggered':
      return observation.instability?.avalanches_triggered ?? false;
    case 'caught':
      return observation.instability?.avalanches_caught ?? false;
  }

  const invalid: never = instability;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unknown instability: ${invalid}`);
};

interface FilterListItem {
  filter: FilterFunction;
  label: string;
  removeFilter?: (config: ObservationFilterConfig) => ObservationFilterConfig;
}
export const filtersForConfig = (
  mapLayer: MapLayer,
  config: ObservationFilterConfig,
  initialFilterConfig: ObservationFilterConfig | undefined,
  currentDate: Date,
): FilterListItem[] => {
  if (!config) {
    return [];
  }

  const filterFuncs: FilterListItem[] = [];
  if (config.dates && config.dates.value) {
    filterFuncs.push({filter: matchesDates(currentDate, config.dates), label: dateLabelForFilterConfig(config.dates)});
  }

  if (config.zone) {
    filterFuncs.push({
      filter: observation => config.zone === matchesZone(mapLayer, observation.locationPoint?.lat, observation.locationPoint?.lng),
      label: config.zone,
      // If the zone was specified as part of the initialFilterConfig (i.e. we're browsing the Obs tab of a particular zone),
      // then removeFilter should be undefined
      removeFilter: initialFilterConfig?.zone ? undefined : config => ({...config, zone: undefined}),
    });
  }

  if (config.observerType) {
    filterFuncs.push({
      filter: observation => config.observerType === observation.observerType,
      label: startCase(config.observerType),
      removeFilter: config => ({...config, observerType: undefined}),
    });
  }

  if (config.instability && (config.instability.avalanches || config.instability.cracking || config.instability.collapsing)) {
    const labelStrings: string[] = [];
    if (config.instability.avalanches) {
      labelStrings.push(`avalanches ${config.instability.avalanches}`);
    }
    if (config.instability.cracking) {
      labelStrings.push('cracking');
    }
    if (config.instability.collapsing) {
      labelStrings.push('collapsing');
    }

    filterFuncs.push({
      filter: observation => matchesInstability(config.instability, observation),
      label: labelStrings.map(startCase).join(', '),
      removeFilter: config => ({...config, instability: undefined}),
    });
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
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
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

  const onSubmitHandler = (data: ObservationFilterConfig) => {
    setFilterConfig(data);
  };

  const fieldRefs = React.useRef<{ref: RNView; field: keyof ObservationFilterConfig}[]>([]);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const onSubmitErrorHandler = (errors: FieldErrors<ObservationFilterConfig>) => {
    logger.error({errors: errors, formValues: formContext.getValues()}, 'filters error');
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
                      items={(['past_day', 'past_3_days', 'past_week', 'past_month', 'custom'] as const).map(val => ({value: val, label: DATE_LABELS[val]}))}
                    />
                    <Conditional name="dates.value" value={'custom'}>
                      <DateField name="dates.from" label="Published After" />
                      <DateField name="dates.to" label="Published Before" />
                    </Conditional>
                    <SelectField
                      name="observerType"
                      label="Observer Type"
                      radio
                      items={[
                        {value: PartnerType.Forecaster, label: 'Forecaster'},
                        {value: PartnerType.Intern, label: 'Intern'},
                        {value: PartnerType.Professional, label: 'Professional'},
                        {value: PartnerType.Volunteer, label: 'Volunteer'},
                        {value: PartnerType.Public, label: 'Public'},
                        {value: PartnerType.Other, label: 'Other'},
                      ]}
                    />
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
              onPress={() =>
                void (async () => {
                  // Force validation errors to show up on fields that haven't been visited yet
                  await formContext.trigger();
                  // Then try to submit the form
                  await formContext.handleSubmit(onSubmitHandler, onSubmitErrorHandler)();
                  // Finally, close the modal
                  setVisible(false);
                })()
              }>
              <BodySemibold>Apply Filters</BodySemibold>
            </Button>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SelectModalProvider>
    </FormProvider>
  );
};

export const matchesZone = (mapLayer: MapLayer, lat: number | null | undefined, long: number | null | undefined): string => {
  if (!lat || !long) {
    return 'Not in any Forecast Zone';
  }
  const matchingFeatures = mapLayer.features.filter(feature => geoContains(feature.geometry, [long, lat])).map(feature => feature.properties.name);
  if (matchingFeatures.length === 0) {
    return 'Not in any Forecast Zone';
  } else if (matchingFeatures.length > 1) {
    // TODO: this happens almost 100% ... why?
    // also, seems like the widget is naming things with more specificity than just the forecast zones? e.g. teton village
    // log.info(`(${long},${lat}) matched ${matchingFeatures.length} features: ${matchingFeatures}`);
  }
  return matchingFeatures[0];
};

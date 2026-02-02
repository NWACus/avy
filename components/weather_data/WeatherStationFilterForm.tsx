import React, {useCallback} from 'react';

import {AntDesign} from '@expo/vector-icons';
import {zodResolver} from '@hookform/resolvers/zod';
import {SelectModalProvider} from '@mobile-reality/react-native-select-pro';
import {useBackHandler} from '@react-native-community/hooks';
import {useFocusEffect} from '@react-navigation/native';
import {Button} from 'components/content/Button';
import {Card} from 'components/content/Card';
import {HStack, VStack} from 'components/core';
import {SelectField} from 'components/form/SelectField';
import {matchesZone} from 'components/observations/ObservationsFilterForm';
import {BodyBlack, BodySemibold, Title3Semibold} from 'components/text';
import {isAfter, isBefore, parseISO, sub} from 'date-fns';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {usePostHog} from 'posthog-react-native';
import {FieldErrors, FormProvider, Resolver, useForm} from 'react-hook-form';
import {KeyboardAvoidingView, Platform, View as RNView, SafeAreaView, ScrollView, TouchableOpacity, findNodeHandle} from 'react-native';
import {colorLookup} from 'theme';
import {MapLayer, WeatherStation, WeatherStationSource, WeatherStationTimeseriesEntry} from 'types/nationalAvalancheCenter';
import {z} from 'zod';

const dateValueSchema = z.enum(['past_hour', 'past_3_hours', 'past_12_hours', 'past_day']);
type DateValue = z.infer<typeof dateValueSchema>;

const weatherStationFilterConfigSchema = z
  .object({
    zone: z.string(),
    source: z.nativeEnum(WeatherStationSource),
    recency: dateValueSchema,
  })
  .deepPartial();

export type WeatherStationFilterConfig = z.infer<typeof weatherStationFilterConfigSchema>;

type FilterFunction = (station: WeatherStation, timeseries?: WeatherStationTimeseriesEntry) => boolean;

const DATE_LABELS: Record<DateValue, string> = {
  past_hour: 'Last hour',
  past_3_hours: 'Last 3 hours',
  past_12_hours: 'Last 12 hours',
  past_day: 'Last 24 hours',
};

export const dateLabelForFilterConfig = (recency: DateValue): string => {
  const value = recency;
  switch (value) {
    case 'past_hour':
    case 'past_3_hours':
    case 'past_12_hours':
    case 'past_day':
      return DATE_LABELS[value];
  }
  const invalid: never = value;
  throw new Error(`Unknown recency selection: ${JSON.stringify(invalid)}`);
};

export const datesForFilterConfig = (recency: DateValue, currentDate: Date): {startDate: Date; endDate: Date} => {
  const value = recency;
  switch (value) {
    case 'past_hour':
      return {startDate: sub(currentDate, {hours: 1}), endDate: currentDate};
    case 'past_3_hours':
      return {startDate: sub(currentDate, {hours: 3}), endDate: currentDate};
    case 'past_12_hours':
      return {startDate: sub(currentDate, {hours: 12}), endDate: currentDate};
    case 'past_day':
      return {startDate: sub(currentDate, {days: 1}), endDate: currentDate};
  }
};

const matchesDates = (currentDate: Date, recency: z.infer<typeof weatherStationFilterConfigSchema.shape.recency>): FilterFunction => {
  if (!recency) {
    return () => true;
  }
  const {startDate, endDate} = datesForFilterConfig(recency, currentDate);
  return (_: WeatherStation, timeseries?: WeatherStationTimeseriesEntry) => {
    if (!timeseries) {
      return false;
    }
    let latestObservation: Date | undefined;
    for (const observation of timeseries.observations) {
      if ('date_time' in observation) {
        const observationTime = parseISO(String(observation['date_time']));
        if (latestObservation === undefined || isAfter(observationTime, latestObservation)) {
          latestObservation = observationTime;
        }
      }
    }
    return latestObservation ? isAfter(latestObservation, startDate) && isBefore(latestObservation, endDate) : false;
  };
};

interface FilterListItem {
  filter: FilterFunction;
  label: string;
  removeFilter?: (config: WeatherStationFilterConfig) => WeatherStationFilterConfig;
}
export const filtersForConfig = (
  mapLayer: MapLayer,
  config: WeatherStationFilterConfig,
  initialFilterConfig: WeatherStationFilterConfig | undefined,
  currentDate: Date,
): FilterListItem[] => {
  if (!config) {
    return [];
  }

  const filterFuncs: FilterListItem[] = [];
  if (config.recency) {
    filterFuncs.push({
      filter: matchesDates(currentDate, config.recency),
      label: dateLabelForFilterConfig(config.recency),
      removeFilter: config => ({...config, recency: undefined}),
    });
  }

  if (config.zone) {
    filterFuncs.push({
      filter: station => config.zone === matchesZone(mapLayer, station.properties.latitude, station.properties.longitude),
      label: config.zone,
      // If the zone was specified as part of the initialFilterConfig (i.e. we're browsing the tab of a particular zone),
      // then removeFilter should be undefined since re-setting the filters should keep that zone filter around
      removeFilter: initialFilterConfig?.zone ? undefined : config => ({...config, zone: undefined}),
    });
  }

  if (config.source) {
    filterFuncs.push({
      filter: station => station.properties.source === config.source,
      label: config.source.toUpperCase(),
      removeFilter: config => ({...config, source: undefined}),
    });
  }

  return filterFuncs;
};

interface WeatherStationFilterFormProps {
  mapLayer: MapLayer;
  initialFilterConfig: WeatherStationFilterConfig;
  currentFilterConfig: WeatherStationFilterConfig;
  setFilterConfig: React.Dispatch<React.SetStateAction<WeatherStationFilterConfig>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const formFieldSpacing = 16;

export const WeatherStationFilterForm: React.FunctionComponent<WeatherStationFilterFormProps> = ({
  mapLayer,
  initialFilterConfig,
  currentFilterConfig,
  setFilterConfig,
  setVisible,
}) => {
  const {logger} = React.useContext<LoggerProps>(LoggerContext);
  const formContext = useForm({
    defaultValues: initialFilterConfig,
    resolver: zodResolver(weatherStationFilterConfigSchema) as Resolver<WeatherStationFilterConfig>,
    mode: 'onBlur',
    shouldFocusError: false,
    shouldUnregister: true,
  });
  React.useEffect(() => {
    formContext.reset(currentFilterConfig);
  }, [formContext, currentFilterConfig]);
  const postHog = usePostHog();

  const recordAnalytics = useCallback(() => {
    postHog?.screen('weatherStationsFilter');
  }, [postHog]);
  useFocusEffect(recordAnalytics);

  const closeWithoutSaving = useCallback(() => {
    formContext.reset(initialFilterConfig);
    setVisible(false);
  }, [initialFilterConfig, formContext, setVisible]);
  const saveAndClose = useCallback(() => setVisible(false), [setVisible]);

  useBackHandler(() => {
    closeWithoutSaving();
    // Returning true marks the event as processed
    return true;
  });

  const onSubmitHandler = useCallback(
    (data: WeatherStationFilterConfig) => {
      setFilterConfig(data);
    },
    [setFilterConfig],
  );

  const fieldRefs = React.useRef<{ref: RNView; field: keyof WeatherStationFilterConfig}[]>([]);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const onSubmitErrorHandler = useCallback(
    (errors: FieldErrors<WeatherStationFilterConfig>) => {
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
    },
    [logger, formContext],
  );
  const onResetHandler = useCallback(() => formContext.reset(initialFilterConfig), [formContext, initialFilterConfig]);

  const applyChanges = useCallback(
    () =>
      void (async () => {
        // Force validation errors to show up on fields that haven't been visited yet
        await formContext.trigger();
        // Then try to submit the form
        await formContext.handleSubmit(onSubmitHandler, onSubmitErrorHandler)();
        // Finally, close the modal
        setVisible(false);
      })(),
    [formContext, onSubmitHandler, onSubmitErrorHandler, setVisible],
  );

  return (
    <FormProvider {...formContext}>
      <SelectModalProvider>
        <SafeAreaView style={{flex: 1, height: '100%'}}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1, height: '100%'}}>
            <ScrollView style={{height: '100%', width: '100%', backgroundColor: 'white'}} ref={scrollViewRef}>
              <VStack space={12} backgroundColor={colorLookup('primary.background')} pt={4}>
                <Card
                  borderRadius={0}
                  borderColor="white"
                  header={
                    <HStack justifyContent={'space-between'} alignItems={'center'}>
                      <TouchableOpacity onPress={saveAndClose}>
                        <AntDesign name="close" size={24} color="black" />
                      </TouchableOpacity>
                      <Title3Semibold>Filters</Title3Semibold>
                      <TouchableOpacity onPress={onResetHandler}>
                        <BodyBlack color={colorLookup('blue2')}>Reset</BodyBlack>
                      </TouchableOpacity>
                    </HStack>
                  }>
                  <VStack space={formFieldSpacing} mt={8}>
                    <SelectField
                      name="zone"
                      label="Zone"
                      required
                      otherItems={mapLayer.features.map(feature => feature.properties.name)}
                      disabled={Boolean(initialFilterConfig.zone)}
                    />
                    <SelectField
                      name="recency"
                      label="Most Recent Data"
                      required
                      otherItems={(['past_hour', 'past_3_hours', 'past_12_hours', 'past_day'] as const).map(val => ({value: val, label: DATE_LABELS[val]}))}
                    />
                    <SelectField
                      name="source"
                      label="Data Source"
                      required
                      otherItems={[
                        {value: WeatherStationSource.NWAC, label: WeatherStationSource.NWAC.toUpperCase()},
                        {value: WeatherStationSource.MESOWEST, label: 'Synoptic Data'},
                        {value: WeatherStationSource.SNOTEL, label: WeatherStationSource.SNOTEL.toUpperCase()},
                      ]}
                    />
                  </VStack>
                </Card>
              </VStack>
            </ScrollView>
            <Button mx={16} mt={16} buttonStyle="primary" onPress={applyChanges}>
              <BodySemibold>Apply Filters</BodySemibold>
            </Button>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SelectModalProvider>
    </FormProvider>
  );
};

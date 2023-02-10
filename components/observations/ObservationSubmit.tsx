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
import {Formik} from 'formik';
import {createObservation, observationSchema} from 'components/observations/ObservationSchema';
import {Button} from 'components/content/Button';
import {TextField} from 'components/form/TextField';

export const ObservationSubmit: React.FC<{
  center_id: AvalancheCenterID;
}> = ({center_id: _center_id}) => {
  const navigation = useNavigation<ObservationsStackNavigationProps>();
  const initialValues = createObservation();

  return (
    <View width="100%" height="100%" bg="white">
      {/* SafeAreaView shouldn't inset from bottom edge because TabNavigator is sitting there */}
      <SafeAreaView edges={['top', 'left', 'right']} style={{height: '100%', width: '100%'}}>
        <Formik initialValues={initialValues} onSubmit={values => console.log('form submission', values)} validationSchema={observationSchema}>
          {({handleSubmit}) => (
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
                <TextField name="date" label="Observation date" placeholder="this needs to be a date picker" />
                <TextField name="zone" label="Zone/Region" placeholder="this needs to be a zone picker" />
                <TextField name="activity" label="Activity" placeholder="this needs to be an activity picker" />
                <TextField name="location" label="Location" placeholder="Tell us more about your route or trailhead" />
                <Divider direction="horizontal" />
                <Title3Semibold>Map location</Title3Semibold>
                <Body>tbd</Body>
                <Button buttonStyle="primary" onPress={() => handleSubmit()}>
                  <BodySemibold>Submit your observation</BodySemibold>
                </Button>
              </VStack>
            </ScrollView>
          )}
        </Formik>
      </SafeAreaView>
    </View>
  );
};

import {AntDesign} from '@expo/vector-icons';
import {Center, HStack, View} from 'components/core';
import {BodySm} from 'components/text';
import {useGooglePlacesAPIKey} from 'hooks/useGooglePlacesAPIKey';
import React from 'react';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import {colorLookup} from 'theme';

export type PlacesSearchBarProps = Omit<React.ComponentProps<typeof View>, 'children'>;

export const PlacesSearchBar: React.FunctionComponent<PlacesSearchBarProps> = props => {
  const apiKey = useGooglePlacesAPIKey();
  return (
    <View {...props}>
      <HStack backgroundColor="#FFFFFF" borderRadius={12} px={12} py={4} justifyContent="space-between" alignItems="center" alignContent="flex-start">
        <AntDesign name="search1" size={25} color={colorLookup('text.secondary')} />
        <GooglePlacesAutocomplete
          textInputProps={{
            placeholderTextColor: colorLookup('text.secondary'),
          }}
          styles={{
            textInput: {
              height: 40,
              paddingVertical: 0,
              paddingHorizontal: 4,
              marginBottom: 0,
              backgroundColor: 'clear',
            },
          }}
          placeholder={'Search for location...'}
          enablePoweredByContainer={false}
          query={{key: apiKey}}
          onPress={data => console.log(`press details: ${JSON.stringify(data)}`)}
          onNotFound={() => console.log(`no results found`)}
          onFail={error => console.log(`query error: ${JSON.stringify(error)}`)}
          listEmptyComponent={() => (
            <Center>
              <BodySm>No results were found.</BodySm>
            </Center>
          )}
        />
      </HStack>
    </View>
  );
};

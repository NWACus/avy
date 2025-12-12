import {MaterialIcons} from '@expo/vector-icons';
import {Button} from 'components/content/Button';
import {EditDeleteCard} from 'components/content/Card';
import {HStack, VStack} from 'components/core';
import {AvalancheObservationForm} from 'components/observations/AvalancheObservationForm';
import {AvalancheObservationFormData, ObservationFormData} from 'components/observations/ObservationFormData';
import {Body, BodySemibold} from 'components/text';
import React, {useCallback, useState} from 'react';
import {useController} from 'react-hook-form';
import {ColorValue} from 'react-native';
import {colorLookup} from 'theme';
import {AvalancheCenterID} from 'types/nationalAvalancheCenter';

export const AvalancheObservationSection: React.FC<{center_id: AvalancheCenterID; disabled: boolean; busy: boolean}> = ({center_id, disabled, busy}) => {
  const [isAvyObsModalDislayed, setAvyObsModalDisplayed] = useState(false);
  const {field} = useController<ObservationFormData, 'avalanches'>({name: 'avalanches', defaultValue: []});
  const avalancheObs = field.value;

  const onAvyObsModalClose = useCallback(() => setAvyObsModalDisplayed(false), [setAvyObsModalDisplayed]);
  const onNewAvyObsSave = useCallback(
    (avalancheData: AvalancheObservationFormData) => {
      field.onChange([...avalancheObs, avalancheData]);
      setAvyObsModalDisplayed(false);
    },
    [setAvyObsModalDisplayed, avalancheObs, field],
  );
  const onToggleAvyObsModal = useCallback(() => setAvyObsModalDisplayed(true), [setAvyObsModalDisplayed]);

  const onDeleteItem = useCallback(
    (index: number) => {
      field.onChange(avalancheObs.filter((_, i) => i !== index));
    },
    [avalancheObs, field],
  );

  const onEditItem = useCallback((_: number) => {}, []);

  const handleDeleteItem = (index: number) => () => onDeleteItem(index);
  const handleEditItem = (index: number) => () => onEditItem(index);

  return (
    <>
      {avalancheObs.length > 0 && (
        <VStack space={4}>
          {avalancheObs.map((avalanche, index) => (
            <EditDeleteCard
              key={index}
              borderWidth={1}
              borderColor={colorLookup('border.base')}
              my={2}
              py={1}
              borderRadius={10}
              onDeletePress={handleDeleteItem(index)}
              onEditPress={handleEditItem(index)}
              header={<BodySemibold>{avalanche.location}</BodySemibold>}>
              <HStack space={8}>
                <Body>{avalanche.date.toDateString()}</Body>
                <Body>{avalanche.d_size}</Body>
                <Body>{avalanche.elevation} ft</Body>
              </HStack>
            </EditDeleteCard>
          ))}
        </VStack>
      )}
      <AddAvalancheObsButton onPress={onToggleAvyObsModal} disabled={disabled} busy={busy} />
      <AvalancheObservationForm visible={isAvyObsModalDislayed} onSave={onNewAvyObsSave} onClose={onAvyObsModalClose} center_id={center_id} />
    </>
  );
};

const AddAvalancheObsButton: React.FC<{onPress: () => void; disabled: boolean; busy: boolean}> = ({onPress, disabled, busy}) => {
  const renderChildren = useCallback(
    ({textColor}: {textColor: ColorValue}) => (
      <HStack width={'100%'} justifyContent="space-between">
        <BodySemibold color={textColor}>{'Add avalanche details'}</BodySemibold>
        <MaterialIcons name="chevron-right" size={24} color={textColor} style={{marginTop: 1}} />
      </HStack>
    ),
    [],
  );

  return <Button mt={8} buttonStyle="secondary" disabled={disabled} busy={busy} onPress={onPress} renderChildren={renderChildren} />;
};

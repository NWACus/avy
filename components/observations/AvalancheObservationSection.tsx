import {Ionicons} from '@expo/vector-icons';
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
  const [editAvyObsIndex, setEditAvyObsIndex] = useState<number | null>(null);
  const {field} = useController<ObservationFormData, 'avalanches'>({name: 'avalanches', defaultValue: []});
  const avalancheObs = field.value;

  const onAvyObsModalClose = useCallback(() => {
    setAvyObsModalDisplayed(false);
    if (editAvyObsIndex != null) {
      setEditAvyObsIndex(null);
    }
  }, [setAvyObsModalDisplayed, editAvyObsIndex, setEditAvyObsIndex]);

  const onNewAvyObsSave = useCallback(
    (avalancheData: AvalancheObservationFormData) => {
      field.onChange([...avalancheObs, avalancheData]);
      setAvyObsModalDisplayed(false);
    },
    [setAvyObsModalDisplayed, avalancheObs, field],
  );

  const onEditAvyObsSave = useCallback(
    (avalancheData: AvalancheObservationFormData) => {
      if (editAvyObsIndex != null) {
        avalancheObs[editAvyObsIndex] = avalancheData;
      }

      field.onChange([...avalancheObs]);
      setAvyObsModalDisplayed(false);
      setEditAvyObsIndex(null);
    },
    [setAvyObsModalDisplayed, avalancheObs, field, editAvyObsIndex, setEditAvyObsIndex],
  );

  const onToggleAvyObsModal = useCallback(() => setAvyObsModalDisplayed(true), [setAvyObsModalDisplayed]);

  const onDeleteItem = useCallback(
    (index: number) => {
      field.onChange(avalancheObs.filter((_, i) => i !== index));
    },
    [avalancheObs, field],
  );

  const handleDeleteItem = (index: number) => () => onDeleteItem(index);

  const onEditItem = useCallback(
    (index: number) => {
      setEditAvyObsIndex(index);
      setAvyObsModalDisplayed(true);
    },
    [setAvyObsModalDisplayed, setEditAvyObsIndex],
  );

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
              noDivider
              onDeletePress={handleDeleteItem(index)}
              onEditPress={handleEditItem(index)}
              header={<BodySemibold>{avalanche.location}</BodySemibold>}>
              <HStack space={8}>
                <Body>{avalanche.date.toDateString()}</Body>
                <Body>{`D${avalanche.d_size}`}</Body>
                <Body>{avalanche.elevation} ft</Body>
              </HStack>
            </EditDeleteCard>
          ))}
        </VStack>
      )}
      <AddAvalancheObsButton onPress={onToggleAvyObsModal} disabled={disabled} busy={busy} />
      <AvalancheObservationForm
        visible={isAvyObsModalDislayed}
        onSave={editAvyObsIndex == null ? onNewAvyObsSave : onEditAvyObsSave}
        onClose={onAvyObsModalClose}
        center_id={center_id}
        initialData={editAvyObsIndex != null ? avalancheObs[editAvyObsIndex] : undefined}
      />
    </>
  );
};

const AddAvalancheObsButton: React.FC<{onPress: () => void; disabled: boolean; busy: boolean}> = ({onPress, disabled, busy}) => {
  const renderChildren = useCallback(
    ({textColor}: {textColor: ColorValue}) => (
      <HStack width={'100%'} justifyContent="space-between">
        <BodySemibold color={textColor}>{'Add avalanche details'}</BodySemibold>
        <Ionicons name="chevron-forward" size={24} color={textColor} style={{marginTop: 1}} />
      </HStack>
    ),
    [],
  );

  return <Button mt={8} buttonStyle="secondary" disabled={disabled} busy={busy} onPress={onPress} renderChildren={renderChildren} />;
};

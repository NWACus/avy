import Ionicons from '@expo/vector-icons/Ionicons';
import {HStack, View, ViewProps, VStack} from 'components/core';
import {Body} from 'components/text';
import {logger} from 'logger';
import React, {ComponentPropsWithoutRef, memo, useMemo} from 'react';
import {TouchableOpacity} from 'react-native';
import {colorLookup} from 'theme';

interface Action<T> {
  label: string;
  data: T;
  action?: (action: {label: string; data: T}) => void;
  // Someday, might be nice to support nesting
  // children?: Action[];
}

export interface ActionListProps<T> extends ViewProps {
  actions: Action<T>[];
  header?: React.ReactNode;
}

function ActionListInternal<T>({actions, header, ...props}: ActionListProps<T>) {
  const onPressHandlers = useMemo(
    () =>
      actions.map(
        ({label, data, action}) =>
          () =>
            action && action({label, data}),
      ),
    [actions],
  );
  return (
    <VStack {...props}>
      {header && (
        <View borderBottomWidth={1} borderColor={colorLookup('light.300')} py={10}>
          {header}
        </View>
      )}
      {actions.map(({label}, index) => (
        <TouchableOpacity onPress={onPressHandlers[index]} key={label}>
          <HStack borderBottomWidth={index < actions.length - 1 ? 1 : 0} borderColor={colorLookup('light.300')} py={10} pr={8} justifyContent="space-between">
            <Body style={{flex: 1, flexGrow: 1}}>{label}</Body>
            <Ionicons name={'chevron-forward'} color={colorLookup('light.300')} size={16} />
          </HStack>
        </TouchableOpacity>
      ))}
    </VStack>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const memoizeGeneric: <T extends React.FC<any>>(
  component: T,
  propsAreEqual?: (prevProps: React.PropsWithChildren<ComponentPropsWithoutRef<T>>, nextProps: React.PropsWithChildren<ComponentPropsWithoutRef<T>>) => boolean,
) => T = memo;

function compareArrays<T>(a1: T[], a2: T[]) {
  const a1Set = new Set(a1);
  const a2Set = new Set(a2);
  return a1Set.size === a2Set.size && a1.every(v => a2Set.has(v));
}

// This is a memoized version of ActionListInternal that only re-renders when the header, labels, or data change,
// and warns when the actions seem to be changing unnecessarily, indicating that we're probably over-rendering.
export const ActionList = memoizeGeneric(ActionListInternal, (prevProps, nextProps) => {
  const sameHeader = prevProps.header === nextProps.header;
  const sameLabels = compareArrays(
    prevProps.actions.map(a => a.label),
    nextProps.actions.map(a => a.label),
  );
  const sameData = compareArrays(
    prevProps.actions.map(a => a.data),
    nextProps.actions.map(a => a.data),
  );
  const sameActions = compareArrays(
    prevProps.actions.map(a => a.action),
    nextProps.actions.map(a => a.action),
  );
  if (sameLabels && sameData && !sameActions) {
    logger.warn('ActionsList: actions are changing but labels and data are not! Do you have a fat arrow function in your actions?');
  }
  // We ignore changes to the actions because (1) it's almost certainly unintentional and (2) it makes perf terrible when it happens.
  // If there is a use case for allowing that someday, then we'll need to add a prop to disable this optimization.
  return sameHeader && sameLabels && sameData;
});

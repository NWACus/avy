import Ionicons from '@expo/vector-icons/Ionicons';
import {HStack, View, ViewProps, VStack} from 'components/core';
import {BodySm, BodySmSemibold, BodyXSmBlack} from 'components/text';
import {useToggle} from 'hooks/useToggle';
import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {LayoutChangeEvent, LayoutRectangle, Modal, Platform, View as RNView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, useWindowDimensions} from 'react-native';
import {colorLookup} from 'theme';

const EDGE_MARGIN = 12;
const PANEL_GAP = 6;
const PANEL_RADIUS = 12;
const PREFERRED_PANEL_WIDTH = 340;

const borderColor = colorLookup('border.base');
const openBackgroundColor = colorLookup('gray.900');
const textColor = colorLookup('text');
const selectedBackgroundColor = colorLookup('blue.100');

const styles = StyleSheet.create({
  panel: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  footerLabel: {
    textDecorationLine: 'underline',
  },
});

// iOS serializes view controller presentation, so opening a browser or another modal while this one is
// still dismissing is refused and wedges the app. Row actions wait for onDismiss, which only fires on iOS
// (ReactModalHostManager.kt registers topDismiss as "iOS only"); Android dialogs have no such constraint.
const DropdownContext = React.createContext<{closeThenRun: (action?: () => void) => void}>({closeThenRun: action => action?.()});

export interface DropdownProps extends ViewProps {
  label: string;
  children: React.ReactNode;
  panelWidth?: number;
  placement?: 'below' | 'above' | 'auto';
  disabled?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({label, children, panelWidth, placement = 'auto', disabled = false, ...props}) => {
  const ref = useRef<RNView>(null);
  const [visible, {off: hide, on: show}] = useToggle(false);
  const [anchor, setAnchor] = useState<LayoutRectangle>({x: 0, y: 0, width: 0, height: 0});
  const [panelHeight, setPanelHeight] = useState(0);
  const {width: windowWidth, height: windowHeight} = useWindowDimensions();
  const pendingAction = useRef<(() => void) | null>(null);

  const measureAnchor = useCallback((onMeasured?: () => void) => {
    if (!ref.current) {
      onMeasured?.();
      return;
    }
    ref.current.measureInWindow((x, y, width, height) => {
      setAnchor(current => (current.x === x && current.y === y && current.width === width && current.height === height ? current : {x: x, y: y, width: width, height: height}));
      onMeasured?.();
    });
  }, []);

  // Measure when opening rather than on every render: this trigger can live inside an animating,
  // scrolling drawer, where a measure-per-render feeds itself new values and re-renders through taps.
  const onPressTrigger = useCallback(() => {
    if (visible) {
      hide();
    } else {
      measureAnchor(show);
    }
  }, [visible, hide, show, measureAnchor]);

  // Nothing can move the trigger while the panel blocks input, so a rotation is the only re-measure case.
  useEffect(() => {
    if (visible) {
      measureAnchor();
    }
  }, [visible, windowWidth, windowHeight, measureAnchor]);

  const runPendingAction = useCallback(() => {
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.();
  }, []);

  const closeThenRun = useCallback(
    (action?: () => void) => {
      if (Platform.OS === 'ios') {
        pendingAction.current = action ?? null;
        hide();
      } else {
        hide();
        action?.();
      }
    },
    [hide],
  );

  const context = useMemo(() => ({closeThenRun: closeThenRun}), [closeThenRun]);

  const onPanelLayout = useCallback((event: LayoutChangeEvent) => setPanelHeight(event.nativeEvent.layout.height), []);

  const width = panelWidth ?? Math.min(PREFERRED_PANEL_WIDTH, windowWidth - 2 * EDGE_MARGIN);

  const panelPosition = useMemo(() => {
    const right = Math.max(EDGE_MARGIN, windowWidth - (anchor.x + anchor.width));
    const spaceBelow = windowHeight - EDGE_MARGIN - (anchor.y + anchor.height + PANEL_GAP);
    const spaceAbove = anchor.y - PANEL_GAP - EDGE_MARGIN;
    let resolved = placement;
    if (resolved === 'auto') {
      if (panelHeight === 0 || panelHeight <= spaceBelow) {
        resolved = 'below';
      } else {
        resolved = panelHeight <= spaceAbove || spaceAbove > spaceBelow ? 'above' : 'below';
      }
    }
    return resolved === 'above' ? {right: right, bottom: windowHeight - anchor.y + PANEL_GAP} : {right: right, top: anchor.y + anchor.height + PANEL_GAP};
  }, [anchor, placement, panelHeight, windowWidth, windowHeight]);

  // Hold the panel invisible for the frame it takes to measure so that an auto-flip never renders as a jump.
  const panelStyle = useMemo(() => [styles.panel, {opacity: placement === 'auto' && panelHeight === 0 ? 0 : 1}], [placement, panelHeight]);

  return (
    <>
      <TouchableOpacity
        onPress={onPressTrigger}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{expanded: visible, disabled: disabled}}>
        <View
          ref={ref}
          px={12}
          py={6}
          borderRadius={8}
          borderWidth={1}
          bg={visible ? openBackgroundColor : 'white'}
          borderColor={visible ? openBackgroundColor : borderColor}
          {...props}>
          <HStack space={6} alignItems="center">
            <BodySmSemibold color={visible ? 'white' : textColor}>{label}</BodySmSemibold>
            <Ionicons name={visible ? 'chevron-up' : 'chevron-down'} size={16} color={visible ? 'white' : textColor} />
          </HStack>
        </View>
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={hide} onDismiss={runPendingAction}>
        <TouchableWithoutFeedback disabled={!visible} onPress={hide}>
          <View style={StyleSheet.absoluteFill}>
            <View position="absolute" borderRadius={PANEL_RADIUS} width={width} onLayout={onPanelLayout} style={panelStyle} {...panelPosition}>
              <VStack bg="white" borderRadius={PANEL_RADIUS} overflow="hidden" pb={4}>
                <DropdownContext.Provider value={context}>{children}</DropdownContext.Provider>
              </VStack>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export const DropdownSection: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
  <VStack>
    <View px={16} pt={12} pb={4}>
      <BodyXSmBlack color="text.tertiary">{title}</BodyXSmBlack>
    </View>
    {children}
  </VStack>
);

export interface DropdownRowProps {
  children: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  selected?: boolean;
  accessibilityLabel?: string;
}

export const DropdownRow: React.FC<DropdownRowProps> = ({children, leading, trailing, onPress, selected = false, accessibilityLabel}) => {
  const handlePress = useCloseThenPress(onPress);

  const row = (
    <HStack px={16} py={10} space={12} alignItems="center" bg={selected ? selectedBackgroundColor : undefined}>
      {leading}
      <View flex={1}>{children}</View>
      {trailing}
    </HStack>
  );

  if (!onPress) {
    return row;
  }

  return (
    <TouchableOpacity onPress={handlePress} accessibilityRole="menuitem" accessibilityLabel={accessibilityLabel}>
      {row}
    </TouchableOpacity>
  );
};

export const DropdownFooterLink: React.FC<{label: string; onPress: () => void}> = ({label, onPress}) => {
  const handlePress = useCloseThenPress(onPress);

  return (
    <TouchableOpacity onPress={handlePress} accessibilityRole="button" accessibilityLabel={label}>
      <View px={16} pt={12} pb={8}>
        <BodySm textAlign="center" color="text.tertiary" style={styles.footerLabel}>
          {label}
        </BodySm>
      </View>
    </TouchableOpacity>
  );
};

const useCloseThenPress = (onPress?: () => void): (() => void) => {
  const {closeThenRun} = useContext(DropdownContext);
  return useCallback(() => closeThenRun(onPress), [closeThenRun, onPress]);
};

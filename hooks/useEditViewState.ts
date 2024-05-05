import {ActionGenerators, applyActions, basicActions, createActionReducer, setStateTimestamp, updateStateValue} from 'hooks/reducerHelpers';
import {logger} from 'logger';
import {useMemo, useReducer} from 'react';

type ViewMode = 'dismissed' | 'dismissing' | 'dismissRequested' | 'presented' | 'presenting' | 'presentRequested' | 'resting';

type EditViewState = {
  // the current view mode that the view represents
  mode: ViewMode;
  // the previous view mode
  previousMode?: ViewMode;
  // the last time the view state was mutated
  mutatedAt?: number;
  // if the keyboard is known to be visible or not
  keyboardVisible: boolean;
  // the minimum and maximum height of the form
  viewBoundary: {
    min: number;
    max: number;
  };
};

const INITIAL_STATE: EditViewState = {
  mode: 'resting',
  keyboardVisible: false,
  viewBoundary: {min: 0, max: 0},
};

const EditViewActions = {
  reset: () => ({action: 'init' as const}),
  setViewBoundary: (minMax: {min: number; max: number} | {min: number; max?: undefined} | {min?: undefined; max: number}) => ({
    action: 'setBoundary' as const,
    minMax,
  }),
  ...basicActions([
    // request dismiss view
    'dismissRequest',
    // in the process of dismissing
    'dismiss',
    // done dismissing
    'dismissCompleted',
    // request to present the view
    'presentRequest',
    // in the process of presenting
    'present',
    // done presenting
    'presentCompleted',
  ] as const),
} satisfies ActionGenerators;

type EditViewActions = typeof EditViewActions;

type EditViewAction = ReturnType<EditViewActions[keyof EditViewActions]>;

const setMode = (mode: ViewMode, option: {fromMode?: ViewMode | ViewMode[]} = {}) => {
  const fromMode = option.fromMode != null ? new Set(Array.isArray(option.fromMode) ? option.fromMode : [option.fromMode]) : null;
  return (state: EditViewState) => {
    if (state.mode === mode) {
      return state;
    }

    if (fromMode != null && !fromMode.has(state.mode)) {
      logger.warn('Invalid state transition from', state.mode, 'to', mode);
      return state;
    }

    return {
      ...state,
      mode,
      previousMode: state.mode,
    };
  };
};

const reducer = setStateTimestamp(
  'mutatedAt',
  createActionReducer<EditViewState, EditViewAction>({
    /**
     * The view modes somewhat represent a state machine that transitions from one mode into the next
     */
    init: setMode('resting'),
    presentRequest: setMode('presentRequested', {fromMode: 'resting'}),
    present: setMode('presenting', {fromMode: 'presentRequested'}),
    presentCompleted: setMode('presented', {fromMode: 'presenting'}),
    dismissRequest: setMode('dismissRequested', {fromMode: 'presented'}),
    dismiss: setMode('dismissing', {fromMode: 'dismissRequested'}),
    dismissCompleted: setMode('dismissed', {fromMode: 'dismissing'}),

    /**
     * Update the boundary to the min and/or max provided.
     */
    setBoundary: updateStateValue('viewBoundary', (viewBoundary, {minMax: {min, max}}) => {
      const next = {min: Math.ceil(min ?? viewBoundary.min), max: Math.floor(max ?? viewBoundary.max)};

      if (next.min === viewBoundary.min && next.max === viewBoundary.max) {
        return viewBoundary;
      }

      return next;
    }),
  }),
);

export const useEditViewState = () => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const actions = useMemo(() => applyActions(EditViewActions, dispatch), []);

  return [state, dispatch, actions] as const;
};

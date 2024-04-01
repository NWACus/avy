import {KeysMatching} from 'components/form/TextField';
import {Dispatch, Reducer} from 'react';

// any here is pretty safe in that it's being used to constrain
// with satisfies ActionGenerators to make sure they're at least
// a function type. createActionReducer maps the correct function
// signatures so any doesn't leak.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionGenerators = Record<string, (...args: any[]) => any>;

type BasicDispatch<T extends string> = {[K in T]: () => {action: K}};

/**
 * Given a list of string literals (e.g ['go', 'stop']), returns a Record of type:
 *
 * ```ts
 * type Actions = {
 *   go: () => ({ action: 'go' });
 *   stop: () => ({ action: 'stop' })
 * }
 *
 * dispatch(actions.go());
 * ```
 */
export const basicActions = <A extends [string, ...string[]]>(actions: A): BasicDispatch<A[number]> =>
  Object.fromEntries(
    actions.map(action => {
      return [action, () => ({action})] as const;
    }),
  ) as BasicDispatch<A[number]>;

type ActionReducers<State, T extends {action: string}> = {
  [A in T['action']]: (prevState: State, action: Extract<T, {action: A}>) => State;
};

/**
 * Build a reducer based on action dispatch types
 *
 * If all actions are a discriminated union on the key of 'action', then this can create a reducer on a set of
 * reducers where the key is the action's literal string type and the value is a reducer with the action refired
 * to that type.
 *
 * Example:
 *
 *   type State = { name: string, age: number };
 *   type Action = { action: 'updateName', name: string } | { action: 'updateAge', age: number};
 *
 *   const reducer = createActionReducer<State, Action>({
 *     // name is correctly typed to string, because the 'updateName' action is refined to the correct type
 *     updateName: (state, { name }) => ({ ...state, name }),
 *     // age is correctly typed to number, because the 'updateAge' action is refined to the correct type
 *     updateAge: (state, { age }) => ({...state, age }),
 *   });
 */
export const createActionReducer = <State, Action extends {action: string}>(actionReducers: ActionReducers<State, Action>): ((state: State, action: Action) => State) => {
  type Reducers = ActionReducers<State, Action>;
  return (state, action) => {
    const actionName = action.action as keyof Reducers;
    const reducer = actionReducers[actionName] as (state: State, action: Action) => State;
    if (reducer == null) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('No reducer configured for', action.action, action);
      }
      return state;
    }
    return reducer(state, action);
  };
};

/**
 * Set the current timestamp of State at the given key if the state is changed. Equality is checked
 * with strict equals.
 *
 * Requires that the type stored at key is a number.
 */
export const setStateTimestamp = <State, Action, K extends KeysMatching<State, number | null | undefined>>(keyName: K, reducer: Reducer<State, Action>): Reducer<State, Action> => {
  return (state, action) => {
    const nextState = reducer(state, action);

    if (nextState === state) {
      return nextState;
    }

    return {
      ...nextState,
      [keyName]: Date.now(),
    };
  };
};

export const logAction = <State, Action>(reducer: Reducer<State, Action>): Reducer<State, Action> => {
  if (!__DEV__) {
    return reducer;
  }

  return (state, action) => {
    /* eslint-disable no-console */
    console.log(' >> ACTION', action);
    console.log(' >> ', state);
    const nextState = reducer(state, action);
    console.log(' << ', nextState);
    return nextState;
    /* eslint-enable no-console */
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dispatchers = Record<string, (...args: any[]) => any>;

/**
 * Used by applyActions to map the action generator signatures into dispatch function signatures.
 */
type AppliedActions<Action, Actions extends Dispatchers> = {
  [K in keyof Actions]: Actions[K] extends (...args: infer Args) => Action ? (...args: Args) => void : never;
};

/**
 * Given a set of actions, create functions at the same keys with the same signatures
 * that call pass the generated Action into dispatch().
 *
 * Example:
 *
 *   const Actions = {
 *     doSomething: (when: Date) => ({ action: 'doSomething', when })
 *   }
 *
 *   function MyComponent() {
 *     const [state, dispatch] = useReducer(reducer, initialState);
 *     const actions = applyActions(Actions, dispatch);
 *
 *     // creates an instance of the action
 *     Actions.doSomething(new Date());
 *
 *     // creates an instance of the action and dispatches it
 *     actions.doSomething(new Date());
 *
 *   }
 */
export const applyActions = <Action, Actions extends Dispatchers>(actions: Actions, dispatch: Dispatch<Action>): AppliedActions<Action, Actions> => {
  return Object.fromEntries(
    Object.entries(actions).map(([key, actionGenerator]) => {
      // Pass the args into the action generator, dispatches the returned action
      const appliedAction = (...args: unknown[]) => {
        const action = actionGenerator(...args) as Action;
        return dispatch(action);
      };
      return [key, appliedAction];
    }),
  ) as AppliedActions<Action, Actions>;
};

/**
 * Mutate a part of State stored at Key.
 *
 * Enforces that `updater` receives and returns a State[Key] type.
 */
export const updateStateValue = <State, Key extends keyof State, Action>(key: Key, updater: (value: State[Key], action: Action) => State[Key]) => {
  return (state: State, action: Action) => {
    const value = updater(state[key], action);
    if (state[key] === value) {
      return state;
    }
    return {
      ...state,
      [key]: value,
    };
  };
};

export const always =
  <T>(value: T) =>
  () =>
    value;

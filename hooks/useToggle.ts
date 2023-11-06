// Essentially useState<boolean>, but also provides event handler-friendly callbacks for toggling the state and setting it to true or false.

import {useCallback, useState} from 'react';

export const useToggle = (
  initialState: boolean,
): [get: boolean, helpers: {set: React.Dispatch<React.SetStateAction<boolean>>; toggle: () => void; on: () => void; off: () => void}] => {
  const [state, setState] = useState<boolean>(initialState);
  const toggle = useCallback(() => setState(state => !state), [setState]);
  const on = useCallback(() => setState(true), [setState]);
  const off = useCallback(() => setState(false), [setState]);

  return [state, {set: setState, toggle, on, off}];
};

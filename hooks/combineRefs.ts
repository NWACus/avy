import {MutableRefObject} from 'react';

const notNull = <T>(value: T | null | undefined): value is T => value != null;

/**
 * Combine multiple refs to the same instance. This allows an external ref and an internal ref to be
 * associated with the same instance.
 *
 * Inspired by Radix https://github.com/radix-ui/primitives/blob/main/packages/react/compose-refs/src/composeRefs.tsx
 */
export const combineRefs = <T>(refs: [React.Ref<T>, ...(React.Ref<T> | null | undefined)[]]): React.Ref<T> => {
  const [ref, ...rest] = refs;
  const nonNullRefs = rest.filter(notNull);
  if (nonNullRefs.length === 0) {
    return ref;
  }

  return value => {
    for (const ref of refs) {
      // refs have two shapes, either a function that is called with the instance
      // or an object with the reference stored at .current
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref != null) {
        // in order to fake
        const mutable = ref as MutableRefObject<T | null>;
        mutable.current = value;
      }
    }
  };
};

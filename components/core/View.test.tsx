/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access */
import {render, screen} from '@testing-library/react-native';
import React from 'react';

import {View} from 'components/core/View';

describe('View', () => {
  it("sets top-level properties on the wrapped View's style property", () => {
    render(<View width={100} height={'100%'} backgroundColor="red" testID="foo" />);
    const view = screen.getByTestId('foo');
    expect(view.props.style).toEqual([
      undefined,
      {
        backgroundColor: 'red',
        width: 100,
        height: '100%',
      },
    ]);
  });

  it('top-level properties overwrite the inner `style`, even when specified before the `style` prop', () => {
    render(<View width={100} style={{width: 50, backgroundColor: 'blue'}} testID="foo" />);
    const view = screen.getByTestId('foo');
    expect(view.props.style).toEqual([
      {
        backgroundColor: 'blue',
        width: 50,
      },
      {width: 100},
    ]);
  });

  it('top-level properties overwrite the inner `style`, when specified after the `style` prop', () => {
    render(<View style={{width: 50, backgroundColor: 'blue'}} backgroundColor="red" testID="foo" />);
    const view = screen.getByTestId('foo');
    expect(view.props.style).toEqual([
      {
        backgroundColor: 'blue',
        width: 50,
      },
      {backgroundColor: 'red'},
    ]);
  });

  it('property shorthand can overwrite `style` props', () => {
    render(<View style={{backgroundColor: 'blue'}} bg="red" testID="foo" />);
    const view = screen.getByTestId('foo');
    expect(view.props.style).toEqual([
      {
        backgroundColor: 'blue',
      },
      {
        backgroundColor: 'red',
      },
    ]);
  });

  it('property aliases are preferred over full property names', () => {
    render(<View style={{backgroundColor: 'blue'}} bg="red" backgroundColor="pink" testID="foo" />);
    const view = screen.getByTestId('foo');
    expect(view.props.style).toEqual([
      {
        backgroundColor: 'blue',
      },
      {
        backgroundColor: 'red',
      },
    ]);

    render(<View style={{backgroundColor: 'blue'}} backgroundColor="pink" bg="red" testID="foo" />);
    const view2 = screen.getByTestId('foo');
    expect(view2.props.style).toEqual([
      {
        backgroundColor: 'blue',
      },
      {
        backgroundColor: 'red',
      },
    ]);
  });

  it('throws errors for invalid dimension values', () => {
    // Suppress console.error while running the test
    jest.spyOn(console, 'error').mockImplementation(() => jest.fn());
    // Silent coercion of string -> number is not allowed: the View will throw
    // @ts-expect-error - this is intentionally incorrect code that demonstrates the error
    expect(() => render(<View padding="100" />)).toThrow('Invalid string value "100" for property padding: string dimensions must specify pt or %');
  });

  afterEach(() => jest.restoreAllMocks());
});

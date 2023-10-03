/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access */
import {render, screen} from '@testing-library/react-native';
import React from 'react';

import {View} from 'components/core/View';
import {colorLookup} from 'theme';

describe('View', () => {
  it("sets top-level properties on the wrapped View's style property", () => {
    render(<View width={100} height={'100%'} backgroundColor="red.100" testID="foo" />);
    const view = screen.getByTestId('foo');
    expect(view.props.style).toEqual({
      backgroundColor: colorLookup('red.100').toString(),
      width: 100,
      height: '100%',
    });
  });

  it('top-level properties overwrite the inner `style`, even when specified before the `style` prop', () => {
    render(<View width={100} style={{width: 50, backgroundColor: 'blue'}} testID="foo" />);
    const view = screen.getByTestId('foo');
    expect(view.props.style).toEqual({
      backgroundColor: 'blue',
      width: 100,
    });
  });

  it('top-level properties overwrite the inner `style`, when specified after the `style` prop', () => {
    render(<View style={{width: 50, backgroundColor: 'blue'}} backgroundColor="red.100" testID="foo" />);
    const view = screen.getByTestId('foo');
    expect(view.props.style).toEqual({
      backgroundColor: colorLookup('red.100').toString(),
      width: 50,
    });
  });

  it('property shorthand can overwrite `style` props', () => {
    render(<View style={{backgroundColor: 'blue'}} bg="red.100" testID="foo" />);
    const view = screen.getByTestId('foo');
    expect(view.props.style).toEqual({
      backgroundColor: colorLookup('red.100').toString(),
    });
  });

  it('when multiple property aliases target the same property, last one wins', () => {
    render(<View style={{backgroundColor: 'blue'}} bg="red.100" backgroundColor="pink.200" bgColor="yellow.300" testID="foo" />);
    const view = screen.getByTestId('foo');
    expect(view.props.style).toEqual({
      backgroundColor: colorLookup('yellow.300').toString(),
    });

    render(<View style={{backgroundColor: 'blue'}} bgColor="yellow.300" backgroundColor="pink.200" bg="red.100" testID="foo" />);
    const view2 = screen.getByTestId('foo');
    expect(view2.props.style).toEqual({
      backgroundColor: colorLookup('red.100').toString(),
    });

    render(<View style={{backgroundColor: 'blue'}} bgColor="yellow.300" bg="red.100" backgroundColor="pink.200" testID="foo" />);
    const view3 = screen.getByTestId('foo');
    expect(view3.props.style).toEqual({
      backgroundColor: colorLookup('pink.200').toString(),
    });
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

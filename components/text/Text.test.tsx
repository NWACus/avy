import '@testing-library/jest-native/extend-expect';
import {render, screen} from '@testing-library/react-native';
import React from 'react';

import {Body} from 'components/text';

describe('Text', () => {
  describe('HTML entitiy escaping', () => {
    const input = 'Brooke Maushund &amp; Matt Primomo';
    const output = 'Brooke Maushund & Matt Primomo';

    it('does not strip HTML entities by default', () => {
      render(<Body>{input}</Body>);
      expect(screen.getByText(input)).not.toBeNull();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      expect(() => screen.getByText(output)).toThrow();
    });

    it('strips HTML entities when option is set', () => {
      render(<Body unescapeHTMLEntities>{input}</Body>);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      expect(() => screen.getByText(input)).toThrow();
      expect(screen.getByText(output)).not.toBeNull();
    });
  });

  describe('Center ID modification', () => {
    it('does not modify center IDs like NWAC', () => {
      const input = 'my favorite avalanche center is NWAC in Seattle';
      render(<Body>{input}</Body>);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const element = screen.getByText(/my favorite/);
      expect(element).toHaveTextContent(input);
    });

    it('does modify center IDs like SNFAC', () => {
      const input = 'my favorite avalanche center is SNFAC in Idaho, known as SNFAC';
      render(<Body>{input}</Body>);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const element = screen.getByText(/my favorite/);
      expect(element).toHaveTextContent('my favorite avalanche center is SAC in Idaho, known as SAC');
    });

    it('is case-sensitive when modifying', () => {
      const input = 'snfac Snfac sNfac snFAC SNFAC';
      render(<Body>{input}</Body>);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const element = screen.getByText(/snfac/);
      expect(element).toHaveTextContent('snfac Snfac sNfac snFAC SAC');
    });

    it('does not modify center id when translate prop is false', () => {
      const input = 'NWAC SNFAC SAC';
      render(<Body translate={false}>{input}</Body>);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const element = screen.getByText(/NWAC/);
      expect(element).toHaveTextContent('NWAC SNFAC SAC');
    });
  });
});

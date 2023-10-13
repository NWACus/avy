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
});

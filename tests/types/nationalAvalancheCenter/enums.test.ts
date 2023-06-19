import {AvalancheProblemSize, numberToProblemSize} from 'types/nationalAvalancheCenter';

describe('numberToProblemSize', () => {
  it('works for expected values', () => {
    expect(numberToProblemSize(1)).toBe(AvalancheProblemSize.Small);
    expect(numberToProblemSize(2)).toBe(AvalancheProblemSize.Large);
    expect(numberToProblemSize(3)).toBe(AvalancheProblemSize.VeryLarge);
    expect(numberToProblemSize(4)).toBe(AvalancheProblemSize.Historic);
  });

  it('rounds up, and clamps values out of range', () => {
    expect(numberToProblemSize(-1)).toBe(AvalancheProblemSize.Small);
    expect(numberToProblemSize(2.3)).toBe(AvalancheProblemSize.Large);
    expect(numberToProblemSize(2.5)).toBe(AvalancheProblemSize.VeryLarge);
    expect(numberToProblemSize(400)).toBe(AvalancheProblemSize.Historic);
  });
});

import { commaNotation, notateNumber } from '@utility/helpers';

export const getHive = (holesObject) => {
  const fishingEff = notateNumber(getEfficiency(holesObject), 'Big');
  const layer = holesObject?.extraCalculations?.[3];
  const caughtBugs = holesObject?.extraCalculations?.[2];
  const reqBugs = 200 * Math.pow(2.2, 1 + layer);

  return {
    fishingEff,
    layer: layer + 1,
    bugs: {
      mined: caughtBugs < 1e9 ? commaNotation(caughtBugs) : notateNumber(caughtBugs, 'Big'),
      required: reqBugs < 1e9 ? commaNotation(reqBugs) : notateNumber(reqBugs, 'Big'),
      maxed: caughtBugs >= reqBugs
    }
  };
}

const getEfficiency = (holesObject) => {
  return (2e4 * Math.pow(1.8, 1 + (holesObject?.extraCalculations[3]))) * .25;
}
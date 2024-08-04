import { Checkbox, FormControl, FormControlLabel, InputLabel, Select, Stack, Typography } from '@mui/material';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import Kitchens from 'components/account/Worlds/World4/Kitchens';
import Meals from '@components/account/Worlds/World4/Meals';
import { NextSeo } from 'next-seo';
import Tabber from '../../../components/common/Tabber';
import { tryToParse } from '@utility/helpers';
import { parseKitchens } from '@parsers/cooking';
import MenuItem from '@mui/material/MenuItem';
import { getPlayerLabChipBonus } from '@parsers/lab';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@components/Tooltip';

const Cooking = () => {
  const { state } = useContext(AppContext);
  const { cooking, achievements, sailing } = state?.account || {};
  const characters = state?.characters?.map(({ name, playerId }) => ({ name, playerId }));
  const [selectedCharacter, setSelectedCharacter] = useState(characters?.[0]);
  const [enableNanoChip, setEnableNanoChip] = useState(false);

  useEffect(() => {
    const hasChip = getPlayerLabChipBonus(selectedCharacter, state?.account, 15);
    const hasGordonius = selectedCharacter?.starSigns?.find(({starName}) => starName === 'Gordonius_Major')?.unlocked;
    setEnableNanoChip(!!hasChip && !!hasGordonius);
  }, [selectedCharacter]);

  const kitchens = useMemo(() => {
    const idleonData = tryToParse(localStorage.getItem('rawJson'));
    if (idleonData) {
      const cookingRaw = tryToParse(idleonData?.data?.Cooking)
      const atomsRaw = tryToParse(idleonData?.data?.Atoms)
      return parseKitchens(cookingRaw, atomsRaw, state?.characters, state?.account, {
        characterIndex: selectedCharacter?.playerId,
        enableNanoChip
      });
    }
    return cooking?.kitchens;
  }, [selectedCharacter, enableNanoChip, state?.account, state?.characters]);

  const totalMealSpeed = useMemo(() => kitchens?.reduce((sum, kitchen) => sum + (kitchen.status === 3
    ? 0
    : kitchen.mealSpeed), 0), [kitchens]);

  return (
    <>
      <NextSeo
        title="Cooking | Idleon Toolbox"
        description="Keep track of your kitchens and meals progression"
      />
      <Stack my={3} direction={'row'} gap={2} alignItems={'center'}>
        <FormControl sx={{ width: 170 }}>
          <InputLabel id="selected-character">Character</InputLabel>
          <Select
            labelId="selected-character"
            id="selected-character"
            value={selectedCharacter?.playerId}
            label="Character"
            onChange={(e) => {
              setSelectedCharacter(characters?.[e.target.value])
            }}
          >
            {characters?.map((character) => <MenuItem key={'option' + character.name}
                                                      value={character?.playerId}>{character.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Stack direction={'row'} alignItems={'center'}>
          <FormControlLabel
            control={<Checkbox name={'enableNanoChip'}
                               checked={enableNanoChip}
                               size={'small'}
            />}
            onChange={(e) => setEnableNanoChip(!enableNanoChip)}
            label={'Enable nano chip'}/>
          <Tooltip title={'Enabling nano chip assumes you have gordonius major star sign *active*'}>
            <InfoIcon fontSize={'small'}></InfoIcon>
          </Tooltip>
        </Stack>
      </Stack>
      <Tabber tabs={['Kitchens', 'Meals']}>
        <Kitchens {...cooking}
                  kitchens={kitchens}
                  achievements={achievements}
                  lastUpdated={state?.lastUpdated}
                  characters={state?.characters}
                  totalMealSpeed={totalMealSpeed}
                  lab={state?.account?.lab}
                  equinoxUpgrades={state?.account?.equinox?.upgrades}
                  account={state?.account}
        />
        <Meals characters={state?.characters}
               {...cooking}
               kitchens={kitchens}
               lab={state?.account?.lab}
               achievements={achievements}
               totalMealSpeed={totalMealSpeed}
               account={state?.account}
               artifacts={sailing?.artifacts}
               equinoxUpgrades={state?.account?.equinox?.upgrades}
        />
      </Tabber>
    </>
  );
};


export default Cooking;

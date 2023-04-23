import React, { useMemo, useState } from "react";
import { Box, Divider, Grid, Stack, Tab, Tabs, Typography, useMediaQuery } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { cleanUnderscore, prefix } from "utility/helpers";

const StarSigns = ({ starSigns, infiniteStars }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  const chronus = useMemo(() => starSigns.filter(({ tree }) => tree === 'chronus'), [starSigns, infiniteStars]);
  const hydron = useMemo(() => starSigns.filter(({ tree }) => tree === 'hydron'), [starSigns, infiniteStars]);
  return (
    <>
      <Tabs centered
            sx={{ marginBottom: 3 }}
            variant={isMd ? 'fullWidth' : 'standard'}
            value={selectedTab} onChange={(e, selected) => setSelectedTab(selected)}>
        {['chronus', 'hydron']?.map((tab, index) => {
          return <Tab label={tab} key={`${tab}-${index}`}/>
        })}
      </Tabs>
      <Stack gap={3}>
        <Grid container>
          <Grid item md={4} sx={{ display: { sm: 'none', md: 'block' } }}>Name</Grid>
          <Grid item xs={8} md={4}>Bonuses</Grid>
          <Grid item xs={2} md={4} pl={5}>Cost</Grid>
        </Grid>
        {(selectedTab === 0 ? chronus : hydron)?.map((starSign, index) => {
          const { starName, cost, unlocked, bonuses } = starSign;
          infiniteStars = selectedTab === 0 ? infiniteStars : infiniteStars - 34
          return (!starName.includes('Filler') && !starName.includes('Unknown')) &&
            <React.Fragment key={name + ' ' + index}>
              <Grid rowGap={2} container>
                <Grid item alignItems={'center'} gap={2} md={4} sx={{
                  display: { sm: 'none', md: 'flex' },
                  justifyContent: { xs: 'center', sm: 'center', md: 'flex-start' }
                }}>
                  {unlocked ? <CheckIcon color={'success'}/> : <Box width={24} height={24}/>}
                  {!isMd ?
                    <>
                      <Typography variant={'body1'} component={'span'}>{cleanUnderscore(starName)}</Typography>
                      {infiniteStars >= index ?
                        <img src={`${prefix}data/SignStarInf${selectedTab === 0 ? 0 : 1}.png`} alt=""/> : null}
                    </> : null}
                </Grid>
                <Grid item sm={7} md={4} display={'flex'} alignItems={'center'} gap={2}>
                  {isMd && unlocked ? <CheckIcon color={'success'}/> : null}
                  <Typography variant={'body1'}
                              component={'span'}>
                    {bonuses?.map(({ rawName, bonus }) => cleanUnderscore(rawName.replace('{', bonus))).join(', ')}
                  </Typography>
                </Grid>
                <Grid item sm={4} md={4}> <Typography variant={'body1'}
                                                      pl={5}
                                                      component={'span'}>{cost}</Typography>
                </Grid>
              </Grid>
              {starSigns.length - 1 !== index ? <Divider/> : null}
            </React.Fragment>
        })}
      </Stack>
    </>
  );
};

export default StarSigns;

import {
  bonuses,
  carryBags,
  classes,
  classFamilyBonuses,
  invBags,
  items,
  mapNames,
  mapPortals,
  monsters,
  starSignByIndexMap
} from "../data/website-data";
import { calculateAfkTime, getHighestLevelOfClass, getMaterialCapacity } from "./misc";
import { createItemsWithUpgrades, getStatFromEquipment } from "./items";
import { getInventory } from "./storage";
import { skillIndexMap } from "./parseMaps";
import { createTalentPage, getActiveBuffs, getTalentBonus, getTalentBonusIfActive, talentPagesMap } from "./talents";
import { calcCardBonus, getEquippedCardBonus, getPlayerCards } from "./cards";
import { getStampBonus, getStampsBonusByEffect } from "./stamps";
import { getPlayerPostOffice, getPostOfficeBonus } from "./postoffice";
import { getBubbleBonus } from "./alchemy";
import { getStatueBonus } from "./statues";
import { getStarSignBonus, getStarSignByEffect } from "./starSigns";
import { getPlayerAnvil } from "./anvil";
import { getPrayerBonusAndCurse } from "./prayers";
import { getGuildBonusBonus } from "./guild";
import { getShrineBonus } from "./shrines";
import { getFamilyBonusBonus } from "./family";
import { getSaltLickBonus } from "./saltLick";
import { getDungeonStatBonus } from "./dungeons";
import { getMealsBonusByEffectOrStat } from "./cooking";
import { getObols, mergeCharacterAndAccountObols } from "./obols";
import { getPlayerWorship } from "./worship";
import { getPlayerQuests } from "./quests";

const { tryToParse, createIndexedArray, createArrayOfArrays } = require("../utility/helpers");

export const getCharacters = (idleonData, charsNames) => {
  const chars = charsNames ? charsNames : [0, 1, 2, 3, 4, 5, 6, 7, 8];
  return chars?.map((charName, playerId) => {
    const characterDetails = Object.entries(idleonData)?.reduce((res, [key, details]) => {
      const reg = new RegExp(`_${playerId}`, 'g');
      if (reg.test(key)) {
        let updatedDetails = tryToParse(details);
        let updatedKey = key;
        let arr = [];
        switch (true) {
          case key.includes('EquipOrder'): {
            updatedKey = `EquipmentOrder`;
            details = createArrayOfArrays(details);
            break;
          }
          case key.includes('EquipQTY'): {
            updatedKey = `EquipmentQuantity`;
            details = createArrayOfArrays(details);
            break;
          }
          case key.includes('AnvilPA_'): {
            updatedKey = `AnvilPA`;
            updatedDetails = createArrayOfArrays(details);
            break;
          }
          case key.includes('EMm0'): {
            updatedKey = `EquipmentMap`;
            arr = res?.[updatedKey];
            const det = createIndexedArray(updatedDetails);
            if (arr) {
              arr.splice(0, 0, det);
            } else {
              arr = [det];
            }
            break;
          }
          case key.includes('EMm1'): {
            updatedKey = `EquipmentMap`;
            arr = res?.[updatedKey];
            const det = createIndexedArray(updatedDetails);
            if (arr) {
              arr.splice(1, 0, det);
            } else {
              arr = [det];
            }
            break;
          }
          case key.includes('BuffsActive'): {
            updatedKey = `BuffsActive`;
            arr = createArrayOfArrays(updatedDetails);
            break;
          }
          case key.includes('ItemQTY'): {
            updatedKey = `ItemQuantity`;
            break;
          }
          case key.includes('PVStatList'): {
            updatedKey = `PersonalValuesMap`;
            updatedDetails = { ...(res?.[updatedKey] || {}), StatList: tryToParse(details) };
            break;
          }
          case key.includes('PVtStarSign'): {
            updatedKey = `PersonalValuesMap`;
            updatedDetails = { ...(res?.[updatedKey] || {}), StarSign: tryToParse(details) };
            break;
          }
          case key.includes('ObolEqO0'): {
            updatedKey = `ObolEquippedOrder`;
            break;
          }
          case key.includes('ObolEqMAP'): {
            updatedKey = `ObolEquippedMap`;
            break;
          }
          case key.includes('SL_'): {
            updatedKey = `SkillLevels`;
            break;
          }
          case key.includes('SM_'): {
            updatedKey = `SkillLevelsMAX`;
            break;
          }
          case key.includes('KLA_'): {
            updatedKey = `KillsLeft2Advance`;
            break;
          }
          case key.includes('AtkCD_'): {
            updatedKey = `AttackCooldowns`;
            break;
          }
          case key.includes('POu_'): {
            updatedKey = `PostOfficeInfo`;
            break;
          }
          case key.includes('PTimeAway'): {
            updatedKey = `PlayerAwayTime`;
            updatedDetails = updatedDetails * 1e3;
            break;
          }
          default : {
            updatedKey = key?.split('_')?.[0];
            break;
          }
        }
        return { ...res, [updatedKey]: arr?.length ? arr : updatedDetails }
      }
      return {...res,  };
    }, {});
    return {
      name: charName,
      playerId,
      ...characterDetails
    }
  })
}

export const initializeCharacter = (char, charactersLevels, account) => {
  const character = {};
  character.playerId = char.playerId;
  character.name = char.name;
  character.class = classes?.[char?.CharacterClass];
  character.afkTime = calculateAfkTime(char?.PlayerAwayTime, account?.timeAway?.GlobalTime);
  character.afkTarget = monsters?.[char?.AFKtarget]?.Name;
  const currentMapIndex = char?.CurrentMap;
  character.mapIndex = currentMapIndex;
  character.currentMap = mapNames?.[currentMapIndex];
  character.money = parseInt(char?.Money);
  character.cooldowns = char?.[`AttackCooldowns`];
  const statMap = { 0: 'strength', 1: 'agility', 2: 'wisdom', 3: 'luck', 4: 'level' };
  character.stats = char?.PersonalValuesMap?.StatList?.reduce((res, statValue, index) => ({
    ...res,
    [statMap[index]]: statValue
  }), {});
  character.level = character.stats.level;
  // inventory bags used
  const rawInvBagsUsed = char?.[`InvBagsUsed`]
  const bags = Object.keys(rawInvBagsUsed);
  character.invBagsUsed = Object.entries(invBags).map(([bagName, details]) => {
    const bagNumber = bagName.match(/[0-9]+/g)[0];
    if (bags.includes(bagNumber)) {
      return { ...details, rawName: bagName, acquired: true };
    }
    return { ...details, rawName: bagName };
  });
  const carryCapacityObject = char?.[`MaxCarryCap`];
  character.carryCapBags = Object.keys(carryCapacityObject).map((bagName) => (carryBags?.[bagName]?.[carryCapacityObject[bagName]])).filter(bag => bag);

  character.statues = char?.StatueLevels;

  // equipment indices (0 = armor, 1 = tools, 2 = food)
  const equipmentMapping = { 0: "armor", 1: "tools", 2: "food" };
  const equippableNames = char?.[
    `EquipmentOrder`
    ]?.reduce(
    (result, item, index) => ({
      ...result,
      [equipmentMapping?.[index]]: item,
    }), {});
  const equipapbleAmount = char[`EquipmentQuantity`]?.reduce((result, item, index) => ({
    ...result,
    [equipmentMapping?.[index]]: item,
  }), {});

  const equipmentStoneData = char[`EquipmentMap`]?.[0];
  character.equipment = createItemsWithUpgrades(equippableNames.armor, equipmentStoneData, character.name);
  const toolsStoneData = char[`EquipmentMap`]?.[1];
  character.tools = createItemsWithUpgrades(equippableNames.tools, toolsStoneData, character.name);
  character.food = Array.from(Object.values(equippableNames.food)).reduce((res, item, index) =>
    item
      ? [...res, {
        name: items?.[item]?.displayName,
        rawName: item,
        owner: character.name,
        amount: parseInt(equipapbleAmount.food[index] || equipapbleAmount.food[index]),
        ...(items?.[item] || {})
      }] : res, []);

  const inventoryArr = char[`InventoryOrder`];
  const inventoryQuantityArr = char[`ItemQuantity`];
  character.inventory = getInventory(inventoryArr, inventoryQuantityArr, character.name);

  // star signs
  const starSignsObject = char?.PersonalValuesMap?.StarSign;
  character.starSigns = starSignsObject
    .split(",")
    .map((starSign) => {
      if (!starSign || starSign === '_') return null;
      return starSignByIndexMap?.[starSign];
    })
    .filter(item => item);

  character.equippedBubbles = account?.equippedBubbles?.[char?.playerId];
  const levelsRaw = char?.[`Exp0`];
  const levelsReqRaw = char?.[`ExpReq0`];
  const skillsInfoObject = char?.[`Lv0`];

  character.skillsInfo = skillsInfoObject.reduce(
    (res, level, index) =>
      index < 13 ? {
        ...res,
        [skillIndexMap[index]?.name]: {
          level: level !== -1 ? level : 0,
          exp: parseFloat(levelsRaw[index]),
          expReq: parseFloat(levelsReqRaw[index]),
          icon: skillIndexMap[index]?.icon
        },
      } : res, {});

  const talentsObject = char?.[`SkillLevels`];
  const maxTalentsObject = char?.[`SkillLevelsMAX`];
  const pages = talentPagesMap?.[character?.class];
  const {
    flat: flatTalents,
    talents
  } = createTalentPage(character?.class, pages, talentsObject, maxTalentsObject);
  character.talents = talents;
  character.flatTalents = flatTalents;
  const {
    flat: flatStarTalents,
    talents: orderedStarTalents
  } = createTalentPage(character?.class, ["Special Talent 1", "Special Talent 2", "Special Talent 3"], talentsObject, maxTalentsObject, true);
  character.starTalents = orderedStarTalents;
  character.flatStarTalents = flatStarTalents;

  const activeBuffs = char?.[`BuffsActive`];
  character.activeBuffs = getActiveBuffs(activeBuffs, [...flatTalents, ...flatStarTalents]);

  character.activePrayers = char?.Prayers?.filter((prayer) => prayer !== -1).map((prayerId) => account?.prayers?.[prayerId]);
  character.postOffice = getPlayerPostOffice(char?.PostOfficeInfo, account);
  character.cards = getPlayerCards(char, account);
  character.anvil = getPlayerAnvil(char, character, account, charactersLevels);
  const charObols = getObols(char, false);
  character.obols = {
    ...charObols,
    stats: mergeCharacterAndAccountObols(charObols, account.obols)
  };
  character.worship = getPlayerWorship(character, pages, account, char?.PlayerStuff?.[0]);
  character.quests = getPlayerQuests(char?.QuestComplete);
  character.crystalSpawnChance = getPlayerCrystalChance(character, account);

  const kills = char?.[`KillsLeft2Advance`];
  character.kills = kills?.reduce((res, map, index) => [...res, parseFloat(mapPortals?.[index]?.[0]) - parseFloat(map?.[0])], []);
  character.nextPortal = {
    goal: mapPortals?.[currentMapIndex]?.[0] ?? 0,
    current: parseFloat(mapPortals?.[currentMapIndex]?.[0]) - parseFloat(kills?.[currentMapIndex]) ?? 0
  };
  return character;
}

export const getPlayerCrystalChance = (character, account) => {
  const crystalShrineBonus = getShrineBonus(account?.shrines, 6, character.mapIndex, character.cards, 'Z9');
  const crystallinStampBonus = getStampBonus(account?.stamps, 'misc', 'StampC3', 0);
  const poopCard = character?.cards?.equippedCards?.find(({ cardIndex }) => cardIndex === 'A10');
  const poopCardBonus = poopCard ? calcCardBonus(poopCard) : 0;
  const demonGenie = character?.cards?.equippedCards?.find(({ cardIndex }) => cardIndex === 'G4');
  const demonGenieBonus = demonGenie ? calcCardBonus(demonGenie) : 0;
  const crystals4DaysBonus = getTalentBonus(character?.starTalents, null, 'CRYSTALS_4_DAYYS');
  const cmonOutCrystalsBonus = getTalentBonus(character?.talents, 1, 'CMON_OUT_CRYSTALS');
  const nonPredatoryBoxBonus = getPostOfficeBonus(character?.postOffice, 'Non_Predatory_Loot_Box', 2);

  return 0.0005 * (1 + cmonOutCrystalsBonus / 100) * (1 + (nonPredatoryBoxBonus + crystalShrineBonus) / 100) * (1 + crystals4DaysBonus / 100)
    * (1 + crystallinStampBonus / 100) * (1 + (poopCardBonus + demonGenieBonus) / 100);
}

export const getPlayerFoodBonus = (character, statues, stamps) => {
  const postOfficeBonus = getPostOfficeBonus(character?.postOffice, 'Carepack_From_Mum', 2)
  const statuePower = getStatueBonus(statues, 'StatueG4', character?.talents);
  const equipmentFoodEffectBonus = character?.equipment?.reduce((res, item) => res + getStatFromEquipment(item, bonuses?.etcBonuses?.[9]), 0);
  const stampBonus = getStampsBonusByEffect(stamps, 'Boost_Food_Effect', 0)
  const starSignBonus = getStarSignBonus(character?.starSigns, 'Mount_Eaterest', 'All_Food_Effect');
  const cardBonus = getEquippedCardBonus(character?.cards, 'Y5');
  const cardSet = character?.cards?.cardSet?.rawName === 'CardSet1' ? character?.cards?.cardSet?.bonus : 0;
  const talentBonus = getTalentBonus(character?.starTalents, null, 'FROTHY_MALK');
  return 1 + (postOfficeBonus + (statuePower +
    (equipmentFoodEffectBonus + (stampBonus + ((starSignBonus) +
      (cardBonus + (cardSet + talentBonus))))))) / 100;
}

export const getPlayerSpeedBonus = (speedBonusFromPotions, character, playerChips, statues, saltLicks, stamps) => {
  let finalSpeed;
  const featherWeight = getTalentBonus(character?.talents, 0, 'FEATHERWEIGHT');
  const featherFlight = getTalentBonus(character?.talents, 0, 'FEATHER_FLIGHT');
  const stampBonus = getStampsBonusByEffect(stamps, 'Base_Move_Speed', 0)
  const strafe = getTalentBonusIfActive(character?.activeBuffs, 'STRAFE');
  let baseMath = speedBonusFromPotions + featherWeight + stampBonus + strafe;
  let agiMulti;
  if (character.stats?.agility < 1000) {
    agiMulti = (Math.pow(character.stats?.agility + 1, .4) - 1) / 40;
  } else {
    agiMulti = (character.stats?.agility - 1e3) / (character.stats?.agility + 2500) * .5 + .371;
  }
  const statuePower = getStatueBonus(statues, 'StatueG2', character?.talents);
  // const speedFromStatue = 1 + (speedBonusFromPotions + (statuePower) / 2.2);
  const speedStarSign = getStarSignByEffect(character?.starSigns, 'Movement_Speed');
  const equipmentSpeedEffectBonus = character?.equipment?.reduce((res, item) => res + getStatFromEquipment(item, bonuses?.etcBonuses?.[1]), 0);
  const cardBonus = getEquippedCardBonus(character?.cards, 'A5');
  finalSpeed = (baseMath + (statuePower + ((speedStarSign) + (equipmentSpeedEffectBonus + (cardBonus + featherFlight))))) / 100; // 1.708730398284699
  finalSpeed = 1 + (finalSpeed + (agiMulti) / 2.2); // 2.829035843985983
  const tipToeQuickness = getTalentBonus(character?.starTalents, null, 'TIPTOE_QUICKNESS');
  if (finalSpeed > 2) {
    finalSpeed = Math.floor(100 * finalSpeed) / 100;
  } else if (finalSpeed > 1.75) {
    finalSpeed = Math.min(2, Math.floor(100 * ((finalSpeed) + tipToeQuickness / 100)) / 100)
  } else {
    const saltLickBonus = getSaltLickBonus(saltLicks, 7);
    const groundedMotherboard = playerChips.find((chip) => chip.index === 15)?.baseVal ?? 0;
    finalSpeed = Math.min(1.75, Math.floor(100 * (finalSpeed + (saltLickBonus + groundedMotherboard + tipToeQuickness) / 100)) / 100)
  }
  // 2 < (finalSpeed) ? (s = b.engine.getGameAttribute("DummyNumbersStatManager"),
  return Math.round(finalSpeed * 100);
}

export const getAfkGain = (character, skillName, bribes, arcadeShop, dungeonUpgrades, playerChips, afkGainsTask, guildBonuses, optionsList, shrines) => {
  const afkGainsTaskBonus = afkGainsTask < character?.playerId ? 2 : 0;
  if (skillName !== 'fighting') {
    let guildAfkGains = 0;
    const amarokBonus = getEquippedCardBonus(character?.cards, 'Z2');
    const bunnyBonus = getEquippedCardBonus(character?.cards, 'F7');
    if (guildBonuses.length > 0) {
      guildAfkGains = getGuildBonusBonus(guildBonuses, 7);
    }
    const cardSet = character?.cards?.cardSet?.rawName === 'CardSet7' ? character?.cards?.cardSet?.bonus : 0;
    const conductiveProcessor = playerChips.find((chip) => chip.index === 8)?.baseVal ?? 0;
    const equipmentAfkEffectBonus = character?.equipment?.reduce((res, item) => res + getStatFromEquipment(item, bonuses?.etcBonuses?.[24]), 0);
    const equipmentShrineEffectBonus = character?.equipment?.reduce((res, item) => res + getStatFromEquipment(item, bonuses?.etcBonuses?.[59]), 0);
    const zergRushogen = getPrayerBonusAndCurse(character?.prayers, 'Zerg_Rushogen')?.bonus;
    const ruckSack = getPrayerBonusAndCurse(character?.prayers, 'Ruck_Sack')?.curse;
    const nonFightingGains = 2 + (amarokBonus + bunnyBonus) + (guildAfkGains + cardSet +
      (conductiveProcessor + (equipmentAfkEffectBonus + equipmentShrineEffectBonus + (zergRushogen - ruckSack))));
    const dungeonAfkGains = getDungeonStatBonus(dungeonUpgrades, 'AFK_Gains');
    const arcadeAfkGains = arcadeShop?.[6]?.bonus ?? 0;
    const baseMath = (nonFightingGains) + (arcadeAfkGains + dungeonAfkGains);

    if ("cooking") {
      const tickTockBonus = getTalentBonus(character?.starTalents, null, 'TICK_TOCK');
      const trappingBonus = getTrappingStuff('TrapMGbonus', 8, optionsList)
      const starSignAfkGains = getStarSignByEffect(character?.starSigns, 'Skill_AFK_Gain');
      const bribeAfkGains = bribes?.[24]?.done ? bribes?.[24]?.value : 0;
      let afkGains = .25 + (tickTockBonus + (baseMath + (trappingBonus + ((starSignAfkGains) + bribeAfkGains)))) / 100;
      if (afkGains < .8) {
        const shrineAfkGains = getShrineBonus(shrines, 8, character?.mapIndex, character.cards, 'Z9');
        afkGains = Math.min(.8, afkGains + shrineAfkGains / 100);
      }
      return afkGains;
    }
  }
  return 1;
}

const getTrappingStuff = (type, index, optionsList) => {
  if (type === 'TrapMGbonus') {
    const value = optionsList?.[99];
    if (value >= 25 * (index + 1)) {
      const parsed = randomList?.[59]?.split(' ')?.map((num) => parseFloat(num));
      return parsed?.[index];
    }
    return 0;
  }
  return 1;
}

export const allProwess = (character, meals, bubbles) => {
  const prowessBubble = getBubbleBonus(bubbles, 'kazam', 'PROWESESSARY', false);
  const starSignProwess = getStarSignByEffect(character?.starSigns, 'All_Skill_Prowess');
  const skillProwessMeals = getMealsBonusByEffectOrStat(meals, null, 'Sprow')
  return Math.max(0, Math.min(.1, (prowessBubble - 1) / 10 + (.001 * (starSignProwess) + 5e-4 * skillProwessMeals)));
}

export const getAllBaseSkillEff = (character, playerChips, jewels) => {
  const baseAllEffBox = getPostOfficeBonus(character?.postOffice, 'Myriad_Crate', 1);
  const galvanicMotherboard = playerChips.find((chip) => chip.index === 11)?.baseVal ?? 0;
  const superSource = getTalentBonus(character?.starTalents, null, 'SUPERSOURCE');
  const emeraldNavetteBonus = jewels.filter(jewel => jewel.active && jewel.name === 'Emerald_Navette').reduce((sum, jewel) => sum += (jewel.bonus * jewel.multiplier), 0);
  return (baseAllEffBox) + galvanicMotherboard + (superSource + emeraldNavetteBonus);
}

export const getAllEff = (character, meals, playerChips, cards, guildBonuses, charactersLevels) => {
  // family bonus - 19.655172413793103
  const highestLevelHunter = getHighestLevelOfClass(charactersLevels, 'Hunter');
  const familyEffBonus = getFamilyBonusBonus(classFamilyBonuses, 'EFFICIENCY_FOR_ALL_SKILLS', highestLevelHunter);
  const equipmentEffEffectBonus = character?.equipment?.reduce((res, item) => res + getStatFromEquipment(item, bonuses?.etcBonuses?.[48]), 0);
  const mealEff = getMealsBonusByEffectOrStat(meals, null, 'Seff');
  const groundedMotherboard = playerChips.find((chip) => chip.index === 11)?.baseVal ?? 0;
  const chaoticTrollBonus = getEquippedCardBonus(character?.cards, 'Boss4B');
  const cardSet = character?.cards?.cardSet?.rawName === 'CardSet2' ? character?.cards?.cardSet?.bonus : 0;
  const skilledDimwit = getPrayerBonusAndCurse(character?.prayers, 'Skilled_Dimwit')?.bonus;
  const balanceOfProficiency = getPrayerBonusAndCurse(character?.prayers, 'Balance_of_Proficiency')?.curse;
  const maestroTransfusion = getTalentBonusIfActive(character?.activeBuffs, 'MAESTRO_TRANSFUSION');
  let guildSKillEff = 0;
  if (guildBonuses.length > 0) {
    guildSKillEff = getGuildBonusBonus(guildBonuses, 6);
  }
  return (1 + ((familyEffBonus) + equipmentEffEffectBonus) / 100) *
    (1 + (mealEff + groundedMotherboard) / 100)
    * (1 + chaoticTrollBonus / 100)
    * (1 + (guildSKillEff + (cardSet + skilledDimwit)) / 100)
    * Math.max(1 - (maestroTransfusion + balanceOfProficiency) / 100, .01)
}

export const getPlayerCapacity = (bag, capacities) => {
  if (bag) {
    return getMaterialCapacity(bag, capacities);
  }
  return 50; // TODO: check for better solution
}


export const getSmithingExpMulti = (focusedSoulTalentBonus, happyDudeTalentBonus, smithingCards, blackSmithBoxBonus0, allSkillExp, leftHandOfLearningTalentBonus) => {
  const talentsBonus = 1 + (focusedSoulTalentBonus + happyDudeTalentBonus) / 100;
  const cardsBonus = 1 + (smithingCards) / 100;
  return Math.max(0.1, talentsBonus * cardsBonus * (1 + blackSmithBoxBonus0 / 100) + (allSkillExp + leftHandOfLearningTalentBonus) / 100);
}

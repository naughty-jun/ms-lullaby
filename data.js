// =============================================================
// 定数定義ファイル
// キャラクターとわくわくの実のマスターデータを定義する。
// ロジックは持たず、純粋なデータのみを扱う。
// =============================================================

// 種族
const RACE = {
  SUBHUMAN: "亜人",
  FAIRY: "妖精",
};

// 撃種
const HIT_TYPE = {
  PENETRATE: "貫通",
  REFLECT: "反射",
};

// 戦型
const BATTLE_TYPE = {
  BALANCE: "バランス",
  SPEED: "スピード",
  POWER: "パワー",
  GUN: "砲撃",
};

// -------------------------------------------------------------
// レベル上限(上限解放の2択)
const LEVEL = {
  LV99: "99",
  LV120: "120",
};

// キャラクター定義
// statsByLevel: レベル上限ごとの { attack, hp } (Lv99 / Lv120)。値は暫定。
// -------------------------------------------------------------
const CHARACTERS = [
  {
    id: "mirai",
    name: "ミライ",
    race: RACE.SUBHUMAN,
    hitType: HIT_TYPE.PENETRATE,
    battleType: BATTLE_TYPE.BALANCE,
    statsByLevel: {
      99: { attack: 30777, hp: 21143 },
      120: { attack: 31377, hp: 22143 },
    },
  },
  {
    id: "kelon",
    name: "ケロン",
    race: RACE.SUBHUMAN,
    hitType: HIT_TYPE.PENETRATE,
    battleType: BATTLE_TYPE.BALANCE,
    // Lv120 のみ(Lv99 は存在しない)
    statsByLevel: {
      120: { attack: 24465, hp: 25114 },
    },
  },
  {
    id: "gimlet",
    name: "ギムレット",
    race: RACE.FAIRY,
    hitType: HIT_TYPE.PENETRATE,
    battleType: BATTLE_TYPE.SPEED,
    // Lv120 のみ(Lv99 は存在しない)
    statsByLevel: {
      120: { attack: 23862, hp: 23811 },
    },
  },
  {
    id: "chernobog",
    name: "チェルノボグ",
    race: RACE.SUBHUMAN,
    hitType: HIT_TYPE.PENETRATE,
    battleType: BATTLE_TYPE.BALANCE,
    statsByLevel: {
      99: { attack: 27080, hp: 22709 },
      120: { attack: 27933, hp: 24067 },
    },
  },
];

// -------------------------------------------------------------
// わくわくの実の効果種別
// 同グループ(同種族/同撃種/同戦型)のキャラへステータスを付与する。
// -------------------------------------------------------------
const EFFECT_KIND = {
  // ステータス付与系。対象グループ単位で重複(デッキ全体で同グループ1つのみ有効)
  RACE: "race", // 同族系: 同じ種族のキャラへ付与
  HIT_TYPE: "hitType", // 撃種系: 同じ撃種のキャラへ付与
  BATTLE_TYPE: "battleType", // 戦型系: 同じ戦型のキャラへ付与
  // ステータス非影響系。重複スコープが異なる
  DECK_UNIQUE: "deckUnique", // デッキ全体で1つのみ有効(将命削り・兵命削り)
  SLOT_UNIQUE: "slotUnique", // 同一キャラ内で1つのみ有効(ケガ減り・速必殺)
};

// グレード
const GRADE = {
  L: "L",
  EL: "EL",
};

// -------------------------------------------------------------
// わくわくの実定義
// - kind: 効果対象グループの種類
// - stats: グレードごとの { attack, hp } 加算値
// 重複ルールは kind により決まる(calc.js が判定):
//   RACE/HIT_TYPE/BATTLE_TYPE ... デッキ全体で同じ対象グループは1つのみ有効
//   DECK_UNIQUE               ... デッキ全体で1つのみ有効
//   SLOT_UNIQUE               ... 同一キャラ内で1つのみ有効
// 効果値の出典: GameWith「わくわくの実の効果と排出一覧」(特級L / 特級EL)
// -------------------------------------------------------------
const WAKUWAKU_FRUITS = [
  // --- 同族系 ---
  {
    id: "race_attack",
    name: "同族の絆・加撃",
    kind: EFFECT_KIND.RACE,
    stats: { L: { attack: 3000, hp: 0 }, EL: { attack: 3300, hp: 0 } },
  },
  {
    id: "race_hp",
    name: "同族の絆・加命",
    kind: EFFECT_KIND.RACE,
    stats: { L: { attack: 0, hp: 2500 }, EL: { attack: 0, hp: 2750 } },
  },
  {
    id: "race_attack_speed",
    name: "同族の絆・加撃速",
    kind: EFFECT_KIND.RACE,
    stats: { L: { attack: 2000, hp: 0 }, EL: { attack: 2200, hp: 0 } },
  },
  {
    id: "race_speed_hp",
    name: "同族の絆・加速命",
    kind: EFFECT_KIND.RACE,
    stats: { L: { attack: 0, hp: 2000 }, EL: { attack: 0, hp: 2200 } },
  },
  {
    id: "race_hp_attack",
    name: "同族の絆・加命撃",
    kind: EFFECT_KIND.RACE,
    stats: { L: { attack: 2000, hp: 2000 }, EL: { attack: 2200, hp: 2200 } },
  },

  // --- 撃種系 ---
  {
    id: "hit_attack",
    name: "撃種の絆・加撃",
    kind: EFFECT_KIND.HIT_TYPE,
    stats: { L: { attack: 1500, hp: 0 }, EL: { attack: 1650, hp: 0 } },
  },
  {
    id: "hit_hp",
    name: "撃種の絆・加命",
    kind: EFFECT_KIND.HIT_TYPE,
    stats: { L: { attack: 0, hp: 1250 }, EL: { attack: 0, hp: 1375 } },
  },
  {
    id: "hit_attack_speed",
    name: "撃種の絆・加撃速",
    kind: EFFECT_KIND.HIT_TYPE,
    stats: { L: { attack: 1000, hp: 0 }, EL: { attack: 1100, hp: 0 } },
  },
  {
    id: "hit_speed_hp",
    name: "撃種の絆・加速命",
    kind: EFFECT_KIND.HIT_TYPE,
    stats: { L: { attack: 0, hp: 1000 }, EL: { attack: 0, hp: 1100 } },
  },
  {
    id: "hit_hp_attack",
    name: "撃種の絆・加命撃",
    kind: EFFECT_KIND.HIT_TYPE,
    stats: { L: { attack: 1000, hp: 1000 }, EL: { attack: 1100, hp: 1100 } },
  },

  // --- 戦型系 ---
  {
    id: "battle_attack",
    name: "戦型の絆・加撃",
    kind: EFFECT_KIND.BATTLE_TYPE,
    stats: { L: { attack: 1500, hp: 0 }, EL: { attack: 1650, hp: 0 } },
  },
  {
    id: "battle_hp",
    name: "戦型の絆・加命",
    kind: EFFECT_KIND.BATTLE_TYPE,
    stats: { L: { attack: 0, hp: 1250 }, EL: { attack: 0, hp: 1375 } },
  },
  {
    id: "battle_attack_speed",
    name: "戦型の絆・加撃速",
    kind: EFFECT_KIND.BATTLE_TYPE,
    stats: { L: { attack: 1000, hp: 0 }, EL: { attack: 1100, hp: 0 } },
  },
  {
    id: "battle_speed_hp",
    name: "戦型の絆・加速命",
    kind: EFFECT_KIND.BATTLE_TYPE,
    stats: { L: { attack: 0, hp: 1000 }, EL: { attack: 0, hp: 1100 } },
  },
  {
    id: "battle_hp_attack",
    name: "戦型の絆・加命撃",
    kind: EFFECT_KIND.BATTLE_TYPE,
    stats: { L: { attack: 1000, hp: 1000 }, EL: { attack: 1100, hp: 1100 } },
  },

  // --- ステータスに影響しない実(選択肢としては用意) ---
  {
    id: "fast_special",
    name: "速必殺の力",
    kind: EFFECT_KIND.SLOT_UNIQUE,
    stats: { L: { attack: 0, hp: 0 }, EL: { attack: 0, hp: 0 } },
  },
  {
    id: "damage_cut",
    name: "ケガ減りの力",
    kind: EFFECT_KIND.SLOT_UNIQUE,
    stats: { L: { attack: 0, hp: 0 }, EL: { attack: 0, hp: 0 } },
  },
  {
    id: "boss_hp_cut",
    name: "将命削りの力",
    kind: EFFECT_KIND.DECK_UNIQUE,
    stats: { L: { attack: 0, hp: 0 }, EL: { attack: 0, hp: 0 } },
  },
  {
    id: "mob_hp_cut",
    name: "兵命削りの力",
    kind: EFFECT_KIND.DECK_UNIQUE,
    stats: { L: { attack: 0, hp: 0 }, EL: { attack: 0, hp: 0 } },
  },
];

// デッキ・装備の上限
const DECK_SIZE = 4;
const MAX_FRUITS_PER_CHARACTER = 4;

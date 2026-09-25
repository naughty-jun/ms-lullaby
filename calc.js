// =============================================================
// 計算ロジック(純粋関数の集合)
// UI(Vue)には依存しない。デッキ状態を受け取り、集計値を返す。
// 各関数は1つの責務のみを持ち、副作用を持たない。
//
// 用語:
//   slot  ... デッキの1枠。{ characterId, fruits: [{ fruitId, grade }] }
//   deck  ... slot の配列 (長さ DECK_SIZE)
// =============================================================

// slot からキャラ定義を引く
function findCharacter(characterId) {
  return CHARACTERS.find((character) => character.id === characterId) ?? null;
}

// fruitId から実定義を引く
function findFruit(fruitId) {
  return WAKUWAKU_FRUITS.find((fruit) => fruit.id === fruitId) ?? null;
}

// キャラが指定レベル上限のステータスを持つか
function characterHasLevel(character, level) {
  return !!character && !!character.statsByLevel[level];
}

// キャラが選べるレベル上限の一覧を返す(定義順)
function availableLevels(character) {
  if (!character) return [];
  return [LEVEL.LV99, LEVEL.LV120].filter((level) =>
    characterHasLevel(character, level)
  );
}

// キャラのデフォルトレベル上限を返す(Lv99 があれば Lv99、なければ Lv120)
function defaultLevelOf(character) {
  return availableLevels(character)[0] ?? LEVEL.LV120;
}

// スロットの有効なレベル上限を返す。
// slot.level をそのキャラが持たない場合はデフォルトへフォールバックする。
function slotLevel(slot) {
  const character = findCharacter(slot.characterId);
  if (characterHasLevel(character, slot.level)) return slot.level;
  return defaultLevelOf(character);
}

// スロットの素ステータス { attack, hp } を返す。レベル上限を反映する。
function baseStatOf(slot) {
  const character = findCharacter(slot.characterId);
  if (!character) return { attack: 0, hp: 0 };
  return character.statsByLevel[slotLevel(slot)] ?? { attack: 0, hp: 0 };
}

// 実1個のステータス加算値 { attack, hp }(グレード適用済み)を返す
function fruitStatValue(equippedFruit) {
  const fruit = findFruit(equippedFruit.fruitId);
  if (!fruit) return { attack: 0, hp: 0 };
  return fruit.stats[equippedFruit.grade] ?? { attack: 0, hp: 0 };
}

// グレードの強さ順位(高いほど上位)。重複時にどちらを残すか判定するのに使う
function gradeRank(grade) {
  return grade === GRADE.EL ? 2 : 1;
}

// 実の効果対象となるキャラ属性値を返す (種族/撃種/戦型)。対象外なら null
function targetAttributeOf(character, fruitKind) {
  if (fruitKind === EFFECT_KIND.RACE) return character.race;
  if (fruitKind === EFFECT_KIND.HIT_TYPE) return character.hitType;
  if (fruitKind === EFFECT_KIND.BATTLE_TYPE) return character.battleType;
  return null;
}

// 対象グループ単位で重複するステータス付与系の種別か
function isGroupStatKind(kind) {
  return (
    kind === EFFECT_KIND.RACE ||
    kind === EFFECT_KIND.HIT_TYPE ||
    kind === EFFECT_KIND.BATTLE_TYPE
  );
}

// デッキ上の全装備を1件ずつ平坦化した配列を返す
// 戻り値: [{ fruitId, kind, attribute, grade, attack, hp, slotIndex }]
function flattenEquippedFruits(deck) {
  return deck.flatMap((slot, slotIndex) => effectsOfSlot(slot, slotIndex));
}

// 装備枠が実をセット済みか(空枠でないか)
function isFruitEquipped(equippedFruit) {
  return !!equippedFruit && !!equippedFruit.fruitId;
}

// 1スロットが生む効果を配列で返す(空枠は除外)
function effectsOfSlot(slot, slotIndex) {
  const character = findCharacter(slot.characterId);
  if (!character) return [];
  return slot.fruits
    .map((equippedFruit, fruitIndex) =>
      effectOfEquippedFruit(character, equippedFruit, slotIndex, fruitIndex)
    )
    .filter((effect) => effect !== null);
}

// 装備した実1個の効果を1件にまとめる。空枠なら null。
function effectOfEquippedFruit(ownerCharacter, equippedFruit, slotIndex, fruitIndex) {
  if (!isFruitEquipped(equippedFruit)) return null;
  const fruit = findFruit(equippedFruit.fruitId);
  const stat = fruitStatValue(equippedFruit);
  return {
    fruitId: equippedFruit.fruitId,
    kind: fruit ? fruit.kind : null,
    attribute: fruit ? targetAttributeOf(ownerCharacter, fruit.kind) : null,
    grade: equippedFruit.grade,
    attack: stat.attack,
    hp: stat.hp,
    slotIndex,
    sourceFruitIndex: fruitIndex,
  };
}

// ステータス(攻撃/HP)を付与する効果か(グループ系のみ)
function isStatEffect(effect) {
  return isGroupStatKind(effect.kind);
}

// 効果の重複判定キーを返す。スコープは kind により異なる。
//   グループ系  : 実 + 対象グループ (デッキ全体で判定)
//   DECK_UNIQUE : 実のみ           (デッキ全体で判定)
//   SLOT_UNIQUE : 実 + スロット     (同一キャラ内で判定)
function effectKey(effect) {
  if (effect.kind === EFFECT_KIND.DECK_UNIQUE) return `${effect.fruitId}`;
  if (effect.kind === EFFECT_KIND.SLOT_UNIQUE) {
    return `${effect.fruitId}::slot${effect.slotIndex}`;
  }
  return `${effect.fruitId}::${effect.attribute}`;
}

// 同一効果(同じ実 かつ 同じ対象グループ)は重複無効。
// 各効果キーで最高グレードの1件だけを残して返す。
// 戻り値: [{ kind, attribute, grade, attack, hp }]
function collectEffects(deck) {
  const byKey = new Map();
  flattenEquippedFruits(deck)
    .filter(isStatEffect)
    .forEach((effect) => keepStrongerEffect(byKey, effect));
  return [...byKey.values()];
}

// Map に効果キーごとの最高グレードの効果を残す
function keepStrongerEffect(byKey, effect) {
  const key = effectKey(effect);
  const current = byKey.get(key);
  if (!current || gradeRank(effect.grade) > gradeRank(current.grade)) {
    byKey.set(key, effect);
  }
}

// 1つの効果が対象キャラに適用されるか判定(グループ系のみ)
function isEffectApplicable(effect, character) {
  if (!isGroupStatKind(effect.kind)) return false;
  const characterAttribute = targetAttributeOf(character, effect.kind);
  return characterAttribute === effect.attribute;
}

// あるキャラに適用される効果だけを返す(effects は重複排除済みの前提)
function effectsAppliedTo(character, effects) {
  return effects.filter((effect) => isEffectApplicable(effect, character));
}

// あるキャラが受ける攻撃力ボーナス合計を返す
function attackBonusFor(character, effects) {
  return effectsAppliedTo(character, effects).reduce(
    (sum, effect) => sum + effect.attack,
    0
  );
}

// あるキャラが受けるHPボーナス合計を返す
function hpBonusFor(character, effects) {
  return effectsAppliedTo(character, effects).reduce(
    (sum, effect) => sum + effect.hp,
    0
  );
}

// 1スロットの最終攻撃力を返す(素の攻撃力 + ボーナス)
function slotAttack(slot, effects) {
  const character = findCharacter(slot.characterId);
  if (!character) return 0;
  return baseStatOf(slot).attack + attackBonusFor(character, effects);
}

// 1スロットの最終HPを返す(素のHP + ボーナス)
function slotHp(slot, effects) {
  const character = findCharacter(slot.characterId);
  if (!character) return 0;
  return baseStatOf(slot).hp + hpBonusFor(character, effects);
}

// デッキ全スロットの最終攻撃力配列を返す
function deckAttacks(deck) {
  const effects = collectEffects(deck);
  return deck.map((slot) => slotAttack(slot, effects));
}

// デッキ全スロットの最終HP配列を返す
function deckHps(deck) {
  const effects = collectEffects(deck);
  return deck.map((slot) => slotHp(slot, effects));
}

// デッキ合計HPを返す
function deckTotalHp(deck) {
  const effects = collectEffects(deck);
  return deck.reduce((sum, slot) => sum + slotHp(slot, effects), 0);
}

// 効果キーごとの装備個数を返す。キーのスコープは kind により異なる(effectKey 参照)。
// 全種別を対象とする(グループ系・DECK_UNIQUE・SLOT_UNIQUE)。
// 戻り値: Map<key, { fruitId, count }>
function countEffectsByKey(deck) {
  const counts = new Map();
  flattenEquippedFruits(deck).forEach((effect) => addEffectCount(counts, effect));
  return counts;
}

// Map に効果キーごとの装備数を積み上げる
function addEffectCount(counts, effect) {
  const key = effectKey(effect);
  const current = counts.get(key);
  const count = current ? current.count + 1 : 1;
  counts.set(key, { fruitId: effect.fruitId, count });
}

// 指定スロットの指定枠の実が重複しているか判定する。
// 重複スコープは実の kind により異なる(effectKey 参照)。
// 同じ効果キーが2個以上あれば true。空枠は対象外。
function isFruitDuplicated(deck, slotIndex, fruitIndex) {
  const slot = deck[slotIndex];
  const character = findCharacter(slot.characterId);
  const equipped = slot.fruits[fruitIndex];
  if (!character || !isFruitEquipped(equipped)) return false;

  const effect = effectOfEquippedFruit(character, equipped, slotIndex, fruitIndex);
  const entry = countEffectsByKey(deck).get(effectKey(effect));
  return !!entry && entry.count >= 2;
}

// 指定枠を除いたデッキ上の全効果が占める効果キー集合を返す。
function occupiedKeysExcluding(deck, slotIndex, fruitIndex) {
  const keys = flattenEquippedFruits(deck)
    .filter((effect) => !isFromSlotFruit(effect, slotIndex, fruitIndex))
    .map(effectKey);
  return new Set(keys);
}

// 効果が指定の枠(スロット + 実インデックス)由来か
function isFromSlotFruit(effect, slotIndex, fruitIndex) {
  return effect.slotIndex === slotIndex && effect.sourceFruitIndex === fruitIndex;
}

// 指定枠で候補の実を選ぶと重複になるか判定する。
// (その枠自身の現在の装備は除外して、他枠との衝突だけを見る)
function wouldDuplicate(deck, slotIndex, fruitIndex, fruitId) {
  const character = findCharacter(deck[slotIndex].characterId);
  if (!character || !fruitId) return false;

  const candidate = effectOfEquippedFruit(
    character,
    { fruitId, grade: GRADE.L },
    slotIndex,
    fruitIndex
  );
  const occupied = occupiedKeysExcluding(deck, slotIndex, fruitIndex);
  return occupied.has(effectKey(candidate));
}

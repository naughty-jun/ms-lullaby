// =============================================================
// Vue アプリ本体(UI層)
// 状態管理と表示のみを担当し、計算は calc.js の純粋関数へ委譲する。
// =============================================================

const { createApp, reactive, computed } = Vue;

// 空の実枠を生成する(fruitId が null なら未選択)
function createEmptyFruitSlot() {
  return { fruitId: null, grade: GRADE.L };
}

// 空スロットを生成する(実枠は常に MAX_FRUITS_PER_CHARACTER 個で固定)
function createEmptySlot() {
  return {
    characterId: null,
    level: LEVEL.LV99,
    fruits: Array.from({ length: MAX_FRUITS_PER_CHARACTER }, createEmptyFruitSlot),
  };
}

// 初期デッキ(空スロット × DECK_SIZE)を生成する
function createInitialDeck() {
  return Array.from({ length: DECK_SIZE }, createEmptySlot);
}

createApp({
  setup() {
    const deck = reactive(createInitialDeck());

    // --- 集計(計算は calc.js に委譲) ---
    const attacks = computed(() => deckAttacks(deck));
    const hps = computed(() => deckHps(deck));
    const totalHp = computed(() => deckTotalHp(deck));

    // 選択中キャラの名前一覧(デッキ順・未選択枠は除外)
    const selectedNames = computed(() =>
      deck
        .map((slot) => findCharacter(slot.characterId))
        .filter((character) => !!character)
        .map((character) => character.name)
    );

    // --- スロット操作 ---
    function selectCharacter(slotIndex, characterId) {
      const slot = deck[slotIndex];
      slot.characterId = characterId || null;
      slot.level = defaultLevelOf(findCharacter(slot.characterId));
    }

    function clearSlot(slotIndex) {
      deck[slotIndex] = createEmptySlot();
    }

    // レベル上限を切り替える(Lv99 <-> Lv120)。切替可能なキャラのみ。
    function toggleLevel(slotIndex) {
      const slot = deck[slotIndex];
      if (!canToggleLevel(slot)) return;
      slot.level = slotLevel(slot) === LEVEL.LV99 ? LEVEL.LV120 : LEVEL.LV99;
    }

    // レベル上限を切り替えられるか(Lv99/Lv120 の両方を持つキャラ)
    function canToggleLevel(slot) {
      return availableLevels(findCharacter(slot.characterId)).length >= 2;
    }

    // スロットの表示用レベル(そのキャラで有効なレベル)
    function levelOf(slot) {
      const character = findCharacter(slot.characterId);
      return character ? slotLevel(slot) : null;
    }

    // --- 実の操作(枠は固定。実のセット/解除のみ) ---
    function setFruit(slotIndex, fruitIndex, fruitId) {
      const target = deck[slotIndex].fruits[fruitIndex];
      target.fruitId = fruitId || null;
      target.grade = GRADE.L;
    }

    function clearFruit(slotIndex, fruitIndex) {
      setFruit(slotIndex, fruitIndex, null);
    }

    function toggleGrade(slotIndex, fruitIndex) {
      const target = deck[slotIndex].fruits[fruitIndex];
      target.grade = target.grade === GRADE.L ? GRADE.EL : GRADE.L;
    }

    // 指定枠が重複しているか(計算は calc.js に委譲)
    function isDuplicated(slotIndex, fruitIndex) {
      return isFruitDuplicated(deck, slotIndex, fruitIndex);
    }

    // 指定枠で候補の実を選ぶと重複になるか(option ラベル用。計算は calc.js に委譲)
    function wouldDuplicateFruit(slotIndex, fruitIndex, fruitId) {
      return wouldDuplicate(deck, slotIndex, fruitIndex, fruitId);
    }

    // --- 表示用ヘルパー ---
    function characterOf(slot) {
      return findCharacter(slot.characterId);
    }

    // スロットの素ステータス { attack, hp }(レベル反映済み。計算は calc.js に委譲)
    function baseStatFor(slot) {
      return baseStatOf(slot);
    }

    return {
      // データ
      characters: CHARACTERS,
      fruits: WAKUWAKU_FRUITS,
      // 状態
      deck,
      // 集計
      attacks,
      hps,
      totalHp,
      selectedNames,
      // 操作
      selectCharacter,
      clearSlot,
      toggleLevel,
      canToggleLevel,
      levelOf,
      setFruit,
      clearFruit,
      toggleGrade,
      isDuplicated,
      wouldDuplicateFruit,
      // 表示ヘルパー
      characterOf,
      baseStatFor,
    };
  },
}).mount("#app");

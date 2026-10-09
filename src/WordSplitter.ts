import { Mode, ModeValue } from "./Mode";
import {
  isEndOfEntity,
  isEndOfTag,
  isStartOfEntity,
  isStartOfTag,
  isWhiteSpace,
  isWord,
} from "./Utils";

type State = {
  mode: ModeValue;
  currentWord: string[];
  words: string[];
}


export function convertHtmlToListOfWords(text: string | null, blockExpressions: RegExp[]): string[] {
  if (text === null) {
    return [];
  }

  let state: State = {
    mode: Mode.character,
    currentWord: [],
    words: [],
  };

  let blockLocations = findBlocks(text, blockExpressions);

  let isBlockCheckRequired = !!blockLocations.size;
  let isGrouping = false;
  let groupingUntil = -1;

  for (let i = 0; i < text.length; i++) {
    const character = text[i];

    // Don't bother executing block checks if we don't have any blocks to check for!
    if (isBlockCheckRequired) {
      // Check if we have completed grouping a text sequence/block
      if (groupingUntil === i) {
        groupingUntil = -1;
        isGrouping = false;
      }

      // Check if we need to group the next text sequence/block
      if (blockLocations.has(i)) {
        groupingUntil = blockLocations.get(i) ?? -1;
        isGrouping = true;
      }

      // if we are grouping, then we don't care about what type of character we have, it's going to be treated as a word
      if (isGrouping) {
        state.currentWord.push(character);
        state.mode = Mode.character;
        continue;
      }
    }

    switch (state.mode) {
      case Mode.character:
        if (isStartOfTag(character)) {
          addClearWordSwitchMode(state, '<', Mode.tag);
        } else if (isStartOfEntity(character)) {
          addClearWordSwitchMode(state, character, Mode.entity);
        } else if (isWhiteSpace(character)) {
          addClearWordSwitchMode(state, character, Mode.whitespace);
        } else if (
          /[,.]/.test(character) &&
          (isWhiteSpace(text[i + 1]) || text[i + 1] === undefined)
        ) {
          // special case for [.,] before whitespace or end of text
          addClearWordSwitchMode(state, character, Mode.character);
        } else if (
          isWord(character) &&
          (state.currentWord.length === 0 ||
            isWord(state.currentWord[state.currentWord.length - 1]))
        ) {
          state.currentWord.push(character);
        } else {
          addClearWordSwitchMode(state, character, Mode.character);
        }

        break;

      case Mode.tag:
        if (isEndOfTag(character)) {
          state.currentWord.push(character);
          state.words.push(state.currentWord.join(''));

          state.currentWord = [];
          state.mode = isWhiteSpace(character) ? Mode.whitespace : Mode.character;
        } else {
          state.currentWord.push(character);
        }

        break;

      case Mode.whitespace:
        if (isStartOfTag(character)) {
          addClearWordSwitchMode(state, character, Mode.tag);
        } else if (isStartOfEntity(character)) {
          addClearWordSwitchMode(state, character, Mode.entity);
        } else if (isWhiteSpace(character)) {
          state.currentWord.push(character);
        } else {
          addClearWordSwitchMode(state, character, Mode.character);
        }

        break;

      case Mode.entity:
        if (isStartOfTag(character)) {
          addClearWordSwitchMode(state, character, Mode.tag);
        } else if (isWhiteSpace(character)) {
          addClearWordSwitchMode(state, character, Mode.whitespace);
        } else if (isEndOfEntity(character)) {
          let switchToNextMode = true;
          if (state.currentWord.length !== 0) {
            state.currentWord.push(character);
            state.words.push(state.currentWord.join(''));

            //join &nbsp; entity with last whitespace
            if (
              state.words.length > 2 &&
              isWhiteSpace(state.words[state.words.length - 2]) &&
              isWhiteSpace(state.words[state.words.length - 1])
            ) {
              let w1 = state.words[state.words.length - 2];
              let w2 = state.words[state.words.length - 1];
              state.words.splice(state.words.length - 2, 2);
              state.currentWord = [w1 + w2];
              state.mode = Mode.whitespace;
              switchToNextMode = false;
            }
          }

          if (switchToNextMode) {
            state.currentWord = [];
            state.mode = Mode.character;
          }
        } else if (isWord(character)) {
          state.currentWord.push(character);
        } else {
          addClearWordSwitchMode(state, character, Mode.character);
        }

        break;
    }
  }

  if (state.currentWord.length !== 0) {
    state.words.push(state.currentWord.join(''));
  }

  return state.words;
}

function addClearWordSwitchMode(state: State, character: string, mode: ModeValue) {
  if (state.currentWord.length !== 0) {
    state.words.push(state.currentWord.join(''));
  }

  state.currentWord = [character];
  state.mode = mode;
}

function findBlocks(text: string, blockExpressions: RegExp[]) {
  let blockLocations = new Map<number, number>();

  if (blockExpressions === null) {
    return blockLocations;
  }

  for (let exp of blockExpressions) {
    let m;
    while ((m = exp.exec(text)) !== null) {
      if (blockLocations.has(m.index)) {
        throw new Error(
          'One or more block expressions result in a text sequence that overlaps. Current expression: ' +
            exp.toString()
        );
      }

      blockLocations.set(m.index, m.index + m[0].length);
    }
  }

  return blockLocations;
}

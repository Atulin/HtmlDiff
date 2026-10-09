import { describe, test, expect } from "bun:test";
import {
  isTag,
  stripTagAttributes,
  wrapText,
  isStartOfTag,
  isEndOfTag,
  isStartOfEntity,
  isEndOfEntity,
  isWhiteSpace,
  stripAnyAttributes,
  isWord,
} from "../src/Utils";

describe("isTag", () => {
  test("recognises opening, closing and self-closing tags", () => {
    expect(isTag("<strong>")).toBe(true);
    expect(isTag("</strong>")).toBe(true);
    expect(isTag("<br/>")).toBe(true);
    expect(isTag("<a href=\"x\">")).toBe(true);
    expect(isTag(" <b> ")).toBe(true);
  });

  test("rejects NULL, plain words and pseudo tags", () => {
    expect(isTag(null)).toBe(false);
    expect(isTag("word")).toBe(false);
    expect(isTag("<>")).toBe(false);
    expect(isTag("a <")).toBe(false);
  });

  test("treats img, video and iframe as words, not tags", () => {
    expect(isTag("<img src='a.jpg'/>")).toBe(false);
    expect(isTag("<video>")).toBe(false);
    expect(isTag("<iframe>")).toBe(false);
  });
});

describe("stripTagAttributes / stripAnyAttributes", () => {
  test("reduces a tag to its bare name", () => {
    expect(stripTagAttributes("<a href=\"http://x\" target=\"_blank\">")).toBe("<a>");
    expect(stripTagAttributes("</strong>")).toBe("</strong>");
    expect(stripTagAttributes('<img src="a.jpg"/>')).toBe("<img/>");
  });

  test("stripAnyAttributes only strips real tags", () => {
    expect(stripAnyAttributes('<img src="a.jpg"/>')).toBe('<img src="a.jpg"/>');
    expect(stripAnyAttributes("plain")).toBe("plain");
    expect(stripAnyAttributes('<p class="x" id="y">')).toBe("<p>");
  });
});

describe("wrapText", () => {
  test("builds an ins/del wrapper with a css class", () => {
    expect(wrapText("text", "ins", "diffins")).toBe('<ins class="diffins">text</ins>');
    expect(wrapText("b", "del", "diffmod")).toBe('<del class="diffmod">b</del>');
  });
});

describe("tag/entity/whitespace predicates", () => {
  test("detects tag and entity delimiters", () => {
    expect(isStartOfTag("<")).toBe(true);
    expect(isStartOfTag("a")).toBe(false);
    expect(isEndOfTag(">")).toBe(true);
    expect(isEndOfTag(")")).toBe(false);
    expect(isStartOfEntity("&")).toBe(true);
    expect(isStartOfEntity("#")).toBe(false);
    expect(isEndOfEntity(";")).toBe(true);
    expect(isEndOfEntity(".")).toBe(false);
  });

  test("detects whitespace and nbsp", () => {
    expect(isWhiteSpace(" ")).toBe(true);
    expect(isWhiteSpace("  ")).toBe(true);
    expect(isWhiteSpace("\n\t")).toBe(true);
    expect(isWhiteSpace("&nbsp;")).toBe(true);
    expect(isWhiteSpace("&nbsp; ")).toBe(true);
    expect(isWhiteSpace("text")).toBe(false);
    expect(isWhiteSpace("")).toBe(false);
  });

  test("detects word characters", () => {
    expect(isWord("a")).toBe(true);
    expect(isWord("1")).toBe(true);
    expect(isWord("þæðö")).toBe(true);
    expect(isWord("é")).toBe(true);
    expect(isWord("12,321.00")).toBe(true);
    expect(isWord("&")).toBe(false);
    expect(isWord(";")).toBe(false);
    expect(isWord("-")).toBe(false);
  });
});
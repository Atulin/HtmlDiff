import { describe, test, expect } from "bun:test";
import { convertHtmlToListOfWords } from "../src/WordSplitter";

describe("convertHtmlToListOfWords", () => {
  test("return an empty list for a null input", () => {
    expect(convertHtmlToListOfWords(null, [])).toEqual([]);
  });

  test("handles a null block expression list", () => {
    expect(convertHtmlToListOfWords("a", null as unknown as RegExp[])).toEqual(["a"]);
  });

  test("leaves entity mode when a tag starts inside it", () => {
    expect(convertHtmlToListOfWords("&<b>", [])).toEqual(["&", "<b>"]);
  });

  test("leaves entity mode on a character that is not part of a word", () => {
    expect(convertHtmlToListOfWords("&£;", [])).toEqual(["&", "£", ";"]);
  });

  test("splits plain text into words and whitespace", () => {
    expect(convertHtmlToListOfWords("a b", [])).toEqual(["a", " ", "b"]);
    expect(convertHtmlToListOfWords("a\nb\tc", [])).toEqual(["a", "\n", "b", "\t", "c"]);
  });

  test("keeps tags intact as single words", () => {
    expect(convertHtmlToListOfWords("<strong>b</strong>", [])).toEqual([
      "<strong>",
      "b",
      "</strong>",
    ]);
    expect(convertHtmlToListOfWords("a <b>x</b> y", [])).toEqual([
      "a",
      " ",
      "<b>",
      "x",
      "</b>",
      " ",
      "y",
    ]);
  });

  test("keeps entities intact as single words", () => {
    expect(convertHtmlToListOfWords("&nbsp;", [])).toEqual(["&nbsp;"]);
    expect(convertHtmlToListOfWords("a &amp; b", [])).toEqual(["a", " ", "&amp;", " ", "b"]);
  });

  test("merges an unmatched ampersand into a standalone word", () => {
    expect(convertHtmlToListOfWords("a & b", [])).toEqual(["a", " ", "&", " ", "b"]);
  });

  test("joins &nbsp; between two whitespace runs", () => {
    expect(convertHtmlToListOfWords("a  &nbsp; b", [])).toEqual(["a", "  &nbsp; ", "b"]);
  });

  test("splits a comma or period into its own word before whitespace", () => {
    expect(convertHtmlToListOfWords("hi . you", [])).toEqual(["hi", " ", ".", " ", "you"]);
    expect(convertHtmlToListOfWords("hi, you", [])).toEqual(["hi", ",", " ", "you"]);
  });

  test("keeps numbers and decimals together", () => {
    expect(convertHtmlToListOfWords("5.5", [])).toEqual(["5.5"]);
    expect(convertHtmlToListOfWords("12,321.00", [])).toEqual(["12,321.00"]);
  });

  test("treats matched block expressions as a single grouped word", () => {
    expect(convertHtmlToListOfWords("x[ab]y", [/\[[^\]]*\]/g])).toEqual(["x[ab]", "y"]);
  });

  test("ignores overlapping matches at different positions", () => {
    expect(convertHtmlToListOfWords("abc", [/ab/g, /bc/g])).toEqual(["abc"]);
  });

  test("throws when block expressions overlap at the same position", () => {
    expect(() => convertHtmlToListOfWords("abc", [/ab/g, /abc/g])).toThrow(
      /One or more block expressions result in a text sequence that overlaps/
    );
  });
});
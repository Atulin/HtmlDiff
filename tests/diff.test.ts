import { describe, test, expect } from "bun:test";
import { HtmlDiff, diff as _diff } from "../src/Diff";
import Operation from "../src/Operation";
import { Action } from "../src/Action";
import { Match } from "../src/Match";

const delta = (oldText: string, newText: string) => new HtmlDiff(oldText, newText).build();

// Most internal methods rely on matchGranularity which is normally
// computed inside build(); set it directly for white-box tests.
function ready(oldText: string, newText: string): HtmlDiff {
  const diffMock = new HtmlDiff(oldText, newText);
  diffMock["splitInputsIntoWords"]();
  diffMock["matchGranularity"] = Math.min(4, diffMock["oldWords"].length, diffMock["newWords"].length);
  return diffMock;
}

describe("HtmlDiff.execute / build", () => {
  test("returns identical text when inputs are equal", () => {
    expect(delta("same text", "same text")).toBe("same text");
    expect(delta("", "")).toBe("");
  });

  test("normalizes both inputs to NFC before diffing", () => {
    const decomposed = "Normalization Jörg Århus".normalize("NFD");
    const composed = "Normalization Jörg Århus";
    const result = delta(decomposed, composed);
    expect(result).toBe(composed);
    expect(result?.normalize("NFC")).toBe(result ?? undefined);
  });

  test("inserts missing content when old text is empty", () => {
    expect(delta("", "hello world")).toBe('<ins class="diffins">hello world</ins>');
    expect(delta("", "<img src='logo.jpg'/>")).toBe(
      "<ins class=\"diffins\"><img src='logo.jpg'/></ins>"
    );
  });

  test("deletes removed content when new text is empty", () => {
    expect(delta("hello world", "")).toBe('<del class="diffdel">hello world</del>');
    expect(delta("a b c", "")).toBe('<del class="diffdel">a b c</del>');
  });

  test("marks a whole-section replacement with diffmod", () => {
    expect(delta("a b c", "a d c")).toBe(
      'a <del class="diffmod">b</del><ins class="diffmod">d</ins> c'
    );
  });

  test("wraps special tags with <ins class=\"mod\"> when reused", () => {
    expect(delta("a b c", "a <strong>b</strong> c")).toBe(
      'a <strong><ins class="mod">b</ins></strong> c'
    );
    expect(delta("Some plain text", "Some <strong><i>plain</i></strong> text")).toBe(
      'Some <strong><i><ins class="mod">plain</ins></i></strong> text'
    );
    expect(delta("Some <strong><i>formatted</i></strong> text", "Some formatted text")).toBe(
      'Some <ins class="mod">formatted</ins> text'
    );
  });

  test("treats img/video/iframe as word content rather than tags", () => {
    const oldText = "<p><img src='a.jpg'/> and <video src='v.mp4'></video> and <iframe src='f.html'></iframe></p>";
    expect(delta(oldText, oldText)).toBe(oldText);
    expect(delta(oldText, `${oldText} x`)).toContain('<ins class="diffins">&nbsp;x</ins>');
  });

  test("preserves attribute values on equal tags", () => {
    expect(delta("<a title='xx'>test</a>", "<a title='yy'>test</a>")).toBe(
      "<a title='yy'>test</a>"
    );
    expect(delta("<p class='a'>x</p>", "<p class='b'>x</p>")).toBe("<p class='b'>x</p>");
  });

  test("diffing whitespace only differences is not ignored by default", () => {
    const result = delta("a  b", "a b");
    expect(result).not.toBe("a b");
    expect(result).toContain("del");
    expect(result).toContain("ins");
  });

  test("only new content yields plain equal text", () => {
    expect(delta("alpha beta", "alpha beta")).toBe("alpha beta");
  });

  test("exported diff function produces the same result as build", () => {
    const oldText = "a b c";
    const newText = "a d c";
    expect(_diff(oldText, newText)).toBe(
      'a <del class="diffmod">b</del><ins class="diffmod">d</ins> c'
    );
    expect(_diff(oldText, newText)).toBe(new HtmlDiff(oldText, newText).build());
  });

  test("supports block expressions for grouping sequences", () => {
    const oldText = 'He said "hello world" today';
    const newText = 'He said "hello there" today';

    const plain = new HtmlDiff(oldText, newText).build();
    const grouped = new HtmlDiff(oldText, newText);
    grouped.addBlockExpression(/"[^"]*"/g);
    const groupedResult = grouped.build();

    expect(plain).toBe(
      'He said "hello <del class="diffmod">world</del><ins class="diffmod">there</ins>" today'
    );
    expect(groupedResult).toBe(
      'He said<del class="diffmod"> "hello world"</del><ins class="diffmod"> "hello there"</ins> today'
    );
  });
});

describe("HtmlDiff internal methods", () => {
  test("splitInputsIntoWords tokenizes and frees the raw text", () => {
    const diff = new HtmlDiff("a b", "a c");
    diff["splitInputsIntoWords"]();
    expect(diff["oldWords"]).toEqual(["a", " ", "b"]);
    expect(diff["newWords"]).toEqual(["a", " ", "c"]);
    expect(diff["oldText"]).toBeNull();
    expect(diff["newText"]).toBeNull();
  });

  test("performOperation routes to the right handler", () => {
    const diff = new HtmlDiff("a b c", "a b c");
    diff["splitInputsIntoWords"]();
    diff["content"] = [];

    diff["performOperation"](new Operation(Action.none, 0, 0, 0, 0));
    expect(diff["content"]).toEqual([]);

    diff["performOperation"](new Operation(Action.equal, 0, 1, 0, 1));
    expect(diff["content"]).toEqual(["a"]);
  });

  test("processEqualOperation appends the matched new words", () => {
    const diff = ready("a b", "a b");
    diff["processEqualOperation"](new Operation(Action.equal, 0, 3, 0, 3));
    expect(diff["content"].join("")).toBe("a b");
  });

  test("processInsertOperation wraps inserted new words", () => {
    const diff = ready("a b", "a c b");
    diff["processInsertOperation"](new Operation(Action.insert, 0, 0, 2, 3), "diffins");
    expect(diff["content"].join("")).toBe('<ins class="diffins">c</ins>');
  });

  test("processDeleteOperation wraps removed old words", () => {
    const diff = ready("a c b", "a b");
    diff["processDeleteOperation"](new Operation(Action.delete, 2, 3, 0, 0), "diffdel");
    expect(diff["content"].join("")).toBe('<del class="diffdel">c</del>');
  });

  test("processReplaceOperation processes delete then insert", () => {
    const diff = ready("a b c", "a d c");
    diff["processReplaceOperation"](new Operation(Action.replace, 2, 3, 2, 3));
    expect(diff["content"].join("")).toBe(
      '<del class="diffmod">b</del><ins class="diffmod">d</ins>'
    );
  });

  test("insertTag splits tags and text into wrapped groups", () => {
    const diff = new HtmlDiff("", "");
    diff["insertTag"]("ins", "diffins", ["<em>", "x", "</em>"]);
    expect(diff["content"].join("")).toBe('<em><ins class="mod"><ins class="diffins">x</ins></ins></em>');
  });

  test("insertTag injects mod style around special opening tags", () => {
    const diff = new HtmlDiff("", "");
    diff["insertTag"]("ins", "diffmod", ["<em>", "x"]);
    expect(diff["content"].join("")).toBe('<em><ins class="mod"><ins class="diffmod">x</ins>');
  });

  test("insertTag drops leading special tags on delete", () => {
    const diff = new HtmlDiff("", "");
    diff["insertTag"]("del", "diffmod", ["<em>", "<strong>", "x"]);
    expect(diff["content"].join("")).toBe('<ins class="mod"><del class="diffmod">x</del>');
  });

  test("extractConsecutiveWords converts a leading space to &nbsp;", () => {
    const diff = new HtmlDiff("a b", "a b");
    const words = [" ", " ", "c"];
    const extracted = diff["extractConsecutiveWords"](words, (word) => !word.startsWith("c"));
    expect(extracted).toEqual(["&nbsp;", " "]);
    expect(words).toEqual(["c"]);
  });

  test("extractConsecutiveWords returns an empty slice if the word does not match", () => {
    const diff = new HtmlDiff("a b", "a b");
    const words = ["<em>", "x"];
    const extracted = diff["extractConsecutiveWords"](words, (word) => !word.startsWith("<"));
    expect(extracted).toEqual([]);
    expect(words).toEqual(["<em>", "x"]);
  });

  test("matchingBlocks returns the shared blocks", () => {
    const diff = ready("a b c", "a x c");
    const matches = diff["matchingBlocks"]();
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((match) => match instanceof Match)).toBe(true);
  });

  test("matchingBlocks returns empty when nothing is shared", () => {
    const diff = ready("aaa", "bbb");
    expect(diff["matchingBlocks"]()).toEqual([]);
  });

  test("findMatch returns a match within the given range", () => {
    const diff = ready("the quick brown fox", "the quick brown dog");
    const match = diff["findMatch"](0, diff["oldWords"].length, 0, diff["newWords"].length);
    expect(match).not.toBeNull();
    expect(match!.startInOld).toBeGreaterThanOrEqual(0);
    expect(match!.size).toBeGreaterThan(0);
  });

  test("findMatch returns null when nothing matches in range", () => {
    const diff = ready("aaa", "bbb");
    expect(diff["findMatch"](0, diff["oldWords"].length, 0, diff["newWords"].length)).toBeNull();
  });

  test("operations emits insert/delete/equal in the right order", () => {
    const diff = ready("a b c", "a b d e");
    const operations = diff["operations"]();
    const kinds = operations.map((op) => op.action);
    expect(kinds).toEqual([Action.equal, Action.replace]);
  });

  test("removeOrphans keeps every match when the threshold is 0", () => {
    const diff = new HtmlDiff("w ".repeat(300), "w ".repeat(300));
    diff["splitInputsIntoWords"]();
    const matches = [new Match(0, 0, 2), new Match(4, 4, 3), new Match(200, 200, 0)];
    const kept = [...diff["removeOrphans"](matches)].filter((m): m is Match => m !== null);
    expect(kept.map((m) => [m.startInOld, m.startInNew, m.size])).toEqual([
      [0, 0, 2],
      [4, 4, 3],
      [200, 200, 0],
    ]);
  });

  test("removeOrphans drops matches shorter than the threshold", () => {
    const diff = new HtmlDiff("w ".repeat(300), "w ".repeat(300));
    diff["splitInputsIntoWords"]();
    diff.orphanMatchThreshold = 1.0;
    const matches = [new Match(0, 0, 2), new Match(4, 4, 3), new Match(200, 200, 0)];
    const kept = [...diff["removeOrphans"](matches)].filter((m): m is Match => m !== null);
    expect(kept.map((m) => [m.startInOld, m.startInNew, m.size])).toEqual([
      [0, 0, 2],
      [200, 200, 0],
    ]);
  });

  test("findMatchingBlocks recurses into the regions around a match", () => {
    const diff = ready("aa bb cc", "aa xx bb yy cc");
    const blocks: Match[] = [];
    diff["findMatchingBlocks"](0, diff["oldWords"].length, 0, diff["newWords"].length, blocks);
    expect(blocks.length).toBeGreaterThanOrEqual(1);
    expect(blocks.every((m) => m instanceof Match)).toBe(true);
  });
});

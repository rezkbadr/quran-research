import { describe, expect, it } from "vitest";
import { norm, stripDiacritics } from "./helpers";

describe("stripDiacritics", () => {
  it("removes harakat (fatha, kasra, damma, sukun, tanwin) but preserves ta marbuta", () => {
    expect(stripDiacritics("بِسْمِ")).toBe("بسم");
    // ta marbuta (ة) is a letter, not a diacritic — `norm` maps it to ه later.
    expect(stripDiacritics("رَحْمَةً")).toBe("رحمة");
  });

  it("removes the small high marks used in the Uthmani script", () => {
    expect(stripDiacritics("ٱللَّهِ")).toBe("ٱلله");
    expect(stripDiacritics("ٱلرَّحۡمَٰنِ")).toBe("ٱلرحمن");
  });

  it("removes the superscript alef (U+0670)", () => {
    expect(stripDiacritics("هَٰذَا")).toBe("هذا");
  });

  it("removes the tatweel kashida (U+0640)", () => {
    expect(stripDiacritics("سـلام")).toBe("سلام");
  });

  it("is a no-op on plain Arabic letters", () => {
    expect(stripDiacritics("الله")).toBe("الله");
  });

  it("preserves whitespace", () => {
    expect(stripDiacritics("بِسْمِ ٱللَّهِ")).toBe("بسم ٱلله");
  });
});

describe("norm", () => {
  it("strips diacritics", () => {
    expect(norm("بِسْمِ")).toBe("بسم");
  });

  it("collapses every alef variant to bare alef, including alef wasla (ٱ, U+0671)", () => {
    // The Uthmani corpus uses alef wasla; a user typing plain alef should still match.
    expect(norm("ٱلله")).toBe("الله");
    expect(norm("إنسان")).toBe("انسان");
    expect(norm("أحمد")).toBe("احمد");
    expect(norm("آدم")).toBe("ادم");
  });

  it("maps alef maqsura (ى) to ya (ي)", () => {
    expect(norm("هدى")).toBe("هدي");
  });

  it("maps ta marbuta (ة) to ha (ه)", () => {
    expect(norm("رحمة")).toBe("رحمه");
  });

  it("normalizes the full basmala for substring matching", () => {
    expect(norm("بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ")).toBe("بسم الله الرحمن الرحيم");
  });

  it("trims surrounding whitespace", () => {
    expect(norm("  الله  ")).toBe("الله");
  });

  it("returns the empty string for the empty string", () => {
    expect(norm("")).toBe("");
  });
});

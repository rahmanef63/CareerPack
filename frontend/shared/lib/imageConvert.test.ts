import { describe, it, expect } from "vitest";
import { fitWithin, MAX_EDGE } from "./imageConvert";

// `fitWithin` is the only part of imageConvert that runs without a DOM —
// the converters need canvas. It is also the part that decides how many
// bytes every uploaded image costs forever, so it gets the test.
describe("fitWithin", () => {
  it("leaves an image alone when it already fits", () => {
    expect(fitWithin(400, 300, 512)).toEqual({ w: 400, h: 300 });
    expect(fitWithin(512, 512, 512)).toEqual({ w: 512, h: 512 });
  });

  it("never upscales", () => {
    expect(fitWithin(100, 50, 1600)).toEqual({ w: 100, h: 50 });
  });

  it("is a no-op without a cap, which is the old behaviour", () => {
    expect(fitWithin(4032, 3024)).toEqual({ w: 4032, h: 3024 });
  });

  it("caps the LONGER edge and keeps the aspect ratio", () => {
    // Portrait phone photo.
    expect(fitWithin(3024, 4032, 512)).toEqual({ w: 384, h: 512 });
    // Landscape phone photo — the case that motivated this.
    expect(fitWithin(4032, 3024, 512)).toEqual({ w: 512, h: 384 });
  });

  it("keeps a 16:9 portfolio cover on its cap", () => {
    expect(fitWithin(3840, 2160, MAX_EDGE.media)).toEqual({ w: 1600, h: 900 });
  });

  it("never returns a zero dimension", () => {
    // A canvas of width 0 throws on encode, so an extreme panorama must
    // still round up to 1 on the short edge.
    const r = fitWithin(10000, 3, 512);
    expect(r.w).toBe(512);
    expect(r.h).toBeGreaterThanOrEqual(1);
  });

  it("has caps ordered avatar < cvPhoto < ocrPage < media", () => {
    // Guards against someone "tidying" the constants into the wrong order:
    // a library upload can later become a CV photo, so media must be the
    // loosest of the display caps.
    expect(MAX_EDGE.avatar).toBeLessThan(MAX_EDGE.cvPhoto);
    expect(MAX_EDGE.cvPhoto).toBeLessThan(MAX_EDGE.ocrPage);
    expect(MAX_EDGE.ocrPage).toBeLessThan(MAX_EDGE.media);
  });
});

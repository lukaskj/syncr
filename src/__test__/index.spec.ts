import { toTest } from "../index";

describe("Index", () => {
  it("Should work", () => {
    expect(true).toBeDefined();
  });

  test("if function is working", () => {
    const result = toTest(6);

    expect(result).toBeTruthy();
  });

  test("if function is working again", () => {
    const result = toTest(1);

    expect(result).toBeFalsy();
  });
});

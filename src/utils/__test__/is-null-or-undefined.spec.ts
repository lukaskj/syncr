import { faker } from "@faker-js/faker";
import { isNullOrEmptyOrUndefined, isNullOrUndefined } from "../is-null-or-undefined";

describe("Application", () => {
  describe("Helpers", () => {
    describe("isNullOrUndefined", () => {
      it("Should return true if input is null", () => {
        const data = null;
        const expected = true;
        const result = isNullOrUndefined(data);

        expect(result).toStrictEqual(expected);
      });

      it("Should return true if input is undefined", () => {
        const data = undefined;
        const expected = true;
        const result = isNullOrUndefined(data);

        expect(result).toStrictEqual(expected);
      });

      it("Should return false if input has value", () => {
        const data = faker.random.word();
        const expected = false;
        const result = isNullOrUndefined(data);

        expect(result).toStrictEqual(expected);
      });
    });

    describe("isNullOrEmptyOrUndefined", () => {
      it("Should return true if input is null", () => {
        const data = null;
        const expected = true;
        const result = isNullOrEmptyOrUndefined(data);

        expect(result).toStrictEqual(expected);
      });

      it("Should return true if input is undefined", () => {
        const data = undefined;
        const expected = true;
        const result = isNullOrEmptyOrUndefined(data);

        expect(result).toStrictEqual(expected);
      });

      it("Should return true if input is empty", () => {
        const data = "";
        const expected = true;
        const result = isNullOrEmptyOrUndefined(data);

        expect(result).toStrictEqual(expected);
      });

      it("Should return true if input is only spaces", () => {
        const data = "  ";
        const expected = true;
        const result = isNullOrEmptyOrUndefined(data);

        expect(result).toStrictEqual(expected);
      });

      it("Should return false if input has value", () => {
        const data = faker.random.word();
        const expected = false;
        const result = isNullOrEmptyOrUndefined(data);

        expect(result).toStrictEqual(expected);
      });
    });
  });
});

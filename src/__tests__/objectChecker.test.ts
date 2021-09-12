import PostgrExpress from "../classes/PostgrExpress";

describe("Object checker", function () {
    const {objectChecker} = PostgrExpress;

    test("No object", () => {
        const obj = undefined;

        expect(() => objectChecker(obj, ["name"])).toThrowError("Object is not valid.");
    });

    test('Object must have a required key.', () => {
        const obj = {
            name: 'test'
        };

        expect(() => objectChecker(obj, ['age'])).toThrowError('Object must have this key: age');
    });

    test('Object\'s key must have a valid value.', () => {
        const obj = {
            name: null,
            age: 0,
        };

        expect(() => objectChecker(obj, ['name'])).toThrowError('Value is not valid: name = null');
        expect(() => objectChecker(obj, ['age'])).toBeTruthy();
    });

    test('Fine.', () => {
        const obj = {
            name: 'test',
            age: null,
        };

        expect(() => objectChecker(obj, ['name'])).toBeTruthy();
    });
});

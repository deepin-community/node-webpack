const assert = require('assert');
const { inspect } = require('util');
const { Readable } = require('stream');
const { stringifyInfo } = require('./helpers/lib');
const wellformedStringify = require('./helpers/well-formed-stringify');
const strBytesLength = str => Buffer.byteLength(str, 'utf8');
const {
    allUtf8LengthDiffChars,
    tests,
    spaceTests,
    spaces
} = require('./fixture/stringify-cases');

function createInfoTest(value, ...args) {
    const title = value === allUtf8LengthDiffChars
        ? `All UTF8 length diff chars ${value[0]}..${value[value.length - 1]}`
        : inspect(value, { depth: null });

    it(title.replace(/[\u0000-\u001f\u0100-\uffff]/g, m => '\\u' + m.charCodeAt().toString(16).padStart(4, '0')), () => {
        const native = String(wellformedStringify(value, ...args));
        const info = stringifyInfo(value, ...args);

        assert.deepStrictEqual(info, {
            minLength: strBytesLength(native),
            circular: [],
            duplicate: [],
            async: []
        });
    });
}

describe('stringifyInfo()', () => {
    describe('default', () => {
        for (const value of tests) {
            createInfoTest(value);
        }
    });

    describe('replacer option', () => {
        // various values for a replace as an allowlist
        createInfoTest(
            { '3': 'ok', b: [2, 3, { c: 5, a: 4 }, 7, { d: 1 }], 2: 'fail', 1: 'ok', a: 1, c: 6, '': 'fail' },
            ['a', 'a', new String('b'), { toString: () => 'c' }, 1, '2', new Number(3), null, () => {}, Symbol(), false]
        );
    });

    describe('space option', () => {
        for (const space of spaces) {
            describe('space ' + wellformedStringify(space), () => {
                for (const value of spaceTests) {
                    createInfoTest(value, null, space);
                }
            });
        }
    });

    describe('circular', () => {
        it('should stop on first circular reference by default', () => {
            const circularRef = {};
            const circularRef2 = [];
            circularRef.a = circularRef;
            circularRef.b = 1234567890;
            circularRef.c = circularRef2;
            circularRef2.push(circularRef, circularRef2);
            const info = stringifyInfo(circularRef);

            assert.deepStrictEqual(info.circular, [circularRef]);
        });

        it('should visit all circular reference when options.continueOnCircular', () => {
            const circularRef = {};
            const circularRef2 = [];
            circularRef.a = circularRef;
            circularRef.b = 1234567890;
            circularRef.c = circularRef2;
            circularRef2.push(circularRef, circularRef2);
            const info = stringifyInfo(circularRef, null, null, { continueOnCircular: true });

            assert.deepStrictEqual(info.circular, [circularRef, circularRef2]);
        });
    });

    describe('visited', () => {
        it('should track duplicates', () => {
            const object = {};
            const array = [];
            const info = stringifyInfo([object, array, array, object]);

            assert.deepStrictEqual(info.duplicate, [array, object]);
        });
    });

    describe('async', () => {
        it('should trace async things as a regular objects by default', () => {
            const stream = new Readable({
                read() {
                    this.read = () => null;
                    return '123456';
                }
            });
            const objectStream = new Readable({
                objectMode: true,
                read() {
                    this.read = () => null;
                    return { test: true };
                }
            });
            const info = stringifyInfo([
                Promise.resolve(123456),
                stream,
                objectStream
            ]);
            assert.strictEqual(info.minLength, `[{},${wellformedStringify(stream)},${wellformedStringify(objectStream)}]`.length);
            assert.deepStrictEqual(info.async, []);
        });

        it('should trace async things as special values when options.async=true', () => {
            const promise = Promise.resolve(123456);
            const stream = new Readable({
                read() {
                    this.read = () => null;
                    return '123456';
                }
            });
            const objectStream = new Readable({
                objectMode: true,
                read() {
                    this.read = () => null;
                    return { test: true };
                }
            });
            const info = stringifyInfo([
                promise,
                stream,
                objectStream
            ], null, null, { async: true });

            assert.strictEqual(info.minLength, '[,,[]]'.length);
            assert.deepStrictEqual(info.async, [promise, stream, objectStream]);
        });
    });

    it('should no throw on unsupported types', () =>
        assert.strictEqual(stringifyInfo([1n, 123]).minLength, '[,123]'.length)
    );

    describe('undefined return', () => {
        const values = [
            undefined,
            function() {},
            Symbol()
        ];

        for (const value of values) {
            it(String(value), () =>
                assert.strictEqual(stringifyInfo(value).minLength, 9)
            );
        }
    });

    it('infinite size', () => {
        const value = [];
        const str = 'str'.repeat(100);

        for (var i = 0; i < 1100; i++) {
            value.push({
                foo: str,
                bar: 12312313,
                baz: [str, 123, str, new Date(2021, 05, 15), str],
                [str]: str,
                prev: value[i - 1] || null,
                a: value[i - 1] || null
            });
        }

        assert.strictEqual(stringifyInfo(value).minLength, Infinity);
    });
});

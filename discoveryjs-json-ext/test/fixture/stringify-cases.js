const date = new Date(2020, 8, 3, 15, 21, 55);
const allUtf8LengthDiffChars = Array.from({ length: 0x900 }).map((_, i) => String.fromCharCode(i)).join(''); // all chars 0x00..0x8FF
const fixture = {
    a: 1,
    b: [2, null, true, false, 'string', { o: 3 }],
    c: 'asd',
    d: {
        e: 4,
        d: true,
        f: false,
        g: 'string',
        h: null,
        i: [5, 6]
    }
};
const tests = [
    // scalar
    null,
    true,
    false,
    1,
    123,
    12.34,
    -123,
    NaN,       // null
    Infinity,  // null
    -Infinity, // null
    'test',
    '漢字',
    '\b\t\n\f\r"\\', // escapes
    ...'\b\t\n\f\r"\\', // escapes as a separate char
    '\x7F',    // 127  - 1 byte in UTF8
    '\x80',    // 128  - 2 bytes in UTF8
    '\u07FF',  // 2047 - 2 bytes in UTF8
    '\u0800',  // 2048 - 3 bytes in UTF8
    '\u0000\u0010\u001F\u009F',
    '\uD800\uDC00',  // surrogate pair
    '\uDC00\uD800',  // broken surrogate pair
    '\uD800',  // leading surrogate (broken surrogate pair)
    '\uDC00',  // trailing surrogate (broken surrogate pair)
    allUtf8LengthDiffChars,

    new Number(3),
    new String('false'),
    new Boolean(false),
    date, // date.toJSON()

    // object
    {},
    { a: undefined }, // {}
    { a: null }, // {"a":null}
    { a: undefined, b: undefined }, // {}
    { a: undefined, b: 1 }, // {"b":1}
    { a: 1, b: undefined },
    { a: 1, b: undefined, c: 2 },
    { a: 1 },
    { foo: 1, bar: 2 },
    { a: 1, b: { c: 2 } },
    { a: [1], b: 2 },
    { a() {}, b: 'b' },
    { a: 10, b: undefined, c: function() { }, d: Symbol('test') },
    { foo: 1, bar: undefined, baz: { a: undefined, b: 123, c: [1, 2] } },
    { foo: 1, bar: NaN, baz: Infinity, qux: -Infinity, num: new Number(3), str: new String('str'), bool: new Boolean(false) },
    { foo: 1, bar: () => 123 },

    // array
    [],
    [1],
    [1, 2],
    [1, 2, 3],
    [1, undefined, 2],
    [1, , 2],
    [1, 'a'],
    [undefined],
    [[[]],[[]]],
    [function a() {}],
    [function a() {}, undefined],
    [{}, [], { a: [], o: {} }],
    [{ a: 1 }, 'test', { b: [{ c: 3, d: 4 }]}],
    [{ foo: 1 }, undefined, true, new Boolean(false), 123, NaN, Infinity, -Infinity, new Number(3), 'test', new String('asd')],
    [10, undefined, function() { }, Symbol('')],


    // special cases
    /regex/gi, // {}
    new RegExp('asd'),
    // undefined, // JSON.stringify() returns undefined instead of 'null'
    // () => 123, // JSON.stringify() returns undefined instead of 'null'
    // Symbol('test') // JSON.stringify() returns undefined instead of 'null'

    fixture
];
const spaceTests = tests
    .filter(t => typeof t === 'object')
    .concat('foo', 123, null, false);

module.exports = {
    allUtf8LengthDiffChars,
    fixture,
    date,
    tests,
    spaceTests,
    spaces: [undefined, 0, '', 2, '  ', '\t', '___', 20, '-'.repeat(20)]
};

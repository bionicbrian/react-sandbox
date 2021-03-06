/*eslint-env node,mocha*/
const { assert } = require('chai');
const React = require('react');

const {
    patch,
    inferType,
    inferTypesForComponent,
    valueSatisfiesType,
    generateValueForType,
    generateRandomValueForType,
} = require("../src/prop-type-tools.js");

const RP = React.PropTypes;

describe('inferType', () => {
    before(() => {
        patch(React.PropTypes);
    });

    // Remove references to __propType, which winds up as a property of
    // inferred types. We don't care about making assertions about it.
    const clean = (x) => {
        if (x == null) {
            return x;
        } else if (Array.isArray(x)) {
            return x.map(clean);
        } else if (typeof x === 'object') {
            const ret = {};
            for (const key in x) {
                if (!x.hasOwnProperty(key) ||
                    key === '__propType') {

                    continue;
                }

                ret[key] = clean(x[key]);
            }
            return ret;
        } else {
            return x;
        }
    };

    const assertSingleType = (propType, expected) => {
        assert.deepEqual(clean(inferType(propType)), expected);
    };

    const assertTypes = (propTypes, expected) => {
        const TestComponent = React.createClass({
            propTypes,
            render() {},
        });
        assert.deepEqual(clean(inferTypesForComponent(TestComponent)),
                         expected);
    };

    const simpleTypes = ['array', 'bool', 'func', 'number', 'object',
                         'string', 'any', 'element', 'node'];

    simpleTypes.forEach(type => {
        it(`can infer type of React.PropTypes.${type}`, () => {
            assertSingleType(RP[type], {
                type: type,
                required: false,
            });
        });

        it(`can infer type of React.PropTypes.${type}.isRequired`, () => {
            assertSingleType(RP[type].isRequired, {
                type: type,
                required: true,
            });
        });
    });

    it('can infer type of React.PropTypes.shape(...)', () => {
        assertSingleType(RP.shape({a: RP.bool, b: RP.string}), {
            type: 'shape',
            required: false,
            args: [{
                a: {
                    type: 'bool',
                    required: false,
                },
                b: {
                    type: 'string',
                    required: false,
                },
            }],
        });
    });

    it('can infer type of React.PropTypes.shape(...).isRequired', () => {
        assertSingleType(RP.shape({
            a: RP.bool.isRequired,
            b: RP.string,
        }).isRequired, {
            type: 'shape',
            required: true,
            args: [{
                a: {
                    type: 'bool',
                    required: true,
                },
                b: {
                    type: 'string',
                    required: false,
                },
            }],
        });
    });

    it('can infer type of React.PropTypes.arrayOf(...)', () => {
        assertSingleType(RP.arrayOf(RP.bool), {
            type: 'arrayOf',
            required: false,
            args: [{
                type: 'bool',
                required: false,
            }],
        });
    });

    it('can infer type of React.PropTypes.arrayOf(...).isRequired', () => {
        assertSingleType(RP.arrayOf(RP.bool.isRequired).isRequired, {
            type: 'arrayOf',
            required: true,
            args: [{
                type: 'bool',
                required: true,
            }],
        });
    });

    it('can infer type of React.PropTypes.objectOf(...)', () => {
        assertSingleType(RP.objectOf(RP.bool), {
            type: 'objectOf',
            required: false,
            args: [{
                type: 'bool',
                required: false,
            }],
        });
    });

    it('can infer type of React.PropTypes.objectOf(...).isRequired', () => {
        assertSingleType(RP.objectOf(RP.bool.isRequired).isRequired, {
            type: 'objectOf',
            required: true,
            args: [{
                type: 'bool',
                required: true,
            }],
        });
    });

    it('can infer type of React.PropTypes.instanceOf(...)', () => {
        const SomeClass = () => { this.x = 1; };

        assertSingleType(RP.instanceOf(SomeClass), {
            type: 'instanceOf',
            required: false,
            args: [SomeClass],
        });
    });

    it('can infer type of React.PropTypes.instanceOf(...).isRequired', () => {
        const SomeClass = () => { this.x = 1; };

        assertSingleType(RP.instanceOf(SomeClass).isRequired, {
            type: 'instanceOf',
            required: true,
            args: [SomeClass],
        });
    });

    it('can infer type of React.PropTypes.oneOf(...)', () => {
        assertSingleType(RP.oneOf(['a', 'b']), {
            type: 'oneOf',
            required: false,
            args: [['a', 'b']],
        });
    });

    it('can infer type of React.PropTypes.oneOf(...).isRequired', () => {
        assertSingleType(RP.oneOf(['a', 'b']).isRequired, {
            type: 'oneOf',
            required: true,
            args: [['a', 'b']],
        });
    });

    it('can infer type of React.PropTypes.oneOfType(...)', () => {
        assertSingleType(RP.oneOfType([RP.number, RP.bool]), {
            type: 'oneOfType',
            required: false,
            args: [[{
                type: 'number',
                required: false,
            }, {
                type: 'bool',
                required: false,
            }]],
        });
    });

    it('can infer type of React.PropTypes.oneOfType(...).isRequired', () => {
        assertSingleType(RP.oneOfType([
            RP.number.isRequired, RP.bool,
        ]).isRequired, {
            type: 'oneOfType',
            required: true,
            args: [[{
                type: 'number',
                required: true,
            }, {
                type: 'bool',
                required: false,
            }]],
        });
    });

    it('returns types verbatim that it cannot figure out', () => {
        // PropTypes are simply functions, enabling people to write PropType
        // validators of their own. In case someone writes an entirely custom
        // one, we can't infer the type, but we at least want to avoid
        // crashing.
        const fn = () => {};
        assertSingleType(fn, fn);
    });

    it("can infer types of a component's propTypes property", () => {
        assertTypes({
            a: RP.number,
            b: RP.string,
        }, {
            a: {
                type: 'number',
                required: false,
            },
            b: {
                type: 'string',
                required: false,
            },
        });
    });
});

describe('valueSatisfiesType', () => {
    it('can validate strings', () => {
        assert.isTrue(valueSatisfiesType('a', RP.string.isRequired));
        assert.isFalse(valueSatisfiesType(null, RP.string.isRequired));
        assert.isTrue(valueSatisfiesType(null, RP.string));
    });
});

describe("generateValueForType", () => {
    const assertGenerated = (type, expected) => {
        assertGeneratedWithConfig(type, {}, expected);
    };

    const assertGeneratedWithConfig = (type, config, expected) => {
        const value = generateValueForType(inferType(type), [], config);
        assert.deepEqual(value, expected);
    };

    it('can generate strings', () => {
        assertGenerated(RP.string, null);
        assertGenerated(RP.string.isRequired, '');
    });

    it('can generate nodes', () => {
        assertGenerated(RP.node, null);
        assertGenerated(RP.node.isRequired, '');
    });

    it('can generate elements', () => {
        assertGenerated(RP.node, null);
        assertGenerated(RP.node.isRequired, '');
    });

    it('can generate any', () => {
        // We'll just use strings for any for now
        assertGenerated(RP.any, null);
        assertGenerated(RP.any.isRequired, '');
    });

    it('can generate numbers', () => {
        assertGenerated(RP.number, null);
        assertGenerated(RP.number.isRequired, 0);
    });

    it('can generate booleans', () => {
        assertGenerated(RP.bool, null);
        assertGenerated(RP.bool.isRequired, false);
    });

    it('can generate arrays', () => {
        assertGenerated(RP.array, null);
        assertGenerated(RP.array.isRequired, []);
    });

    it('can generate objects', () => {
        assertGenerated(RP.object, null);
        assertGenerated(RP.object.isRequired, {});
    });

    it('can generate arrays of numbers', () => {
        assertGenerated(RP.arrayOf(RP.number.isRequired), null);
        assertGenerated(RP.arrayOf(RP.number.isRequired).isRequired,
                        [0]);
    });

    it('can generate objects of numbers', () => {
        assertGenerated(RP.objectOf(RP.number.isRequired), null);
        assertGenerated(RP.objectOf(RP.number.isRequired).isRequired,
                        {});
    });

    it('can generate objects of numbers', () => {
        assertGenerated(RP.objectOf(RP.number.isRequired), null);
        assertGenerated(RP.objectOf(RP.number.isRequired).isRequired,
                        {});
    });

    it('can generate for oneOf', () => {
        assertGenerated(RP.oneOf([3, 7]), null);
        assertGenerated(RP.oneOf([3, 7]).isRequired, 3);
    });

    it('can generate for func', () => {
        assertGenerated(RP.func, null);
        assert.isFunction(generateValueForType(inferType(RP.func.isRequired),
                          [], {}));
    });

    it('can generate for oneOfType', () => {
        assertGenerated(RP.oneOfType([RP.number.isRequired]), null);
        assertGenerated(RP.oneOfType([RP.number.isRequired]).isRequired, 0);
    });

    it('can generate shapes', () => {
        const type = RP.shape({
            nullable: RP.string,
            s: RP.string.isRequired,
            n: RP.number.isRequired,
        });

        assertGenerated(type, null);
        assertGenerated(type.isRequired,
                        {nullable: null, s: "", n: 0});
    });

    it('defaults to returning a string for custom propTypes', () => {
        assertGenerated(() => {}, null);
    });
});

describe("generateRandomValueForType", () => {
    const generate = (type, expected) => {
        generateRandomValueForType(inferType(type), []);
    };

    it('can generate random values', () => {
        // Making sensible assertions here is hard, so we'll just run this
        // a bunch and ensure that it doesn't crash.
        //
        // TODO(jlfwong): Force a random seed. Probably still won't want to
        // write assertions, since they'll still be pretty fragile as
        // parameters of the randomness get tuned.
        for (var i = 0; i < 100; i++) {
            [
                RP.number,
                RP.number.isRequired,
                RP.string,
                RP.string.isRequired,
                RP.bool,
                RP.bool.isRequired,
                RP.array,
                RP.array.isRequired,
                RP.object,
                RP.object.isRequired,
                RP.oneOf([0, 1]),
                RP.oneOf([0, 1]).isRequired,
                RP.func,
                RP.func.isRequired,
                RP.arrayOf(RP.string.isRequired),
                RP.arrayOf(RP.string.isRequired).isRequired,
                RP.objectOf(RP.string.isRequired),
                RP.objectOf(RP.string.isRequired).isRequired,
                RP.shape({
                    a: RP.string.isRequired,
                    b: RP.string.isRequired,
                }),
                RP.shape({
                    a: RP.string.isRequired,
                    b: RP.string.isRequired,
                }).isRequired,
            ].forEach(generate);
        }
    });
});

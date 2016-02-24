const { assert } = require('chai');
const React = require('react');

const createSandboxStore = require("../src/create-sandbox-store.js");
const actions = require("../src/actions.js");
const { patch } = require("../src/prop-type-tools.js");

const SomeComponent = React.createClass({
    propTypes: {
        a: React.PropTypes.string
    },
    render() {
        return <div />;
    }
});

const expectedComponentTypes = {
    a: {
        type: 'string',
        required: false
    }
};

const someFixtures = {instances: [{a: 1}]};

describe('createSandboxStore', () => {
    let store;
    let resolveComponentList;

    const getComponentList = () => {
        return new Promise((resolve, reject) => {
            resolveComponentList = resolve;
        });
    };

    let resolveComponentReference;
    const getComponentReference = () => {
        return new Promise((resolve, reject) => {
            resolveComponentReference = resolve;
        });
    };

    let resolveFixtureListReference;
    const getFixtureListReference = () => {
        return new Promise((resolve, reject) => {
            resolveFixtureListReference = resolve;
        });
    };

    beforeEach(function() {
        store = createSandboxStore(false);
        resolveComponentList = null;
        resolveComponentReference = null;
        resolveFixtureListReference = null;
        patch(React.PropTypes);
    });

    const assertStore = (expected) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                assert.deepEqual(store.getState(), expected);
                resolve();
            }, 0);
        });
    };

    it('initializes sensibly', () => {
        return assertStore({
            componentList: null,
            selectedComponent: null
        });
    });

    it('can load components', () => {
        store.dispatch(actions.loadComponentList(getComponentList));

        return assertStore({
            componentList: null,
            selectedComponent: null
        }).then(() => {
            resolveComponentList([
                ['big-spinner.jsx', 'BigSpinner'],
                ['small-spinner.jsx', 'SmallSpinner']
            ]);

            return assertStore({
                componentList: [
                    ['big-spinner.jsx', 'BigSpinner'],
                    ['small-spinner.jsx', 'SmallSpinner']
                ],
                selectedComponent: null
            });
        });
    });

    it('can select components', () => {
        store.dispatch(actions.selectComponent('big-spinner.jsx',
                                               getComponentReference,
                                               getFixtureListReference));

        return assertStore({
            componentList: null,
            selectedComponent: {
                key: 'big-spinner.jsx',
                reference: null,
                fixtures: null,
                types: null
            }
        }).then(() => {
            resolveComponentReference(SomeComponent);

            return assertStore({
                componentList: null,
                selectedComponent: {
                    key: 'big-spinner.jsx',
                    reference: SomeComponent,
                    types: expectedComponentTypes,
                    fixtures: null
                }
            });
        }).then(() => {
            resolveFixtureListReference(someFixtures);

            return assertStore({
                componentList: null,
                selectedComponent: {
                    key: 'big-spinner.jsx',
                    reference: SomeComponent,
                    types: expectedComponentTypes,
                    fixtures: someFixtures
                }
            });
        });
    });

    it('can update fixtures', () => {
        store.dispatch(actions.selectComponent('big-spinner.jsx',
                                               getComponentReference,
                                               getFixtureListReference));
        resolveComponentReference(SomeComponent);
        resolveFixtureListReference(someFixtures);

        return assertStore({
            componentList: null,
            selectedComponent: {
                key: 'big-spinner.jsx',
                reference: SomeComponent,
                    types: expectedComponentTypes,
                fixtures: someFixtures,
            }
        }).then(() => {
            store.dispatch(actions.updateFixture([0, 'a'], 2));

            return assertStore({
                componentList: null,
                selectedComponent: {
                    key: 'big-spinner.jsx',
                    reference: SomeComponent,
                    types: expectedComponentTypes,
                    fixtures: {
                        instances: [{a: 2}]
                    }
                }
            });
        });
    });
});

/*eslint-disable react/forbid-prop-types, no-console*/

/**
 * Component to render a single instance of a component using fixture data.
 */

const React = require("react");
const { StyleSheet, css } = require("aphrodite");

const PropEditor = require("./prop-editor.jsx");
const PureRenderMixinWithCursor = require("./pure-render-mixin-with-cursor.js");

const RP = React.PropTypes;

const getInvalidProps = (component, props) => {
    const propTypes = component.propTypes;
    const componentName = component.displayName;

    const errors = [];

    for (var propName in propTypes) {
        if (!propTypes.hasOwnProperty(propName)) {
            continue;
        }
        const error = propTypes[propName](props, propName,
                                          componentName, 'prop');
        if (error instanceof Error) {
            errors.push(error);
        }
    }
    return errors;
};

const SandboxInstance = React.createClass({
    propTypes: {
        // The props taking function values to respond to by logging to the
        // console.
        callbacksToLog: RP.arrayOf(RP.string.isRequired).isRequired,

        // The Component class to render
        component: RP.func.isRequired,

        // Cursor to the data this binds to in the fixtures. To be treated as
        // opaque.
        cursor: RP.arrayOf(RP.oneOfType([
            RP.string.isRequired,
            RP.number.isRequired,
        ]).isRequired).isRequired,

        // Called with the new prop values on update
        onFixtureUpdate: RP.func.isRequired,

        // Called with the cursor to the prop to edit.
        onRequestEdit: RP.func.isRequired,

        // The props for the component
        props: RP.object.isRequired,

        types: PropEditor.propTypes.types,
    },

    mixins: [PureRenderMixinWithCursor],

    render() {
        const {
            component,
            props,
            callbacksToLog,
            onFixtureUpdate,
            onRequestEdit,
            cursor,
            types,
        } = this.props;

        const propsToPass = {...props};

        callbacksToLog.forEach(propToLog => {
            propsToPass[propToLog] = function() {
                console.log(propToLog, arguments);
            };
        });

        const propErrors = getInvalidProps(component, propsToPass);

        const Component = component;

        return <div className={css(styles.container)}>
            <div className={css(styles.propEditorWrapper)}>
                <PropEditor
                    component={component}
                    componentProps={propsToPass}
                    onChange={onFixtureUpdate}
                    onRequestEdit={onRequestEdit}
                    cursor={cursor}
                    types={types}
                />
            </div>
            <div className={css(styles.componentTableWrapper)}>
                {propErrors.length > 0 ?
                    <pre className={css(styles.errorBox)}>
                        {propErrors.map(er => er.toString()).join('\n')}
                    </pre>
                    :
                    <Component {...propsToPass} />}
            </div>
        </div>;
    },
});

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        borderTop: '1px dotted black',
    },
    propEditorWrapper: {
        padding: '10px 10px 10px 0',
        width: 400,
        overflow: 'scroll',
        maxHeight: 800,
        borderRight: '1px dotted black',
    },
    componentTableWrapper: {
        padding: '10px 0',
        flexGrow: 1,
        overflow: 'auto',
        maxHeight: 800,
    },
    errorBox: {
        background: 'red',
        color: 'black',
        whiteSpace: 'pre',
        textAlign: 'left',
    },
});

module.exports = SandboxInstance;

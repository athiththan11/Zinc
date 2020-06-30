const _ = require('lodash');
const marked = require('marked');
const TerminalRenderer = require('marked-terminal');

marked.setOptions({
    renderer: new TerminalRenderer({
        tab: '\t',
    }),
});

/**
 * method to structure the output
 *
 * @param {[]} obj json object | array
 * @returns {string}
 */
function writeToTerminal(obj) {
    var output =
        '\n\t' +
        _.capitalize(obj[0].title) +
        '\n\n\t' +
        obj[0].description +
        '\n\t' +
        'Source: ' +
        (marked ? marked(obj[0].source) : obj[0].source) +
        (!marked ? '\n\n' : '') +
        '\t' +
        '```' +
        obj[0].segment.lang +
        '\n\n' +
        (!marked ? '\t' : '') +
        (marked ? marked(obj[0].segment.raw) : obj[0].segment.text.replace(/\n/g, '\n\t')) +
        (!marked ? '\n\n' : '') +
        '\t' +
        '```' +
        '\n';
    return output;
}

exports.writeToTerminal = writeToTerminal;

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const marked = require('marked');
const TerminalRenderer = require('marked-terminal');
const chalk = require('chalk');

marked.setOptions({
    renderer: new TerminalRenderer({
        tab: 0,
    }),
});

/**
 * method to structure the output
 *
 * @param {[]} obj json object | array
 * @returns {string}
 */
function writeToTerminal(obj) {
    // FIXME: loop through the results and to output in the console
    var output =
        '\n-----\n' +
        '\n' +
        chalk`{bold ${_.capitalize(obj[0].title)}}` +
        '\n\n' +
        obj[0].description +
        '\n' +
        'Source: ' +
        (marked ? marked(obj[0].source) : obj[0].source) +
        (!marked ? '\n\n' : '') +
        '' +
        '```' +
        obj[0].segment.lang +
        '\n\n' +
        (!marked ? '' : '') +
        (marked ? marked(obj[0].segment.raw) : obj[0].segment.text.replace(/\n/g, '\n')) +
        (!marked ? '\n\n' : '') +
        '' +
        '```' +
        '\n' +
        '\n-----\n';
    return output;
}

/**
 * method to store the parsed json content
 *
 * @param {string} content parsed json content
 * @param {string} workingDir path of the working directory
 */
async function storeParsed(content, workingDir) {
    // FIXME: configure the paths
    fs.writeFileSync(path.join(workingDir, 'memos', '.meta', 'memo.json'), JSON.stringify(content), {
        encoding: 'utf-8',
    });
}

/**
 * method to read the stored json (meta)
 *
 * @param {string} workingDir path of the working directory
 */
function readParsed(workingDir) {
    // FIXME: configure the paths
    return JSON.parse(fs.readFileSync(path.join(workingDir, 'memos', '.meta', 'memo.json')));
}

exports.writeToTerminal = writeToTerminal;
exports.storeParsed = storeParsed;
exports.readParsed = readParsed;

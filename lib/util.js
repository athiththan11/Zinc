const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const marked = require('marked');
const TerminalRenderer = require('marked-terminal');
const chalk = require('chalk');

const { memo } = require('./model/memo');

marked.setOptions({
    renderer: new TerminalRenderer({
        tab: 0,
        code: chalk.reset,
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
async function storeMetaJSON(content, workingDir) {
    // FIXME: configure the paths
    if (!fs.existsSync(path.join(workingDir, 'memos', '.meta'))) {
        try {
            fs.mkdirSync(path.join(workingDir, 'memos', '.meta'));
        } catch (err) {
            console.log();
            console.error('Something went wrong while creating .meta directory.', err);
            process.exit(0);
        }
    }

    try {
        fs.writeFileSync(path.join(workingDir, 'memos', '.meta', 'memo.json'), JSON.stringify(content), {
            encoding: 'utf-8',
        });
    } catch (err) {
        console.log();
        console.error('Something went wrong while writing the meta JSON.', err);
        process.exit(0);
    }
}

/**
 * method to read the stored json (meta)
 *
 * @param {string} workingDir path of the working directory
 */
function readMetaJSON(workingDir) {
    // FIXME: configure the paths
    try {
        var content = fs.readFileSync(path.join(workingDir, 'memos', '.meta', 'memo.json'));
        return JSON.parse(content);
    } catch (err) {
        if (err instanceof Error) {
            if (err.code === 'ENOENT') {
                console.log();
                console.error('Meta JSON is not found.', err.message);
                console.info('Execute `zinc -z` and search again');
            }
        } else {
            console.error(err);
        }
        process.exit(0);
    }
}

/**
 * method to populate memo content using the obj values
 *
 * @param {{}} obj JSON object containing the key values pairs to populate memo
 * @returns {string} memo content
 */
function populateMemoMD(obj) {
    // FIXME: conditionally replace the values with the md template
    var memoContent = memo
        .replace('{number}', Date.now())
        .replace('{title}', obj.title)
        .replace('{desc}', obj.desc)
        .replace('{source}', `[${obj.source}](${obj.source})`)
        .replace('{keys}', obj.keys)
        .replace('{lang}', obj.lang)
        .replace('{code}', obj.code);
    return memoContent;
}

/**
 * method to append the memo content to the zinc
 *
 * @param {string} memoContent memo content
 * @param {string} workingDir path of the working directory
 */
function appendZincMemo(memoContent, workingDir) {
    try {
        fs.appendFileSync(path.join(workingDir, 'memos', 'zinc.md'), memoContent);
    } catch (err) {
        // FIXME: exception handling
        console.error(err);
        process.exit(0);
    }
}

exports.writeToTerminal = writeToTerminal;
exports.storeMetaJSON = storeMetaJSON;
exports.readMetaJSON = readMetaJSON;
exports.populateMemoMD = populateMemoMD;
exports.appendZincMemo = appendZincMemo;

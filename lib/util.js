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
        '\n-----\n\n' +
        chalk`{bold ${_.capitalize(obj[0].title)}}` +
        '\n\n' +
        `Description: ${_.lowerCase(obj[0].description)}` +
        (!_.isEmpty(obj[0].source) ? '\n' + `Source: ${marked(obj[0].source)}` : '') +
        (obj[0].segment ? '```' + obj[0].segment.lang + '\n\n' + marked(obj[0].segment.raw) + '```' : '') +
        '\n\n-----\n';
    return output;
}

/**
 * method to store the parsed json content
 *
 * @param {string} content parsed json content
 * @param {string} workingDir path of the working directory
 */
async function storeMetaJSON(content, workingDir) {
    createMetaDir(workingDir);

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
    var memoContent = memo
        .replace('{number}', Date.now())
        .replace('{title}', obj.title)
        .replace('{desc}', obj.desc)
        .replace('{source}', _.isEmpty(obj.source) ? '' : `[${obj.source}](${obj.source})`)
        .replace('{keys}', obj.keys);
    if (obj.isCodeAvailable) {
        memoContent = memoContent
            .replace('(isCodeAvailable){```', '\n```')
            .replace('```}', '\n```\n')
            .replace('{lang}', obj.lang)
            .replace('{code}', obj.code);
    } else {
        memoContent = memoContent.replace(/\(isCodeAvailable\)(.*(\n|\r).*)/, '');
    }
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
        // FIXME: handle exceptions
        console.log();
        console.error(err);
        process.exit(0);
    }
}

/**
 * method to configure zinc cli
 *
 * @param {{location: string, dirname: string, sink: string}} config zinc configuration object
 */
function configureZinc(config) {
    var content = {
        path: config.location,
    };

    try {
        fs.writeFileSync(path.join(config.dirname, '.zincrc'), JSON.stringify(content), { encoding: 'utf-8' });
    } catch (err) {
        console.log();
        console.error('Something went wrong while writing to .zincrc.', err);
        process.exit(0);
    }

    createSinkLocation(config.location);
}

/**
 * method to create sink location for the zinc
 *
 * @param {string} workingDir path of the working directory
 */
function createSinkLocation(workingDir) {
    createMetaDir(workingDir);

    try {
        fs.writeFileSync(path.join(workingDir, 'memos', 'zinc.md'), `# Zinc Memo\n`);
    } catch (err) {
        console.log();
        console.error('Something went wrong while creating zinc.md.', err);
        process.exit(0);
    }
}

/**
 * method to create .meta directory for the zinc
 *
 * @param {string} workingDir path of the working directory
 */
function createMetaDir(workingDir) {
    try {
        if (!fs.existsSync(path.join(workingDir, 'memos'))) fs.mkdirSync(path.join(workingDir, 'memos'));
    } catch (err) {
        console.log();
        console.error('Something went wrong while creating memos directory.', err);
        process.exit(0);
    }

    try {
        if (!fs.existsSync(path.join(workingDir, 'memos', '.meta')))
            fs.mkdirSync(path.join(workingDir, 'memos', '.meta'));
    } catch (err) {
        console.log();
        console.error('Something went wrong while creating .meta directory.', err);
        process.exit(0);
    }
}

/**
 * method to check whether zinc tool is configured with required properties or not
 *
 * @param {string} workingDir path of the working directory
 * @returns {boolean | string} `string` (sink path) if zinc is configured properly and `false` if not
 */
function isZincConfigured(workingDir) {
    try {
        if (fs.existsSync(path.join(workingDir, '.zincrc'))) {
            var content = JSON.parse(fs.readFileSync(path.join(workingDir, '.zincrc'), { encoding: 'utf-8' }));
            return content.path ? content.path : false;
        }
    } catch (err) {
        // FIXME: handle exceptions
        console.error(err);
        return false;
    }
    return false;
}

exports.writeToTerminal = writeToTerminal;
exports.storeMetaJSON = storeMetaJSON;
exports.readMetaJSON = readMetaJSON;
exports.populateMemoMD = populateMemoMD;
exports.appendZincMemo = appendZincMemo;
exports.configureZinc = configureZinc;
exports.isZincConfigured = isZincConfigured;

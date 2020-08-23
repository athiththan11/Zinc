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
    let output = [];
    let count = obj.length;

    if (count > 1) output.push('\n----------\n');
    obj.forEach((memo, i) => {
        var write = '';
        if (count == 1) write += `\n`;

        write += `-----\n\n`;
        write += chalk`{bold ${memo.title}}\n\n`;
        if (obj.length > 1) {
            write += `Keywords: ` + chalk`{italic [${memo.keywords.join(', ')}]}\n`;
        }
        write += `Description: ${memo.description}`;
        if (_.isEmpty(memo.source) && !memo.segment) {
            write += `\n\n`;
        }
        if (!_.isEmpty(memo.source)) {
            write += `\nSource: ${marked(memo.source)}`;
        }
        if (memo.segment) {
            if (_.isEmpty(memo.source)) {
                write += `\n\n`;
            }
            write += `\`\`\`${memo.segment.lang}\n\n${marked(memo.segment.raw)}\`\`\``;
            if (i < obj.length - 1 || count === 1) {
                write += '\n';
            }
        }

        if (count === 1) write += '-----\n';
        output.push(write);
    });
    if (count > 1) output.push('\n----------\n');
    return output.join('');
}

/**
 * method to structure the output and to print the list
 *
 * @param {[]} arr json arr
 * @returns {string} string output
 */
function writeListToTerminal(arr) {
    let output = [];
    output.push('\n----------\n');
    arr.forEach((memo, i) => {
        var write = `-----\n\n`;
        write +=
            chalk`{bold ${memo.title}}\n\n` +
            `Keywords: ` + chalk`{italic [${memo.keywords.join(', ')}]}\n` +
            `Description: ${memo.description}`;
        if (_.isEmpty(memo.source) && !memo.segment) {
            write += `\n\n`;
        }
        if (!_.isEmpty(memo.source)) {
            write += `\nSource: ${marked(memo.source)}`;
        }
        if (memo.segment) {
            if (_.isEmpty(memo.source)) {
                write += `\n\n`;
            }
            write += `\`\`\`${memo.segment.lang}\n\n${marked(memo.segment.raw)}\`\`\``;
            if (i < arr.length - 1) {
                write += '\n';
            }
        }
        output.push(write);
    });
    output.push('\n----------\n');
    return output.join('');
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
        console.error(err);
        return false;
    }
    return false;
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
        console.log();
        console.error(err);
        process.exit(0);
    }
}

/**
 * method to remove a memo from the zinc
 *
 * @param {string} key key of the content
 * @param {string} workingDir path of the sink root path
 */
function removeZincMemo(key, workingDir) {
    try {
        var zincContent = fs.readFileSync(path.join(workingDir, 'memos', 'zinc.md'), { encoding: 'utf-8' });
        var splitContents = zincContent.split(`## ${key}`);

        zincContent = splitContents[0];
        if (splitContents[1].indexOf(`## `) && splitContents[1].indexOf(`## `) > 0) {
            zincContent += splitContents[1].substring(splitContents[1].indexOf(`## `));
        } else {
            // cleaning the extra lines
            zincContent = zincContent.substring(0, zincContent.lastIndexOf('\n'));
        }

        fs.writeFileSync(path.join(workingDir, 'memos', 'zinc.md'), zincContent, { encoding: 'utf-8' });
    } catch (err) {
        console.log();
        console.error('Something went wrong while removing the memo from Zinc.', err);
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
 * method to construct an inquirer object to present and prompt for defaults
 *
 * @param {{}} obj search result object
 * @returns {{title: string, desc: string, source: string, keys: string, lang: string, code: string }} JSON object
 */
function constructInquirerObject(obj) {
    return {
        title: obj[0].title,
        desc: obj[0].description,
        source: _.isEmpty(obj[0].source) ? '' : obj[0].source.split('(')[1].replace(')', ''),
        keys: obj[0].keywords.join(', '),
        lang: obj[0].segment ? obj[0].segment.lang : '',
        code: obj[0].segment ? obj[0].segment.text : '',
    };
}

exports.appendZincMemo = appendZincMemo;
exports.configureZinc = configureZinc;
exports.constructInquirerObject = constructInquirerObject;
exports.isZincConfigured = isZincConfigured;
exports.populateMemoMD = populateMemoMD;
exports.readMetaJSON = readMetaJSON;
exports.removeZincMemo = removeZincMemo;
exports.storeMetaJSON = storeMetaJSON;
exports.writeToTerminal = writeToTerminal;
exports.writeListToTerminal = writeListToTerminal;

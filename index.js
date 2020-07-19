let argv = require('yargs')
    .usage('Usage: $0 [flag]')
    .example('$0 --sink', 'configure a sink location to store the memos')
    .example(
        '$0 --write',
        'write a memo by providing a title, description, source (an external (URL) reference), and code/segment if exists'
    )
    .example('$0 --zync', 'sync the memos to find the memos using the keyword')
    .example('$0 --find <keyword>', 'find a memo using the keyword')
    .example('$0 --update <keyword>', 'update/rewrite an existing memo')
    .example('$0 --remove <keyword>', 'remove a memo from zinc')
    // sink memo
    .option('s', {
        alias: 'sink',
        describe: 'configure a location to sink the memos',
        type: 'boolean',
        nargs: 0,
    })
    // write zinc memo
    .option('w', {
        alias: 'write',
        describe: 'write a memo',
        type: 'boolean',
        nargs: 0,
    })
    // zi(sy)nc alias to sync the markdowns
    .option('z', {
        alias: 'zync',
        describe: 'zi(sy)nc the memos',
        type: 'boolean',
        nargs: 0,
    })
    // search keyword
    .option('f', {
        alias: 'find',
        describe: 'keyword to search through',
        type: 'string',
        nargs: 1,
    })
    // update memo
    .option('u', {
        alias: 'update',
        describe: 'update/rewrite an existing memo',
        type: 'string',
        nargs: 1,
    })
    // remove memo
    .option('r', {
        alias: 'remove',
        describe: 'remove a memo',
        type: 'string',
        nargs: 1,
    })
    // help
    .help('help').argv;

const ora = require('ora');
const inquirer = require('inquirer');
const _ = require('lodash');

const { parse } = require('./lib/parser');
const { searchJSONObject } = require('./lib/searcher');
const {
    appendZincMemo,
    configureZinc,
    constructInquirerObject,
    isZincConfigured,
    populateMemoMD,
    readMetaJSON,
    removeZincMemo,
    writeToTerminal,
} = require('./lib/util');

var sinkPath = false;
var parsedContent, results, parentKey;

if (argv.z) {
    /**
     * code block handling the `zync` flag
     * * checks whether the zinc is configured with a sink location
     * * reads the md content and parse to the meta JSON
     */

    isSinkConfigured();

    const spinner = ora('zi(sy)ncing markdown memos').start();
    try {
        parse(sinkPath).then(() => {
            if (spinner.isSpinning) spinner.succeed('zinced');
        });
    } catch (err) {
        if (spinner.isSpinning) spinner.fail();
    }
}

if (argv.f) {
    /**
     * code block handling the `find` flag
     * * checks whether the zinc is configured with a sink location
     * * reads the meta JSON content
     * * searches through the JSON with the defined keyword
     * * search result is printed in the terminal as a structured output
     */

    isSinkConfigured();

    const spinner = ora("searching for '" + argv.f + "'").start();
    parsedContent = readMetaJSON(sinkPath);
    results = searchJSONObject(parsedContent, 'keywords', argv.f);

    if (results['resultObjects'].length == 0) {
        if (spinner.isSpinning) spinner.fail("no matching results found for '" + argv.f + "'");
        process.exit(0);
    }

    if (spinner.isSpinning) spinner.succeed("search results for '" + argv.f + "'");
    console.log(writeToTerminal(results['resultObjects']));
}

if (argv.w) {
    /**
     * code block handling the `write` flag
     * * checks whether the zinc is configured with a sink location
     * * prompts for input using the inquirer lib
     * * once the inputs are recorded, the object is parsed to populate a markdown content
     * * the content is added to the zinc.md
     * * the meta JSON is updated
     */

    isSinkConfigured();

    const promptSchema = [
        {
            name: 'title',
            message: 'Title of the memo',
        },
        {
            name: 'desc',
            message: 'Description of the memo',
        },
        {
            name: 'source',
            message: 'Source',
        },
        {
            name: 'keys',
            message: 'Keywords (comma, separated)',
            validate: function (keywords) {
                return !_.isEmpty(keywords);
            },
        },
        {
            name: 'isCodeAvailable',
            message: 'Code input available',
            type: 'confirm',
            default: true,
        },
        {
            name: 'lang',
            message: 'Language',
            when: function (answers) {
                return answers.isCodeAvailable;
            },
        },
        {
            name: 'code',
            type: 'editor',
            message: 'Code segment',
            when: function (answers) {
                return answers.isCodeAvailable;
            },
        },
    ];

    inquirer.prompt(promptSchema).then((answers) => {
        appendZincMemo(populateMemoMD(answers), sinkPath);
        parse(sinkPath);
    });
}

if (argv.s) {
    /**
     * code block handling the `sink` flag
     * * prompts the user to select a sink location with choices
     * * once the input is recorded, the object is passed to configure the Zinc
     * * a .zincrc is created and the configurations are recorded
     */

    const sinkChoices = ['Here', 'Provide a custom location', 'Use default location'];
    const promptSchema = [
        {
            name: 'sink',
            message: 'Where do you want to sink the memos?',
            type: 'list',
            choices: sinkChoices,
        },
        {
            name: 'location',
            message: 'Write me the location (absolute path)',
            when: function (answers) {
                return answers.sink === sinkChoices[1];
            },
        },
    ];

    inquirer.prompt(promptSchema).then((answers) => {
        if (answers.sink === sinkChoices[0]) answers.location = process.cwd();
        if (answers.sink === sinkChoices[2]) answers.location = __dirname;

        answers.dirname = __dirname;
        configureZinc(answers);
    });
}

if (argv.r) {
    /**
     * code block handling the `remove` flag
     * * checks whether the zinc is configured with a sink location
     * * reads the meta JSON content
     * * searches through the JSON with the defined keyword
     * * search result is printed in the terminal as a structured output
     * * along with the output, question is asked to whether remove or not
     * * once the input is recorded by the inquirer lib removes the content from the zinc.md
     * * updates the meta JSON
     */

    isSinkConfigured();

    const spinner = ora("searching for '" + argv.r + "'").start();
    parsedContent = readMetaJSON(sinkPath);
    results = searchJSONObject(parsedContent, 'keywords', argv.r);

    if (results['resultObjects'].length == 0) {
        if (spinner.isSpinning) spinner.fail("no matching results found for '" + argv.r + "'");
        process.exit(0);
    }

    if (spinner.isSpinning) spinner.succeed("search results for '" + argv.r + "'");

    parentKey = results['resultKeys'][0];
    console.log(writeToTerminal(results['resultObjects']));

    const promptSchema = [
        {
            name: 'remove',
            message: 'Remove this memo',
            type: 'confirm',
            default: true,
        },
    ];

    inquirer.prompt(promptSchema).then((answers) => {
        if (answers.remove) {
            removeZincMemo(parentKey, sinkPath);
            parse(sinkPath);
            ora().succeed('removed the memo from zinc successfully!');
        }
    });
}

if (argv.u) {
    /**
     * code block handling the `update` flag
     * * checks whether the zinc is configured with a sink location
     * * reads the meta JSON content
     * * searches through the JSON with the defined keyword
     * * search result is printed in the terminal as a structured output
     * * along with the output, question is asked to whether update or not
     * * if yes, the inquirer prompts the set of questions of with the previously set values
     * * once the input is recorded by the inquirer lib, the final object is constructed
     * * the existing content is removed from the zinc.md
     * * the updated content is written to the zinc.md
     * * the meta JSON is updated
     */

    isSinkConfigured();

    const spinner = ora("searching for '" + argv.u + "'").start();
    parsedContent = readMetaJSON(sinkPath);
    results = searchJSONObject(parsedContent, 'keywords', argv.u);

    if (results['resultObjects'].length == 0) {
        if (spinner.isSpinning) spinner.fail("no matching results found for '" + argv.u + "'");
        process.exit(0);
    }

    if (spinner.isSpinning) spinner.succeed("search results for '" + argv.u + "'");

    parentKey = results['resultKeys'][0];
    console.log(writeToTerminal(results['resultObjects']));

    var zincObject = constructInquirerObject(results['resultObjects']);
    const promptSchema = [
        {
            name: 'update',
            message: 'Do you want to update/rewrite this memo?',
            type: 'confirm',
            default: true,
        },
        {
            name: 'title',
            message: 'Title of the memo',
            default: zincObject['title'],
            when: function (answers) {
                return answers.update;
            },
        },
        {
            name: 'desc',
            message: 'Description of the memo',
            default: zincObject['desc'],
            when: function (answers) {
                return answers.update;
            },
        },
        {
            name: 'source',
            message: 'Source',
            default: zincObject['source'],
            when: function (answers) {
                return answers.update;
            },
        },
        {
            name: 'keys',
            message: 'Keywords (comma, separated)',
            default: zincObject['keys'],
            when: function (answers) {
                return answers.update;
            },
            validate: function (keywords) {
                return !_.isEmpty(keywords);
            },
        },
        {
            name: 'isCodeAvailable',
            message: 'Do you want to input a code?',
            type: 'confirm',
            default: true,
            when: function (answers) {
                return answers.update && _.isEmpty(zincObject.code);
            },
        },
        {
            name: 'updateExistingCode',
            message: 'Do you want to update the existing code?',
            type: 'confirm',
            default: true,
            when: function (answers) {
                return answers.update && !_.isEmpty(zincObject.code);
            },
        },
        {
            name: 'lang',
            message: 'Language',
            default: zincObject['lang'],
            when: function (answers) {
                return (answers.isCodeAvailable || answers.updateExistingCode) && answers.update;
            },
        },
        {
            name: 'code',
            type: 'editor',
            message: 'Code segment',
            default: zincObject['code'],
            when: function (answers) {
                return (answers.isCodeAvailable || answers.updateExistingCode) && answers.update;
            },
        },
    ];

    inquirer.prompt(promptSchema).then((answers) => {
        if (!answers.update) {
            ora().succeed('no updates were done to the memo');
            process.exit(0);
        }

        // if not updating the existing code segment then, passing
        // the existing code element from the zincObject
        if (!answers.updateExistingCode) {
            answers.isCodeAvailable = true;
            answers.lang = zincObject.lang;
            answers.code = zincObject.code;
        }

        removeZincMemo(parentKey, sinkPath);
        appendZincMemo(populateMemoMD(answers), sinkPath);
        parse(sinkPath);
        ora().succeed(`updated the memo successfully!`);
        process.exit(0);
    });
}

//#region helpers

function isSinkConfigured() {
    sinkPath = isZincConfigured(__dirname);
    if (!sinkPath) {
        ora().fail('zinc is not configured properly. please execute `zinc -s` to configure');
        process.exit(0);
    }
}

//#endregion

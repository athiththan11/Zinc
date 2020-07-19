let argv = require('yargs')
    .usage('Usage: $0 [flag]')
    .example('$0 --sink', 'configure a sink location to store the memos')
    .example(
        '$0 --write',
        'write a memo by providing a title, description, source (an external (URL) reference), and code/segment if exists'
    )
    .example('$0 --zync', 'sync the memos to find the memos using the keyword')
    .example('$0 --find <keyword>', 'find a memo using the keyword')
    .example('$0 --remove <keyword>', 'remove a memo from zinc')
    .example('$0 --update <keyword>', 'update/rewrite an existing memo')
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
    // remove memo
    .option('r', {
        alias: 'remove',
        describe: 'remove a memo',
        type: 'string',
        nargs: 1,
    })
    // search keyword
    .option('f', {
        alias: 'find',
        describe: 'keyword to search through',
        type: 'string',
        nargs: 1,
    })
    // re-write memo
    .option('u', {
        alias: 'update',
        describe: 'update/rewrite an existing memo',
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
    configureZinc,
    readMetaJSON,
    writeToTerminal,
    populateMemoMD,
    appendZincMemo,
    isZincConfigured,
    removeZincMemo,
    constructInquirerObject,
} = require('./lib/util');

var sinkPath = false;

if (argv.z) {
    sinkPath = isZincConfigured(__dirname);
    if (!sinkPath) {
        ora().fail('zinc is not configured properly. please execute `zinc -s` to configure');
        process.exit(0);
    }
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
    sinkPath = isZincConfigured(__dirname);
    if (!sinkPath) {
        ora().fail('zinc is not configured properly. please execute `zinc -s` to configure');
        process.exit(0);
    }
    const spinner = ora("searching for '" + argv.f + "'").start();
    var parsedContent = readMetaJSON(sinkPath);
    var results = searchJSONObject(parsedContent, 'keywords', argv.f);

    if (results['resultObjects'].length == 0) {
        if (spinner.isSpinning) spinner.fail("no matching results found for '" + argv.f + "'");
        process.exit(0);
    }

    if (spinner.isSpinning) spinner.succeed("search results for '" + argv.f + "'");
    console.log(writeToTerminal(results['resultObjects']));
}

if (argv.w) {
    sinkPath = isZincConfigured(__dirname);
    if (!sinkPath) {
        ora().fail('zinc is not configured properly. please execute `zinc -s` to configure');
        process.exit(0);
    }
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
                return answers.sink === 'Provide a custom location';
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
    sinkPath = isZincConfigured(__dirname);
    if (!sinkPath) {
        ora().fail('zinc is not configured properly. please execute `zinc -s` to configure');
        process.exit(0);
    }

    const spinner = ora("searching for '" + argv.r + "'").start();
    var metaContent = readMetaJSON(sinkPath);
    var searchResults = searchJSONObject(metaContent, 'keywords', argv.r);

    if (searchResults['resultObjects'].length == 0) {
        if (spinner.isSpinning) spinner.fail("no matching results found for '" + argv.r + "'");
        process.exit(0);
    }

    if (spinner.isSpinning) spinner.succeed("search results for '" + argv.r + "'");

    var parentKey = searchResults['resultKeys'][0];
    console.log(writeToTerminal(searchResults['resultObjects']));

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
            ora().succeed('removed memo from zinc');
        }
    });
}

if (argv.u) {
    sinkPath = isZincConfigured(__dirname);
    if (!sinkPath) {
        ora().fail('zinc is not configured properly. please execute `zinc -s` to configure');
        process.exit(0);
    }

    const spinner = ora("searching for '" + argv.u + "'").start();
    var metaContent = readMetaJSON(sinkPath);
    var searchResults = searchJSONObject(metaContent, 'keywords', argv.u);

    if (searchResults['resultObjects'].length == 0) {
        if (spinner.isSpinning) spinner.fail("no matching results found for '" + argv.u + "'");
        process.exit(0);
    }

    if (spinner.isSpinning) spinner.succeed("search results for '" + argv.u + "'");

    var parentKey = searchResults['resultKeys'][0];
    console.log(writeToTerminal(searchResults['resultObjects']));

    var zincObject = constructInquirerObject(searchResults['resultObjects']);
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
            ora().succeed('no updates were done');
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
        ora().succeed('updated the memo successfully');
        process.exit(0);
    });
}

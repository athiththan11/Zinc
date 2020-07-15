let argv = require('yargs')
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
    // write zinc memo
    .option('w', {
        alias: 'write',
        describe: 'write a memo',
        type: 'boolean',
        nargs: 0,
    })
    // help
    .help('help').argv;

const ora = require('ora');
const inquirer = require('inquirer');

const { parse } = require('./lib/parser');
const { searchJSONObject } = require('./lib/searcher');
const { readMetaJSON, writeToTerminal, populateMemoMD, appendZincMemo } = require('./lib/util');

if (argv.z) {
    const spinner = ora('zi(sy)ncing markdown memos').start();
    try {
        parse(__dirname).then(() => {
            if (spinner.isSpinning) spinner.succeed('zinced');
        });
    } catch (err) {
        if (spinner.isSpinning) spinner.fail();
    }
}

if (argv.f) {
    const spinner = ora("searching for '" + argv.f + "'").start();
    var parsedContent = readMetaJSON(__dirname);
    var results = searchJSONObject(parsedContent, 'keywords', argv.f);

    if (results.length == 0) {
        if (spinner.isSpinning) spinner.fail("no matching results found for '" + argv.f + "'");
        process.exit(0);
    }

    if (spinner.isSpinning) spinner.succeed("search results for '" + argv.f + "'");
    console.log(writeToTerminal(results));
}

if (argv.w) {
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
            message: 'Keywords (comma , separated)',
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
        appendZincMemo(populateMemoMD(answers), __dirname);
    });
}

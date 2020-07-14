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
// const prompt = require('prompt');
const inquirer = require('inquirer');

const { parse } = require('./lib/parser');
const { searchJSONObject } = require('./lib/searcher');
const { readMetaJSON, writeToTerminal, populateMemoMD } = require('./lib/util');

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

    if (!(results.length > 0)) {
        if (spinner.isSpinning) spinner.fail("no matching results found for '" + argv.f + "'");
        process.exit(0);
    }

    if (spinner.isSpinning) spinner.succeed("search results for '" + argv.f + "'");
    console.log(writeToTerminal(results));
}

if (argv.w) {
    // TODO: ask for input from the console and save it as memo

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
        // {
        //     name: 'code',
        //     type: 'editor',
        //     message: 'Code segment',
        //     when: function (answers) {
        //         return answers.isCodeAvailable;
        //     },
        // },
    ];

    inquirer.prompt(promptSchema).then((answers) => {
        // console.info('  Title: ' + answers.title);
        // console.info('  Description: ' + answers.desc);
        // console.info('  Source: ' + answers.source);
        // console.info('  Keywords: ' + answers.keys);
        // console.info('  Code Available: ' + answers.isCodeAvailable);
        // console.info('  Code: ' + answers.code);
        console.dir(answers, { depth: 10 });
        populateMemoMD(answers);
    });
}

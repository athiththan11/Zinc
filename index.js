let argv = require('yargs')
    // zi(sy)nc alias to sync the markdowns
    .option('z', {
        alias: 'zync',
        describe: 'zi(sy)nc the memos',
        type: 'boolean',
        nargs: 0,
    })
    // search keyword
    .option('k', {
        alias: 'key',
        describe: 'keyword to search through',
        type: 'string',
        nargs: 1,
    })
    // help
    .help('help').argv;

const ora = require('ora');

const { parse } = require('./lib/parser');
const { searchJSONObject } = require('./lib/searcher');
const { readParsed, writeToTerminal } = require('./lib/util');

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

if (argv.k) {
    const spinner = ora("searching for '" + argv.k + "'").start();
    var parsedContent = readParsed(__dirname);
    var results = searchJSONObject(parsedContent, 'keywords', argv.k);

    if (!(results.length > 0)) {
        if (spinner.isSpinning) spinner.fail("no matching results found for '" + argv.k + "'");
        process.exit(0);
    }

    if (spinner.isSpinning) spinner.succeed("search results for '" + argv.k + "'");
    console.log(writeToTerminal(results));
}

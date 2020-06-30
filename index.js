const fs = require('fs');
const path = require('path');

const parser = require('./lib/parser/markdown.parser');
const { searchJSONObject } = require('./lib/searcher/json.searcher');
const { writeToTerminal } = require('./lib/util');

var parsedContent = parser.parse(fs.readFileSync(path.join(__dirname, 'examples', 'assets', 'sample.md'), 'utf8'));
// console.dir(parsedContent, { depth: 10 });
// console.dir(searchJSONObject(parsedContent, 'keywords', 'say-how-are-you'), { depth: 10 });
var result = searchJSONObject(parsedContent, 'keywords', 'say-how-are-you');

// TODO: sketch a terminal output to show the K
if (result.length > 0) {
    console.log(writeToTerminal(result));
}

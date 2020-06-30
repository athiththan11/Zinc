var marked = require('marked');

/**
 * method to parse the markdown content into JSON object
 *
 * @author https://github.com/ajithr/md-2-json
 *
 * @param {string} mdContent markdown content
 * @returns {{}} JSON Object
 */
function parse(mdContent) {
    var json = marked.lexer(mdContent);
    var currentHeading,
        headings = [];
    var output = json.reduce((result, item) => {
        switch (item.type) {
            case 'heading':
                // TODO: construct json object
                if (!currentHeading || item.depth == 1) {
                    headings = [];
                    result[item.text] = {};
                    currentHeading = result[item.text];
                    headings.push(item.text);
                } else {
                    var parentHeading = getParentHeading(headings, item, result);
                    headings = parentHeading.headings;
                    currentHeading = parentHeading.parent;
                    currentHeading[item.text] = {};
                    currentHeading = currentHeading[item.text];
                }
                break;
            case 'table':
                // TODO: construct object
                var tableContent = getTableContent(item);

                currentHeading.title = tableContent.title;
                currentHeading.description = tableContent.description;
                currentHeading.source = tableContent.source;
                currentHeading.keywords = tableContent.keywords;
                break;
            case 'code':
                // TODO: construct object
                var codeContent = getCodeContent(item);
                currentHeading.segment = codeContent;
                break;
        }
        return result;
    }, {});
    return output;
}

/**
 * method to get the parent heading
 *
 * @param {[]} headings headings
 * @param {marked.Tokens.Heading} item
 * @param {marked.Token} result
 * @returns {{ headings: [], parent: string }}
 */
function getParentHeading(headings, item, result) {
    var parent,
        index = item.depth - 1;
    var currentHeading = headings[index];
    if (currentHeading) {
        headings.splice(index, headings.length - index);
    }
    headings.push(item.text);
    for (let i = 0; i < index; i++) {
        parent = !parent ? result[headings[i]] : parent[headings[i]];
    }
    return {
        headings: headings,
        parent: parent,
    };
}

/**
 * method to get table content of markdown
 *
 * @param {marked.Tokens.Table} item
 * @returns {{ title: string, description: string, source: string, keywords: [string] }}
 */
function getTableContent(item) {
    var row = item.cells[0];
    return {
        title: row[0],
        description: row[1],
        source: row[2],
        keywords: row[3].replace(/\s/g, '').split(','),
    };
}

/**
 * method to get the code content of markdown
 *
 * @param {marked.Tokens.Code} item
 * @returns {{ raw: string, lang: string, text: string }}
 */
function getCodeContent(item) {
    return {
        raw: item.raw,
        lang: item.lang,
        text: item.text,
    };
}

exports.parse = parse;

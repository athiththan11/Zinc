const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const parser = require('./markdown.parser');
const { storeParsed } = require('../util');

/**
 * method to read and store the md contents as a json
 *
 * @description this method lists all the markdowns > read > parse > and stores
 * as a single json meta inside the configured directory
 *
 * @param {string} workingDir working directory
 */
async function parse(workingDir) {
    var obj = {};
    var markdowns = findInDir(path.join(workingDir, 'memos'), /\.md$/);
    markdowns.map((md) => {
        var content = parser.parse(fs.readFileSync(path.join(md), { encoding: 'utf-8' }));
        _.merge(obj, content);
    });

    await storeParsed(obj, workingDir);
}

/**
 * method to find files and artifacts based on regex pattern
 *
 * @author https://gist.github.com/kethinov/6658166#gistcomment-3079220
 *
 * @param {string} dir path of the directory
 * @param {string} filter regex pattern to filter
 * @param {*} fileList
 */
function findInDir(dir, filter, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const fileStat = fs.lstatSync(filePath);

        if (fileStat.isDirectory()) {
            findInDir(filePath, filter, fileList);
        } else if (filter.test(filePath)) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

exports.parse = parse;

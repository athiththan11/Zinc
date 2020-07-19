const _ = require('lodash');

/**
 * the following code segment is referred from
 * https://gist.github.com/iwek/3924925
 *
 * and added a couple of tweaks to support
 * the required use-case
 */

/**
 * method to search through JSON object and to return matched JSON objects
 *
 * @author https://gist.github.com/iwek/3924925
 *
 * @param {{}} obj json object to perform search
 * @param {string} key search keyword
 * @param {string} val search value (matching value)
 * @param {string} oKey object key
 * @returns {{ resultObjects: [], resultKeys: []}} an array of matched JSON objects
 */
function searchJSONObject(obj, key, val, oKey = undefined) {
    var objects = [];
    var keys = [];
    for (var i in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
        if (typeof obj[i] == 'object' && !_.isArray(obj[i]) && !obj[i]['raw']) {
            var result = searchJSONObject(obj[i], key, val, i);
            objects = objects.concat(result['resultObjects']);
            keys = keys.concat(result['resultKeys']);
        } else if (
            (i == key && obj[i] == val) ||
            (i == key &&
                _.filter(obj[i], function (o) {
                    return o.includes(val);
                }).length > 0) ||
            (i == key && val == '')
        ) {
            keys.push(oKey);
            objects.push(obj);
        } else if (obj[i] == val && key == '') {
            if (objects.lastIndexOf(obj) == -1) {
                key.push(oKey);
                objects.push(obj);
            }
        }
    }
    return { resultObjects: objects, resultKeys: keys };
}

exports.searchJSONObject = searchJSONObject;

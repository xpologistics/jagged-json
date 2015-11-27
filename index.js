var _ = require('underscore');

/*
 * private
 */
var normalizeJsonR = function (tokens, current, value) {
    if (!tokens.length) {
        current = value;
    }


    tokens.forEach(function (t, i) {
        // remove the indexing from a string that has it
        var nt = t.replace(/[\[][0-9]*[\]]/, '');
        var isArray = ~t.indexOf('[');
        // get the index from the token if it's an array
        var index = isArray ? t.match(/\[([0-9]+)\]/)[1] : -1;

        if (!current[nt])
            current[nt] = isArray ? [] : {};

        if (isArray && !current[nt][index])
            current[nt][index] = {};

        if (tokens[tokens.length - 1] == t)
            current[nt] = value;

        tokens.shift();

        isArray
            ? current[nt][index] = normalizeJsonR(tokens, current[nt][index], value)
            : current[nt] = normalizeJsonR(tokens, current[nt], value);

    });
    return current;
};

/*
 * private
 */
var normalizeJsonRAsync = function (tokens, currentObj, value, complete, root) {
    // no tokens, call back with the current object, we don't have a key to set the value
    if (!tokens.length)
        return callback(null, currentObj);

    // save the root object once. Since we iterate through the object graph, we need
    // a pointer to the start of the object so we can return it.
    if (!root)
        root = currentObj;

    var currentToken = tokens[0];
    // current token minus the array crap that might come in from ASP.NET
    var normalizedToken = currentToken.replace(/[\[][0-9]*[\]]/, '');
    // is the current token in array notation?
    var currentTokenIsArray = ~currentToken.indexOf('[');
    // what is the index we're currently processing for an array based token
    var index = currentTokenIsArray ? currentToken.match(/\[([0-9]+)\]/)[1] : -1;

    // if the key doesn't exist on the object, create it with an empty object or array
    if (!currentObj[normalizedToken])
        currentObj[normalizedToken] = currentTokenIsArray ? [] : {};

    // if it was an array, add an empty object to the index
    if (currentTokenIsArray && !currentObj[normalizedToken][index])
        currentObj[normalizedToken][index] = {};

    // set a pointer to the object we need to potentially assign a value or another nested object/array
    var current = currentTokenIsArray ? currentObj[normalizedToken][index] : currentObj[normalizedToken];

    // if we're on the last token, set it to the value and call the callback with the root object
    if (tokens.length == 1) {

        // if the last item is an array add it to the array
        // handles Filter.Something.Code[0] scenario
        if (currentTokenIsArray) {
            currentObj[normalizedToken][index] = value;
        } else {
            currentObj[normalizedToken] = value;
        }

        return complete(null, root);
    }

    // process the next iteration after deferring to the event loop
    setImmediate(function () {
        normalizeJsonRAsync(tokens.slice(1), current, value, complete, root);
    });
};


var normalizeJson = function (obj) {
    var newObj = {};
    for (var key in obj) {
        var tokens = key.split('.');
        newObj = normalizeJsonR(tokens, newObj, obj[key]);
    }
    return newObj;
};

// "async" version of normalizeJson that yields to the event loop after every
// iteration.
var normalizeJsonAsync = function (obj, callback) {
    var loop = function (keys, obj, cb, acc) {
        // if we are done processing, callback with the accumulator
        if (!keys.length)
            return callback(null, acc);


        // get the current key to process (always index 0) and split it into tokens
        var key = keys[0];
        var tokens = key.split('.');

        setImmediate(function () {
            normalizeJsonRAsync(tokens, acc, obj[key], function (err, result) {
                loop(keys.slice(1), obj, cb, result);
            });
        });
    };

    loop(Object.keys(obj), obj, callback, {});
};

module.exports = {
    normalizeJson: function (json) {
        if (_.isString(json))
            return normalizeJson.call(this, JSON.parse(json));
        else
            return normalizeJson.call(this, json);
    },

    normalizeJsonAsync: function (json, cb) {
        if (_.isString(json))
            return normalizeJsonAsync.call(this, JSON.parse(json), cb);
        else
            return normalizeJsonAsync.call(this, json, cb);
    }
};

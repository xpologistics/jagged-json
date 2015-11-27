# jaggedJson
Takes a flat JSON object and converts it to a hierarchy

## Description
Used to normalize a JSON object that is usually posted by Microsoft's MVC framework. These objects tend to be formatted
to work with MVCs model binders but not very friendly to client-side consumers that want the same "model". The JSON
objects will have a flat structure that is a single level deep but represents more of a hierarchy through the use of
dot-notation in the key names. This library will create a new JSON object with a more jagged structure by creating a
level of nesting for each dot.

```javascript

// typical flattened structure
var input = { filters.minMax.min: 10,
filters.minMax.max: 100,
filters.keyWord: 'jagged',
filters.geography.lat: 1.123,
filters.geography.long: -10.342,
filters.geography.radius: 15,
filters.myList[0]: 'apples',
filters.myList[1]: 'oranges'
}

var jaggedJson = require('jagged-json');

var output = jaggedJson.normalizeJson(input);

// output
{
    filters: {
        minMax: {
            min: 10,
            max: 100
        },
        keyWord: 'jagged',
        geography: {
            lat: 1.123,
            long: -10.342,
            radius: 15
        },
        myList: ['apples', 'oranges']
    }
}
```
var json = require('../json');

module.exports = {

    Parser: json.Parser,
    Request: json.Request,

    transform: [
        {to: 'properties', type: 'Object'},
        {to: 'type', type: 'String'},
        {to: 'geometry', type: 'Object'},
    ]

};

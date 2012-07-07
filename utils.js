var config = require('./config.js'),
    //mailer = require('mailer'),
    fs = require('fs');

/**
* Simple Python-style string formatting.
*
* Example:
*
*   "%(foo)s, %(bar)s!".format({foo: 'Hello', bar: 'world'})
*/
String.prototype.format = function(replacements) {
    return this.replace(/\%\(([a-z0-9_]+)\)(s|i)/ig, function(match, name, type) { 
        return typeof replacements[name] != 'undefined'
            ? replacements[name]
            : match;
    });
};

function __(str, replacements) {
    var s = (locale.strings[str] || str);
    if (replacements) {
        return s.format(replacements);
    }
    return s;
}

exports.sendEmail = function(to, subject, bodyTemplate, replacements, callback)
{
    fs.readFile('template/email/' + bodyTemplate + '.txt', function(err, data) {
        if (err) throw err;
        if (!callback) {
            callback = function() {};
        }
        body = new String(data).format(replacements);
        console.log(body);
        mailer.send({
            host: config.SMTP_HOST,
            port: config.SMTP_PORT,
            domain: "geosense.media.mit.edu",
            authentication: "login",
            username: config.SMTP_USERNAME,
            password: config.SMTP_PASSWORD,

            to: to,
            from: "geosense@media.mit.edu",
            subject: subject,
            body: body,
        }, callback);
    });
}

exports.handleDbOp = function(req, res, err, op, name, permissionCallback) 
{
    if (err) {
        console.log('error', err);
        switch (err.name) {
            default:
                // if not in DEBUG mode, most error messages should be hidden from client: 
                sendErr = config.DEBUG ? err : {
                    message: 'Server error'
                };          
                res.send(sendErr, 500);
                break;
            case 'ValidationError':
                // certain error messages should be available to client:
                res.send(err, 403);
                break;
        }
        return true;
    } else if (!op) {
        res.send((name ? name + ' ' : '') + 'not found', 404);
        return true;
    } else if (permissionCallback && !permissionCallback(req, op)) {
        res.send('permission denied', 403);
        return true;
    }

    return false;
}

exports.import = function(into, mod) {
    for (var k in mod) {
        into[k] = mod[k];
    }
    return mod;
}

// TODO: Due to a mongodb bug, counting is really slow even if there is 
// an index: https://jira.mongodb.org/browse/SERVER-1752
// To address this we currently cache the count as long for 
// as the server is running, but mongodb 2.3 should fix this issue.
var COUNT_CACHE = {};
exports.modelCount = function(model, query, callback) {
    console.log('counting', query);

    cacheKey = model.modelName + '-';
    for (var k in query) {
        cacheKey += k + '-' + query[k];
    }

    if (!COUNT_CACHE[cacheKey]) {
        model.count(query, function(err, count) {
            if (!err) {
                COUNT_CACHE[cacheKey] = count;
            }           
            callback(err, count);
        });
    } else {
        console.log('cached count '+cacheKey+': '+COUNT_CACHE[cacheKey]);
        callback(false, COUNT_CACHE[cacheKey]);
    }
}

// port of http://stackoverflow.com/a/25486
exports.slugify = function(title)
{
    if (title == null) return "";

    var maxlen = 80;
    var len = title.length;
    var prevdash = false;
    var c;
    var sb = '';

    for (var i = 0; i < len; i++)
    {
        c = title[i];
        if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9'))
        {
            sb += c;
            prevdash = false;
        }
        else if (c >= 'A' && c <= 'Z')
        {
            // tricky way to convert to lowercase
            //sb += ((char)(c | 32));
            sb += c.toLowerCase();
            prevdash = false;
        }
        else if (c == ' ' || c == ',' || c == '.' || c == '/' || 
            c == '\\' || c == '-' || c == '_' || c == '=')
        {
            if (!prevdash && sb.length > 0)
            {
                sb += '-';
                prevdash = true;
            }
        }
        else if (c.charCodeAt(0) >= 128)
        {
            var prevlen = sb.length;
            sb += this.remapInternationalCharToAscii(c);
            if (prevlen != sb.length) prevdash = false;
        }
        if (i == maxlen) break;
    }

    if (prevdash)
        return sb.substring(0, sb.length - 1);
    else
        return sb;
}

// port and extension of http://meta.stackoverflow.com/a/7696
this.remapInternationalCharToAscii = function(c, skipSpecialTranscription)
{
    var s = c.toLowerCase();

    if (!skipSpecialTranscription) {
        if ("äöü".indexOf(s) != -1) {
            // German Umlaut
            return this.remapInternationalCharToAscii(s, true) + 'e';
        }
    }

    if ("àåáâäãåą".indexOf(s) != -1)
    {
        return "a";
    }
    else if ("èéêëę".indexOf(s) != -1)
    {
        return "e";
    }
    else if ("ìíîïı".indexOf(s) != -1)
    {
        return "i";
    }
    else if ("òóôõöøőð".indexOf(s) != -1)
    {
        return "o";
    }
    else if ("ùúûüŭů".indexOf(s) != -1)
    {
        return "u";
    }
    else if ("çćčĉ".indexOf(s) != -1)
    {
        return "c";
    }
    else if ("żźž".indexOf(s) != -1)
    {
        return "z";
    }
    else if ("śşšŝ".indexOf(s) != -1)
    {
        return "s";
    }
    else if ("ñń".indexOf(s) != -1)
    {
        return "n";
    }
    else if ("ýÿ".indexOf(s) != -1)
    {
        return "y";
    }
    else if ("ğĝ".indexOf(s) != -1)
    {
        return "g";
    }
    else if (c == 'ř')
    {
        return "r";
    }
    else if (c == 'ł')
    {
        return "l";
    }
    else if (c == 'đ')
    {
        return "d";
    }
    else if (c == 'ß')
    {
        return "ss";
    }
    else if (c == 'Þ')
    {
        return "th";
    }
    else if (c == 'ĥ')
    {
        return "h";
    }
    else if (c == 'ĵ')
    {
        return "j";
    }
    else
    {
        return "";
    }
}


var config = require('./config.js'),
    errors = require('./errors.js'),
    HTTPError = errors.HTTPError,
    mailer = require('mailer'),
    fs = require('fs'),
    mongoose = require('mongoose'),
    console = require('./ext-console');

// These Array methods do not exist under MongoDB, under which some of the utility
// functions below will be used while supplementing the Array methods.
var isArray = Array.isArray,
    arrayMap = Array.prototype.map,
    arrayReduce = Array.prototype.reduce;

exports.connectDB = function(callback, exitProcessOnError) 
{
    if (mongoose.connection.base.connections.length) {
        var conn = mongoose.connection.base.connections[0];
        if (conn._hasOpened) {
            if (callback) {
                callback();
            }
            return conn;
        }
    }

    mongoose.connection.on('open', function (ref) {
        console.success('Connected to mongoDB server.');
        if (callback) {
            callback();
        }
    });

    mongoose.connection.on('error', function (err) {
        console.error('mongoDB connection error:', err.message);
        if (exitProcessOnError == undefined || exitProcessOnError) {
            process.exit(1);
        }
    });

    if (!config.DB_URI) {
        console.error('config.DB_URI is not defined');
        if (exitProcessOnError == undefined || exitProcessOnError) {
            process.exit(1);
        }
    } else {
        console.info('Connecting to database', config.DB_URI.replace(/([^:]):.*@/, '$1:***@'));
        var opts = { db: { native_parser: config.MONGODB_NATIVE_PARSER }};
        return mongoose.connect(config.DB_URI, opts).connection;
    }
};

/**
* Simple Python-style string formatting.
*
* Example:
*
*   "%(foo)s, %(bar)s!".format({foo: 'Hello', bar: 'world'})
*/
String.prototype.format = function(replacements) {
    return this.replace(/\%\((.+?)\)(s|i)/ig, function(match, name, type) { 
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

/**
* Simple Python-style date formatting.
*
* Example:
*
*   new Date().format('%d %m %y')
*/
Date.prototype.format = function(format) {
  var self = this;
  console.log('format', self);

  return format.replace(/\%([a-z0-9_]+)/ig, function(match, name, type) { 
    return typeof self.formatReplacements[name] != 'undefined'
      ? self.formatReplacements[name].call(self)
      : match
    ;
  });
};

var lpad = function(str, padString, length) {
    var s = new String(str);
    while (s.length < length) {
        s = padString + s;
    }
    return s;
};

Date.prototype.formatReplacements = {
    d: function() {
        return lpad(this.getDate(), '0', 2);
    },
    m: function() {
        return lpad(this.getMonth() + 1, '0', 2);
    },
    Y: function() {
        return this.getFullYear();
    },
    y: function() { 
        return new String(this.getFullYear()).substr(2, 2);
    },
    /*B: function() { 
        return locale.MONTH_NAMES[this.getMonth()] 
    },
    b: function() { 
        return locale.ABBR_MONTH_NAMES[this.getMonth()] 
    }*/
};

/**
* Evaluates a value as Boolean as usual, with the exception that strings such as '0' or '1'
# are cast as Number first (hence '0' evaluates as false), and the string 'false' will evaluate
* as false. This is useful when posting boolean values without indication of a data type. 
*/
exports.smartBoolean = function(value) {
    return isNaN(Number(value)) ? value != 'false' : Number(value) != 0;
}

exports.sendEmail = function(to, subject, bodyTemplate, replacements, callback)
{
    fs.readFile('templates/email/' + bodyTemplate + '.txt', function(err, data) {
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

var serveError = function(err, req, res) 
{
    if (!config.DEBUG) {
        res.send(err.statusCode || 500, err.statusCode ? err : { error: 'An error occurred on the server' });
    } else {
        res.send(err.statusCode || 500, err);
    }
}

exports.handleDbOp = function(req, res, err, op, name, permissionCallback) 
{
    if (err) {
        console.error('Error', err);
        switch (err.name) {
            case 'CastError':
                if (err.type == 'ObjectId') {
                    serveError(new HTTPError((name ? name + ' ' : '') + 'not found', 404), req, res);
                    break;
                }
            default:
                // if not in DEBUG mode, most error messages should be hidden from client: 
                if (!config.DEBUG) {
                    err = new HTTPError('Internal Server Error', 500);
                }
                serveError(err, req, res);
                break;
            case 'ValidationError':
                err = new errors.ValidationError(err.msg, err.errors);
            case 'HTTPError':
                // certain error messages should be available to client:
                serveError(err, req, res);
                break;
        }
        return true;
    } else if (!op) {
        serveError(new HTTPError((name ? name + ' ' : '') + 'not found', 404), req, res);
        return true;
    } else if (permissionCallback && !permissionCallback(req, op)) {
        serveError(new HTTPError('permission denied', 403), req, res);
        return true;
    }

    return false;
}

exports.collectionHasIndex = function(collection, index) {
    // TODO: to be implemented
    return true;
}

exports.import = function(into, mod) {
    for (var k in mod) {
        into[k] = mod[k];
    }
    return mod;
}

exports.exitCallback = function(err, data, showHelp, throwErr) {
    if (showHelp) {
        console.info(data);
    }
    if (err) {
        console.error(err.message);
        if (throwErr == undefined) throwErr = config.DEV;
        if (throwErr) {
            throw(err);
        }
        process.exit(1);
    }
    process.exit(0);
};

exports.validateExistingCollection = function(err, collection, callback, force)
{
    if (err || !collection) {
        if (!err) {
            err = new Error('Collection not found');
        }
        if (callback) {
            callback(err);
        } else {
            throw err;
        }
        return false;
    }
    if (!force && (collection.status == config.DataStatus.IMPORTING || collection.status == config.DataStatus.REDUCING)) {
        var err = new Error('Collection is currently busy.');
        if (callback) {
            callback(err);
        } else {
            throw err;
        }
        return false;
    }

    return true;
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

exports.loadFiles = function(filenames, baseDirName, callback)
{
    var loadIndex = 0;
    var contents = {};
    var loadNext = function(err, data) {
        if (loadIndex > 0) {
            if (err) {
                callback(err, contents);
                return;
            }
            contents[filenames[loadIndex - 1]] = data.toString();
            if (loadIndex == filenames.length) {
                callback(err, contents);
                return;
            }
        }
        fs.readFile((baseDirName ? baseDirName + '/' : '') + filenames[loadIndex], 'utf8', loadNext);
        loadIndex++;
    };
    if (filenames.length) {
        loadNext();
    }
}

exports.isEmpty = function(v)
{
    return typeof v == 'undefined'
        || v == ''
        || v == null
        || v == undefined;
}

exports.deleteUndefined = function(obj) 
{
    for (var p in obj) {
        if (typeof obj[p] == 'undefined') {
            delete obj[p];
        }
    }

    return obj;
}

exports.callbackOrThrow = function(err, callback)
{
    if (err) {
        if (callback) {
            console.log(err);
            callback(err);
            return true;
        }
        throw err;
    }
};

exports.capFirst = function(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

var friendlyErrorMessages = function(err)
{
    if (err.name == 'ValidationError') {
        var messages = [],
            keys = Object.keys(err.errors);
        for (var i = 0; i < keys.length; i++) {
            var vErr = err.errors[keys[i]],
                fieldName = exports.capFirst(vErr.path),
                message;
            switch (vErr.type) {
                case 'required':
                    message = fieldName + ' is required.';
                    break;
                default:
                    message = fieldName + ' is not valid.';
            }
            messages.push(message);
        }
        return messages;
    }
};
exports.friendlyErrorMessages = friendlyErrorMessages;

exports.errorToFlash = function(req, err)
{
    var messages = friendlyErrorMessages(err);
    if (messages) {
        for (var i = 0; i < messages.length; i++) {
            req.flash('error', messages[i]);                            
        }
    } else if (err.code == 11000) {
        console.error(err);
        req.flash('error', 'A user with this email address already exists.');
    } else {
        req.flash('error', 'Error creating user account.');
    }
};

var opCache = {};

exports.cachedOp = function(op, key, time, callback) 
{
    var t = Date.now(),
        cached = opCache[key];

    if (cached && cached[0] >= t - time) {
        return callback.apply(null, cached[1]);
    }

    op(function() {
        opCache[key] = [t, arguments];
        callback.apply(null, arguments);
    });
};

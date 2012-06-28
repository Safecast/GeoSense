exports.import = function(into, mod) {
    for (var k in mod) {
        into[k] = mod[k];
    }
    return mod;
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


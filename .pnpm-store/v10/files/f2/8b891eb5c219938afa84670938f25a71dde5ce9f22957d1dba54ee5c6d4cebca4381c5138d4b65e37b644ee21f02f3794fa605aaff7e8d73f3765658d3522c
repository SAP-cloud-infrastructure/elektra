/* jshint node:true */
var vow = require('vow'),
    fs = require('fs'),
    path = require('path'),
    extend = require('extend'),
    _logger, _basedir;
module.exports = function(list, basedir, env, callback, logger){
    "use strict";
    _basedir = basedir || '.';
    _logger = logger || console;

    var file, promises = [];
    for(file in list){
        if(list.hasOwnProperty(file)){
            var p = checkFile(path.resolve(basedir, file), pickOptsFor(env, list[file]));
            if(p){
                promises.push(p);
            }
        }
    }
    if(promises.length){
        vow.all(promises).then(function(result){
            var status = result.some(function(status){
                return status;
            });
            callback && callback(status, result.length);
        });
    }else{
        callback && callback(0, 0);
    }
    
};
function pickOptsFor(env, optList){
    if(!Array.isArray(optList)){
        optList = [optList];
    }
    var i, l = optList.length, res = {}, empty = true;
    for(i = 0; i < l; i++){
        var opt = optList[i];
        if(opt){
            if(!opt.env || opt.env === env && !opt.skip){
                extend(res, opt);
                empty = false;
            }
        }
    }
    return empty? false:res;
}
function checkFile(filename, opts){
    "use strict";
    var defs = getDefaultOpts(filename);
    if( !opts){
        return;
    }
    opts = extend({}, defs, opts);

    return new vow.Promise(function(resolve){
        fs.stat(filename, function(err, stat){
            if(err){
                _logger.error(filename + ': ', err.code === 'ENOENT'? 'File not found':('failed to stat!' + err));
                resolve(1);
            }else{
                var fail = false;
                fail = checkSize(stat, filename, opts.lessThan, opts.biggerThan) || fail;
                fail = checkAge(stat, filename, opts.maxAge) || fail;
                
                if(opts.maxNewLines || opts.blacklist){
                    var data = fs.readFileSync(filename, 'utf-8');
                    fail = checkMaxLines(data, filename, opts.maxNewLines)|| fail;
                    fail = checkBlacklist(data, filename, opts.blacklist) || fail;
                }
                resolve(fail);
            }
        });
    });
}
    
function checkSize(stat, file, max, min){
    "use strict";
    if(!max && !min){
        return;
    }
    if(typeof min === 'number'){
        if(stat.size < min){
            _logger.error(path.relative(_basedir, file) + ': too small!', stat.size, '<', max);
            return true;
        }
    }
    if(typeof max === 'number'){
        if(stat.size > max){
            _logger.error(path.relative(_basedir, file) + ': too big!', stat.size, '>', min);
            return true;
        }
    }
    if(max === 'parent' || min === 'parent'){
        var parent = resolveParent(file);
        if(parent === file){
            _logger.warn(path.relative(_basedir,file) + ': parent is same as file');
            return;
        }
        if(!fs.existsSync(parent)){
            _logger.warn(path.relative(_basedir,file) + ': no parent found while checking size.\n\tparent:', parent);
            return;
        }
        var pstat = fs.statSync(parent);
        if(min && stat.size < pstat.size){
            _logger.error(path.relative(_basedir,file) + ': too small!',
                    stat.size, '<', pstat.size, '(' + parent + ')');
            return true;
        }
        if(max && stat.size > pstat.size){
            _logger.error(path.relative(_basedir,file) + ': too big!',
                    stat.size, '>', pstat.size, '(' + parent + ')');
            return true;
        }
    }
}
    
function checkAge(stat, file, opt){
    "use strict";
    if(!opt){
        return;
    }
    var age = new Date() - new Date(stat.mtime);

    if(typeof opt === 'number'){
        if(age > opt*1000){
            _logger.error(path.relative(_basedir,file) + ': obsolete!',
                    stat.mtime, (age / 1000) + 's > ' + opt + 's');
            return true;
        }else {
            if(age < 0){
                _logger.warn(path.relative(_basedir,file) + ': strange last modified:',
                        stat.mtime, (age / 1000) + 's in future');
            }
            return;
        }
    }
    _logger.warn(path.relative(_basedir,file) + ': strange param maxAge:', opt);
}

function checkMaxLines(data, file, opt){
    "use strict";
    if(!opt){
        return;
    }
    var matches = data.match(/\n/g);

    if(matches && matches.length > opt){
        _logger.error(path.relative(_basedir,file) + ': too much newlines!', matches.length, '>', opt);
        return true;
    }
}
function checkBlacklist(data, file, opt){
    "use strict";
    if(!opt){
        return;
    }
    var matches = data.match(new RegExp(opt, 'g'));
    if(matches && matches.length){
        _logger.error(path.relative(_basedir,file) + ': blacklist!'+
                '\n\tmatching regexp: ' + opt + '\n\tstring: "' + matches.join(' ').substr(0, 140) + '..."');
        return true;
    }
}
function resolveParent(file){
    "use strict";
    var dir = path.dirname(file),
        ext = path.extname(file),
        base = path.basename(file, ext);
    
    if(base.indexOf('_') === 0){
        return path.join(dir, base.substr(1) + ext);
    }
    base = base.replace(/\.ie\d?$/,'');
    return path.join(dir, base + ext);
}


function getDefaultOpts(file){
    "use strict";
    var base = path.basename(file),
    /* import matching regexp from borschik */
        stringRe = "(?:(?:'[^'\\r\\n]*')|(?:\"[^\"\\r\\n]*\"))",
        urlRe = "(?:(?:url\\(\\s*" + stringRe + "\\s*\\))|(?:url\\(\\s*[^\\s\\r\\n'\"]*\\s*\\)))",
        importRe = '(?:\\@import\\s+(' + urlRe + '|' + stringRe + '))',
    /* js include matching regexp from borschik */
        includeRe = [
                ['\\{/\\*!?', '\\*/\\}'],
                ['\\[/\\*!?', '\\*/\\]'],
                ['/\\*!?', '\\*/'],
                ['[\'"]', '[\'"]']
            ].map(function(i) {
                return ['(?:', i[0], '\\s*borschik:include:(.*?)\\s*', i[1], ')'].join('');
            }).join('|')+ '|' +
            // RegExp to find borschik.link("path/to/image.png")
            'borschik\\.link\\([\'"]([^@][^"\']+?)[\'"]\\)' +
            '|' +
            // RegExp to find includes("path/to/file.js")
            'include\\([\'"]([^@][^"\']+?)[\'"]\\);?',
        opts = [
            {
                re: /_[^\/]+\.webp\.css$/,
                maxNewLines: 50,
                blacklist: importRe
            },
            {
                re: /_[^\/]+\.css$/,
                maxNewLines: 50,
                blacklist: importRe
            },
            {
                re: /\.css$/,
                biggerThan: 10
            },
            {
                re: /_[^\/]+\.js$/,
                maxNewLines: 50,
                blacklist: includeRe
            }
        ], i;
    for(i = 0; i < opts.length; i++){
        if(opts[i].re.test(base)){
            return opts[i];
        }
    }
    return {};
}
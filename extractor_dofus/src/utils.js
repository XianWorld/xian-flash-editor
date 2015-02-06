/**
 * Created by Dianyan on 2015/2/5.
 */

var utils = {};
utils.getProcessArgvData = function () {
    var i;
    var argString;
    var tempArray;
    var argv = process.argv;
    var len = argv.length;
    var result = {};
    var key, value;

    for (i = 2; i < len; i++) {
        argString = argv[i];
        tempArray = argString.split('=');
        key = tempArray[0].trim();
        value = tempArray.length > 1 ? tempArray[1].trim() : '';

        console.log(key + '=' + value);

        result[key] = value;
    }
    return result;
};

module.exports = utils;
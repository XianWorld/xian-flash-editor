/**
 * Created with WebStorm.
 * User: Dianyan
 * Date: 2015/3/9
 * Time: 15:05
 * To change this template use File | Settings | File Templates.
 */

//if (typeof Xian !== 'object') {
//    Xian = {};
//}
Xian = {};

function getURIDir(file) {
    var index = file.lastIndexOf('/');
    var len = file.length;
    if (index === -1) {
        return file;
    }
    if (index === (len - 1)) {
        return file;
    }
    return file.substring(0, index + 1);
}

var documentDirURI = getURIDir(fl.getDocumentDOM().pathURI);
var scriptDirURI = getURIDir(fl.scriptURI);
Xian.documentDirURI = documentDirURI;
Xian.scriptDirURI = scriptDirURI;

fl.runScript(scriptDirURI + 'utils.jsfl');
fl.runScript(scriptDirURI + 'json2.jsfl');

fl.runScript(scriptDirURI + 'skeleton_2d_data.jsfl');

fl.runScript(scriptDirURI + 'item_handler.jsfl');
fl.runScript(scriptDirURI + 'definition_item_handler.jsfl');
fl.runScript(scriptDirURI + 'animation_item_handler.jsfl');

fl.runScript(scriptDirURI + 'file_handler.jsfl');
fl.runScript(scriptDirURI + 'animation_file_handler.jsfl');
fl.runScript(scriptDirURI + 'sprite_sheet_file_handler.jsfl');


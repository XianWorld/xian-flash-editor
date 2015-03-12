/**
 * Created with WebStorm.
 * User: Dianyan
 * Date: 2015/3/11
 * Time: 14:38
 * To change this template use File | Settings | File Templates.
 */

"use strict";

if (typeof Xian !== 'object') {
    Xian = {};
}

if (!Xian.SpriteSheetFileHandler) {
    (function () {
        fl.runScript(Xian.scriptDirURI + 'utils.jsfl');
        var Utils = Xian.Utils;
        fl.runScript(Xian.scriptDirURI + 'item_handler.jsfl');
        var ItemHandler = Xian.ItemHandler;

        function SpriteSheetFileHandler() {
            this.json = undefined;
            this.fileName = undefined;
        }

        SpriteSheetFileHandler.prototype.initFromFile = function (fileName) {
            if(!fileName){
                fileName = fl.browseForFileURL("open", "打开SpriteSheet文件");
            }
            if(!fileName)
                return;

            this.fileName = fileName;

            var jsonString = FLfile.read(fileName);
            this.initFromString(jsonString);
        };

        SpriteSheetFileHandler.prototype.initFromString = function (jsonString) {
            this.json = JSON.parse(jsonString);
        };

        SpriteSheetFileHandler.prototype.saveToFile = function (fileName) {
            fileName = fileName || this.fileName;
            //if(!fileName)
            //    return;
            this.saveAsToFile(fileName);
        };

        SpriteSheetFileHandler.prototype.saveAsToFile = function (fileName) {
            //fileName = fileName || this.fileName;
            if(!fileName){
                fileName = fl.browseForFileURL("open", "保存SpriteSheet文件");
            }
            if(!fileName)
                return;

            var jsonString = JSON.stringify(this.json, null, '\t');
            if (!FLfile.write(fileName, jsonString)) {
                fl.trace("[Error]: failed to write to file!");
            }
        };

        SpriteSheetFileHandler.prototype.validate = function () {
            //var dom = fl.getDocumentDOM();
            //var library = dom.library;

            var json = this.json;
            var frames = json.frames;

            var itemName;
            var frameId;
            var item;
            var bounds = {};
            var frame;
            var newFrames = {};
            var pivotX,pivotY;

            for (var frameName in frames) {
                frame = frames[frameName];
                itemName = frameName.substr(0, frameName.length - 4);
                frameId = parseInt(frameName.substr(frameName.length - 4, 4));
                //item = Utils.getLibraryItemByName(itemName);
                //if(!item) continue;

                bounds = ItemHandler.getItemFrameBounds(itemName, frameId, bounds);
                //fl.trace(itemName + ": " +JSON.stringify(bounds, null, '\t'));

                var ew = frame.frame.w;
                var eh = frame.frame.h;
                var ox = (ew-bounds.width)/2;
                var oy = (eh-bounds.height)/2;
                //"pivot": {"x":0.5,"y":0.5}
                pivotX = -(bounds.left-ox) / (ew);
                pivotY = -(bounds.top-oy) / (eh);
                //pivotX = -Utils.roundValue(bounds.left) / Utils.roundValue(bounds.width);
                //pivotY = -Utils.roundValue(bounds.top) / Utils.roundValue(bounds.height);
                frame.pivot = {"x": Utils.roundValue(pivotX,1000), "y": Utils.roundValue(pivotY,1000)};
                newFrames[itemName] = frame;
            }

            json.frames = newFrames;
        };


        Xian.SpriteSheetFileHandler = SpriteSheetFileHandler;
    }());
}

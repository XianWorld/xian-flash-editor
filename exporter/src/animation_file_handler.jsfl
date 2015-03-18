/**
 * Created with WebStorm.
 * User: Dianyan
 * Date: 2015/3/9
 * Time: 18:12
 * To change this template use File | Settings | File Templates.
 */

"use strict";

if (typeof Xian !== 'object') {
    Xian = {};
}

if (!Xian.AnimationFileHandler) {
    (function () {
        fl.runScript(Xian.scriptDirURI + 'file_handler.jsfl');
        var FileHandler = Xian.FileHandler;
        fl.runScript(Xian.scriptDirURI + 'item_handler.jsfl');
        var ItemHandler = Xian.ItemHandler;
        fl.runScript(Xian.scriptDirURI + 'definition_item_handler.jsfl');
        var DefinitionItemHandler = Xian.DefinitionItemHandler;
        fl.runScript(Xian.scriptDirURI + 'utils.jsfl');
        var Utils = Xian.Utils;
        fl.runScript(Xian.scriptDirURI + 'sprite_sheet_file_handler.jsfl');
        var SpriteSheetFileHandler = Xian.SpriteSheetFileHandler;

        var definition_item_name = '_definition';
        var tempEmptyItemName = "_tempEmptyItem";
        var spriteSheetFileHandler = new SpriteSheetFileHandler();

        function AnimationFileHandler() {
            FileHandler.call(this);

            this.definitionHandler = undefined;

            this.animationHandlerHash = {};
            this.animationHandlers = [];
            //this.animationItemDataHash = {};

        }

        AnimationFileHandler.prototype = Utils.inherit(FileHandler.prototype);
        AnimationFileHandler.prototype.constructor = AnimationFileHandler;

        AnimationFileHandler.prototype.init = function (dom, type) {
            FileHandler.prototype.init.call(this, dom, type);

            this.definitionHandler = ItemHandler.getHandlerByItemName(definition_item_name, "DefinitionItemHandler", true);
            this.initAnimationItems();
        };

        AnimationFileHandler.prototype.initAnimationItems = function () {
            var dom = this.document;//fl.getDocumentDOM();
            var library = dom.library;
            var items = library.items;
            var i, item;
            var animationHandlerHash = this.animationHandlerHash;
            var animationHandlers = this.animationHandlers;

            if (this.type === 'dofus') {
                for (i = 0; i < items.length; i++) {
                    item = items[i];

                    var str = item.linkageClassName;
                    if (!str || str == '')
                        continue;
                    if (str.indexOf('Anim') !== 0)
                        continue;
                    var strs = str.split('_');
                    if (strs.length != 2)
                        continue;
                    if (strs[0] == 'AnimArtwork')
                        continue;
                    str = strs[0].substring(4);
                    var dir = parseInt(strs[1]);

                    var anims = animationHandlerHash[str];
                    if (!anims) {
                        anims = animationHandlerHash[str] = [];
                    }
                    var handler = ItemHandler.getHandlerByItem(item, "AnimationItemHandler");
                    handler.animDir = dir;
                    handler.animName = str;
                    anims[dir] = handler;
                    animationHandlers.push(handler);
                    //fl.trace(item.name + "|" + handler);
                }
                //definitionItem = XianUtils.getLibraryItemByName(definition_item_name);
            }
        };

        AnimationFileHandler.prototype.normalizeAnimationItems = function (scale) {
            //1. get all item used in these mc items, and calculate eachone's average scaleX and scaleY.
            var exportItems = [];
            var exportItemHash = {};

            var animationHandlers = this.animationHandlers;
            var i, handler;
            for (i = 0; i < animationHandlers.length; i++) {
                handler = animationHandlers[i];
                handler.getItemScaleData(exportItemHash, exportItems, scale);
            }

            //2. modify the scaleX and scaleY of elements in these items
            var scaleX, scaleY;
            var m;
            for (m = 0; m < exportItems.length; m++) {
                var itemData = exportItems[m];
                var item = itemData.item;
                scaleX = itemData.scaleX;
                scaleY = itemData.scaleY;
                //fl.trace('[Info]: ' + item.name + ": " + scaleX + ', ' + scaleY + ', ' + itemData.refNum);

                //init the item dependencies of the item
                itemData.dependencies = [];
                Utils.traverseItemElements(item, function (timeline, layer, frame, element) {
                    var _sx = scaleX;
                    var _sy = scaleY;
                    if (element.elementType === 'instance') {
                        var tempItem = element.libraryItem;
                        var tempData = exportItemHash[tempItem.name];
                        if (tempData) {
                            //if the element is other export item, then change the scale value because it will be/have been changed
                            fl.trace("****" + tempItem.name + ": " + tempData.scaleX + ', ' + tempData.scaleY);
                            _sx = scaleX / tempData.scaleX;
                            _sy = scaleY / tempData.scaleY;
                            //add the dependency element
                            itemData.dependencies.push(element);
                        }
                    }
                    element.scaleX *= _sx;
                    element.scaleY *= _sy;

                    element.x *= scaleX;
                    element.y *= scaleY;
                }, true, true);

                if (itemData.dependencies.length == 1) {
                    var tempItem = itemData.dependencies[0].libraryItem;
                    fl.trace("[Info]: " + item.name + " will be replaced by " + tempItem.name);
                }
                else if (itemData.dependencies.length > 1) {
                    fl.trace("[Warning]: " + item.name + ' have ' + itemData.dependencies.length + 'dependencies!');
                }
            }

            //3. adjust the scaleX and scaleY of the mc items's elements to recover to original position.
            for (i = 0; i < animationHandlers.length; i++) {
                handler = animationHandlers[i];
                handler.updateItemScaleData(exportItemHash, scale);
            }

            this.saveEditItem();
        };

        AnimationFileHandler.prototype.updateDefinition = function () {
            var definitionHandler = this.definitionHandler;
            var animationHandlers = this.animationHandlers;

            //fl.trace("updateDefinition");

            definitionHandler.validate();
            //fl.trace("definitionHandler.validate");

            definitionHandler.updateSkinData();
            //fl.trace("definitionHandler.updateSkinData");

            var slotLayerHash = definitionHandler.slotLayerHash;
            var slotLayerItemsHash = {};
            var skinsUnusedLayerName = DefinitionItemHandler.skinsUnusedLayerName;
            var i, handler;
            for (i = 0; i < animationHandlers.length; i++) {
                handler = animationHandlers[i];
                handler.getSlotItemsHash(slotLayerHash, slotLayerItemsHash, skinsUnusedLayerName);
            }
            //fl.trace("handler.getSlotItemsHash: " + slotLayerItemsHash);
            //fl.trace(JSON.stringify(slotLayerItemsHash, null, '\t'));

            definitionHandler.updateSkinSlotItems(slotLayerItemsHash);
            //fl.trace("definitionHandler.updateSkinSlotItems");

            this.saveEditItem();
        };

        AnimationFileHandler.prototype.updateAnimationsSlotLayerName = function () {
            var definitionHandler = this.definitionHandler;
            var animationHandlers = this.animationHandlers;

            //get all skin data and their slot layer
            definitionHandler.updateSkinData();

            var itemSlotLayerHash = definitionHandler.getItemSlotLayerHash();

            var i, handler;
            for (i = 0; i < animationHandlers.length; i++) {
                handler = animationHandlers[i];
                handler.updateSlotLayerName(itemSlotLayerHash);
            }
            this.saveEditItem();

        };

        AnimationFileHandler.prototype.exportSkinData = function (bitDepth) {
            var definitionHandler = this.definitionHandler;

            var fileURL = fl.browseForFileURL("save", "保存动画皮肤文件");
            if (!fileURL || fileURL.length === 0)
                return;
            var file = fileURL;
            var index = fileURL.lastIndexOf('.');
            if (index > 0)
                file = file.substring(0, index);

            //0. variable definitions
            var m, instance, item, itemData, len;
            //var bitDepth = parseInt(exportOptions.bitDepth) || 8;
            //var dom = fl.getDocumentDOM();
            //var timeline = dom.getTimeline();
            //var library = dom.library;

            //2. get all item used in these mc items, and calculate eachone's average scaleX and scaleY.
            //var exportItems = [];
            //var exportItemHash = {};
            //
            //Utils.traverseItemsElements(selectedItems, function (timeline, layer, frame, element) {
            //    if (element.elementType === 'instance') {
            //        instance = element;
            //        item = instance.libraryItem;
            //        itemData = exportItemHash[item.name];
            //        if (!itemData) {
            //            exportItemHash[item.name] = item;
            //            exportItems.push(item);
            //            fl.trace(item.name);
            //        }
            //    }
            //}, true);

            //get all skin data and their slot layer
            definitionHandler.updateSkinData();
            var exportItems = definitionHandler.getSkinItems();

            //5. export item to spritesheet.
            var exporter = fl.spriteSheetExporter;//new SpriteSheetExporter();
            exporter.beginExport();
            fl.trace("exporter.borderPadding: "+exporter.borderPadding);
            for (m = 0; m < exportItems.length; m++) {
                exporter.addSymbol(exportItems[m]);
            }

            exporter.layoutFormat = 'JSON';

            var data = exporter.exportSpriteSheet(file, {
                format: "png",
                bitDepth: bitDepth,
                backgroundColor: "#00000000"
            });
            //fl.trace(data);

            spriteSheetFileHandler.initFromString(data);
            spriteSheetFileHandler.validate();
            fl.trace(JSON.stringify(spriteSheetFileHandler.json, null, '\t'));

            var fileName = file + ".json";
            spriteSheetFileHandler.saveAsToFile(fileName);
        };

        AnimationFileHandler.prototype.exportSkeletonData = function (includeAnimation) {
            var definitionHandler = this.definitionHandler;

            var fileURL = fl.browseForFileURL("save", "保存动画皮肤文件");
            if (!fileURL || fileURL.length === 0)
                return;
            //var file = fileURL;
            //var index = fileURL.lastIndexOf('.');
            //if (index > 0)
            //    file = file.substring(0, index);

            var skeletonData = definitionHandler.buildSkeletonData();

            var animationHandler = this.animationHandlerHash['Statique'][2];
            if (animationHandler){
                animationHandler.buildSkeletonPose(skeletonData);
            }

            if(includeAnimation){
                var i, handler;
                var animationHandlers = this.animationHandlers;

                for (i = 0; i < animationHandlers.length; i++) {
                    handler = animationHandlers[i];
                    handler.buildAnimationData(skeletonData);
                }
            }
            var json = skeletonData.toJSON();
            var jsonString = JSON.stringify(json, null, '\t');
            fl.trace(jsonString);

            if (!FLfile.write(fileURL, jsonString)) {
                fl.trace("[Error]: failed to write to file!");
            }

        };

        Xian.AnimationFileHandler = AnimationFileHandler;
    }());
}

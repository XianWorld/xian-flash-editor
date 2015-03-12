/**
 * Created with WebStorm.
 * User: Dianyan
 * Date: 2015/3/6
 * Time: 19:47
 * To change this template use File | Settings | File Templates.
 */

"use strict";

if (typeof Xian !== 'object') {
    Xian = {};
}

if(!Xian.ItemHandler){
    (function() {
        fl.runScript(Xian.scriptDirURI + 'utils.jsfl');
        var Utils = Xian.Utils;

        function ItemHandler() {
            this.item = undefined;
        }
        ItemHandler.prototype.getItem = function(){
            return this.item;
        };

        ItemHandler.classHash = {};
        ItemHandler.createHandler = function(handlerType){
            var c = ItemHandler.classHash[handlerType];
            if(c)
                return new c();
            return undefined;
        };
        ItemHandler.registerHandler = function(handlerType, handlerClass){
            ItemHandler.classHash[handlerType] = handlerClass;
            //fl.trace(handlerType+":" + handlerClass);
        };

        var handlerCacheHash = {};
        ItemHandler.getHandlerByItemName = function (name, handlerType, isNew) {

            var definitionItem = Utils.getLibraryItemByName(name);
            if (!definitionItem) {
                if (isNew) {
                    var dom = fl.getDocumentDOM();
                    var library = dom.library;
                    library.addNewItem("movie clip", name);
                    definitionItem = Utils.getLibraryItemByName(name);
                }
            }

            return ItemHandler.getHandlerByItem(definitionItem, handlerType);
        };

        ItemHandler.getHandlerByItem = function (item, handlerType) {

            var definitionItem = item;
            var handler;
            if (!definitionItem) {
                return undefined;
            }
            handler = handlerCacheHash[definitionItem.name];
            //fl.trace(item.name+":" + handlerType +","+handler);
            if (!handler) {
                handler = handlerCacheHash[definitionItem.name] = ItemHandler.createHandler(handlerType);
                //fl.trace(item.name+":" + handler);
                handler.item = item;
            }
            return handler;

            //handler = ItemHandler.createHandler(handlerType);
            //handler.item = item;
        };

        ItemHandler.getItemFrameBounds = function (itemName, frameId, bounds) {
            bounds || (bounds = {});

            //var dom = fl.getDocumentDOM();
            //var library = dom.library;

            var item = Utils.getLibraryItemByName(itemName);
            if(!item) return null;

            var _xMin,_yMin,_xMax,_yMax;
            var xMin = Infinity;
            var yMin = Infinity;
            var xMax = -Infinity;
            var yMax = -Infinity;
            //var elements = [];
            Utils.traverseItemElements(item, function (timeline, layer, frame, element) {
                if(frame.startFrame > frameId || (frame.startFrame + frame.duration) <= frameId)
                    return;
                //elements.push(element);

                _xMin = element.left;
                _yMin = element.top;
                _xMax = element.left + element.width;
                _yMax = element.top + element.height;
                if(xMin > _xMin) xMin = _xMin;
                if(yMin > _yMin) yMin = _yMin;
                if(xMax < _xMax) xMax = _xMax;
                if(yMax < _yMax) yMax = _yMax;

            }, true);

            bounds.left = xMin;
            bounds.top = yMin;
            bounds.right = xMax;
            bounds.bottom = yMax;
            bounds.width = xMax - xMin;
            bounds.height = yMax - yMin;

            return bounds;
        };
        Xian.ItemHandler = ItemHandler;
    }());
}

/**
 * Created with WebStorm.
 * User: Dianyan
 * Date: 2015/3/9
 * Time: 23:00
 * To change this template use File | Settings | File Templates.
 */


"use strict";

if (typeof Xian !== 'object') {
    Xian = {};
}

if(!Xian.FileHandler) {
    (function () {
        fl.runScript(Xian.scriptDirURI + 'utils.jsfl');
        var Utils = Xian.Utils;

        var tempEmptyItemName = "_tempEmptyItem";

        function FileHandler() {
            this.type = "";

            this.document = undefined;
            this.tempEmptyItem = undefined;
        }

        FileHandler.prototype.init = function (dom, type) {
            this.document = dom;
            this.type = type;

            var library = dom.library;
            this.tempEmptyItem = Utils.getLibraryItemByName(tempEmptyItemName);
            if (!this.tempEmptyItem) {
                library.addNewItem("movie clip", tempEmptyItemName);
                this.tempEmptyItem = Utils.getLibraryItemByName(tempEmptyItemName);
            }
            //fl.trace("FileHandler.prototype.init");
        };

        FileHandler.prototype.saveEditItem = function () {
            var dom = this.document;//fl.getDocumentDOM();
            var library = dom.library;

            dom.editScene(0);
            library.selectItem(this.tempEmptyItem.name);
            var result = library.editItem(this.tempEmptyItem.name);
        };

        Xian.FileHandler = FileHandler;
    }());
}
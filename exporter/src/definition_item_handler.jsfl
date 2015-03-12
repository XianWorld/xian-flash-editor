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

if (!Xian.DefinitionItemHandler) {
    (function () {
        fl.runScript(Xian.scriptDirURI + 'item_handler.jsfl');
        var ItemHandler = Xian.ItemHandler;
        fl.runScript(Xian.scriptDirURI + 'utils.jsfl');
        var Utils = Xian.Utils;
        fl.runScript(Xian.scriptDirURI + 'skeleton_2d_data.jsfl');
        var Skeleton2DData = Xian.Skeleton2DData;


        function DefinitionItemHandler() {
            ItemHandler.call(this);

            this.skinDataHash = {};

            this.slotLayerHash = {};
            this.slotLayers = [];

            this.boneDataHash = {};
            this.boneDatas = [];
        }

        DefinitionItemHandler.prototype = Utils.inherit(ItemHandler.prototype);
        DefinitionItemHandler.prototype.constructor = DefinitionItemHandler;

        DefinitionItemHandler.prototype.updateSkinData = function () {
            //add slot items(attachments) to relative slot layers.
            var i, j, m, layer, layers;
            var dom = fl.getDocumentDOM();
            var definitionItem = this.item;
            var timeline = definitionItem.timeline;

            this.skinDataHash = {};
            this.slotLayerHash = {};
            this.slotLayers.length = 0;
            var skinDataHash = this.skinDataHash;
            var slotLayerHash = this.slotLayerHash;
            var slotLayers = this.slotLayers;
            var skinsFolderName = DefinitionItemHandler.skinsFolderName;


            timeline.currentFrame = 0;
            layers = timeline.layers;
            //get all skin data and their slot layer
            for (i = 0; i < layers.length; i++) {
                layer = layers[i];

                //fl.trace(layer.name + layer.parentLayer + skinsFolder);
                if (layer.parentLayer) {
                    if (layer.parentLayer.name == skinsFolderName) {
                        //get skin data
                        if (layer.layerType == 'folder') {
                            skinDataHash[layer.name] = Utils.getSubLayers(layers, layer);
                        }
                    }
                }
            }

            for (var skinDataName in skinDataHash) {
                var skinSlotLayers = skinDataHash[skinDataName];

                for (i = 0; i < skinSlotLayers.length; i++) {
                    layer = skinSlotLayers[i];

                    if (layer.layerType == 'folder')
                        continue;

                    slotLayerHash[layer.name] = layer;
                    slotLayers.push(layer);
                    //slotLayerItemsHash[layer.name] = {};
                }
            }

        };

        function isInFolder(layer, folderName) {
            var parent = layer.parentLayer;
            while (parent) {
                if (parent.name === folderName)
                    return true;
                parent = parent.parentLayer;
            }
            return false;
        }

        DefinitionItemHandler.prototype.updateBoneData = function () {
            var i, j, m, layer, layers;
            var definitionItem = this.item;
            var timeline = definitionItem.timeline;

            this.boneDataHash = {};
            this.boneDatas.length = 0;
            var boneDataHash = this.boneDataHash;
            var boneDatas = this.boneDatas;
            var bonesFolderName = DefinitionItemHandler.bonesFolderName;
            var boneData;

            //timeline.currentFrame = 0;
            layers = timeline.layers;
            //get all skin data and their slot layer
            for (i = 0; i < layers.length; i++) {
                layer = layers[i];

                //fl.trace(layer.name + layer.parentLayer + skinsFolder);
                if (layer.parentLayer) {
                    if (isInFolder(layer, bonesFolderName)) {
                        var tempName = layer.parentLayer.name;
                        var parentName = (tempName === bonesFolderName) ? undefined : tempName;
                        if (!boneDataHash[layer.name]) {
                            boneData = {name: layer.name, parentName: parentName};
                            boneDataHash[layer.name] = boneData;
                            boneDatas.push(boneData);
                        }
                    }
                }
            }

            if (boneDatas.length > 0)
                return;

            //update from skin slots.
            var slotLayers = this.slotLayers;

            for (i = 0; i < slotLayers.length; i++) {
                layer = slotLayers[i];

                if (layer.layerType == 'folder')
                    continue;
                if (layer.name === DefinitionItemHandler.skinsUnusedLayerName)
                    continue;

                var strs = layer.name.split("_");
                var boneName = strs[0];
                if (!boneDataHash[boneName]) {
                    boneData = {name: boneName, parentName: undefined};
                    boneDataHash[boneName] = boneData;
                    boneDatas.push(boneData);
                    //fl.trace(boneName);
                }
            }
        };

        DefinitionItemHandler.prototype.updateSkinSlotItems = function (slotLayerItemsHash) {
            //add slot items(attachments) to relative slot layers.
            var i, j, m, layer;
            var dom = fl.getDocumentDOM();
            var library = dom.library;

            var definitionItem = this.item;
            library.editItem(definitionItem.name);
            var timeline = definitionItem.timeline;
            var skinDataHash = this.skinDataHash;

            timeline.currentFrame = 0;
            m = 0;
            for (var skinDataName in skinDataHash) {
                var slotLayers = skinDataHash[skinDataName];

                for (i = 0; i < slotLayers.length; i++) {
                    layer = slotLayers[i];

                    if (layer.layerType == 'folder')
                        continue;

                    Utils.getLayerIndex(timeline, layer, true);

                    //clean all items in this layer and first frame
                    timeline.clearFrames(0);

                    var slotItems = slotLayerItemsHash[layer.name];
                    j = 0;
                    for (var key in slotItems) {
                        //for (j = 0; j < slotItems.length; j++) {
                        var x = j * 60;
                        var y = m * 60;
                        dom.addItem({x: x, y: y}, slotItems[key]);

                        j++;
                    }
                    m++;
                }
            }
        };

        DefinitionItemHandler.prototype.validate = function () {
            var dom = fl.getDocumentDOM();
            //var timeline = dom.getTimeline();
            var library = dom.library;

            var definitionItem = this.item;
            library.editItem(definitionItem.name);
            var timeline = definitionItem.timeline;

            var skinsFolder;
            var bonesFolder;
            var unusedSkin;
            var unusedSlot;
            var layerIndexes, layerIndex;
            var layers = timeline.layers;

            //find skins folder
            var skinsFolderName = DefinitionItemHandler.skinsFolderName;
            layerIndexes = timeline.findLayerIndex(skinsFolderName);
            if (layerIndexes === undefined) {
                timeline.currentLayer = 0;
                layerIndex = timeline.addNewLayer(skinsFolderName, "folder", true);
                skinsFolder = timeline.layers[layerIndex];
            }
            else {
                skinsFolder = layers[layerIndexes[0]];
                if (skinsFolder.layerType != 'folder')
                    skinsFolder.layerType = 'folder';
            }
            //fl.trace("skinsFolder: " + skinsFolder);

            //find bones folder
            var bonesFolderName = DefinitionItemHandler.bonesFolderName;
            layerIndexes = timeline.findLayerIndex(bonesFolderName);
            if (layerIndexes === undefined) {
                timeline.currentLayer = 0;
                layerIndex = timeline.addNewLayer(bonesFolderName, "folder", true);
                bonesFolder = timeline.layers[layerIndex];
            }
            else {
                bonesFolder = layers[layerIndexes[0]];
                if (bonesFolder.layerType != 'folder')
                    bonesFolder.layerType = 'folder';
            }
            //fl.trace("bonesFolder: " + bonesFolder);

            //find skins unused skin
            var skinsUnusedSkinName = DefinitionItemHandler.skinsUnusedSkinName;
            layerIndexes = timeline.findLayerIndex(skinsUnusedSkinName);
            if (layerIndexes === undefined) {
                layerIndexes = timeline.findLayerIndex(skinsFolderName);
                timeline.currentLayer = layerIndexes[0];
                layerIndex = timeline.addNewLayer(skinsUnusedSkinName, "folder", false);
                unusedSkin = timeline.layers[layerIndex];
                //fl.trace(layerIndex+", " + timeline.currentLayer+", " + layerIndexes[0] + ", " + layers.length + "," + timeline.layerCount);
                unusedSkin.parentLayer = skinsFolder;
            }
            //fl.trace("unusedSkin: " + layerIndexes);
            //check and create unused layer, which will be used for contain items not bundled with slot layer.
            var skinsUnusedLayerName = DefinitionItemHandler.skinsUnusedLayerName;
            layerIndexes = timeline.findLayerIndex(skinsUnusedLayerName);
            //fl.trace("unusedSlot: " + layerIndexes);
            if (layerIndexes === undefined) {
                layerIndexes = timeline.findLayerIndex(skinsUnusedSkinName);
                timeline.currentLayer = layerIndexes[0];
                layerIndex = timeline.addNewLayer(skinsUnusedLayerName, "normal", false);
                unusedSlot = timeline.layers[layerIndex];
                unusedSlot.parentLayer = timeline.layers[layerIndexes[0]];
            }
            //fl.trace("unusedSlot: " + layerIndexes);
        };

        DefinitionItemHandler.prototype.getItemSlotLayerHash = function () {

            var definitionItem = this.item;
            var timeline = definitionItem.timeline;
            var skinDataHash = this.skinDataHash;

            var itemSlotLayerHash = {};
            for (var skinDataName in skinDataHash) {
                var slotLayers = skinDataHash[skinDataName];
                Utils.traverseLayersElements(timeline, slotLayers, function (timeline1, layer, frame, element) {
                    if (element.elementType !== 'instance')
                        return;
                    var instance = element;
                    //if (!layer.parentLayer || layer.parentLayer.name !== definition_skins_folder_name)
                    //    return;

                    var item = instance.libraryItem;
                    var itemData = itemSlotLayerHash[item.name];
                    if (!itemData) {
                        itemData = itemSlotLayerHash[item.name] = {};
                    }

                    itemData[layer.name] = layer.name;
                }, true);
            }
            return itemSlotLayerHash;
        };

        DefinitionItemHandler.prototype.getSkinItems = function () {

            var definitionItem = this.item;
            var timeline = definitionItem.timeline;

            var exportItems = [];
            var exportItemHash = {};

            Utils.traverseLayersElements(timeline, this.slotLayers, function (timeline1, layer, frame, element) {
                if (element.elementType !== 'instance') return;

                if (layer.name === DefinitionItemHandler.skinsUnusedLayerName) return;

                var instance = element;
                var item = instance.libraryItem;
                var itemData = exportItemHash[item.name];
                if (!itemData) {
                    exportItemHash[item.name] = item;
                    exportItems.push(item);
                    //fl.trace(item.name);
                }
            }, true);
            return exportItems;
        };

        DefinitionItemHandler.prototype.buildSkeletonData = function (skeletonData) {
            skeletonData || (skeletonData = new Skeleton2DData());

            this.updateSkinData();
            this.updateBoneData();

            var definitionItem = this.item;
            var timeline = definitionItem.timeline;

            //add bones
            var i, layer, layers;
            var boneDatas = this.boneDatas;
            var bone;
            var boneData;
            var boneName;

            for (i = 0; i < boneDatas.length; i++) {
                bone = boneDatas[i];

                boneName = bone.name;
                //fl.trace(boneName);
                boneData = skeletonData.getBone(boneName);
                if (!boneData) {
                    boneData = new Xian.Bone2DData(boneName);
                    if (bone.parentName)
                        boneData.parent = bone.parentName;
                    skeletonData.addBone(boneData);
                }
            }

            //add slot
            var slotLayers = this.slotLayers;
            var slotData;
            //for (i = 0; i < slotLayers.length; i++) {
            for (i = slotLayers.length - 1; i >= 0; i--) {
                layer = slotLayers[i];

                if (layer.name === DefinitionItemHandler.skinsUnusedLayerName) continue;

                var slotName = layer.name;
                slotData = skeletonData.getSlot(slotName);
                if (!slotData) {
                    boneName = slotName.split("_")[0];
                    boneData = skeletonData.getBone(boneName);
                    slotData = new Xian.Slot2DData(slotName, boneData);
                    skeletonData.addSlot(slotData);
                }
            }

            //add skin slot attachments
            var skinDataHash = this.skinDataHash;
            var skinData;
            var attachmentData;
            for (var skinDataName in skinDataHash) {
                if (skinDataName == DefinitionItemHandler.skinsUnusedSkinName) continue;

                //add skin
                skinData = skeletonData.getSkin(skinDataName);
                if (!skinData) {
                    skinData = new Xian.SkinData(skinDataName);
                    skeletonData.addSkin(skinData);
                }

                layers = skinDataHash[skinDataName];
                for (i = 0; i < layers.length; i++) {
                    layer = layers[i];
                    var slotName = layer.name;
                    slotData = skeletonData.getSlot(slotName);
                    if (!slotData)
                        continue;

                    Utils.traverseLayerElements(timeline, layer, function (timeline1, layer, frame, element) {
                        if (element.elementType !== 'instance')
                            return;
                        var instance = element;

                        var item = instance.libraryItem;
                        //add attachment
                        attachmentData = skinData.getAttachment(slotName, item.name);
                        if (!attachmentData) {
                            attachmentData = new Xian.RegionAttachmentData(item.name);
                            attachmentData.slotData = slotData;
                            skinData.addAttachment(attachmentData);
                        }

                    }, true);
                }
            }

            return skeletonData;
        };

        DefinitionItemHandler.skinsUnusedSkinName = "unusedSkin";
        DefinitionItemHandler.skinsUnusedLayerName = "unusedSlot";
        DefinitionItemHandler.skinsFolderName = "skins";
        DefinitionItemHandler.bonesFolderName = "bones";

        ItemHandler.registerHandler("DefinitionItemHandler", DefinitionItemHandler);
        Xian.DefinitionItemHandler = DefinitionItemHandler;
    }());
}

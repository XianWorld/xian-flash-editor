fl.runScript(fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf('/') + 1) + 'utils.jsfl');

fl.runScript(XianUtils.scriptDirURI + 'skeleton_2d_data.jsfl');

//fl.trace(XianUtils.getDomJsonString());

var exportOptions = {};
var animationItemHash = {};
var animationItems = [];
var animationItemDataHash = {};

//var skeletonDefinitionItem;
var definition_item_name = '_definition';

var definitionItem;
var definition_skins_unused_skin_name = "unusedSkin";
var definition_skins_unused_layer_name = "unusedSlot";
var definition_skins_folder_name = "skins";
var definition_bones_folder_name = "bones";

var tempEmptyItemName = "_tempEmptyItem";
var tempEmptyItem;

function exportMain() {
    var obj = fl.xmlPanel(XianUtils.scriptDirURI + 'export_options.xml');
    if (obj.dismiss !== 'accept')
        return;

    for (var prop in obj) {
        //fl.trace( "property " + prop + " = " + obj[prop]);
        exportOptions[prop] = obj[prop];
    }
    fl.trace(JSON.stringify(exportOptions, null, '\t'));

    beginExport();
    //findAnimationItems(exportOptions.editType);
    //fl.trace(JSON.stringify(animationItemHash, null, '\t'));

    if (exportOptions.normalizeClips == 'true') {
        var scale = parseFloat(exportOptions.clipScale);
        normalizeAnimationItems(scale);
    }
    else if (exportOptions.updateSkinDefinition == 'true') {
        updateSkinDefinition();
    }
    else if (exportOptions.updateSlotLayerName == 'true') {
        updateSlotLayerName();
    }
    else {
        if (exportOptions.exportSkin == 'true') {
            exportSkin();
        }
    }


    endExport();
}

function beginExport() {
    findAnimationItems(exportOptions.editType);

    //create temporary empty item for finishing the item edit mode and save it.
    var dom = fl.getDocumentDOM();
    var library = dom.library;

    tempEmptyItem = XianUtils.getLibraryItemByName(tempEmptyItemName);
    if (!tempEmptyItem) {
        library.addNewItem("movie clip", tempEmptyItemName);
        tempEmptyItem = XianUtils.getLibraryItemByName(tempEmptyItemName);
    }

    //library.selectItem(tempEmptyItem.name);
    //library.editItem(tempEmptyItem.name);
    //dom.editScene(0);

}
function endExport() {
    var dom = fl.getDocumentDOM();
    var library = dom.library;

    dom.editScene(0);
    library.selectItem(tempEmptyItem.name);
    var result = library.editItem(tempEmptyItem.name);
    fl.trace("endExport!" + result);
}
/**
 * find animation items for processions
 * @param type 'dufus', 'xian'
 */
function findAnimationItems(type) {
    var dom = fl.getDocumentDOM();
    var library = dom.library;
    var items = library.items;
    var i, item;
    if (type === 'dofus') {
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

            var anims = animationItemHash[str];
            if (!anims) {
                anims = animationItemHash[str] = [];
            }
            anims[dir] = item;
            animationItems.push(item);

            var animProp = animationItemDataHash[item.name];
            if (!animProp) {
                animationItemDataHash[item.name] = {
                    dir: dir,
                    type: str
                };
            }
            //fl.trace(item.name);
        }

        definitionItem = XianUtils.getLibraryItemByName(definition_item_name);
    }

    //var pos = {x:0,y:0};
    //for (i = 0; i < animationItems.length; i++) {
    //    item = animationItems[i];
    //    library.selectItem(item.name);
    //    library.addItemToDocument(pos);
    //}
}

function normalizeAnimationItems(scale) {
    //0. variable definitions
    var m, instance, item, itemData, len;
    var dom = fl.getDocumentDOM();
    //var timeline = dom.getTimeline();
    var library = dom.library;

    //fl.trace(animationItemHash['Statique']);
    var selectedItems = animationItems;//library.getSelectedItems();//animationItemHash['Statique'];//
    if (!selectedItems || selectedItems.length === 0) {
        fl.trace('[Error]: should select a item in library!');
        return;
    }

    //1. get all item used in these mc items, and calculate eachone's average scaleX and scaleY.
    var exportItems = [];
    var exportItemHash = {};

    XianUtils.traverseItemsElements(selectedItems, function (timeline, layer, frame, element) {
        if (element.elementType === 'instance') {
            instance = element;
            item = instance.libraryItem;
            itemData = exportItemHash[item.name];
            if (!itemData) {
                itemData = {};
                itemData.item = item;
                itemData.refNum = 0;
                itemData.scaleXSum = 0;
                itemData.scaleYSum = 0;
                itemData.scaleX = 1;
                itemData.scaleY = 1;
                exportItemHash[item.name] = itemData;
                exportItems.push(itemData);
                //fl.trace(item.name);
            }
            itemData.refNum++;
            itemData.scaleXSum += instance.scaleX;
            itemData.scaleYSum += instance.scaleY;
            itemData.scaleX = itemData.scaleXSum / itemData.refNum * scale;
            itemData.scaleY = itemData.scaleYSum / itemData.refNum * scale;

            //if(item.name === 'sprite 56'){
            //    fl.trace(item.name + ": " + instance.scaleX + ', ' + instance.scaleY + ', ' + itemData.refNum);
            //}
        }
    }, true);

    //2. modify the scaleX and scaleY of elements in these items
    var scaleX, scaleY;
    for (m = 0; m < exportItems.length; m++) {
        itemData = exportItems[m];
        item = itemData.item;
        scaleX = itemData.scaleX;
        scaleY = itemData.scaleY;
        fl.trace('[Info]: ' + item.name + ": " + scaleX + ', ' + scaleY + ', ' + itemData.refNum);

        //init the item dependencies of the item
        itemData.dependencies = [];
        XianUtils.traverseItemElements(item, function (timeline, layer, frame, element) {
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

        //library.editItem(item.name);
        //dom.selectNone();
        //dom.selectAll();
        //dom.scaleSelection(scaleX, scaleY);
    }
    //dom.editScene(0);
    //dom.selectNone();

    //3. adjust the scaleX and scaleY of the mc items's elements to recover to original position.
    XianUtils.traverseItemsElements(selectedItems, function (timeline, layer, frame, element) {
        var timelineItem = timeline.libraryItem;
        if (element.elementType === 'instance') {
            instance = element;
            item = instance.libraryItem;
            itemData = exportItemHash[item.name];
            if (!itemData) {
                return;
            }
            instance.scaleX /= itemData.scaleX;
            instance.scaleY /= itemData.scaleY;

            instance.scaleX *= scale;
            instance.scaleY *= scale;

            instance.x *= scale;
            instance.y *= scale;

            //if the instance is dependent on only one anther export item, then try replace it with the dependency item.
            if (itemData.dependencies.length == 1) {
                var tempElement = itemData.dependencies[0];
                var tempItem = tempElement.libraryItem;

                instance.matrix = fl.Math.concatMatrix(tempElement.matrix, instance.matrix);
                instance.libraryItem = tempItem;

                fl.trace("[Info]: " + timelineItem.name + ' - ' + tempItem.name + " replace " + item.name);
            }
        }
    }, true, true);

    fl.trace("[Info]: animation normalization finished!");
}

//function buildSkeletonDefinition(skeletonData) {
//    var i, j, k, m, layer, layers, frame, frames, element, elements, instance, item;
//    var isKeyFrame = false;
//    var timeline;
//
//    //var skeletonData = new XianData.Skeleton2DData();
//    var boneData;
//    var slotData;
//
//    item = skeletonDefinitionItem || animationItemHash['Statique'][2];
//    if (!item) return;
//
//    timeline = item.timeline;
//
//    layers = timeline.layers;
//
//    for (i = 0; i < layers.length; i++) {
//        layer = layers[i];
//
//        var parentLayer = layer.parentLayer;
//        //if(layer.layerType == 'folder')
//        //    continue;
//
//        var str = layer.name;
//        var strs = str.split('_');
//
//        //add bone
//        var boneName = strs[0];
//        boneData = skeletonData.boneHash[boneName];
//        if (!boneData) {
//            boneData = new XianData.Bone2DData(boneName);
//            if (parentLayer)
//                boneData.parent = skeletonData.boneHash[parentLayer.name];
//            skeletonData.boneHash[boneName] = boneData;
//        }
//
//        //add slot
//        var slotName = str;
//        slotData = skeletonData.getSlot(slotName);
//        if (!slotData) {
//            slotData = new XianData.Slot2DData(slotName, boneData);
//            skeletonData.addSlot(slotData);
//        }
//    }
//}
//
//function buildSkinDefinition(skeletonData) {
//    var i, j, k, m, layer, layers, frame, frames, element, elements, instance, item;
//    var timeline;
//
//    var slotData;
//    var skinData;
//
//    if (!definitionItem) {
//        skinData = skeletonData.getSkin('default');
//        if (!skinData) {
//            skinData = new XianData.SkinData('default');
//            skeletonData.addSkin(skinData);
//        }
//        return;
//    }
//
//    item = definitionItem;
//    timeline = item.timeline;
//
//    layers = timeline.layers;
//
//    for (i = 0; i < layers.length; i++) {
//        layer = layers[i];
//
//        var layerName = layer.name;
//        if (layer.layerType == 'folder') {
//            skinData = skeletonData.getSkin(layerName);
//            if (!skinData) {
//                skinData = new XianData.SkinData(layerName);
//                skeletonData.addSkin(skinData);
//            }
//            continue;
//        }
//
//        var parentLayer = layer.parentLayer;
//        //set slot's skin data.
//        slotData = skeletonData.getSlot(layerName);
//        if (slotData) {
//            slotData.skinData = skeletonData.getSkin(parentLayer.name);
//        }
//    }
//}

function buildSkeletonDefinition(skeletonData) {
    var i, j, k, m, layer, layers, frame, frames, element, elements, instance, item;
    var isKeyFrame = false;
    var timeline;

    var boneData;
    var slotData;

    item = definitionItem;
    if (!item) return;

    timeline = item.timeline;
    layers = timeline.layers;


    for (i = 0; i < layers.length; i++) {
        layer = layers[i];

        var parentLayer = layer.parentLayer;
        //if(layer.layerType == 'folder')
        //    continue;

        var str = layer.name;
        var strs = str.split('_');

        //add bone
        var boneName = strs[0];
        boneData = skeletonData.getBone(boneName);
        if (!boneData) {
            boneData = new XianData.Bone2DData(boneName);
            if (parentLayer)
                boneData.parent = skeletonData.boneHash[parentLayer.name];
            skeletonData.boneHash[boneName] = boneData;
        }

        //add slot
        var slotName = str;
        slotData = skeletonData.getSlot(slotName);
        if (!slotData) {
            slotData = new XianData.Slot2DData(slotName, boneData);
            skeletonData.addSlot(slotData);
        }
    }
}

function buildSkeletonPose(skeletonData) {
    var i, j, k, m, layer, layers, frame, frames, element, elements, instance, item;
    var isKeyFrame = false;
    var timeline;

    //var skeletonData = new XianData.Skeleton2DData();
    var boneData;
    var slotData;

    item = animationItemHash['Statique'][2];
    if (!item) return;

    timeline = item.timeline;

    layers = timeline.layers;

    for (i = 0; i < layers.length; i++) {
        layer = layers[i];

        var str = layer.name;

        slotData = skeletonData.getSlot(str);
        if (slotData) {
            //update slot order
            skeletonData.bringSlotToTop(slotData);
        }

        frame = layer.frames[0];
        if (frame.elements.length == 0)
            continue;
        element = frame.elements[0];

        boneData = skeletonData.getBone(str);
        if (boneData) {
            boneData.x = element.x;
            boneData.y = element.y;
            boneData.rotation = element.rotation;
            boneData.skewX = element.skewX;
            boneData.skewY = element.skewY;
            boneData.scaleX = element.scaleX;
            boneData.scaleY = element.scaleY;
        }

        //set slot's default attachment name
        if (slotData) {
            slotData.attachmentName = element.name;
        }
    }
}

function buildSlotAttachments(skeletonData) {
    var i, j, k, m, layer, layers, frame, frames, element, elements, instance, item;
    var isKeyFrame = false;
    var timeline;

    var slotData;
    var attachmentData;

    var selectedItems = animationItems;//[animationItemHash['Statique'][2]];

    for (m = 0; m < selectedItems.length; m++) {
        item = selectedItems[m];
        timeline = item.timeline;

        layers = timeline.layers;

        for (i = 0; i < layers.length; i++) {
            layer = layers[i];

            var str = layer.name;

            //add slot
            var slotName = str;
            slotData = skeletonData.getSlot(slotName);
            if (!slotData) {
                continue;
            }

            //find items in frames as slot attachments.
            for (j = 0; j < layer.frames.length; j++) {
                frame = layer.frames[j];
                isKeyFrame = (frame.startFrame === j);
                if (!isKeyFrame) continue;
                for (k = 0; k < frame.elements.length; k++) {
                    element = frame.elements[k];

                    if (element.elementType === 'instance') {
                        var tempItem = element.libraryItem;
                        attachmentData = skeletonData.getAttachment(tempItem.name);
                        if (!attachmentData) {
                            attachmentData = new XianData.RegionAttachmentData(tempItem.name);
                            attachmentData.slotData = slotData;
                            skeletonData.addAttachment(attachmentData);
                        }
                    }
                }
            }
        }
    }
}

function exportSkeleton() {
    var skeletonData = new XianData.Skeleton2DData();

    buildSkeletonDefinition(skeletonData);
    buildSkinDefinition(skeletonData);
    buildSkeletonPose(skeletonData);
    buildSlotAttachments(skeletonData);
}

function updateSkinDefinition() {
    var i, j, k, m, layer, layers, frame, frames, element, elements, instance, item;
    var isKeyFrame = false;

    var dom = fl.getDocumentDOM();
    var timeline = dom.getTimeline();
    var library = dom.library;

    //create new skin definition item if not exit.
    if (!definitionItem) {
        //item = animationItemHash['Statique'][2];
        //if (!item) return;

        //library.duplicateItem(item.name);
        //library.renameItem(skinDefinitionItemName);
        library.addNewItem("movie clip", definition_item_name);
        definitionItem = XianUtils.getLibraryItemByName(definition_item_name);
    }

    library.editItem(definitionItem.name);
    timeline = definitionItem.timeline;//dom.getTimeline();//
    layers = timeline.layers;

    var skinsFolder;
    var bonesFolder;
    var unusedSkin;
    var unusedSlot;
    var layerIndexes, layerIndex;

    //find skins folder
    layerIndexes = timeline.findLayerIndex(definition_skins_folder_name);
    if (layerIndexes == undefined) {
        timeline.currentLayer = 0;
        layerIndex = timeline.addNewLayer(definition_skins_folder_name, "folder", true);
        skinsFolder = timeline.layers[layerIndex];
    }
    else {
        skinsFolder = layers[layerIndexes[0]];
        if (skinsFolder.layerType != 'folder')
            skinsFolder.layerType = 'folder';
    }
    //fl.trace("skinsFolder: " + skinsFolder);

    //find bones folder
    layerIndexes = timeline.findLayerIndex(definition_bones_folder_name);
    if (layerIndexes == undefined) {
        timeline.currentLayer = 0;
        layerIndex = timeline.addNewLayer(definition_bones_folder_name, "folder", true);
        bonesFolder = timeline.layers[layerIndex];
    }
    else {
        bonesFolder = layers[layerIndexes[0]];
        if (bonesFolder.layerType != 'folder')
            bonesFolder.layerType = 'folder';
    }
    //fl.trace("bonesFolder: " + bonesFolder);

    //find skins unused skin
    layerIndexes = timeline.findLayerIndex(definition_skins_unused_skin_name);
    if (layerIndexes == undefined) {
        layerIndexes = timeline.findLayerIndex(definition_skins_folder_name);
        timeline.currentLayer = layerIndexes[0];
        layerIndex = timeline.addNewLayer(definition_skins_unused_skin_name, "folder", false);
        unusedSkin = timeline.layers[layerIndex];
        //fl.trace(layerIndex+", " + timeline.currentLayer+", " + layerIndexes[0] + ", " + layers.length + "," + timeline.layerCount);
        unusedSkin.parentLayer = skinsFolder;
    }
    //check and create unused layer, which will be used for contain items not bundled with slot layer.
    layerIndexes = timeline.findLayerIndex(definition_skins_unused_layer_name);
    if (layerIndexes == undefined) {
        layerIndexes = timeline.findLayerIndex(definition_skins_unused_skin_name);
        timeline.currentLayer = layerIndexes[0];
        layerIndex = timeline.addNewLayer(definition_skins_unused_layer_name, "normal", false);
        unusedSlot = timeline.layers[layerIndex];
        unusedSlot.parentLayer = timeline.layers[layerIndexes[0]];
    }
    //fl.trace("layerIndexes: " + layerIndexes);

    layers = timeline.layers;

    var slotLayerHash = {};
    var slotLayerItemsHash = {};
    var skinDataHash = {};
    timeline.currentFrame = 0;
    //get all skin data and their slot layer
    for (i = 0; i < layers.length; i++) {
        layer = layers[i];

        //fl.trace(layer.name + layer.parentLayer + skinsFolder);
        if (layer.parentLayer) {
            if (layer.parentLayer == skinsFolder) {
                //get skin data
                if (layer.layerType == 'folder') {
                    skinDataHash[layer.name] = XianUtils.getSubLayers(layers, layer);
                }
            }
        }
    }

    //clear all elements in the slot layers.
    for (var skinDataName in skinDataHash) {
        var slotLayers = skinDataHash[skinDataName];

        for (i = 0; i < slotLayers.length; i++) {
            layer = slotLayers[i];

            if (layer.layerType == 'folder')
                continue;

            slotLayerHash[layer.name] = layer;
            slotLayerItemsHash[layer.name] = {};

            var index = XianUtils.getLayerIndex(timeline, layer);
            if (index >= 0) {
                timeline.currentLayer = index;
                timeline.clearFrames(0);
            }
        }
    }

    //update all elements in animation items to relative slot layer
    //var exportItemHash = {};
    var selectedItems = animationItems;
    XianUtils.traverseItemsElements(selectedItems, function (timeline, layer, frame, element) {
        if (element.elementType === 'instance') {
            instance = element;
            item = instance.libraryItem;

            var itemName = item.name;
            var layerName = layer.name;
            //var itemData = exportItemHash[itemName];
            //if (!itemData) {
            //    exportItemHash[itemName] = item;
            //}
            var tempLayer = slotLayerHash[layerName];
            var slotName = definition_skins_unused_layer_name;
            if (tempLayer) {
                slotName = layerName;
            }
            //fl.trace(slotName);
            var slotItems = slotLayerItemsHash[slotName];
            if (!slotItems[itemName])
                slotItems[itemName] = item;
        }
    }, true);

    //add slot items(attachments) to relative slot layers.
    //var itemNum = 0;
    timeline.currentFrame = 0;
    m = 0;
    for (var skinDataName in skinDataHash) {
        var slotLayers = skinDataHash[skinDataName];

        for (i = 0; i < slotLayers.length; i++) {
            layer = slotLayers[i];

            if (layer.layerType == 'folder')
                continue;

            XianUtils.getLayerIndex(timeline, layer, true);
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
}
function updateSlotLayerName() {
    var i, j, k, m, layer, layers, frame, frames, element, elements, instance, item;
    var isKeyFrame = false;

    var dom = fl.getDocumentDOM();
    var timeline = dom.getTimeline();
    var library = dom.library;

    //create new skin definition item if not exit.
    if (!definitionItem) {
        fl.trace("[Error]: no skin definition item found!");
        return;
    }

    timeline = definitionItem.timeline;
    layers = timeline.layers;
    var skinDataHash = {};
    //get all skin data and their slot layer
    for (i = 0; i < layers.length; i++) {
        layer = layers[i];
        if (layer.parentLayer && layer.parentLayer.name == definition_skins_folder_name) {
            //get skin data
            if (layer.layerType == 'folder') {
                skinDataHash[layer.name] = XianUtils.getSubLayers(layers, layer);
            }
        }
    }

    //extract relationship of items and slots from skin definition item
    var itemSlotLayerHash = {};
    for (var skinDataName in skinDataHash) {
        var slotLayers = skinDataHash[skinDataName];
        XianUtils.traverseLayersElements(timeline, slotLayers, function (timeline, layer, frame, element) {
            if (element.elementType !== 'instance')
                return;
            instance = element;
            //if (!layer.parentLayer || layer.parentLayer.name !== definition_skins_folder_name)
            //    return;

            item = instance.libraryItem;
            var itemData = itemSlotLayerHash[item.name];
            if (!itemData) {
                itemData = itemSlotLayerHash[item.name] = {};
            }

            itemData[layer.name] = layer.name;
        }, true);
    }
    //XianUtils.traverseItemElements(definitionItem, function (timeline, layer, frame, element) {
    //    if (element.elementType !== 'instance')
    //        return;
    //    instance = element;
    //    if (!layer.parentLayer || layer.parentLayer.name !== definition_skins_folder_name)
    //        return;
    //
    //    item = instance.libraryItem;
    //
    //    var itemData = itemSlotLayerHash[item.name];
    //    if (!itemData) {
    //        itemData = itemSlotLayerHash[item.name] = {};
    //    }
    //
    //    itemData[layer.name] = layer.name;
    //}, true);

    //var applyLeftRightRule = true;

    //var itemStateHash = {};
    //update all animation slot layer name by relationship in skin definition
    var selectedItems = animationItems;
    XianUtils.traverseItemsElements(selectedItems, function (timeline, layer, frame, element) {
        //var timelineItemName = timeline.libraryItem.name;
        //fl.trace(timelineItemName);
        if (element.elementType !== 'instance')
            return;
        instance = element;
        item = instance.libraryItem;
        //var timelineItemName = timeline.libraryItem.name;
        //var state = itemStateHash[timelineItemName];
        //if(!state){
        //    state = itemStateHash[timelineItemName] = {};
        //}
        //if(state[layer])
        //    return;

        var layerName = layer.name;
        //fl.trace(timeline.libraryItem.name+": " + layer.name);
        var slotHash = itemSlotLayerHash[item.name];
        if (!slotHash)
            return;

        if (slotHash[layerName])
            return;

        var newLayerName = null;
        for (var key in slotHash) {
            newLayerName = key;
            break;
        }

        if (!newLayerName)
            return;

        fl.trace(timeline.libraryItem.name + ": " + layer.name + " -> " + newLayerName);
        layer.name = newLayerName;
        //state[layer] = layer;
    }, true, true);

    fl.trace("[Info]: update slot layer name finished!");
}

//function applyLeftRightRule(itemName, slotName, slotNameHash, state){
//
//    var animProp = animationItemDataHash[itemName];
//    if(!animProp)
//        return slotName;
//
//    var strs = slotName.split('-');
//    if(strs.length == 1)
//        return slotName;
//
//    var partName = strs[0];
//    var dirName = strs[1];
//    if(dirName != 'left' && dirName != 'right')
//        return slotName;
//
//    var leftSlotName = partName + "-left";
//    var rightSlotName = partName + "-right";
//    switch(animProp.dir){
//        case 0:
//        {
//            if(state[])
//        }
//    }
//
//}

function exportSkin() {

    //0. variable definitions
    var m, instance, item, itemData, len;
    var bitDepth = parseInt(exportOptions.bitDepth) || 8;
    //var dom = fl.getDocumentDOM();
    //var timeline = dom.getTimeline();
    //var library = dom.library;

    var selectedItems = animationItems;
    if (!selectedItems || selectedItems.length === 0) {
        fl.trace('[Error]: should select a item in library!');
        return;
    }

    //2. get all item used in these mc items, and calculate eachone's average scaleX and scaleY.
    var exportItems = [];
    var exportItemHash = {};

    XianUtils.traverseItemsElements(selectedItems, function (timeline, layer, frame, element) {
        if (element.elementType === 'instance') {
            instance = element;
            item = instance.libraryItem;
            itemData = exportItemHash[item.name];
            if (!itemData) {
                exportItemHash[item.name] = item;
                exportItems.push(item);
                fl.trace(item.name);
            }
        }
    }, true);

    //5. export item to spritesheet.
    var exporter = fl.spriteSheetExporter;//new SpriteSheetExporter();
    exporter.beginExport();
    for (m = 0; m < exportItems.length; m++) {
        exporter.addSymbol(exportItems[m]);
    }

    exporter.layoutFormat = 'JSON';

    var fileURL = fl.browseForFileURL("save", "保存动画皮肤文件");
    if (fileURL && fileURL.length) {
        var file = fileURL;
        var index = fileURL.lastIndexOf('.');
        if (index > 0)
            file = file.substring(0, index);

        var data = exporter.exportSpriteSheet(file, {format: "png", bitDepth: bitDepth, backgroundColor: "#00000000"});
        fl.trace(data);
    }
}

fl.outputPanel.clear();
exportMain();

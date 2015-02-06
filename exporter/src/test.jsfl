function _getURIDir(file) {
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
var documentDir = _getURIDir(fl.getDocumentDOM().pathURI);
var scriptDir = _getURIDir(fl.scriptURI);
//load JSON encoder/decoder
var file = scriptDir + 'json2.jsfl';
fl.runScript(file);

function debugInfo() {
    var i, j, k, layer, frame, frames, element, elements, instance;
    var dom = fl.getDocumentDOM();
    var timeline = dom.getTimeline();
    var library = dom.library;
    var layers = timeline.layers;

    var currentLayerId = timeline.currentLayer;
    var currentLayer = layers[currentLayerId];
    var currentFrames = currentLayer.frames;
    var currentFrameId = timeline.currentFrame;
    var currentFrame = currentFrames[currentFrameId];
    var currentElements = currentFrame.elements;

    var domObj, timelineObj, layerObj, frameObj, elementObj, itemObj;
    domObj = {};
    domObj.timeline = timelineObj = {
        layers: []
    };
    for (i = 0; i < layers.length; i++) {
        layer = layers[i];
        layerObj = {
            id: i,
            name: layer.name,
            animationType: layer.animationType,
            layerType: layer.layerType,
            frameCount: layer.frameCount,
            frames: []
        };
        //fl.trace(
        //    "[Layer] " + i
        //    + " Name = " + layer.name
        //    + " animationType = " + layer.animationType
        //    + " layerType = " + layer.layerType
        //    + " frameCount = " + layer.frameCount
        //);
        for (j = 0; j < layer.frames.length; j++) {
            frame = layer.frames[j];
            frameObj = {
                id: j,
                name: frame.name,
                duration: frame.duration,
                labelType: frame.labelType,
                startFrame: frame.startFrame,
                tweenType: frame.tweenType,
                hasCustomEase: frame.hasCustomEase,
                tweenEasing: frame.tweenEasing,
                elements: []
            };
            //fl.trace(
            //    "\t[Frames] " + j
            //    + " Name = " + frame.name
            //    + " duration = " + frame.duration
            //    + " labelType = " + frame.labelType
            //    + " startFrame = " + frame.startFrame
            //    + " tweenType = " + frame.tweenType
            //    + " hasCustomEase = " + frame.hasCustomEase
            //    + " tweenEasing = " + frame.tweenEasing
            //);
            //if (frame.isMotionObject()) {
            //    fl.trace(
            //        "\t\t[MotionObject] : " + frame.getMotionObjectXML());
            //}
            for (k = 0; k < frame.elements.length; k++) {
                element = frame.elements[k];
                elementObj = {
                    id: k,
                    name: element.name,
                    left: element.left,
                    top: element.top,
                    width: element.width,
                    height: element.height,
                    transformX: element.transformX,
                    transformY: element.transformY,
                    x: element.x,
                    y: element.y,
                    rotation: element.rotation,
                    scaleX: element.scaleX,
                    scaleY: element.scaleY,
                    skewX: element.skewX,
                    skewY: element.skewY,
                    depth: element.depth
                };
                //fl.trace(
                //    "[Element] " + k
                //    + " name = " + element.name
                //    + " elementType = " + element.elementType
                //    + " bounds = " + element.left + "," + element.top + "," + element.width + "," + element.height
                //    + " transform = " + element.transformX + "," + element.transformY
                //    + " pos = " + element.x + "," + element.y
                //    + " rotation = " + element.rotation
                //    + " scale = " + element.scaleX + "," + element.scaleY
                //    + " skew = " + element.skewX + "," + element.skewY
                //    + " Depth = " + element.depth
                //);
                //
                if (element.elementType === 'instance') {
                    instance = element;
                    elementObj.instanceType = instance.instanceType;
                    elementObj.libraryItem = instance.libraryItem.name + "(" + instance.libraryItem.itemType + ")";
                    //fl.trace(
                    //    "[Instance] "
                    //    + " instanceType = " + instance.instanceType
                    //    + " libraryItem = " + instance.libraryItem
                    //);
                }
                frameObj.elements[k] = elementObj;
            }
            layerObj.frames[j] = frameObj;
        }
        timelineObj.layers[i] = layerObj;
    }
    var data = JSON.stringify(domObj, null, '\t');
    fl.trace(data);
}

function testSpriteSheetExporter(name, layoutFormat) {
    var exporter = fl.spriteSheetExporter;//new SpriteSheetExporter();
    var dom = fl.getDocumentDOM();
    var timeline = dom.getTimeline();
    var library = dom.library;

    var selectedItems = library.getSelectedItems();
    if (!selectedItems || selectedItems.length === 0) return;

    exporter.beginExport();

    var i;
    var len = selectedItems.length;
    for (i = 0; i < len; i++) {
        exporter.addSymbol(selectedItems[i]);
    }
    exporter.layoutFormat = layoutFormat || 'JSON';

    var file = documentDir + name;
    var data = exporter.exportSpriteSheet(file, {format: "png", bitDepth: 32, backgroundColor: "#00000000"});
    fl.trace(data);
}

function testSpriteSheetExporter1(name, layoutFormat) {
    var exporter = fl.spriteSheetExporter;//new SpriteSheetExporter();

    var dom = fl.getDocumentDOM();
    var timeline = dom.getTimeline();
    var library = dom.library;

    var selectedItems = library.getSelectedItems();
    if (!selectedItems || selectedItems.length === 0) return;

    exporter.beginExport();

    var exportItems = [];
    var exportItemHash = {};

    var i, j, k, m, layer, layers, frame, frames, element, elements, instance, item;
    var len = selectedItems.length;
    for (m = 0; m < len; m++) {
        //library.editItem(selectedItems[i].name);
        //_exportDom(exporter);
        //_exportItem(exporter, selectedItems[i]);
        //exporter.addSymbol(selectedItems[i]);
        timeline = selectedItems[m].timeline;
        layers = timeline.layers;

        for (i = 0; i < layers.length; i++) {
            layer = layers[i];
            for (j = 0; j < layer.frames.length; j++) {
                frame = layer.frames[j];
                for (k = 0; k < frame.elements.length; k++) {
                    element = frame.elements[k];
                    if (element.elementType === 'instance') {
                        instance = element;
                        item = instance.libraryItem;
                        if(item.name !== 'sprite 2' && !exportItemHash[item.name]){
                            exportItemHash[item.name] = item;
                            exportItems.push(item);
                            fl.trace(item.name);
                        }
                    }
                }
            }
        }
    }

    //library.addNewItem('movie clip', '__temp');
    //var tempItem = library.getSelectedItems()[0];
    //library.editItem('__temp');
    len = exportItems.length;
    for (m = 0; m < len; m++) {
        dom.addItem({x:0,y:0}, exportItems[m]);
    }
    dom.selectNone();
    dom.selectAll();
    dom.scaleSelection(2.0, 2.0);

    len = dom.selection.length;
    for (m = 0; m < len; m++) {
        element = dom.selection[m];
        exporter.addSymbol(element, element.libraryItem.name);
    }
    exporter.layoutFormat = layoutFormat || 'JSON';

    var file = documentDir + name;
    var data = exporter.exportSpriteSheet(file, {format: "png", bitDepth: 8, backgroundColor: "#00000000"});
    //fl.trace(data);
}

function traverseItemsElements(items, callback, keyframe) {
    var m;
    var len = items.length;
    for (m = 0; m < len; m++) {
        traverseTimelineElements(items[m].timeline, callback, keyframe);
    }
}

function traverseItemElements(item, callback, keyframe) {
    traverseTimelineElements(item.timeline, callback, keyframe);
}

function traverseTimelineElements(timeline, callback, keyframe){
    var i, j, k, m, layer, layers, frame, frames, element, elements, instance, item;
    var isKeyFrame = false;
    layers = timeline.layers;

    for (i = 0; i < layers.length; i++) {
        layer = layers[i];
        for (j = 0; j < layer.frames.length; j++) {
            frame = layer.frames[j];
            isKeyFrame = (frame.startFrame === j);
            if(keyframe && !isKeyFrame) continue;
            for (k = 0; k < frame.elements.length; k++) {
                element = frame.elements[k];
                callback(layer, frame, element);
            }
        }
    }
}

function testSpriteSheetExporter2(name, layoutFormat) {

    //0. variable definitions
    var m, instance, item, itemData, len;
    var dom = fl.getDocumentDOM();
    var timeline = dom.getTimeline();
    var library = dom.library;

    //1. get selected library item
    var selectedItems = library.getSelectedItems();
    if (!selectedItems || selectedItems.length === 0) {
        fl.trace('[Error]: should select a item in library!');
        return;
    }

    //2. get all item used in these mc items, and calculate eachone's average scaleX and scaleY.
    var exportItems = [];
    var exportItemHash = {};

    traverseItemsElements(selectedItems, function(layer, frame, element){
        if (element.elementType === 'instance') {
            instance = element;
            item = instance.libraryItem;
            itemData = exportItemHash[item.name];
            if(!itemData){
                itemData = {};
                itemData.item = item;
                itemData.refNum = 0;
                itemData.scaleXSum = 0;
                itemData.scaleYSum = 0;
                itemData.scaleX = 1;
                itemData.scaleY = 1;
                exportItemHash[item.name] = itemData;
                exportItems.push(itemData);
                fl.trace(item.name);
            }
            itemData.refNum ++;
            itemData.scaleXSum += instance.scaleX;
            itemData.scaleYSum += instance.scaleY;
            itemData.scaleX = itemData.scaleXSum / itemData.refNum;
            itemData.scaleY = itemData.scaleYSum / itemData.refNum;

            //if(item.name === 'sprite 56'){
            //    fl.trace(item.name + ": " + instance.scaleX + ', ' + instance.scaleY + ', ' + itemData.refNum);
            //}
        }
    }, true);

    //3. modify the scaleX and scaleY of elements in these items
    var scaleX, scaleY;
    for (m = 0; m < exportItems.length; m++) {
        itemData = exportItems[m];
        item = itemData.item;
        scaleX = itemData.scaleX;
        scaleY = itemData.scaleY;
        fl.trace(item.name + ": " + scaleX + ', ' + scaleY + ', ' + itemData.refNum);

        traverseItemElements(item, function(layer, frame, element) {
            element.scaleX *= scaleX;
            element.scaleY *= scaleY;
        }, true);
    }

    //4. adjust the scaleX and scaleY of the mc items's elements to recover to original position.
    traverseItemsElements(selectedItems, function(layer, frame, element) {
        if (element.elementType === 'instance') {
            instance = element;
            item = instance.libraryItem;
            itemData = exportItemHash[item.name];
            if(!itemData){
                return;
            }
            instance.scaleX /= itemData.scaleX;
            instance.scaleY /= itemData.scaleY;
        }
    }, true);

    //5. export item to spritesheet.

    var exporter = fl.spriteSheetExporter;//new SpriteSheetExporter();
    exporter.beginExport();

    //len = exportItems.length;
    //for (m = 0; m < len; m++) {
    //    dom.addItem({x:0,y:0}, exportItems[m]);
    //}
    //dom.selectNone();
    //dom.selectAll();
    //dom.scaleSelection(2.0, 2.0);
    //
    //len = dom.selection.length;
    //for (m = 0; m < len; m++) {
    //    element = dom.selection[m];
    //    exporter.addSymbol(element, element.libraryItem.name);
    //}
    for (m = 0; m < exportItems.length; m++) {
        exporter.addSymbol(exportItems[m].item);
    }

    exporter.layoutFormat = layoutFormat || 'JSON';

    var file = documentDir + name;
    var data = exporter.exportSpriteSheet(file, {format: "png", bitDepth: 8, backgroundColor: "#00000000"});
    ////fl.trace(data);
}

//function _exportDom(exporter) {
//    var i, j, k, layer, frame, frames, element, elements, instance;
//    var dom = fl.getDocumentDOM();
//    var timeline = dom.getTimeline();
//    var library = dom.library;
//    var layers = timeline.layers;
//
//    for (i = 0; i < layers.length; i++) {
//        layer = layers[i];
//        for (j = 0; j < layer.frames.length; j++) {
//            frame = layer.frames[j];
//            for (k = 0; k < frame.elements.length; k++) {
//                element = frame.elements[k];
//                if (element.elementType === 'instance') {
//                    instance = element;
//                    exporter.addSymbol(instance.libraryItem);
//                }
//            }
//        }
//    }
//}
//
//function _exportItem(exporter, item) {
//    var i, j, k, layer, frame, frames, element, elements, instance;
//    //var dom = fl.getDocumentDOM();
//    var timeline = item.timeline;
//    //var library = dom.library;
//    var layers = timeline.layers;
//
//    for (i = 0; i < layers.length; i++) {
//        layer = layers[i];
//        for (j = 0; j < layer.frames.length; j++) {
//            frame = layer.frames[j];
//            for (k = 0; k < frame.elements.length; k++) {
//                element = frame.elements[k];
//                if (element.elementType === 'instance') {
//                    instance = element;
//                    exporter.addSymbol(instance.libraryItem);
//                }
//            }
//        }
//    }
//}

fl.outputPanel.clear();
debugInfo();

//testSpriteSheetExporter('dog1');
//testSpriteSheetExporter1('dog2');
testSpriteSheetExporter2('dog2');
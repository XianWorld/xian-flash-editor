/**
 * Created with WebStorm.
 * User: Dianyan
 * Date: 2015/3/9
 * Time: 15:17
 * To change this template use File | Settings | File Templates.
 */
fl.outputPanel.clear();

//fl.trace(Xian);
fl.runScript(fl.scriptURI.substring(0, fl.scriptURI.lastIndexOf('/') + 1) + 'xian.jsfl');
var ItemHandler = Xian.ItemHandler;
var AnimationFileHandler = Xian.AnimationFileHandler;
var SpriteSheetFileHandler = Xian.SpriteSheetFileHandler;

function exportMain() {
    var exportOptions = {};

    var obj = fl.xmlPanel(Xian.scriptDirURI + 'export_options.xml');
    if (obj.dismiss !== 'accept')
        return;

    for (var prop in obj) {
        //fl.trace( "property " + prop + " = " + obj[prop]);
        exportOptions[prop] = obj[prop];
    }
    //fl.trace(JSON.stringify(exportOptions, null, '\t'));
    var animationFileHandler = new AnimationFileHandler();
    animationFileHandler.init(fl.getDocumentDOM(), exportOptions.editType);

    if (exportOptions.normalizeClips == 'true') {
        var scale = parseFloat(exportOptions.clipScale);
        animationFileHandler.normalizeAnimationItems(scale);
    }
    else if (exportOptions.updateDefinition == 'true') {
        animationFileHandler.updateDefinition();
    }
    else if (exportOptions.updateSlotLayerName == 'true') {
        animationFileHandler.updateAnimationsSlotLayerName();
    }
    else {
        if (exportOptions.exportSkeleton == 'true') {
            //var bitDepth = parseInt(exportOptions.bitDepth) || 8;
            var exportAnimation = exportOptions.exportAnimation == 'true';
            animationFileHandler.exportSkeletonData(exportAnimation);
        }

        if (exportOptions.exportSkin == 'true') {
            var bitDepth = parseInt(exportOptions.bitDepth) || 8;
            animationFileHandler.exportSkinData(bitDepth);
        }
    }
}

exportMain();

//var exporter = fl.spriteSheetExporter;//new SpriteSheetExporter();
//exporter.beginExport();
//fl.trace("exporter.borderPadding: "+exporter.borderPadding);
//fl.trace("exporter.canBorderPad: "+exporter.canBorderPad);

//var bounds = ItemHandler.getItemFrameBounds("sprite 39", 0);
//fl.trace(JSON.stringify(bounds, null, '\t'));

//var ssf = new SpriteSheetFileHandler();
//ssf.initFromFile();
//ssf.validate();
//fl.trace(JSON.stringify(ssf.json, null, '\t'));
//
//var fileName = ssf.fileName;
//var file = fileName;
//var index = fileName.lastIndexOf('.');
//if (index > 0)
//    file = file.substring(0, index);
//fileName = file + "_0.json";
//ssf.saveAsToFile(fileName);

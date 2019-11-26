function goto_bounding_box() {
  var queryTask = new esri.tasks.QueryTask(mapservice);
  var query = new esri.tasks.Query();
  query.where = filter;
  query.returnGeometry = true;
  query.outFields = ["OBJECTID"]; //apparently have to return something
  queryTask.execute(query, function(featureSet) {
    var features = featureSet.features || [];
    if (features.length==0) {
      ask_undo_filters();
    } else {
      var extent = esri.graphicsExtent(features);
      if (features.length == 1) {
        var point = features[0];
        if (extent) {
          extent.xmin-=1000;
          extent.ymin-=1000;
          extent.xmax+=1000;
          extent.ymax+=1000;
        }
      }
      if (extent) map.setExtent(extent, true);
    }
  });
}

function check_for_undone_filters() {
  //Don't reset clusters etc with the latest filter unless the zoom level requires it. When it does, apply then.
  if (last_zoom>=points_level) {
    if (update_pins_flag) apply_pins_filters();
  } else {
    if (update_clusterer_flag) apply_cluster_filter();
  }
}

function setLocationRenderer(bpin, ppin) {
  //Different default pins for satellite vs streets
  var renderer = new ClassBreaksRenderer(ppin, "department_broad");
  renderer.addBreak(0, 0, bpin);
  renderer.addBreak(1, 1, ppin);
  locations.setRenderer(renderer);
}

function check_for_points( b ) {
  if (check_extent) {
    check_extent = false;
    if (!points_visible()) {
      goto_bounding_box();
    }
  }
  check_search_highlight();
}

function points_visible() {
  //Are there points displayed on screen?
  var check = locations.visible ? locations : clusterLayer ;
  if (check.graphics.length==0) return false;
  for (var x=0; x<check.graphics.length; x++) {
    if (map.extent.contains(check.graphics[x].geometry)) return true;
  }
  return false;
}

function show_loader(b) {
  document.body.className = b ? "loading" : "" ;
}

function apply_pins_filters() {
  update_pins_flag = false;
  locations.setDefinitionExpression( filter );
  site_boundaries.setLayerDefinitions([filter]);
}

function apply_cluster_filter() {
  update_clusterer_flag = false;
  clusterer(filter);
}

function westminster() {
  return new esri.geometry.Extent(-24784,6706222,-8732,6714744, new esri.SpatialReference({ wkid: 102100 }));
}

function get_dropdown_val( id ) {
  var elem = did(id);
  return elem.value || elem.options[elem.selectedIndex].text; //for ie
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function unique(array) {
  return $.grep(array, function(el, index) {
    return index === $.inArray(el, array);
  });
}

function did(id) {
  return document.getElementById(id);
}

/**
 * convenience debug function to avoid console.log in browsers that don't implement it
 */
function db(s) {
  try {
    console.log(s);
  } catch(e) {
    // could debug in alert() bearing in mind user experience
    // alert(s)
  }
}

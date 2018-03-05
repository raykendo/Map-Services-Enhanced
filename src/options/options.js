// Saves options to chrome.storage
function save_options() {
  chrome.storage.sync.set({
    autoMetadata: document.getElementById("metadata").checked,
    autoFeatureCounts: document.getElementById("featurecounts").checked,
    autoFieldCounts: document.getElementById("fieldcounts").checked,
    autoDomainCounts: document.getElementById("domaincounts").checked,
    defaultWebMapAsJSON: document.getElementById("defaultwebmapasjson").value,
    queryHelperSelectAll: document.querySelector('input[name = "queryhelperselectall"]:checked').value,
    defaultWhereClause: document.getElementById("defaultwhereclause").value
  }, function() {
    // Update status to let user know options were saved.
    var button = document.getElementById("save");
    button.textContent = "Options saved.";
    button.setAttribute("disabled", "disabled");
    setTimeout(function() {
      button.textContent = "Save";
      button.removeAttribute("disabled");
    }, 800);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {

  // Use default value color = "red" and likesColor = true.
  chrome.storage.sync.get({
    autoMetadata: true,
    autoFeatureCounts: true,
    autoFieldCounts: true,
    autoDomainCounts: true,
    defaultWebMapAsJSON: "{\"operationalLayers\":[],\"baseMap\":{\"baseMapLayers\":[{\"id\":\"defaultBasemap\",\"opacity\":1,\"visibility\":true,\"url\":\"http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer\"}],\"title\":\"Topographic\"},\"exportOptions\":{\"dpi\":300,\"outputSize\":[1280,1024]}}",
    queryHelperSelectAll: "get",
    defaultWhereClause: ""
  }, function(items) {
    var metaDataCheck = document.getElementById("metadata"),
      featureCountsCheck = document.getElementById("featurecounts");
    // update form items
    metaDataCheck.checked = items.autoMetadata;
    featureCountsCheck.checked = items.autoFeatureCounts;
    document.getElementById("fieldcounts").checked = items.autoFieldCounts;
    document.getElementById("domaincounts").checked = items.autoDomainCounts;
    document.getElementById("defaultwebmapasjson").value = items.defaultWebMapAsJSON;
    document.getElementById("defaultwhereclause").value = items.defaultWhereClause;
    document.querySelector('input[name = "queryhelperselectall"][value="' + items.queryHelperSelectAll + '"]').checked = true;

    // update auto meta data behavior with update feature counts.
    if (!items.autoMetadata) {
      featureCountsCheck.setAttribute("disabled", "disabled");
    }
    metaDataCheck.addEventListener("change", updateFeatureCountCheck);
  });
}

function updateFeatureCountCheck() {
  var metaDataCheck = document.getElementById("metadata");
  var featureCountsCheck = document.getElementById("featurecounts");
  if (!metaDataCheck.checked) {
    featureCountsCheck.setAttribute("disabled", "disabled");
  } else {
    featureCountsCheck.removeAttribute("disabled");
  }

}
document.addEventListener("DOMContentLoaded", restore_options);
document.getElementById("save").addEventListener("click",
    save_options);
// Saves options to chrome.storage
function save_options() {
  chrome.storage.sync.set({
    autoMetadata: document.getElementById("metadata").checked,
    autoFeatureCounts: document.getElementById("featurecounts").checked,
    autoDomainCounts: document.getElementById("domaincounts").checked,
    defaultWebMapAsJSON: document.getElementById("defaultwebmapasjson").value,
    queryHelperSelectAll: document.querySelector('input[name = "queryhelperselectall"]:checked').value,
    defaultWhereClause: document.getElementById("defaultwhereclause").value
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById("status");
    status.textContent = "Options saved.";
    setTimeout(function() {
      status.textContent = "";
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {

  // Use default value color = "red" and likesColor = true.
  chrome.storage.sync.get({
    autoMetadata: true,
    autoFeatureCounts: true,
    autoDomainCounts: true,
    defaultWebMapAsJSON: "{\"operationalLayers\":[],\"baseMap\":{\"baseMapLayers\":[{\"id\":\"defaultBasemap\",\"opacity\":1,\"visibility\":true,\"url\":\"http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer\"}],\"title\":\"Topographic\"},\"exportOptions\":{\"dpi\":300,\"outputSize\":[1280,1024]}}",
    queryHelperSelectAll: "get",
    defaultWhereClause: ""
  }, function(items) {
    document.getElementById("metadata").checked = items.autoMetadata;
    document.getElementById("featurecounts").checked = items.autoFeatureCounts;
    document.getElementById("domaincounts").checked = items.autoDomainCounts;
    document.getElementById("defaultwebmapasjson").value = items.defaultWebMapAsJSON;
    document.getElementById("defaultwhereclause").value = items.defaultWhereClause;
    document.querySelector('input[name = "queryhelperselectall"][value="' + items.queryHelperSelectAll + '"]').checked = true;
  });
}
document.addEventListener("DOMContentLoaded", restore_options);
document.getElementById("save").addEventListener("click",
    save_options);
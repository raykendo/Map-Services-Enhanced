// Saves options to chrome.storage
function save_options() {
  var color = document.getElementById('color').value;

  chrome.storage.sync.set({
    autoMetadata: document.getElementById('metadata').checked,
    autoFeatureCounts: document.getElementById('featurecounts').checked,
    autoDomainCounts: document.getElementById('domaincounts').checked
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    autoMetadata: true,
    autoFeatureCounts: true,
    autoDomainCounts: true
  }, function(items) {
    document.getElementById('metadata').checked = items.autoMetadata;
    document.getElementById('featurecounts').checked = items.autoFeatureCounts;
    document.getElementById('domaincounts').checked = items.autoDomainCounts;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
{
  const shortenerBlank = document.getElementById("urlshortblank"),
    copyBtn = document.getElementById("copybtn");

  /**
   * Shortens the url
   * @function shortenUrl
   * @param {string} url 
   * @returns {string}
   */
  const shortenUrl = (url) => {
    const defaultParams = {
      f: "html",
      returnExtentsOnly: "false",
      returnIdsOnly: "false",
      geometryType: "esriGeometryEnvelope",
      spatialRel: "esriSpatialRelIntersects",
      returnTrueCurves: "false",
      returnCountOnly: "false",
      returnZ: "false",
      returnM: "false",
      returnDistinctValues: "false",
      returnGeometry: "true"
    };
    // replace empty query parameter values
    while (/(\?|\&)\w+\=(\&|$)/g.test(url)) {
      url = url.replace(/(\?|\&)\w+\=(\&|$)/g, "$1");
    }

    // replace default values:
    for (let item in defaultParams) {
      let defaultRegex = new RegExp(item + "=" + defaultParams[item], "ig");
      if (defaultRegex.test(url)) {
        url = url.replace(defaultRegex, "");
      }
    }

    // replace multiple ampersand(&) values
    while (/\&{2,}/g.test(url)) {
      url = url.replace(/\&+/g, "&");
    }
    // replace ampersand(&) at end of the string with a blank
    while (/\&$/.test(url)) {
      url = url.replace(/\&$/, "");
    }

    return url;
  };
  
  /**
   * Run this when current page loads
   * @function bootStrap
   */
  const bootStrap = () => {
    chrome.tabs.query({
      active: true, 
      currentWindow: true
    }, (tabs) => {
      let url = tabs[0].url,
        shortened = shortenUrl(url);
      shortenerBlank.setAttribute("value", shortened);

      // hide url shortener if the url of the page matches the url of the shortener
      if (url === shortened) {
        document.getElementById("urlshortcontent").style.display = "none";
      } else {
        document.getElementById("urlshortcontent").style.display = "block";
      }
    });
  };
  
  // copy the url to the clipboard when the copy url button is clicked.
  copyBtn.addEventListener("click", () => {
    if (typeof shortenerBlank.select === "function") {
      shortenerBlank.select();
      document.execCommand("Copy");
      copyBtn.firstChild.nodeValue = "Copied!";
      copyBtn.setAttribute("disabled", "disabled");
      setTimeout(() => {
        copyBtn.firstChild.nodeValue = "Copy to Clipboard";
        copyBtn.removeAttribute("disabled");
      }, 1000);
    }
  });

  document.addEventListener("DOMContentLoaded", () => bootStrap());
}
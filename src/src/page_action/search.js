{
  const d = document, 
    txt = d.getElementById("searchblank"), 
    btn = d.getElementById("searchbtn"),
    searchCount = d.getElementById("searchedfeatures"),
    resultCount = d.getElementById("searchresultscount"),
    resultList = d.getElementById("searchresults");
  let locs, hits;
		
	/**
   * requests data from a URL and returns it in JSON format
   * @function ajax
   * @param {string} u - URL to send the requests
   * @param {function} callback - function to call when results are returned
   * @param {object} [data] - optional information to send, triggers a post instead of a get requests
   * @param {object} [x] - state of the application
   */
  const ajax = (u, callback, data, x) => {
    try {
      x = new(this.XMLHttpRequest)("MSXML2.XMLHTTP.3.0");
      x.open(data ? "POST" : "GET", u, 1);
      x.setRequestHeader("X-Requested-With", "XMLHttpRequest");
      x.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      x.onreadystatechange = () => {
        if (x.readyState > 3 && callback) {
          try {
            // JSON.parse doesn't handle NaN values where numbers are supposed to go
            let processedResponseText = (x.responseText || "{}").replace(/:\s*NaN,/ig, ":\"NaN\",");
            callback(JSON.parse(processedResponseText), x);
          } catch (err) {
            console && console.warn(u, x.responseText, err);
          }
        }
      };
      x.send(data);
    } catch (e) {
      window.console && console.log(e);
    }
  };

   /**
   * Creates an HTML element.
   * @function loadElement
   * @param {string} tag - HTML tag name that you want to create.
   * @param {object} attributes - name value object describing properties you want to assign to the object
   * @param {string} [text] - if present, this is the content you should add to the HTML element.
   */
  const loadElement = (tag, attributes, text) => {
    const el = document.createElement(tag);
    if (attributes) {
      for (let a in attributes) {
        el.setAttribute(a, attributes[a]);
      }
    }
    if (text) {
      el.appendChild(document.createTextNode(text));
    }
    return el;
  };

  /**
   * get values of dot.notated.parameters out of a JSON object
   * @function getFinalVal
	 * @param {string[]} fields - list of fields
	 * @param {object} data - JSON object.
   */
  const getFinalVal = (fields, data) => {
    let result = data.hasOwnProperty(fields[0]) ? data[fields[0]] : null;
    if (result != null && fields.length > 1) {
      if (result instanceof Array) {
        return result.map((item) => getFinalVal(fields.slice(1), item));
      }
      return getFinalVal(fields.slice(1), result);
    }
    return result;
  };

  /**
   * displays a link to a map service REST endpoint with data that matches the search.
   * @function printResult
   * @param {string} field
   * @param {string} result
   * @param {string} url
   */
  const printResult = (field, result, url) => {
    const li = d.createElement("li");
    const link = loadElement("a", {
      "href": url,
      "target": "_blank"
    });
    link.appendChild(loadElement("b", {}, "Source: "));
    link.appendChild(d.createTextNode(url.replace(/^\S*\/rest\/services\//i, ".")));
    link.appendChild(d.createElement("br"));
    link.appendChild(loadElement("b", {}, `${field}: `));
    link.appendChild(d.createTextNode(result))
    li.appendChild(link);
    return li;
  };

  /**
   * test if the result matches the search. If so, increments the hit counter and displays the result.
   * @function checkAndPrint
   * @param {function} myTest - test function
   * @param {string} field - field name
   * @param {string} result
   * @param {string} url
   */
  const checkAndPrint = (myTest, field, result, url) => {
    if (myTest(result)) {
      hits++;
      resultList.appendChild(printResult(field, result, url));
    }
  };

  /**
   * collect values from the data, and send the data off for testing.
   * @function responseSearch
   * @param {string} url
   * @param {object} data
   * @param {function} myTest
   */
  const responseSearch = (url, data, myTest) => {
    const fieldList = ["name", "description", "displayField", "fields.name", "fields.alias", "mapName", "layers.name", "documentInfo.Title", "documentInfo.Comments", "documentInfo.Subject", "documentInfo.Category", "documentInfo.Keywords", "folders", "services.name", "services.type"];
    fieldList.forEach((field) => {
      let result = getFinalVal(field.split("."), data);
      if (result == null) { return; }
      if (result instanceof Array) {
        result.forEach((item) => checkAndPrint(myTest, field, item, url));
      } else {
        checkAndPrint(myTest, field, result, url);
      }
    });
  };
	
  /** 
   * returns a list of child folders for the current service.
   * @function subUrls
   * @param {string} url
   * @param {*} data
   * @returns {string[]} a list of results
   */
  const subUrls = (url, data) => {
    const runners = {
      "folders": (folder) => [url, folder].join("/"),
      "services": (service) => [url, service.name.replace(/\w+\//ig, ""), service.type].join("/"),
      "layers": (layer) => [url, layer.id].join("/"),
      "tables": (table) => [url, table.id].join("/")
    };
    let list = [];
    for (let r in runners) {
      if (data[r] && data[r].length) {
        list = list.concat(data[r].map(runners[r]));
      }
    }
    return list;
  };

  /**
   * given a list of urls and a testing function, requests data from 
   * the first url in the list, searches the JSON response, and if there 
   * are more urls in the list, calls itself again.
   * @function queryMe
   * @param {string[]} list - list of urls
   * @param {function} myTest - test to perform on the results to see if it matches.
   */
  const queryMe = (list, myTest) => { 
    if (!list.length) { return; }
    const url = list.shift();
    ajax(url + "?f=json", (data) => {
      locs++;
      responseSearch(url, data, myTest);
      list = list.concat(subUrls(url, data));
      searchCount.firstChild.nodeValue = locs.toString();
      resultCount.firstChild.nodeValue = hits.toString();
      if (list.length) {	
        queryMe(list, myTest); 
      } else {
        btn.removeAttribute("disabled");
        btn.firstChild.nodeValue = "Search";
        Array.prototype.forEach.call(d.getElementsByTagName("a"), (ln) => {
          let location = ln.href;
          ln.addEventListener("click", () => {
            chrome.tabs.create({active: true, url: location});
          });
        });
      }
    });
  };

	// function called on mouse click, parses searches, sets up tests, and queries the current REST service.
  btn.addEventListener("click", () => {
    let searchFor, myTest;
    if (txt.value) {
      // clear the list
      while (resultList.childNodes.length) {
        resultList.removeChild(resultList.childNodes[0]);
      }
      btn.firstChild.nodeValue = "Scanning";
      btn.setAttribute("disabled", "disabled");
      searchCount.firstChild.nodeValue = " ";
      resultCount.firstChild.nodeValue = " ";

      if (/^\d*\.?\d+$/.test(txt.value)) {
        searchFor = /\./.test(txt.value) ? parseFloat(txt.value) : parseInt(txt.value, 10);
        myTest = (val) => val === searchFor;
      } else {
        searchFor = new RegExp(txt.value, "i");
        myTest = (val) => searchFor.test(val);
      }
      locs = 0;
      hits = 0;
      chrome.tabs.query({
        active: true, 
        currentWindow: true
      }, (tabs) => {
        tabs.forEach((tab) => queryMe([tab.url.replace(/\?[\B]*$/, "")], myTest));
      });
    } else { 
      alert("Please enter a value"); 
    }
    return false;
  }, false);
}
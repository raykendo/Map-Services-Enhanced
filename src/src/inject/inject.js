{
  let colorhash = {},
    active;
  
  // Status effects
  const STATUS = {
    LOADING: "loading-start",
    LOAD_COMPLETE: "loading-complete"
  };

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
   * Changes a text value from camel-case to title case
   * @function unCamelCase
   * @param {string} value - value to transform from camel case
   * @returns {string} - a string in title case form.
   */
  const unCamelCase = (value) => value.substr(0, 1).toUpperCase() + value.substr(1).replace(/([a-z])([A-Z])/g, "$1 $2");

  /**
   * Creates an HTML element.
   * @function loadElement
   * @param {string} tag - HTML tag name that you want to create.
   * @param {object} attributes - name value object describing properties you want to assign to the object
   * @param {string} [text] - if present, this is the content you shoul add to the HTML element.
   */
  const loadElement = (tag, attributes, text) => {
    const el = document.createElement(tag);
    for (let a in attributes) {
      el.setAttribute(a, attributes[a]);
    }
    if (text) {
      el.innerHTML = text;
    }
    return el;
  };

  /**
   * Adds a list item to a node if the property is there and maybe if a property is true.
   * @function li
   * @param {string} title - text to add in bold
   * @param {string | object} content - data to add after title in regular format
   * @param {string} [className] - if prsent, adds the class name to the list item
   * @returns {object} - list item node;
   */
  const li = (title, content, className) => {
    const node = loadElement("LI", {"class": className || ""});
    if (content === undefined) {
      node.innerHTML = ["<b>","</b>"].join(title);
    } else {
      node.innerHTML = ["<b>", title, ": </b>", (content instanceof Object ? JSON.stringify(content) : content)].join("");
    }
    return node;
  };

  /**
   * Adds a list item to a node with the title of the property, and then itemizes ovoer the content object get all its properties
   * @function addSubList
   * @param {string} title - title of the list
   * @param {object} content - name, value pairs used to describe a feature.
   * @param {string} [className] - if present, add this class name to the list item.
   * @returns {object} - list item node containing list of properties.
   */
  const addSubList = (title, content, className) => {
    const node = loadElement("LI", {"class": className || ""}, ["<b>",": </b>"].join(title)), 
      ul = document.createElement("ul");
    for (let i in content) {
      ul.appendChild(li(unCamelCase(i), content[i]));
    }
    node.appendChild(ul);
    return node;
  };

  /**
   * Calculates a random color for a string value
   * @function getColor
   * @param {string} item - a string value
   * @returns {string} a CSS hex string for a color.
   */
  const getColor = (item) => {
    if (colorhash[item]) { return colorhash[item]; }
    colorhash[item] = "#" + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6);
    return colorhash[item];
  };

  /**
   * Returns whether a field is queryable
   */
  const isQueryableField = (field) => ["esriFieldTypeGeometry","esriFieldTypeBlob","esriFieldTypeXML","esriFieldTypeRaster"].indexOf(field.type) === -1;

  /**
   * Calculates a complimentary shade or tint of a color to provide contrast
   * @function getCompColor
   * @param {string} item - a CSS hex string for a color
   * @returns {string} a CSS hext string for a color that is either lighter or darker than the current color.
   */
  const getCompColor = (item) => {
    const col = colorhash[item],
      mid = [col.substr(1,1),col.substr(3,1),col.substr(5,1)].sort()[1],
      coltbl = "fedcba98".indexOf(mid) > -1 ? "0000000001234567" : "89abcdefffffffff";
    let newcol = "";
    for (let c = 0; c < col.length; c++) {
      newcol += c%2 === 1 ? coltbl[parseInt(col.substr(c,1), 16)] : col.substr(c, 1);
    }
    return newcol;
  };

  /**
   * Creates a node to display the spatial reference of a map service.
   * @function showSpatialReferenceData
   * @param {object} data - JSON response from the map service.
   * @returns {object} an HTML DOM node with the spatial reference data.
   */
  const showSpatialReferenceData  = (data) => {
    let val="&nbsp;No valid spatial reference available &nbsp;",
      el = "span", 
      container = null,
      srnode = null, cachenode = null, sr;
    if (data && data.hasOwnProperty("spatialReference")) {
      sr = data.spatialReference;
      val = sr.latestWkid || sr.wkid || sr.latestWkt || sr.wkt || val;
      if (sr.latestWkid || sr.wkid) {
        el = "a";
      }
      container = document.createElement("span");
      srnode = document.createElement(el);
      if (el === "a") {
        srnode.setAttribute("href", "http://spatialreference.org/ref/?search=" + val);
      }
      srnode.setAttribute("style", ["color:", getColor(val), ";background:", getCompColor(val), ";border-radius:4px;padding:2px;"].join(""));
      srnode.innerHTML = val;
      container.appendChild(srnode);

      // handle tiled or dynamic service
      cachenode = document.createElement("b");
      if (data.singleFusedMapCache) {
        cachenode.innerHTML = " tiled";
      } else {
        cachenode.innerHTML = " dynamic";
      }
      container.appendChild(cachenode);
    }
    
    return container;
  };

  

  /**
   * Error reporting
   * @function reportError
   * @param {error} err0r - error object returned.
   * @returns {object} an HTML node containing the error message.
   */
  const reportError = (err0r) => {
    let codeNumber = -99999;

    if (err0r.hasOwnProperty("code")) {
      codeNumber = err0r.code;
    }
    if (err0r.hasOwnProperty("Code")) {
      codeNumber = err0r.Code;
    }

    switch(codeNumber) {
    case -2147220985:
      return li("Cannot count features with valid shape fields in a shapefile");
    case 400:
      if (arguments.length > 1) {
        if (arguments[1].hasOwnProperty("type")) {
          switch(arguments[1].type) {
          case "esriFieldTypeOID":
            return li("Service does not support checking for null ObjectID");
          case "esriFieldTypeGeometry": 
            return li("Service datasource does not support checking for null/empty geometry");
          }
        }
      }
    }

    return addSubList("Error", err0r, "error");
  };

  /**
   * Creates a nested list to show service and layer metadata
   * @function showMetadata
   * @param {object} data - JSON response from the map service
   * @returns {object} an HTML DOM node with the formatted metadata list
   */
  const showMetadata = (data) => {
    const dF = document.createDocumentFragment(),
      boolPreCheck = ["defaultVisibility", "isDataVersioned"];
    if (data) {
      const div = loadElement("DIV", {
        "class": "datablock collapsed"
      });
      div.appendChild(document.createElement("br"));
      const ul = document.createElement("ul");
      div.appendChild(ul);

      // handling errors
      if (data.hasOwnProperty("error") && data.error) {
        dF.appendChild(reportError(data.error));
      }

      if (data.hasOwnProperty("description") && data.description) {
        dF.appendChild(li("Description", data.description));
      }
      if (data.hasOwnProperty("serviceDescription") && data.serviceDescription) {
        dF.appendChild(li("Service Description", data.serviceDescription));
      }
      if (data.hasOwnProperty("copyrightText") && data.copyrightText) {
        dF.appendChild(li("&copy;", data.copyrightText));
      }
      if (data.hasOwnProperty("layers")) {
        dF.appendChild(li("# Layers", data.layers.length));
      }
      if (data.hasOwnProperty("tables") && data.tables.length) {
        dF.appendChild(li("# Tables", data.tables.length));
      }
      if (data.hasOwnProperty("minScale")) {
        dF.appendChild(li("Min Scale", data.minScale || "None"));
      }
      if (data.hasOwnProperty("maxScale")) {
        dF.appendChild(li("Max Scale", data.maxScale || "None"));
      }
      if (data.hasOwnProperty("initialExtent")) {
        dF.appendChild(addSubList("Initial Extent", data.initialExtent));
      }
      if (data.hasOwnProperty("fullExtent")) {
        dF.appendChild(addSubList("Full Extent", data.fullExtent));
      }
      if (data.hasOwnProperty("extent")) {
        dF.appendChild(addSubList("Extent", data.extent));
      }
      if (data.hasOwnProperty("units") && data.units) {
        dF.appendChild(li("Units", data.units.replace("esri", "")));              
      }
      if (data.hasOwnProperty("documentInfo")) {
        dF.appendChild(addSubList("Document Info", data.documentInfo));
      }
      if (data.hasOwnProperty("documentInfo")) {
        dF.appendChild(li("Max Record Count", data.maxRecordCount));
      }
      if (data.hasOwnProperty("geometryType") && data.geometryType) {
        dF.appendChild(li("Geometry", data.geometryType.replace("esriGeometry", "")));
      }
      if (data.definitionExpression) {
        dF.appendChild(li("Definition Expression", data.definitionExpression));
      }
      if (data.hasOwnProperty("defaultVisibility")) {
        dF.appendChild(li("Visible by default", data.defaultVisibility.toString()));
      }
      if (data.hasOwnProperty("displayField") && data.displayField) {
        dF.appendChild(li("Display Field", data.displayField));
      }
      if (data.hasOwnProperty("objectIdField") && data.objectIdField) {
        dF.appendChild(li("Object ID Field", data.objectIdField));
      }
      if (data.hasOwnProperty("globalIdField") && data.globalIdField) {
        dF.appendChild(li("Global ID Field", data.globalIdField));
      }
      
      if (data.relationships && data.relationships.length) {
        dF.appendChild(li("Has Relationships"));
      }
      if (data.hasOwnProperty("isDataVersioned")) {
        dF.appendChild(li("Versioned Data", data.isDataVersioned ? "Yes" : "No"));
      }

      if (data.dateFieldsTimeReference) {
        dF.appendChild(li("Date fields Time Zone", data.dateFieldsTimeReference.timeZone + "(Daylight Savings Time " + (data.dateFieldsTimeReference.respectsDaylightSaving ? "" : "not ") + "supported)"));
      }

      if (data.hasOwnProperty("supportedQueryFormats")) {
        dF.appendChild(li("Supported Query Formats", data.supportedQueryFormats ));
      }
      if (data.advancedQueryCapabilities) {
        dF.appendChild(addSubList("Advanced Query Capabilities", data.advancedQueryCapabilities));
      }

      // show all data items where true, unless formatted value already available.
      for (let item in data) {
        if (typeof data[item] === "boolean" && data[item] && boolPreCheck.indexOf(item) === -1) {
          dF.appendChild(li(unCamelCase(item)));
        }
      }
      
      ul.appendChild(dF);
      div.addEventListener("click", () => {toggleCollapse(div);});

      return div;
    }
    return null;
  };

  /**
   * Queries for the feature count and the features with geometries
   * @function getLayerCount
   * @param {string} url - map service url
   * @param {object} data - the JSON data collected from the map service
   * @param {function} callback - callback function once the query is complete.
   */
  const getLayerCount = (url, data, callback) => {
    const queryUrl = url + "/query?where=not+field+is+null&returnGeometry=false&returnCountOnly=true&f=json",
      ul = document.createElement("ul");
    let oid, shape;

    if (data && data.hasOwnProperty("objectIdField") && data.objectIdField) {
      oid = data.objectIdField;
    }
    /*
    if (data && data.hasOwnProperty("globalIdField") && data.globalIdField) {
      oid = data.globalIdField;
    }
    */
    if (data && data.hasOwnProperty("fields") && data.fields.length) {
      data.fields.some((field) => {
        switch(field.type) {
        case "esriFieldTypeOID":
        case "":
          oid = field.name;
          break;
        case "esriFieldTypeGeometry":
          shape = field.name;
          break;
        }

        return oid && shape;
      });
    }

    if (oid) {
      ajax(queryUrl.replace(/\+field\+/g, ["+","+"].join(oid) ), (response) => {
        if (response.count !== undefined && response.count !== null) {
          ul.appendChild(li("Number of features", response.count ));
        }
        if (response.hasOwnProperty("error") && response.error) {
          ul.appendChild(reportError(response.error, {"type": "esriFieldTypeOID"}));
        }
      });
    } else {
      ul.appendChild(li("No way to query features."));
    }
    
    if (shape) {
      ajax(queryUrl.replace(/\+field\+/g, ["+", "+"].join(shape)), (response) => {
        if (response.count !== undefined && response.count !== null) {
          ul.appendChild(li("Features with shapes", response.count ));
        }
        if (response.hasOwnProperty("error") && response.error) {
          ul.appendChild(reportError(response.error, {"type": "esriFieldTypeGeometry"}));
        }
      });
    } else if (!/\/featureserver\//i.test(url) && (data.type && data.type !== "Table")) {
      ul.appendChild(li("No visible shape field available."));
    }

    callback(ul);
  };

  /**
   * toggles the collapeable state of an element.
   * @function toggleCollapse
   * @param {HTML} div
   */
  const toggleCollapse = (div) => {
    if (div.className.indexOf("collapsed") > -1) {
      div.className = div.className.replace(" collapsed", "");
    } else {
      div.className += " collapsed";
    }
  };

  /**
   * Gets the time difference between the current time and the time presented
   * @function responseTime
   * @param {number} timeValue - milliseconds since January 1, 1970 UTC 
   * @returns {string} - text display of seconds or milliseconds between now and time submitted.
   */
  const responseTime = (timeValue) => {
    const timeDiff = Date.now() - timeValue;
    return "" + (timeDiff > 1000 ? timeDiff / 1000 : timeDiff + "m") + "s";
  };

  /**
   * gets a <b>old element previous to the current element
   * @function getPreviousLabel
   * @param {object} node - HTML DOM node
   * @returns {string} - content fo the <b> tag prior to the node
   */
  const getPreviousLabel = (node) => {
    let h = node; 
    while (h.previousSibling) { 
      h = h.previousSibling; 
      if (h.tagName === "B") {
        break; 
      } 
    } 
    return h.innerHTML;
  };

  /**
   * Finds where the fields are listed on the current web page.
   * @function getFieldList
   * returns {object[]} - list of list items containing field data.
   */
  const getFieldList = () => {
    const uls = document.getElementsByTagName("ul"),
      labels = [].map.call(uls, getPreviousLabel);
    for (let i = uls.length - 1; i > -1; i--) {
      if (/^Fields\:/.test(labels[i])) {
        return [].slice.call(uls[i].children, 0);
      }
    }
    return null;
  };

  /**
   * Goes through each field in the list, requesting how many non-null values there are for that field.
   * @function checkForNulls
   * @param {string} url - map service url to query
   * @param {object[]} fields - list of JSON field data on that map service
   * @param {object[]} nodes - HTML DOM nodes corresponding to the fields in the other list.
   */
  const checkForNulls = (url, fields, nodes) => {
    if (!fields.length) {
      updateStatus(STATUS.LOAD_COMPLETE); 
      return; 
    }
    const field = fields.shift(),
      node = nodes.shift(),
      params = "/query?where=not+field+is+null&returnGeometry=false&returnCountOnly=true&f=json".replace("field", field.name),
      resultList = document.createElement("ul");
    node.appendChild(resultList);
    const timeCheck = Date.now();
    ajax(url + params, (response) => {
      const hasError = response.hasOwnProperty("error") && !!response.error;
      let item = document.createElement("li");
      if (response.count !== undefined && response.count !== null) {
        item.innerHTML =  ["<b>Features with values: </b>", response.count, (!response.count ? "<b style=\"color:#f00;\"> !!!</b>":""), " (<i>Response time: ", responseTime(timeCheck),"</i>)"].join("");
      } else if (hasError) {
        item = reportError(response.error, field);
      }
      resultList.appendChild(item);
      if (!hasError && field.type === "esriFieldTypeString") {
        const newTimeCheck = Date.now();

        ajax(url + "/query?where=not+field+is+null+and+field+<>%27%27&returnGeometry=false&returnCountOnly=true&f=json".replace(/field/g, field.name), 
            (response2) => {
              let item2 = document.createElement("li");
              const hasError = response2.hasOwnProperty("error") && !!response2.error;
              if (response2.count !== undefined && response2.count !== null) {
                item2.innerHTML = ["<b>Features without empty values: </b>", response2.count, (!response2.count ? "<b style=\"color:#f00;\"> !!!</b>":""), " (<i>Response time: ", responseTime(newTimeCheck),"</i>)"].join("");
              } else if (hasError) {
                item2 = reportError(response2.error);
              }
              resultList.appendChild(item2);

              checkForNulls(url, fields, nodes);
            }
          );
      } else {
        checkForNulls(url, fields, nodes); 
      }
    }
    );
  };

  /**
   * Queries domain values for each 
   * @function checkDomains
   * @param {string} url - map service url to query
   * @param {object[]} fields - a list of field JSON provided by map service
   * @param {object[]} nodes - list of HTML DOM nodes corresponding to the fields list
   * @param {object} [tr] - possible list to attach domain search results to.
   */
  const checkDomains = (url, fields, nodes, tr) => {
    if (!fields.length) { 
      updateStatus(STATUS.LOAD_COMPLETE);
      return; 
    }
    if (!tr) {
      const node = nodes.shift();
      tr = document.createElement("ul");
      node.appendChild(tr);
    }
    if (fields[0].length) {
      const item = fields[0].shift(),
        value = item.type === "esriFieldTypeString" ? "'" + item.code + "'" : item.code,
        params = "/query?where=field+%3D+value&returnGeometry=false&returnCountOnly=true&f=json".replace("field", item.field).replace("value", value);
      ajax(url + params, (response) => {
        let node = document.createElement("li");
        const hasError = response.hasOwnProperty("error") && !!response.error;
        if (response.count !== undefined && response.count !== null) {
          node.innerHTML = ["<b>", item.name, ": </b>", response.count, (!response.count ? "<b style=\"color:#f00;\"> !!!</b>" : "")].join("");
        } else if (hasError) {
          node = reportError(response.error);
        }
        tr.appendChild(node);
        if (fields[0].length) {  
          checkDomains(url, fields, nodes, tr); 
        } else {
          fields.shift();
          if (fields.length) {
            checkDomains(url, fields, nodes);
          } else {
            updateStatus(STATUS.LOAD_COMPLETE);
          }
        }
      });
    } else {
      updateStatus(STATUS.LOAD_COMPLETE);
    }
  };

  /**
   * clears the input stored within the "active" variable.
   * @function clearActive
   */
  const clearActive = () => {
    if (active !== undefined && active !== null) {
      active.value = "";
    }
  };
  
  /**
   * sets the value of the input stored in the "active" variable
   * @function setActive
   * @param {string} value - input to insert in the "active" input
   */
  const setActive = (value) => {
    if (active !== undefined) {
      // get cursor position
      const oldVal = active.value.substring(0);
      let iCaretPos = oldVal.length;
      active.focus();
      if (document.selection) {
        const oSel = document.selection.createRange();
        oSel.moveStart("character", -active.value.length);
        iCaretPos = oSel.text.length;
      } else if ("selectionStart" in active) {
        iCaretPos = active.selectionStart;
      }
      // insert clicked text
      active.value = oldVal.substring(0, iCaretPos) + value + oldVal.substring(iCaretPos);

      // reset cursor position
      iCaretPos += value.length - (["()", "''"].indexOf(value) > -1);
      if (active.createTextRange) {
        const range = active.createTextRange();
        range.move("character", iCaretPos);
        range.select();
      } else if ("selectionStart" in active) {
        active.setSelectionRange(iCaretPos, iCaretPos);
      }      
    }
  };

  /**
   * Adds eventlisteners function to all nodes that match a querySelectorAll
   * @function listenAll
   * @param {object} node - HTML DOM parent node to use with querySelectorAll
   * @param {string} selector - CSS selector 
   * @param {string} evt - event name
   * @param {function} callback - callback function when event occurs.
   */
  const listenAll = (node, selector, evt, callback) => {
    [].forEach.call(node.querySelectorAll(selector), (el) => el.addEventListener(evt, callback));
  };

  /**
   * Represents the SidePanel
   * @class SidePanel
   * @param {string} title title to add to the sidepanel
   * @property {object} node - HTML DOM node of the side panel.
   */
  class SidePanel { 
    constructor(title) {
      this.node = loadElement("DIV", {"class": "sidepanel"});
      // insert title
      const titlePanel = loadElement("DIV", {"class": "titlepanel"});
      titlePanel.appendChild(loadElement("b", {}, title));

      // insert clear button
      const clearBtn = loadElement("BUTTON", {"type": "button"}, "Clear");
      clearBtn.addEventListener("click", clearActive);
      titlePanel.appendChild(clearBtn);

      this.node.appendChild(titlePanel);

      // add events
      listenAll(document, "input[type=text], textarea", "blur", function () { 
        // no fat arrow b/c Active would become this sidepanel instead of an element
        active = this;
      });

      document.body.appendChild(this.node);
    }
    /**
     * @method addElement
     * @param {HTML} node 
     */
    addElement(node) {
      this.node.appendChild(node);
    }
    /**
     * @method note
     * @param {string} text 
     */
    note(text) {
      this.addElement(loadElement("P", {}, text));
    }
    /**
     * @method label
     * @param {string} text 
     */
    label(text) {
      this.addElement(loadElement("SPAN", {}, text));
      this.addElement(loadElement("BR", {}));
    }
  }

  /**
   * Field Selector
   */
  class FieldSelector {
    /**
     * @constructor
     * @param {string} url 
     * @param {HTML} parentNode
     * @param {function} callback
     */
    constructor(url, parentNode, callback) {
      const singleLayer = /server\/\d+\/?$/i.test(url),
        jsonUrl = url + (singleLayer ? "" : "/layers") + "?f=json";
      let helpMessage = "Click field name to get up to 1000 examples. Double-click selections to add to form.";

      this.url = url;
      this.parentNode = parentNode;

      // update help message
      if (!singleLayer) {
        helpMessage = "Select layer to populate fields. " + helpMessage;
      }
      const helpMessageNode = loadElement("P", {}, helpMessage);
      parentNode.appendChild(helpMessageNode);
      
      // get JSON data from service and build data afterward.
      ajax(jsonUrl, this.buildRenderer.bind(this, callback));
    
    }
    /**
     * Renderer for the Field Selector
     * @param {function} callback - call this once the renderer has completed
     * @param {object|object[]} data 
     */
    buildRenderer(callback, data) {
      const df = document.createDocumentFragment();
      if (!data) {
        return;
      }
      // collect layer data into a list
      let dataItems = (data.layers || []).concat(data.tables || []);
      if (dataItems.length === 0) {
        dataItems = [data];
      }
      // filter out potential parent layers with no data.
      dataItems = dataItems.filter((item) => {
        return !item.subLayers || item.subLayers.length === 0;
      });
  
      //construct the layer selector
      const layerSelectorHeight = Math.min(dataItems.length, 5);
      this.layerSelect = loadElement("SELECT", {"size": layerSelectorHeight.toString(), "title": "Double-click to add to form."}),
      this.fieldSelect = loadElement("SELECT", {"size": "5", "title": "Double-click to add to form."}),
      this.valueList = loadElement("SELECT", {"size": "5", "title": "Double-click to add to form."});
  
      // add layer options, even if there is just one
      dataItems.forEach((item) => {
        this.layerSelect.appendChild(loadElement("OPTION", {"value": item.id}, item.name || item.title));  
      });
  
      // if layer 
      if (dataItems.length === 1) {
        this.layerSelect.className = "hidden";
        this.updateFields(dataItems);
      } else {
        df.appendChild(loadElement("SPAN", {}, "Layers:"));
        // on layerSelect change, update the fieldSelect list.
        this.layerSelect.addEventListener("change", this.updateFields.bind(this, dataItems));
      }
      df.appendChild(this.layerSelect);
      df.appendChild(loadElement("SPAN", {}, "Fields:"));
      df.appendChild(this.fieldSelect);
      df.appendChild(loadElement("SPAN", {}, "Values:"));
      df.appendChild(this.valueList);
  
      this.parentNode.appendChild(df);

      this.fieldSelect.addEventListener("change", this.updateValues.bind(this, this.url.replace(/\/\d*\/?$/, "")));
    
      // apply double-click event listeners to fill in items.
      listenAll(this.parentNode, "select", "dblclick", function (evt) {
        // no fat arrow b/c Active would become this sidepanel instead of an element
        setActive(evt.currentTarget.value);
      });

      // call the callback with the data items collected from the previous ajax call.
      if (callback && typeof callback === "function") {
        callback(dataItems);
      }
    }

    /**
     * Update the field items.
     * @param {object[]} dataItems 
     */
    updateFields(dataItems) {
      const layerId = parseInt(this.layerSelect.value, 10);
      this.fieldSelect.innerHTML = "";
      dataItems.filter((item) => item.id === layerId).forEach((item) => {
        
        if (!item || !item.fields || !item.fields.length) {
          this.fieldSelect.appendChild(loadElement("option", {"value": ""}, "No values found for this field"));
          this.fieldSelect.setAttribute("disabled", "disabled");
          return;
        } 
        
        const fields = item.fields.filter(isQueryableField);
        if (fields.length === 0) {
          this.fieldSelect.appendChild(loadElement("option", {"value": ""}, "No values found for this field"));
          this.fieldSelect.setAttribute("disabled", "disabled");
        } else {  
          this.fieldSelect.removeAttribute("disabled");
          fields.forEach((field) =>this.fieldSelect.appendChild(loadElement("OPTION", {"value": field.name}, field.alias)));
        }
      }, this);
    }

    /**
     * Update the value items
     * @param {string} url
     */
    updateValues(url) {
      const val = this.fieldSelect.value;
      const layerId = this.layerSelect.value;
      // loading of values
      this.valueList.innerHTML = "<option value=''>Loading...</option>";
      updateStatus(STATUS.LOADING);
      this.valueList.setAttribute("disabled", "disabled");
      // stop additional clicks on fieldSelect from subsequent calls
      this.fieldSelect.setAttribute("disabled", "disabled");
      // request distinct values
      ajax(url + "/" + layerId + "/query?where=1%3D1&returnGeometry=false&outFields=field&orderByFields=field&returnDistinctValues=true&f=json".replace(/field/g, val), this._updateValuesCallback.bind(this));
    }
    /**
     * Updates values after query
     * @param {*} res
     * @private
     */
    _updateValuesCallback(res) {
      const val = this.fieldSelect.value;
      const df = document.createDocumentFragment();
      // re-enable fieldlist
      this.fieldSelect.removeAttribute("disabled");
      // test if features were returned.
      this.valueList.innerHTML = "";
      if (!res || !res.features || res.features.length === 0) {
        this.valueList.setAttribute("disabled", "disabled");
        df.appendChild(loadElement("option", {value: ""}, "No values found for this field"));
      } else {
        this.valueList.removeAttribute("disabled");   
        res.features.forEach((feature) => {
          const featureValue = isNaN(feature.attributes[val] * 1) ? "'{0}'".replace("{0}", feature.attributes[val]) : feature.attributes[val];
          df.appendChild(loadElement("option", {"value": featureValue}, feature.attributes[val]));
        });  
      }
      this.valueList.appendChild(df);
      updateStatus(STATUS.LOAD_COMPLETE);
    }
  }

  /**
   * Builds the Find Helper Panel
   * @function findHelper
   * @param {string} url
   */
  const findHelper = (url) => {
    const sidepanel = new SidePanel("Find Helper");
    
    new FieldSelector(url, sidepanel.node, (dataItems) => {
      // insert valid layers into layers input.
      const layersBlank = document.querySelector("input[name = layers]");
      if (layersBlank && !layersBlank.value) {
        layersBlank.value = dataItems.filter((item) => {
          return !item.subLayers || item.subLayers.length === 0;
        }).map((item) => item.id).join(",");
      }
    });
  };


  /**
   * Handle status updates
   * @function updateStatus
   * @param {string} status
   */
  const updateStatus = (status) => {
    chrome.runtime.sendMessage({MSE_STATUS: status}, response => console.log(response));
  };

  chrome.extension.sendMessage({}, (/*response*/) => {
    let readyStateCheckInterval = setInterval(() => {
      if (document.readyState === "complete") {
        clearInterval(readyStateCheckInterval);

        // collect the links on the web page to collect information about the content they link to.
        const tags = Array.prototype.slice.call(document.getElementsByTagName("a"), 0),
          url = window.location.href.split("?")[0],
          findTest = /\/find\/?$/i,
          // search for map service links on the page
          urls = tags.map((tag, i) => {
            return Object.create({}, {
              i: {
                value: i
              },
              url: {
                value: tag.href
              }
            });
          }).filter((item) => {
          // filter out links in the breadcrumbs section at the top of the page.
            if (tags[item.i].parentNode.className === "breadcrumbs") {
              return false;
            }
            return /(map|feature|image|mobile)server(\/\d*\/?)?$/i.test(item.url);
          });
          
        /**
         * collect and present service data based on a list of urls.
         * @function collectData
         * @param {string[]} f - a list of urls to collect data on.
         * @param {boolean} canCountFeatures - if true, count features.
         */
        const collectData = (f, canCountFeatures) => {
          if (!f || !f.length) {
            updateStatus(STATUS.LOAD_COMPLETE);
            return; 
          }
          const data = f.shift();
          ajax(data.url + "?f=json",
            (response) => {
              const spatialReferenceNode = showSpatialReferenceData(response),
                metadata = showMetadata(response);
              
              if (spatialReferenceNode !== null) {
                tags[data.i].parentNode.appendChild(spatialReferenceNode);  
              }
              
              if (metadata !== null) {
                tags[data.i].parentNode.appendChild(metadata);
              }
              
              // if the service has fields, get the layer count
              if (response.fields && response.fields.length && canCountFeatures) {
                getLayerCount(data.url, response, (countList) => {
                  tags[data.i].parentNode.appendChild(countList);
                });
              }
              collectData(f, canCountFeatures);
            });
        };

        chrome.storage.sync.get({
          autoMetadata: true,
          autoFeatureCounts: true
        }, (items) => {
          console.log(urls, items);
          if (urls && urls.length && items.autoMetadata) {
            updateStatus(STATUS.LOADING);
            collectData(urls, items.autoFeatureCounts);
          }
        });
        
        // field and domain data counting.
        if (/(imageserver|\d+)\/?$/i.test(url)) {
          ajax(url + "?f=json", (results) => {
            if (results && results.fields && results.fields.length > 0) {
              const fieldHTML = getFieldList();
              const hasDomainTest = (field) => !!field && field.domain && field.domain.codedValues;

              chrome.storage.sync.get({
                autoFieldCounts: true,
                autoDomainCounts: true
              }, (items) => {
                const domainFields = [];
                let domainFieldHTML;
                if (items.autoFieldCounts) {
                  updateStatus(STATUS.LOADING);
                  checkForNulls(url, results.fields.slice(0), fieldHTML.slice(0));
                }
                if (items.autoDomainCounts && results.fields.some(hasDomainTest)) {
                  
                  domainFieldHTML = fieldHTML.slice(0);

                  results.fields.forEach((field, i) => {
                    if (hasDomainTest(field)) {
                      domainFields.push(field.domain.codedValues.map((item) => {
                        // future reference: check if Object.assign supported by Chrome
                        item.field = field.name;
                        item.type = field.type;
                        return item;
                      }));
                    } else {
                      domainFieldHTML[i] = null;
                    }
                  });

                  // filter out nulled out HTML nodes.
                  domainFieldHTML = domainFieldHTML.filter((item) => !!item );
                  updateStatus(STATUS.LOADING);
                  checkDomains(url, domainFields, domainFieldHTML, null);
                }
              });

            }
          });
        }


        // todo: find page helper
        if (findTest.test(url)) {
          findHelper(url.replace(findTest, ""));
        }

        // todo: identify page helper

        // todo: tile testing
        // todo: geometry helper
        
      }
    }, 10);
  });
}

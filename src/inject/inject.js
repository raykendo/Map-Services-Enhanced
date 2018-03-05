(function () {
  // ajax function from https://gist.github.com/Xeoncross/7663273
  var colorhash = {},
    active;
  
  /**
   * requests data from a URL and returns it in JSON format
   * @function ajax
   * @param {string} u - URL to send the requests
   * @param {function} callback - function to call when results are returned
   * @param {object} [data] - optional information to send, triggers a post instead of a get requests
   * @param {object} [x] - state of the application
   */
  function ajax(u, callback, data, x) {
    try {
      x = new(this.XMLHttpRequest)("MSXML2.XMLHTTP.3.0");
      x.open(data ? "POST" : "GET", u, 1);
      x.setRequestHeader("X-Requested-With", "XMLHttpRequest");
      x.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      x.onreadystatechange = function () {
        x.readyState > 3 && callback && callback(JSON.parse(x.responseText), x);
      };
      x.send(data);
    } catch (e) {
      window.console && console.log(e);
    }
  }

  /**
   * Changes a text value from camel-case to title case
   * @function unCamelCase
   * @param {string} value - value to transform from camel case
   * @returns {string} - a string in title case form.
   */
  function unCamelCase (value) {
    return value.substr(0, 1).toUpperCase() + value.substr(1).replace(/([a-z])([A-Z])/g, "$1 $2");
  }

  /**
   * Creates an HTML element.
   * @function loadElement
   * @param {string} tag - HTML tag name that you want to create.
   * @param {object} attributes - name value object describing properties you want to assign to the object
   * @param {string} [text] - if present, this is the content you shoul add to the HTML element.
   */
  function loadElement (tag, attributes, text) {
    var el = document.createElement(tag), a;
    for (a in attributes) {
      el.setAttribute(a, attributes[a]);
    }
    if (text) {
      el.innerHTML = text;
    }
    return el;
  }

  /**
   * Adds a list item to a node if the property is there and maybe if a property is true.
   * @function li
   * @param {string} title - text to add in bold
   * @param {string | object} content - data to add after title in regular format
   * @param {string} [className] - if prsent, adds the class name to the list item
   * @returns {object} - list item node;
   */
  function li(title, content, className) {
    var node = loadElement("LI", {"class": className || ""});
    if (content === undefined) {
      node.innerHTML = ["<b>","</b>"].join(title);
    } else {
      node.innerHTML = ["<b>", title, ": </b>", (content instanceof Object ? JSON.stringify(content) : content)].join("");
    }
    return node;
  }

  /**
   * Adds a list item to a node with the title of the property, and then itemizes ovoer the content object get all its properties
   * @function addSubList
   * @param {string} title - title of the list
   * @param {object} content - name, value pairs used to describe a feature.
   * @param {string} [className] - if present, add this class name to the list item.
   * @returns {object} - list item node containing list of properties.
   */
  function addSubList(title, content, className) {
    var node = loadElement("LI", {"class": className || ""}, ["<b>",": </b>"].join(title)), 
      ul = document.createElement("ul"), 
      i;
    for (i in content) {
      ul.appendChild(li(unCamelCase(i), content[i]));
    }
    node.appendChild(ul);
    return node;
  }

  /**
   * Calculates a random color for a string value
   * @function getColor
   * @param {string} item - a string value
   * @returns {string} a CSS hex string for a color.
   */
  function getColor(item) {
    if (colorhash[item]) { return colorhash[item]; }
    colorhash[item] = "#" + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6);
    return colorhash[item];
  }

  /**
   * Returns whether a field is queryable
   */
  function isQueryableField(field) {
    return ["esriFieldTypeGeometry","esriFieldTypeBlob","esriFieldTypeXML","esriFieldTypeRaster"].indexOf(field.type) === -1;
  }

  /**
   * Calculates a complimentary shade or tint of a color to provide contrast
   * @function getCompColor
   * @param {string} item - a CSS hex string for a color
   * @returns {string} a CSS hext string for a color that is either lighter or darker than the current color.
   */
  function getCompColor(item) {
    var col = colorhash[item],
      newcol = "",
      mid = [col.substr(1,1),col.substr(3,1),col.substr(5,1)].sort()[1],
      coltbl = "fedcba98".indexOf(mid) > -1 ? "0000000001234567" : "89abcdefffffffff",
      c;
    for (c = 0; c < col.length; c++) {
      newcol += c%2 === 1 ? coltbl[parseInt(col.substr(c,1), 16)] : col.substr(c, 1);
    }
    return newcol;
  }

  /**
   * Creates a node to display the spatial reference of a map service.
   * @function showSpatialReferenceData
   * @param {object} data - JSON response from the map service.
   * @returns {object} an HTML DOM node with the spatial reference data.
   */
  function showSpatialReferenceData(data) {
    var val="&nbsp;No valid spatial reference available &nbsp;",
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
  }

  /** */
  function getMapDiv () {
    var mapDiv = document.getElementById("mapdiv");

    if (!mapDiv) {
      var parentDiv = loadElement("DIV", {
        style: "position:fixed;top:0;right:0;border:1px solid #ccc;z-index:10;padding:8px;background:#fff;"
      });
      document.body.appendChild(parentDiv);
      mapDiv = loadElement("DIV", {
        id: "mapdiv" 
      });
      parentDiv.appendChild(mapDiv);
      parentDiv.appendChild(loadElement("P", {}, "Hover over a Map Service link to view it."));
    }

    return mapDiv;
  }

  /**
   * On hover, get map
   * @param {Event} evt 
   */
  function hoverGetMap (evt) {
    if (!evt || !evt.target) {
      return;
    }
    var url = evt.target.href;
    if (!url) {
      return;
    }
    console.log("hover get map:", url);
    var getMap = false;
    if (getMap) {
      var mapDiv = getMapDiv();
      mapDiv.innerHTML = "";
    }
    
  }

  function hoverHideMap () {
    console.log("hover hide map");
  }

  /**
   * Error reporting
   * @function reportError
   * @param {error} err0r - error object returned.
   * @returns {object} an HTML node containing the error message.
   */
  function reportError(err0r) {
    var codeNumber = -99999;

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
  }

  /**
   * Creates a nested list to show service and layer metadata
   * @function showMetadata
   * @param {object} data - JSON response from the map service
   * @returns {object} an HTML DOM node with the formatted metadata list
   */
  function showMetadata(data) {
    var dF = document.createDocumentFragment(),
      boolPreCheck = ["defaultVisibility", "isDataVersioned"],
      ul, div;
    if (data) {
      div = loadElement("DIV", {"class": "datablock collapsed"});
      div.appendChild(document.createElement("br"));
      ul = document.createElement("ul");
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
      for (var item in data) {
        if (typeof data[item] === "boolean" && data[item] && boolPreCheck.indexOf(item) === -1) {
          dF.appendChild(li(unCamelCase(item)));
        }
      }
      
      ul.appendChild(dF);
      div.addEventListener("click", toggleCollapse.bind(div));

      return div;
    }
    return null;
  }

  /**
   * Queries for the feature count and the features with geometries
   * @function getLayerCount
   * @param {string} url - map service url
   * @param {object} data - the JSON data collected from the map service
   * @param {function} cb - callback function once the query is complete.
   */
  function getLayerCount(url, data, cb) {
    var queryUrl = url + "/query?where=not+field+is+null&returnGeometry=false&returnCountOnly=true&f=json",
      ul = document.createElement("ul"),
      oid, shape;

    if (data && data.hasOwnProperty("objectIdField") && data.objectIdField) {
      oid = data.objectIdField;
    }
    /*
    if (data && data.hasOwnProperty("globalIdField") && data.globalIdField) {
      oid = data.globalIdField;
    }
    */
    if (data && data.hasOwnProperty("fields") && data.fields.length) {
      data.fields.some(function (field) {
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
      ajax(queryUrl.replace(/\+field\+/g, ["+","+"].join(oid) ), function (response) {
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
      ajax(queryUrl.replace(/\+field\+/g, ["+", "+"].join(shape)), function (response) {
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

    cb(ul);
  }

  /**
   * toggles the collapeable state of an element.
   * @function toggleCollapse
   */
  function toggleCollapse() {
    if (this.className.indexOf("collapsed") > -1) {
      this.className = this.className.replace(" collapsed", "");
    } else {
      this.className += " collapsed";
    }
  }

  /**
   * Gets the time difference between the current time and the time presented
   * @function responseTime
   * @param {number} timeValue - milliseconds since January 1, 1970 UTC 
   * @returns {string} - text display of seconds or milliseconds between now and time submitted.
   */
  function responseTime (timeValue) {
    var timeDiff = Date.now() - timeValue;
    return "" + (timeDiff > 1000 ? timeDiff / 1000 : timeDiff + "m") + "s";
  }

  /**
   * gets a <b>old element previous to the current element
   * @function getPreviousLabel
   * @param {object} node - HTML DOM node
   * @returns {string} - content fo the <b> tag prior to the node
   */
  function getPreviousLabel(node) {
    var h = node; 
    while (h.previousSibling) { 
      h = h.previousSibling; 
      if (h.tagName === "B") {
        break; 
      } 
    } 
    return h.innerHTML;
  }

  /**
   * Finds where the fields are listed on the current web page.
   * @function getFieldList
   * returns {object[]} - list of list items containing field data.
   */
  function getFieldList () {
    var uls = document.getElementsByTagName("ul"),
      labels = [].map.call(uls, getPreviousLabel),
      i;
    for (i = uls.length - 1; i > -1; i--) {
      if (/^Fields\:/.test(labels[i])) {
        return [].slice.call(uls[i].children, 0);
      }
    }
    return null;
  }

  /**
   * Goes through each field in the list, requesting how many non-null values there are for that field.
   * @function checkForNulls
   * @param {string} url - map service url to query
   * @param {object[]} fields - list of JSON field data on that map service
   * @param {object[]} nodes - HTML DOM nodes corresponding to the fields in the other list.
   */
  function checkForNulls(url, fields, nodes) {
    if (!fields.length) { 
      return; 
    }
    var field = fields.shift(),
      node = nodes.shift(),
      params = "/query?where=not+field+is+null&returnGeometry=false&returnCountOnly=true&f=json".replace("field", field.name),
      resultList = document.createElement("ul"), timeCheck;
    node.appendChild(resultList);
    timeCheck = Date.now();
    ajax(url + params,
      function (response) {
        var item = document.createElement("li"),
          hasError = response.hasOwnProperty("error") && !!response.error,
          newTimeCheck;
        if (response.count !== undefined && response.count !== null) {
          item.innerHTML =  ["<b>Features with values: </b>", response.count, (!response.count ? "<b style=\"color:#f00;\"> !!!</b>":""), " (<i>Response time: ", responseTime(timeCheck),"</i>)"].join("");
        } else if (hasError) {
          item = reportError(response.error, field);
        }
        resultList.appendChild(item);
        if (!hasError && field.type === "esriFieldTypeString") {
          newTimeCheck = Date.now();

          ajax(url + "/query?where=not+field+is+null+and+field+<>%27%27&returnGeometry=false&returnCountOnly=true&f=json".replace(/field/g, field.name), 
            function (response2) {
              var item2 = document.createElement("li"),
                hasError = response2.hasOwnProperty("error") && !!response2.error;
              if (response2.count !== undefined && response2.count !== null) {
                item2.innerHTML = ["<b>Features without empty values: </b>", response2.count, (!response2.count ? "<b style=\"color:#f00;\"> !!!</b>":""), " (<i>Response time: ", responseTime(newTimeCheck),"</i>)"].join("");
              } else if (hasError) {
                item2 = reportError(response2.error);
              }
              resultList.appendChild(item2);

              if (fields.length) {
                checkForNulls(url, fields, nodes);
              }
            }
          );
        } else if (fields.length) {  
          checkForNulls(url, fields, nodes); 
        }
      }
    );
  }

  /**
   * Queries domain values for each 
   * @function checkDomains
   * @param {string} url - map service url to query
   * @param {object[]} fields - a list of field JSON provided by map service
   * @param {object[]} nodes - list of HTML DOM nodes corresponding to the fields list
   * @param {object} [tr] - possible list to attach domain search results to.
   */
  function checkDomains(url, fields, nodes, tr) {
    if (!fields.length) { return; }
    if (!tr) {
      var node = nodes.shift();
      tr = document.createElement("ul");
      node.appendChild(tr);
    }
    if (fields[0].length) {
      var item = fields[0].shift(),
        value = item.type === "esriFieldTypeString" ? "'" + item.code + "'" : item.code,
        params = "/query?where=field+%3D+value&returnGeometry=false&returnCountOnly=true&f=json".replace("field", item.field).replace("value", value);
      ajax(url + params,
        function (response) {
          var node = document.createElement("li"),
            hasError = response.hasOwnProperty("error") && !!response.error;
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
            }
          }
        });
    }
  }

  /**
   * Tests whether some field JSON has a coded value domain
   * @function hasDomainTest
   * @param {object} field - JSON data related to a map service layer field.
   * @returns {boolean} - if true, coded value domain is present.
   */
  function hasDomainTest(field) {
    return !!field && field.domain && field.domain.codedValues;
  }

  /**
   * Switches a text blank for a select element if choices are present.
   * @function swapInChoice
   * @param {object[]} nodes - list of HTML DOM nodes for text blanks and textareas in the form
   * @param {object} param - GP task parameters taken from REST Service.
   */
  function swapInChoice(nodes, param) {
    if (!param.choiceList) {
      return;
    }

    var nodesByName = nodes.filter(function (node) {
      return node.name === param.name;
    });

    if (nodesByName && nodesByName.length > 0) {
      nodesByName.forEach(function (nodeToReplace) {
        var select = loadElement("select", {
          "name": param.name
        });
        // generate options
        param.choiceList.forEach(function(choice) {
          var option = loadElement("option", {
            value: choice
          }, choice);
          select.appendChild(option);
        });
        
        select.value = param.defaultValue;
        // replace existing node with select node.
        nodeToReplace.parentNode.replaceChild(select, nodeToReplace);
      });
    }
  }

  /**
   * Modifies the Geoprocessing form to make choices easier. 
   * function updateGPForm
   * @param {object} response
   * @returns
   */
  function updateGPForm(response) {
    var myForm, blanks = [];
    if (!response.parameters) {
      alert("Could not find GP parameters for this task.");
      return;
    }
    try {
      myForm = document.getElementsByTagName("FORM")[0];
      // get TextAreas in form
      blanks = Array.prototype.slice.call(myForm.getElementsByTagName("TEXTAREA"), 0);
      // concat in list of inputs in the form
      blanks = blanks.concat(Array.prototype.slice.call(myForm.getElementsByTagName("INPUT"), 0));
      // for each parameter in the geoprocessing JSON, swap in choices 
      response.parameters.forEach(swapInChoice.bind(this, blanks));
      // look for Web_Map_as_JSON blank to fill in with default value.
      blanks.some(function (blank) {
        if (blank.name === "Web_Map_as_JSON" && /^\s*$/.test(blank.value)) {
          chrome.storage.sync.get({
            defaultWebMapAsJSON: ""
          }, function(items) {
            blank.value = items.defaultWebMapAsJSON;
          });
        }
        return blank.name === "Web_Map_as_JSON";
      });
    } catch (err) {
      console.error(err);
      alert("invalid form");
    }
  }

  /**
   * clears the input stored within the "active" variable.
   * @function clearActive
   */
  function clearActive() {
    if (active !== undefined && active !== null) {
      active.value = "";
    }
  }
  
  /**
   * sets the value of the input stored in the "active" variable
   * @function setActive
   * @param {string} value - input to insert in the "active" input
   */
  function setActive(value) {
    if (active !== undefined) {
      // get cursor position
      var oldVal = active.value.substring(0),
        iCaretPos = oldVal.length;
      active.focus();
      if (document.selection) {
        var oSel = document.selection.createRange();
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
        var range = active.createTextRange();
        range.move("character", iCaretPos);
        range.select();
      } else if ("selectionStart" in active) {
        active.setSelectionRange(iCaretPos, iCaretPos);
      }      
    }
  }

  /**
   * Adds eventlisteners function to all nodes that match a querySelectorAll
   * @function listenAll
   * @param {object} node - HTML DOM parent node to use with querySelectorAll
   * @param {string} selector - CSS selector 
   * @param {string} evt - event name
   * @param {function} callback - callback function when event occurs.
   */
  function listenAll(node, selector, evt, callback) {
    [].forEach.call(node.querySelectorAll(selector), function (el) {
      el.addEventListener(evt, callback);
    });
  }

  /**
   * Inserts pre-defined data into a form on a page
   * @function quickFormFillin
   * @param {object} formData - JSON of name, value pairs to insert in the form
   * @param {boolean} clickSubmit - if true, click the submit button
   */
  function quickFormFillin(formData, clickSubmit) {
    var formFields = Array.prototype.slice.call(document.getElementsByTagName("INPUT"), 0);
  
    formFields = formFields.concat(Array.prototype.slice.call(document.getElementsByTagName("TEXTAREA"), 0));
    
    if (!formFields || formFields.length < 1) {
      return;
    }

    formFields.forEach(function (item) {
      if (formData.hasOwnProperty(item.name)) {
        if (item.type && item.type === "radio" && formData[item.name] === item.value) {
          item.checked = true;
        } else {
          item.value = formData[item.name];
        }
      }
    });

    if (clickSubmit) {
      chrome.storage.sync.get({
        queryHelperSelectAll: "get"
      }, 
      function (item) {
        var submitButtons = document.querySelectorAll("input[type='submit']"),
          submitButton;
        switch(item.queryHelperSelectAll) {
        case "get":
          submitButton = submitButtons[0];
          break;
        case "post":
          submitButton = submitButtons[1];
          break;
        }

        if (submitButton) {
          submitButton.click();
        } 
      });
    }
  }
  
  /**
   * Inserts a button in a panel that will quickly fill in a form when clicked
   * @function insertQuickFillinButton
   * @param {object} parentElement - panel or element where the button will be added
   * @param {string} content - Text inside the button
   * @param {object} formData - JSON of name, value pairs to insert in the form
   * @param {boolean} clickSubmit - if true, click the submit button
   * 
   */
  function insertQuickFillinButton(parentElement, content, formData, clickSubmit) {
    var buttonConfig = {type: "button"};
    if (clickSubmit) {
      buttonConfig.title = "Clicking here will auto-submit your request (see options for details)";
    }
    var quickBtn = loadElement("BUTTON", buttonConfig, content);
    quickBtn.addEventListener("click", quickFormFillin.bind(this, formData, !!clickSubmit));
    parentElement.appendChild(quickBtn);
    parentElement.appendChild(document.createElement("br"));
  }

  /**
   * Adds a statistic option to the outStatistics blank.
   * @function addStatistic
   * @param {string} statisticType - statistic type to collect from the service
   * @returns {string}
   */
  function addStatistic(statisticType) {
    if (!active || active.name !== "outStatistics") {
      return;
    }
    var activeText = active.value,
      statContent = [];
    if (activeText.length) {
      try {
        statContent = JSON.parse(activeText);
        if (!(statContent instanceof Array)) {
          throw "Not a valid array";
        }
      } catch(err) {
        statContent = [];
      }
    }

    statContent.push({
      "statisticType": statisticType,
      "onStatisticField": "",
      "outStatisticFieldName": ""
    });

    active.value = JSON.stringify(statContent);
    return active.value;
  }
  
  /**
   * Adds statistics buttons to a side panel.
   * @function addStatisticsControl
   * @param {object} parentNode - HTML dom node of the sidepanel or whatever control you're adding
   */
  function addStatisticsControl (parentNode) {
    ["Count", "Sum", "Min", "Max", "Avg", "StdDev", "Var"].forEach(function (stat) {
      var btn = loadElement("BUTTON", {"type":"button", "class": "statistic", "style": "display:none;"}, stat);
      btn.addEventListener("click", addStatistic.bind(this, stat.toLowerCase()));
      parentNode.appendChild(btn);
    });

    // show/hide buttons on textbox focus
    listenAll(document,  "input[type=text], textarea", "focus", function () {
      var buttonNodes, i, il;

      buttonNodes = document.querySelectorAll(".statistic");
      il = buttonNodes.length;
      for (i = 0; i < il; i++) {
        if (this && this.name && this.name === "outStatistics") {
          buttonNodes[i].style.display = "inline-block";
        } else {
          buttonNodes[i].style.display = "none";
        }
      }
    });

  }

  /**
   * Adds the SQL control buttons to the sidepanel.
   * @function addSqlControl
   * @param {object} parentNode - HTML dom node of the sidepanel or whatever control you're adding
   */
  function addSqlControl (parentNode) {
    var btns = loadElement("DIV", {"class": "buttonbox"});
     //[" = ", " &lt;&gt; ", " LIKE ", " &gt; ", " &gt;= ", " AND ", " &lt; ", " &lt;= ", " OR ", "_", "%", "()", "NOT ", " IS ", "*", "&#39;&#39;", " IN ", ", " ].forEach(function (txt) {
    [" = ", " <> ", " LIKE ", " > ", " >= ", " AND ", " < ", " <= ", " OR ", "_", "%", "()", "NOT ", " IS ", "*", "''", " IN ", ", ", "NULL" ].forEach(function (txt) {
      btns.appendChild(loadElement("button", {
        "class": "sql",
        "type": "button",
        "name": txt
      }, txt.replace(/\s+/g, "")));
    });
    parentNode.appendChild(btns);

    listenAll(parentNode, "button.sql", "click", function (evt) {
      setActive(evt.currentTarget.name);
    });
  }

  /**
   * Represents the SidePanel
   * @constructor
   * @param {string} title title to add to the sidepanel
   * @property {object} node - HTML DOM node of the side panel.
   */
  function SidePanel(title) { 
    this.node = loadElement("DIV", {"class": "sidepanel"});
    // insert title
    var titlePanel = loadElement("DIV", {"class": "titlepanel"});
    titlePanel.appendChild(loadElement("b", {}, title));

    // insert clear button
    var clearBtn = loadElement("BUTTON", {"type": "button"}, "Clear");
    clearBtn.addEventListener("click", clearActive);
    titlePanel.appendChild(clearBtn);

    this.node.appendChild(titlePanel);

    // add events
    listenAll(document, "input[type=text], textarea", "blur", function () { 
      active = this;
    });

    document.body.appendChild(this.node);
  }

  SidePanel.prototype.addElement = function (node) {
    this.node.appendChild(node);
  };

  SidePanel.prototype.note = function (text) {
    this.addElement(loadElement("P", {}, text));
  };

  SidePanel.prototype.label = function (text) {
    this.addElement(loadElement("SPAN", {}, text));
    this.addElement(loadElement("BR", {}));
  };

  /**
   * Field Selector
   * @constructor
   * @param {string} url 
   * @param {HTML} parentNode
   * @param {function} callback
   */
  function FieldSelector(url, parentNode, callback) {
    var singleLayer = /server\/\d+\/?$/i.test(url),
      jsonUrl = url + (singleLayer ? "" : "/layers") + "?f=json",
      helpMessage = "Click field name to get up to 1000 examples. Double-click selections to add to form.",
      helpMessageNode;

    /**
     * Renderer for the Field Selector
     * @param {function} callback - call this once the renderer has completed
     * @param {object|object[]} data 
     */
    this.buildRenderer = function (callback, data) {
      var dataItems, layerSelectorHeight;
      if (!data) {
        return;
      }
      // collect layer data into a list
      dataItems = (data.layers || []).concat(data.tables || []);
      if (dataItems.length === 0) {
        dataItems = [data];
      }
      // filter out potential parent layers with no data.
      dataItems = dataItems.filter(function (item) {
        return !item.subLayers || item.subLayers.length === 0;
      });
  
      //construct the layer selector
      layerSelectorHeight = Math.min(dataItems.length, 5);
      this.layerSelect = loadElement("SELECT", {"size": layerSelectorHeight.toString(), "title": "Double-click to add to form."}),
      this.fieldSelect = loadElement("SELECT", {"size": "5", "title": "Double-click to add to form."}),
      this.valueList = loadElement("SELECT", {"size": "5", "title": "Double-click to add to form."});
  
      // add layer options, even if there is just one
      dataItems.forEach(function (item) {
        this.layerSelect.appendChild(loadElement("OPTION", {"value": item.id}, item.name || item.title));  
      }, this);
  
      // if layer 
      if (dataItems.length === 1) {
        this.layerSelect.className = "hidden";
        this.updateFields(dataItems);
      } else {
        parentNode.appendChild(loadElement("SPAN", {}, "Layers:"));
        // on layerSelect change, update the fieldSelect list.
        this.layerSelect.addEventListener("change", this.updateFields.bind(this, dataItems));
      }
      parentNode.appendChild(this.layerSelect);
      parentNode.appendChild(loadElement("SPAN", {}, "Fields:"));
      parentNode.appendChild(this.fieldSelect);
      parentNode.appendChild(loadElement("SPAN", {}, "Values:"));
      parentNode.appendChild(this.valueList);
  
      this.fieldSelect.addEventListener("change", this.updateValues.bind(this, url.replace(/\/\d*\/?$/, "")));
    
      // apply double-click event listeners to fill in items.
      listenAll(parentNode, "select", "dblclick", function (evt) {
        setActive(evt.currentTarget.value);
      });

      // call the callback with the data items collected from the previous ajax call.
      if (callback && typeof callback === "function") {
        callback(dataItems);
      }
    };

    /**
     * Update the field items.
     * @param {object[]} dataItems 
     */
    this.updateFields = function (dataItems) {
      var layerId = parseInt(this.layerSelect.value, 10);
      this.fieldSelect.innerHTML = "";
      dataItems.filter(function (item) {
        return item.id === layerId;
      }).forEach(function (item) {
        
        if (!item || !item.fields || !item.fields.length) {
          this.fieldSelect.appendChild(loadElement("option", {"value": ""}, "No values found for this field"));
          this.fieldSelect.setAttribute("disabled", "disabled");
          return;
        } 
        
        var fields = item.fields.filter(isQueryableField);
        if (fields.length === 0) {
          this.fieldSelect.appendChild(loadElement("option", {"value": ""}, "No values found for this field"));
          this.fieldSelect.setAttribute("disabled", "disabled");
        } else {  
          this.fieldSelect.removeAttribute("disabled");
          fields.forEach(function (field) {
            this.fieldSelect.appendChild(loadElement("OPTION", {"value": field.name}, field.alias));  
          }, this);
        }
      });
    };

    /**
     * Update the value items
     * @param {string} url
     */
    this.updateValues = function (url) {
      var val = this.fieldSelect.value;
      var layerId = this.layerSelect.value;
      // loading of values
      this.valueList.innerHTML = "<option value=''>Loading...</option>";
      this.valueList.setAttribute("disabled", "disabled");
      // stop additional clicks on fieldSelect from subsequent calls
      this.fieldSelect.setAttribute("disabled", "disabled");
      // request distinct values
      ajax(url + "/" + layerId + "/query?where=1%3D1&returnGeometry=false&outFields=field&orderByFields=field&returnDistinctValues=true&f=json".replace(/field/g, val), function (res) {
        // re-enable fieldlist
        this.fieldSelect.removeAttribute("disabled");
        // test if features were returned.
        if (!res || !res.features || res.features.length === 0) {
          this.valueList.innerHTML = "<option value=''>No values found for this field</option>";
          this.valueList.setAttribute("disabled", "disabled");
        } else {
          this.valueList.removeAttribute("disabled");
          this.valueList.innerHTML = "";
          res.features.forEach(function (feature) {
            var featureValue =  isNaN(feature.attributes[val] * 1) ? "'{0}'".replace("{0}", feature.attributes[val]) : feature.attributes[val];
            this.valueList.appendChild(loadElement("option", {"value": featureValue}, feature.attributes[val]));
          }, this);  
        }
      }.bind(this));
    };

    // update help message
    if (!singleLayer) {
      helpMessage = "Select layer to populate fields. " + helpMessage;
    }
    helpMessageNode = loadElement("P", {}, helpMessage);
    parentNode.appendChild(helpMessageNode);

    // get JSON data from service and build data afterward.
    ajax(jsonUrl, this.buildRenderer.bind(this, callback));
    
  }

  /** 
   * Inserts a default where clause
   */
  function insertDefaultWhereClause() {
    chrome.storage.sync.get({
      defaultWhereClause: ""
    }, function(items) {
      var whereInput = document.querySelector("input[name = where]");
      // if the where clause input is empty and the defaultWhereClause is not, add it in.
      console.log("whereInput", whereInput);
      if (whereInput && !whereInput.value && items.defaultWhereClause) {
        whereInput.value = items.defaultWhereClause;
      }
    });
  }

  /**
   * Builds the Find Helper Panel
   * @function findHelper
   * @param {string} url
   */
  function findHelper(url) {
    var sidepanel = new SidePanel("Find Helper");
    
    FieldSelector(url, sidepanel.node, function (dataItems) {
      // insert valid layers into layers input.
      var layersBlank = document.querySelector("input[name = layers]");
      if (layersBlank && !layersBlank.value) {
        layersBlank.value = dataItems.filter(function (item) {
          return !item.subLayers || item.subLayers.length === 0;
        }).map(function (item) {
          return item.id;
        }).join(",");
      }
    });
      
    
  }

  /**
   * Builds the Query Helper panel
   * @function queryHelper
   * @param {string} url - url of the query service.
   */
  function queryHelper(url) {
    var sidepanel = new SidePanel("Query Helper");
    
    FieldSelector(url, sidepanel.node, function () {
      addSqlControl(sidepanel.node);
    
      addStatisticsControl(sidepanel.node);
  
      // add quick helpers
      insertQuickFillinButton(sidepanel.node, "Select All *", { where: "1=1", outFields: "*", returnCountOnly: "false", returnGeometry: "true" }, true);
      insertQuickFillinButton(sidepanel.node, "Select All but Geometry *", { where: "1=1", outFields: "*", returnCountOnly: "false", returnGeometry: "false" }, true);
      insertQuickFillinButton(sidepanel.node, "Get Count Only *", { where: "1=1", returnDistinctValues: "false", returnCountOnly: "true", returnGeometry: "false" }, true);
      insertQuickFillinButton(sidepanel.node, "Select Distinct", { where: "1=1", returnDistinctValues: "true", returnGeometry: "false"});
  
      insertDefaultWhereClause();
    }); 
  }

  chrome.extension.sendMessage({}, function(/*response*/) {
    var readyStateCheckInterval = setInterval(function() {
      var collectData;
      if (document.readyState === "complete") {
        clearInterval(readyStateCheckInterval);

        // collect the links on the web page to collect information about the content they link to.
        var tags = Array.prototype.slice.call(document.getElementsByTagName("a"), 0),
          url = window.location.href.split("?")[0],
          queryTest = /\/query\/?$/i,
          findTest = /\/find\/?$/i,
          printTaskTest = /\/(execute|submitjob)\/?$/i,
          urls;

        // search for map service links on the page
        urls = tags.map(function (tag, i) {
          return {i: i, url: tag.href};
        }).filter(function (item) {
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
        collectData = function (f, canCountFeatures) {
          if (!f.length) { return; }
          var data = f.shift();
          ajax(data.url + "?f=json",
            function (response) {
              var spatialReferenceNode = showSpatialReferenceData(response),
                metadata = showMetadata(response);
              
              if (spatialReferenceNode !== null) {
                tags[data.i].parentNode.appendChild(spatialReferenceNode);  
              }
              
              if (metadata !== null) {
                tags[data.i].parentNode.appendChild(metadata);
              }
              
              // if the service has fields, get the layer count
              if (response.fields && response.fields.length && canCountFeatures) {
                getLayerCount(data.url, response, function (countList) {
                  tags[data.i].parentNode.appendChild(countList);
                });
              }
              if (f.length) {
                collectData(f, canCountFeatures);
              }
            });
        };

        chrome.storage.sync.get({
          autoMetadata: true,
          autoFeatureCounts: true
        }, function(items) {
          if (urls && urls.length && items.autoMetadata) {
            collectData(urls, items.autoFeatureCounts);
          }
        });
        
        // field and domain data counting.
        if (/(imageserver|\d+)\/?$/i.test(url)) {
          ajax(url + "?f=json", function (results) {
            if (results && results.fields && results.fields.length > 0) {
              var fieldHTML = getFieldList(),
                domainFields, domainFieldHTML;

              chrome.storage.sync.get({
                autoFieldCounts: true,
                autoDomainCounts: true
              }, function(items) {
                if (items.autoFieldCounts) {
                  checkForNulls(url, results.fields.slice(0), fieldHTML.slice(0));
                }
                if (items.autoDomainCounts && results.fields.some(hasDomainTest)) {
                  domainFields = [];
                  domainFieldHTML = fieldHTML.slice(0);

                  results.fields.forEach(function (field, i) {
                    if (hasDomainTest(field)) {
                      domainFields.push(field.domain.codedValues.map(function (item) {
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
                  domainFieldHTML = domainFieldHTML.filter(function (item) {
                    return !!item;
                  });

                  checkDomains(url, domainFields, domainFieldHTML, null);
                }
              });

            }
          });
        }

        // map display on hover
        urls.forEach(function (item) {
          var tag = tags[item.i];

          tag.addEventListener("mouseover", hoverGetMap);
          tag.addEventListener("mouseout", hoverHideMap);
        });

        // handling print task and other 
        if (printTaskTest.test(url)) {
          ajax(url.replace(printTaskTest, "") + "?f=json", updateGPForm);
        }

        // handling query page with quick query helpers
        if (queryTest.test(url)) {
          queryHelper(url.replace(queryTest, ""));
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
}());

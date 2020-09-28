{
  let url = window.location.href.split("?")[0];
 
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
   * @param {string} [text] - if present, this is the content you shoul add to the HTML element.
   */
  const loadElement = (tag, attributes, text) => {
    let el = document.createElement(tag);
    for (let a in attributes) {
      el.setAttribute(a, attributes[a]);
    }
    if (text) {
      el.appendChild(document.createTextNode(text));
    }
    return el;
  };

  /**
   * Hides an input
   * @param {HTML} node 
   * @returns {string} original type of the node to show later on.
   */
  const hideInput = (node) => {
    let type = node.type || "";
    switch (node.tag) {
    case "INPUT":
      node.setAttribute("type", "hidden");
      break;
    default:
      node.className = (node.className ? " " : "") + "hidden";
    }
    return type;
  };

  /**
   * Show the form elemeent
   * @param {HTML} node element to show.
   * @param {string} type - original type of the node 
   */
  const showInput = (node, type) => {
    switch (node.tag) {
    case "INPUT":
      node.setAttribute("type", type);
      break;
    default:
      node.className = node.className.replace(/\s?hidden/ig, "");
    }
  };

  /**
   * Switches a text blank for a select element if choices are present.
   * @function swapInChoice
   * @param {object[]} nodes - list of HTML DOM nodes for text blanks and textareas in the form
   * @param {object} param - GP task parameters taken from REST Service.
   * @param {boolean} addOther - If true, add an "other" 
   */
  function swapInChoice (nodes, param, addOther) {
    const otherValue = "||||:OIJ:DOIJFOWIJVPWIO||||";
    if (!param.choiceList) {
      return;
    }
    // convert addOther to boolean
    addOther = !!addOther;

    const nodesByName = nodes.filter((node) => node.name === param.name);

    if (nodesByName && nodesByName.length > 0) {
      nodesByName.forEach((nodeToReplace) => {
        const select = loadElement("select", {});
        let nodeType;
          //"name": param.name
          
        // generate options
        param.choiceList.forEach((choice) => {
          const option = loadElement("option", {
            value: choice
          }, choice);
          select.appendChild(option);
        });

        if (addOther) {
          select.appendChild(loadElement("option", {
            value: otherValue
          }, "Other..."));
        }
        
        nodeType = hideInput(nodeToReplace);

        // when the select is triggered, update the value of the element
        select.addEventListener("change", () => {
          if (select.value === otherValue) {
            showInput(nodeToReplace, nodeType);
            nodeToReplace.value = "";
          } else {
            hideInput(nodeToReplace);
            nodeToReplace.value = select.value;
          }
        });

        if (!nodeToReplace.value) {
          select.value = param.defaultValue;
          nodeToReplace.value = param.defaultValue;
        } else {
          select.value = nodeToReplace.value;
        }
        // replace existing node with select node.
        nodeToReplace.parentNode.insertBefore(select, nodeToReplace);
        // nodeToReplace.parentNode.replaceChild(select, nodeToReplace);
        
      });
    }
  }

  /**
   * Modifies the Geoprocessing form to make choices easier. 
   * @function updateGPForm
   * @param {object} response
   * @returns
   */
  const updateGPForm = (response) => {
    if (!response.parameters) {
      alert("Could not find GP parameters for this task.");
      return;
    }
    try {
      const myForm = document.getElementsByTagName("FORM")[0];
      // get TextAreas in form
      let blanks = Array.prototype.slice.call(myForm.getElementsByTagName("TEXTAREA"), 0);
      // concat in list of inputs in the form
      blanks = blanks.concat(Array.prototype.slice.call(myForm.getElementsByTagName("INPUT"), 0));
      // for each parameter in the geoprocessing JSON, swap in choices 
      response.parameters.forEach(swapInChoice.bind(this, blanks));
      // look for Web_Map_as_JSON blank to fill in with default value.
      blanks.some((blank) => {
        if (blank.name === "Web_Map_as_JSON" && /^\s*$/.test(blank.value)) {
          chrome.storage.sync.get({
            defaultWebMapAsJSON: ""
          }, (items) => {
            blank.value = items.defaultWebMapAsJSON;
          });
        }
        return blank.name === "Web_Map_as_JSON";
      });
    } catch (err) {
      console.error(err);
      alert("Invalid form.");
    }
  };

  ajax(url.replace(/\/(execute|submitjob)\/?$/i, "") + "?f=json", updateGPForm);
}
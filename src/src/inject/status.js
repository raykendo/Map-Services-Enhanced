{
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
   * Creates an HTML element.
   * @function loadElement
   * @param {string} tag - HTML tag name that you want to create.
   * @param {object} attributes - name value object describing properties you want to assign to the object
   * @param {string} [text] - if present, this is the content you shoul add to the HTML element.
   */
  const loadElement = (tag, attributes, text) => {
    const el = document.createElement(tag);
    attributes = attributes || {};
    for (let a in attributes) {
      el.setAttribute(a, attributes[a]);
    }
    if (text) {
      el.innerHTML = text;
    }
    return el;
  };

  const statusNode = loadElement("DIV", {
    "class": "status"
  });
  const settingsImg = loadElement("IMG", {
    "class": "status-icon"
  });
  
  statusNode.appendChild(settingsImg);
  
  const showSettingsImg = () => { 
    settingsImg.src = chrome.runtime.getURL("src/images/settings.svg");
  };

  const openOptionsForm = () => {
    if (!statusNode) {
      return;
    }
    if (!/open/i.test(statusNode.className)) {
      statusNode.className += " open";
    }
  };

  const closeOptionsForm = () => {
    if (!statusNode) {
      return;
    }
    if (/open/i.test(statusNode.className)) {
      statusNode.className = statusNode.className.replace(" open", "");
    }
  };

  const showLoading = () => {
    if (!/loading/i.test(settingsImg.className))
      settingsImg.className += " loading";
  };

  const hideLoading = () => {
    if (/loading/i.test(settingsImg.className))
      settingsImg.className = settingsImg.className.replace(" loading", "");
  };

 
  showSettingsImg();

  statusNode.addEventListener("click", openOptionsForm);

  // set up listener for status changes
  chrome.runtime.onMessage.addListener(
    (request/*, sender*/ /*, sendResponse*/) => {
      switch (request.DISPLAY_STATUS) {
      case STATUS.LOADING:
        showLoading();
        break;
      case STATUS.LOAD_COMPLETE:
        hideLoading();
        break;
      }
      return true;
    });

  class OptionsForm {
    
    constructor(parentNode) {
      let df = document.createDocumentFragment();
      this.domNode = loadElement("DIV");
      df.appendChild(this.domNode);

      let configUrl = chrome.runtime.getURL("src/config/options.json");
      ajax(configUrl, response => this.renderForm(response));

      parentNode.appendChild(df);
    }

    renderForm(config) {
      if (!config.tools) {
        alert("unable to load tools.");
        return;
      }

      config.tools.forEach(tool => this.renderItem(tool));

      const saveContainer = loadElement("div");

      const saveButton = loadElement("BUTTON", {
        type: "submit"
      }, "Save");

      // assign save function
      saveButton.addEventListener("click", evt => {
        if (evt && evt.stopPropagation) {
          evt.stopPropagation();
        }
        this.saveForm(evt);
      }, {capture: true});

      saveContainer.appendChild(saveButton);

      const cancelButton = loadElement("BUTTON", {
        type: "reset"
      }, "Cancel");
      
      cancelButton.addEventListener("click", evt => {
        if (evt && evt.stopPropagation) {
          evt.stopPropagation();
        }
        this.cancelForm();
      });
      
      saveContainer.appendChild(cancelButton);

      this.domNode.parentNode.appendChild(saveContainer);
    }

    renderItem(group) {
      const fieldSet = loadElement("FIELDSET");
      const legend = loadElement("LEGEND", {}, group.name);
      fieldSet.appendChild(legend);

      if (group.items) {
        let lastItemIndex = group.items.length - 1;
        group.items.forEach((item, index) => this.renderQuestion(item, fieldSet, index === lastItemIndex));
      }

      this.domNode.appendChild(fieldSet);
    }

    renderQuestion(questionItem, parentNode, isLastItem) {
      let storageItem = {};
      storageItem[questionItem.property] = questionItem.default || "";

      switch (questionItem.type) {
      case "checkbox": {
        let checkboxLabel = loadElement("LABEL");
        let checkbox = loadElement("INPUT", {
          type: "checkbox",
          name: questionItem.property
        });
        checkboxLabel.appendChild(checkbox);
        let textspan = loadElement("SPAN", {}, questionItem.label);
        checkboxLabel.appendChild(textspan);
        parentNode.appendChild(checkboxLabel);
        if (!isLastItem) {
          parentNode.appendChild(loadElement("BR"));
        }
        chrome.storage.sync.get(storageItem, items => {
          checkbox.checked = items[questionItem.property];
        });
        break;
      }
      case "radio": {
        let checkboxQuestion = loadElement("SPAN",  {}, questionItem.label);
        parentNode.appendChild(checkboxQuestion);

        const radioBoxes = questionItem.options.map(option => {
          parentNode.appendChild(loadElement("BR"));
          let checkboxLabel = loadElement("LABEL");
          let checkbox = loadElement("INPUT", {
            type: "radio",
            value: option.value,
            name: questionItem.property
          });
          let textspan = loadElement("SPAN", {}, option.label);
          checkboxLabel.appendChild(checkbox);
          checkboxLabel.appendChild(textspan);
          parentNode.appendChild(checkboxLabel);
          return checkbox;
        });
  
        chrome.storage.sync.get(storageItem, items => {
          radioBoxes.forEach(radioBox => {
            //console.log(radioBox.value, items[questionItem.property], questionItem.property);
            if (radioBox.value === items[questionItem.property]) {
              radioBox.checked = true;
            }
          });
        });
        break;
      }
      case "textarea": {
        let label = loadElement("P", {}, questionItem.label);
        let blank = loadElement("TEXTAREA", {
          rows: "3",
          name: questionItem.property,
          placeholder: questionItem.placeholder || ""
        });
        parentNode.appendChild(label);
        parentNode.appendChild(blank);
        chrome.storage.sync.get(storageItem, items => {
          blank.value = items[questionItem.property];
        });
        break;
      }
      case "number": {
        let label = loadElement("P", {}, questionItem.label);
        let blank = loadElement("INPUT", {
          type: "number",
          name: questionItem.property,
          placeholder: questionItem.placeholder || ""
        });
        parentNode.appendChild(label);
        parentNode.appendChild(blank);
        if (!isLastItem) {
          parentNode.appendChild(loadElement("BR"));
        }
        chrome.storage.sync.get(storageItem, items => {
          blank.value = items[questionItem.property];
        });
        break;
      }
      default: {
        let label = loadElement("P", {}, questionItem.label);
        let blank = loadElement("INPUT", {
          type: "text",
          name: questionItem.property,
          placeholder: questionItem.placeholder || ""
        });
        parentNode.appendChild(label);
        parentNode.appendChild(blank);
        if (!isLastItem) {
          parentNode.appendChild(loadElement("BR"));
        }
        chrome.storage.sync.get(storageItem, items => {
          blank.value = items[questionItem.property];
        });
      }      
      }
    }
    cancelForm() {
      // todo: reset form values
      closeOptionsForm(); 
    }
    saveForm(evt) {
      if (!evt || !evt.target) {
        return;
      }

      let dataToSave = {},
        saveBtn = evt.target,
        checkboxes = this.domNode.querySelectorAll("input[type=checkbox]"),
        radioboxes = this.domNode.querySelectorAll("input[type=radio]:checked"),
        textboxes = this.domNode.querySelectorAll("input[type=text]"),
        textareas = this.domNode.querySelectorAll("textarea"),
        numberboxes = this.domNode.querySelectorAll("input[type=number]");
        // save properties

      if (checkboxes && checkboxes.length) {
        [].forEach.call(checkboxes, checkbox => {
          dataToSave[checkbox.name] = checkbox.checked;
        });
      }

      if (radioboxes && radioboxes.length) {
        [].forEach.call(radioboxes, checkbox => {
          dataToSave[checkbox.name] = checkbox.value;
        });
      }

      if (textboxes && textboxes.length) {
        [].forEach.call(textboxes, blank => {
          dataToSave[blank.name] = blank.value;
        });
      }

      if (textareas && textareas.length) {
        [].forEach.call(textareas, blank => {
          dataToSave[blank.name] = blank.value;
        });
      }

      if (numberboxes && numberboxes.length) {
        [].forEach.call(numberboxes, blank => {
          dataToSave[blank.name] = parseInt(blank.value, 10);
        });
      }

      saveBtn.textContent = "Saving options.";
      saveBtn.setAttribute("disabled", "disabled");

      chrome.storage.sync.set(dataToSave, () => {
        
        setTimeout(() => {
          saveBtn.textContent = "Save";
          saveBtn.removeAttribute("disabled");
          // close form
          closeOptionsForm();
        });
      });
    }
  }

  new OptionsForm(statusNode);
  document.body.appendChild(statusNode);
  
}
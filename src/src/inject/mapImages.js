{

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
   * Get the map div for the map viewer
   */
  const getMapDiv = () => {
    let mapDiv = document.getElementById("mapdiv");

    if (!mapDiv) {
      const parentDiv = loadElement("DIV", {
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
  };

  /**
   * On hover, get map
   * @param {Event} evt 
   */
  const hoverGetMap = (evt) => {
    if (!evt || !evt.target) {
      return;
    }
    const url = evt.target.href;
    if (!url) {
      return;
    }
    console.log("hover get map:", url);
    let getMap = false;
    if (getMap) {
      const mapDiv = getMapDiv();
      mapDiv.innerHTML = "";
    }
  };

  const hoverHideMap = () => {
    console.log("hover hide map");
  };


  chrome.extension.sendMessage({}, (/*response*/) => {
    let readyStateCheckInterval = setInterval(() => {
      if (document.readyState === "complete") {
        clearInterval(readyStateCheckInterval);

        // collect the links on the web page to collect information about the content they link to.
        const tags = Array.prototype.slice.call(document.getElementsByTagName("a"), 0),
          urls = tags.map((tag, i) =>  {
            return Object.create({}, {
              i: {
                value: i
              },
              url: {
                value: tag.url
              }
            });
          }).filter((item) => {
          // filter out links in the breadcrumbs section at the top of the page.
            if (tags[item.i].parentNode.className === "breadcrumbs") {
              return false;
            }
            return /(map|feature|image|mobile)server(\/\d*\/?)?$/i.test(item.url);
          });

        // map display on hover
        urls.forEach((item) => {
          const tag = tags[item.i];

          tag.addEventListener("mouseover", hoverGetMap);
          tag.addEventListener("mouseout", hoverHideMap);
        });

      }
    }, 10);
  });
}
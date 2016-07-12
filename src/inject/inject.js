(function () {
	// ajax function from https://gist.github.com/Xeoncross/7663273
	var colorhash = {};
	
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

	function add(node, title, content, hideifContentFalse, hideContent) {
		if (hideifContentFalse && !content) { return; }
		var li = document.createElement("li");
		li.innerHTML = ["<b>", title, "</b>", (hideContent ? "": ": " + (content instanceof Object ? JSON.stringify(content) : content))].join("");
		node.appendChild(li);
	}

	function addSubList(node, title, content) {
		var li = document.createElement("li"), 
			ul = document.createElement("ul"), 
			i;
		li.innerHTML = "<b>" + title + ":</b>";
		for (i in content) {
			add(ul, i, content[i], 1);
		}
		li.appendChild(ul);
		node.appendChild(li);
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
	/**
	 * Creates a nested list to show service and layer metadata
	 * @function showMetadata
	 * @param {object} data - JSON response from the map service
	 * @returns {object} an HTML DOM node with the formatted metadata list
	 */
	function showMetadata(data) {
		var dF = document.createDocumentFragment(),
			ul, div;
		if (data) {
			div = document.createElement("div");
			div.className = "datablock collapsed";
			div.appendChild(document.createElement("br"));
			ul = document.createElement("ul");
			div.appendChild(ul);
			add(dF, "Description", data.description, true);
			add(dF, "Service Description", data.serviceDescription, true);
			add(dF, "&copy;", data.copyrightText, true);
			add(dF, "Supports Dynamic Layers", 0, data.supportsDynamicLayers, 1);
			add(dF, "# Layers", data.layers ? data.layers.length : 0);
			add(dF, "# Tables", data.tables ? data.tables.length : 0, 1);
			add(dF, "Min Scale", data.minScale || "None");
			add(dF, "Max Scale", data.maxScale || "None");
			addSubList(dF, "Initial Extent", data.initialExtent);
			addSubList(dF, "Full Extent", data.fullExtent);
			if (data.hasOwnProperty("units")) {
				add(dF, "Units", data.units.replace("esri", ""));							
			}
			addSubList(dF, "Document Info", data.documentInfo);
			add(dF, "Max Record Count", data.maxRecordCount);
			ul.appendChild(dF);
			div.addEventListener("click", toggleCollapse.bind(div));

			return div;
		}
		return null;
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

	chrome.extension.sendMessage({}, function(response) {
		var readyStateCheckInterval = setInterval(function() {
			if (document.readyState === "complete") {
				clearInterval(readyStateCheckInterval);

				var	tags = Array.prototype.slice.call(document.getElementsByTagName("a"), 0),
				urls = tags.map(function (tag, i) {
					return {i: i, url: tag.href};
				}).filter(function (item) {
					if (tags[item.i].parentNode.className === "breadcrumbs") {
						return false;
					}
					return /(map|feature|image|mobile)server\/?$/i.test(item.url);
				});

				function collectData(f) {
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
							
							if (f.length) {
								collectData(f);
							}
						});
				}

				if (urls && urls.length) {
					collectData(urls);
				}
				
			}
		}, 10);
	});


}());
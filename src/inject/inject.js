(function () {
	// ajax function from https://gist.github.com/Xeoncross/7663273
	var colorhash = {};
	
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
	 * Adds a list item to a node if the property is there and maybe if a property is true.
	 * @function add
	 * @param {string} title - text to add in bold
	 * @param {string | function} content - data to add after title in regular format
	 * @returns {object} - list item node;
	 */
	function add(title, content) {
		var li = document.createElement("li");
		if (content === undefined) {
			li.innerHTML = ["<b>","</b>"].join(title);
		} else {
			li.innerHTML = ["<b>", title, ": </b>", (content instanceof Object ? JSON.stringify(content) : content)].join("");
		}
		return li;
	}

	/**
	 * Adds a list item to a node with the title of the property, and then itemizes ovoer the content object get all its properties
	 * @function addSubList
	 * @param {string} title - title of the list
	 * @param {object} content - name, value pairs used to describe a feature.
	 * @returns {object} - list item node containing list of properties.
	 */
	function addSubList(title, content) {
		var li = document.createElement("li"), 
			ul = document.createElement("ul"), 
			i;
		li.innerHTML = ["<b>",": </b>"].join(title);
		for (i in content) {
			ul.appendChild(add(unCamelCase(i), content[i]));
		}
		li.appendChild(ul);
		return li;
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

			if (data.hasOwnProperty("description") && data.description) {
				//add("Description", data.description, true);
				dF.appendChild(add("Description", data.description));
			}
			if (data.hasOwnProperty("serviceDescription") && data.serviceDescription) {
				dF.appendChild(add("Service Description", data.serviceDescription));
			}
			if (data.hasOwnProperty("copyrightText") && data.copyrightText) {
				dF.appendChild(add("&copy;", data.copyrightText));
			}
			if (data.hasOwnProperty("supportsDynamicLayers") && data.supportsDynamicLayers) {
				dF.appendChild(add("Supports Dynamic Layers"));
			}
			if (data.hasOwnProperty("layers")) {
				dF.appendChild(add("# Layers", data.layers.length));
			}
			if (data.hasOwnProperty("tables") && data.tables.length) {
				dF.appendChild(add("# Tables", data.tables.length));
			}
			if (data.hasOwnProperty("minScale")) {
				dF.appendChild(add("Min Scale", data.minScale || "None"));
			}
			if (data.hasOwnProperty("maxScale")) {
				dF.appendChild(add("Max Scale", data.maxScale || "None"));
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
			if (data.hasOwnProperty("units")) {
				dF.appendChild(add("Units", data.units.replace("esri", "")));							
			}
			if (data.hasOwnProperty("documentInfo")) {
				dF.appendChild(addSubList("Document Info", data.documentInfo));
			}
			if (data.hasOwnProperty("documentInfo")) {
				dF.appendChild(add("Max Record Count", data.maxRecordCount));
			}
			if (data.hasOwnProperty("geometryType")) {
				dF.appendChild(add("Geometry", data.geometryType.replace("esriGeometry", "")));
			}
			if (data.definitionExpression) {
			    dF.appendChild(add("Definition Expression", data.definitionExpression));
			}
			if (data.hasOwnProperty("defaultVisibility")) {
				dF.appendChild(add("Visible by default", data.defaultVisibility.toString()));
			}
			if (data.hasAttachments) {
				dF.appendChild(add("Has Attachments"));
			}
			if (data.hasLabels) {
			    dF.appendChild(add("Has Labels"));
			}
			if (data.supportsStatistics) {
			    dF.appendChild(add("Supports Statistics"));
			}
			if (data.supportsAdvancedQueries) {
			    dF.appendChild(add("Supports Advanced Queries"));
			}
			if (data.relationships && data.relationships.length) {
			    dF.appendChild(add("Has Relationships"));
			}
			if (data.hasOwnProperty("isDataVersioned")) {
				dF.appendChild(add("Versioned Data", data.isDataVersioned ? "Yes" : "No"));
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
				ul.appendChild(add("Number of features", response.count ));
			});
		} else {
			ul.appendChild(add("No way to query features."));
		}
		
		if (shape) {
			ajax(queryUrl.replace(/\+field\+/g, ["+", "+"].join(shape)), function (response) {
				ul.appendChild(add("Features with shapes", response.count ));
			})
		} else if (!/\/featureserver\//i.test(url) && (data.type && data.type !== "Table")) {
			ul.appendChild(add("No visible shape field available."));
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
					return /(map|feature|image|mobile)server(\/\d*\/?)?$/i.test(item.url);
				});

				function collectData(f) {
					if (!f.length) { return; }
					var data = f.shift();
					ajax(data.url + "?f=json",
						function (response) {
							var spatialReferenceNode = showSpatialReferenceData(response),
								metadata = showMetadata(response),
								dataCount;
							
							if (spatialReferenceNode !== null) {
								tags[data.i].parentNode.appendChild(spatialReferenceNode);	
							}
							
							if (metadata !== null) {
								tags[data.i].parentNode.appendChild(metadata);
							}
							
							// if url is a map service layer, query for number of features && number of features with shapes
							if (/server\/\d+\/?$/i.test(data.url)) {
								getLayerCount(data.url, response, function (countList) {
									tags[data.i].parentNode.appendChild(countList);
								});
							}

							if (f.length) {
								collectData(f);
							}


						});
				}

				if (urls && urls.length) {
					collectData(urls);
				}

				// todo: handle Query page with quick query helpers
				// todo: handle PrintTask page
				// todo: tile testing
				// todo: field data count
				// todo: domain data count
				// todo: geometry helper
				
			}
		}, 10);
	});


}());
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
					newTimeCheck;
				item.innerHTML =  ["<b>Features with values: </b>", response.count, (!response.count ? "<b style=\"color:#f00;\"> !!!</b>":""), " (<i>Response time: ", responseTime(timeCheck),"</i>)"].join("");
				resultList.appendChild(item);
				if (field.type === "esriFieldTypeString") {
					newTimeCheck = Date.now();

					ajax(url + "/query?where=not+field+is+null+and+field+<>%27%27&returnGeometry=false&returnCountOnly=true&f=json".replace(/field/g, field.name), 
						function (response2) {
							var item2 = document.createElement("li");
							item2.innerHTML = ["<b>Features without empty values: </b>", response2.count, (!response2.count ? "<b style=\"color:#f00;\"> !!!</b>":""), " (<i>Response time: ", responseTime(newTimeCheck),"</i>)"].join("");

							resultList.appendChild(item2);

							if (fields.length) {
								checkForNulls(url, fields, nodes);
							}
						});

				} else 	if (fields.length) {	
					checkForNulls(url, fields, nodes); 
				}
				
			});
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
					var li = document.createElement("li");
					li.innerHTML = ["<b>", item.name, ": </b>", response.count, (!response.count ? "<b style=\"color:#f00;\"> !!!</b>" : "")].join("");
					tr.appendChild(li);
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
	 * Creates a button with the entered text.
	 * function createButton
	 * @param {string} text - text you want to insert within the button.
	 */
	function createButton(text) {
		var button = document.createElement("button");
		button.innerHTML = text;
		button.setAttribute("type", "button");
		return button;
	}


	chrome.extension.sendMessage({}, function(response) {
		var readyStateCheckInterval = setInterval(function() {
			if (document.readyState === "complete") {
				clearInterval(readyStateCheckInterval);

				// collect the links on the web page to collect information about the content they link to.
				var	tags = Array.prototype.slice.call(document.getElementsByTagName("a"), 0),
				urls = tags.map(function (tag, i) {
					return {i: i, url: tag.href};
				}).filter(function (item) {
					// filter out links in the breadcrumbs section at the top of the page.
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



				// get current url
				//chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    				//var url = tabs[0].url;
					var url = window.location.href;

					// create a side-bar to house buttons that do stuff.
					var sidepanel = document.createElement("div");
					sidepanel.className = "sidepanel";
					document.body.appendChild(sidepanel);

					// field and domain data counting.
					if (/\d+\/?$/.test(url)) {
						ajax(url + "?f=json", function (results) {
							if (results.fields && results.fields.length) {
								var fieldHTML = getFieldList();

								var panelbutton = createButton("Test Fields for nulls");

								sidepanel.appendChild(panelbutton);

								panelbutton.addEventListener("click", function () {
									checkForNulls(url, results.fields.slice(0), fieldHTML.slice(0));
								});

								if (results.fields.some(hasDomainTest)) {
									var domainFields = []
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
											domainFieldHTML[i] = null

										}
									});

									// filter out nulled out HTML nodes.
									domainFieldHTML = domainFieldHTML.filter(function (item) {
										return !!item;
									});



									var domainbutton = createButton("Test coded value domains");

									sidepanel.appendChild(domainbutton);

									domainbutton.addEventListener("click", function () {
										checkDomains(url, domainFields, domainFieldHTML, null);
									});
									

								}
							}
							
						});

					}

				//});


				// todo: handle Query page with quick query helpers
				// todo: handle PrintTask page
				// todo: tile testing

				// todo: geometry helper
				
			}
		}, 10);
	});


}());
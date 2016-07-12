(function () {
	// ajax function from https://gist.github.com/Xeoncross/7663273
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

	chrome.extension.sendMessage({}, function(response) {
		var readyStateCheckInterval = setInterval(function() {
			if (document.readyState === "complete") {
				clearInterval(readyStateCheckInterval);

				var	tags = document.getElementsByTagName("a"),
				urls = Array.prototype.map.call(tags, function (tag, i) {
					return {i: i, url: tag.href};
				}).filter(function (item) {
					if (tags[item.i].parentNode.className === "breadcrumbs") {
						return false;
					}
					return /(map|feature|image|mobile)server\/?$/i.test(item.url);
				});

				function toggleCollapse() {
					if (this.className.indexOf("collapsed") > -1) {
						this.className = this.className.replace(" collapsed", "");
					} else {
						this.className += " collapsed";
					}
				}

				function collectData(f) {
					if (!f.length) { return; }
					var data = f.shift();
					ajax(data.url + "?f=json",
						function (response) {
							var dF = document.createDocumentFragment(),
								div = document.createElement("div");
								ul = document.createElement("ul");
							div.className = "datablock collapsed";

							add(dF, "Description", response.description, true);
							add(dF, "Service Description", response.serviceDescription, true);
							add(dF, "&copy;", response.copyrightText, true);
							add(dF, "Supports Dynamic Layers", 0, response.supportsDynamicLayers, 1);
							add(dF, "# Layers", response.layers ? response.layers.length : 0);
							add(dF, "# Tables", response.tables ? response.tables.length : 0, 1);
							add(dF, "Tiled or Dynamic", response.tileInfo ? " tiled" : " dynamic");
							add(dF, "Spatial Reference", JSON.stringify(response.spatialReference || "none"));
							add(dF, "Min Scale", response.minScale || "None");
							add(dF, "Max Scale", response.maxScale || "None");
							addSubList(dF, "Initial Extent", response.initialExtent);
							addSubList(dF, "Full Extent", response.fullExtent);
							if (response.hasOwnProperty("units")) {
								add(dF, "Units", response.units.replace("esri", ""));							
							}
							addSubList(dF, "Document Info", response.documentInfo);
							add(dF, "Max Record Count", response.maxRecordCount);
							tags[data.i].parentNode.appendChild(div);
							div.appendChild(ul);
							div.addEventListener("click", toggleCollapse.bind(div));
							ul.appendChild(dF);
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
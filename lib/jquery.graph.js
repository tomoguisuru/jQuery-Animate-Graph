/*********************************************/
/* jQuery Animated Graph Plugin			*/
/* Author: Brandon Drake		  		   	*/
/* Version: 1.0     								*/
/* Date: Jan 26, 2012							*/	
/* Requires 										*/
/*  jCarousel                               		*/
/*********************************************/

(function($) {	
	var defaults = {
		columns: 6,
		imgHeight: 50,
		imgWidth: 75,
		jsonScript: '',
		jsonObject: null,
		ajaxData: {},
		cssClass: 'jcarousel-skin-benchmark',
		imgEvent: 'click',
		afterEvent: $.noop,
		animate: true,
		jCarouselEnabled: true,
		onComplete: $.noop
	},
	initLoad = true,
	methods = {
		_init: function (options) {
			return this.each(function () {
				var $this = $(this),
					data = $this.data('graph');
					
				if (!data) {
					if (options) {
						options = $.extend({}, defaults, options)
					}
					
					var data = {
							element: $this,
							elementID: $this.attr('id'),							
							options: options,
							total: 0
						}
					
					if (options.jsonObject === null) {
						methods._processAjax(data);
					} else {
						methods._process(data, options.jsonObject);
					}
				}
			});
		},
		_getIntervalMax: function (max) {
			var multiplier = 1;
			
			if (max > 100 && max < 999) {
				multiplier = 10;
			} else if (max > 1000 && max < 9999) {
				multiplier = 100;
			} else if (max > 10000 && max < 99999) {
				multiplier = 1000;
			} else if (max > 100000 && max < 999999) {
				multiplier = 10000;
			}
			
			max = parseInt(max / multiplier, 0) + 10;
			
			while (max % 6 != 0) {
				max += 1;
			}
			
			return max * multiplier;
		},
		_drawGraph: function (data, jsonData) {
			var graph = $("#" + data.elementID + " .graphs"),
				caption = $("#" + data.elementID + " .graph_caption"),
				scaleMsg = $("#" + data.elementID + " .scaleMsg"),
				width = graph.width(),
				values = jsonData.results,
				ct = values.length,
				i,
				drawWidth = 0,
				max = Math.max.apply(null, values),
				scale = methods._getIntervalMax(max),
                temp = 0,
                scaleMax = (7 * scale) / 6,
				options = data.options;
			
			caption.find("h2").html(jsonData.title);
			caption.find("h3").html(jsonData.def);
			scaleMsg.html(jsonData.scaleMsg);
                        
			for (i = 0; i < ct; i += 1) {
                drawWidth = Math.round( (values[i] / scaleMax) * width );
                var bar = $("#" + data.elementID + "_graph_" + i.toString());

                if (options.animate === true) {
                    // Perform animations
				    bar.stop(true, false).animate({ width: drawWidth }, {
                        duration: 500, 
                        complete: function () {
                            temp += 1;

                            // afterEvent call when animation is on
                            if (temp === (ct)) {
                                if (initLoad === false) {
									try {
										options.afterEvent.call();
									} catch (err) { }
                                } else {
                                    initLoad = false;
                                }
                            } 
                        }
                    });
                } else {
                    bar.width(drawWidth);
                }

				$("#" + data.elementID + "_graph_" + i.toString() + "_value").text(values[i] || "[Not Tested]");
			}

            // afterEvent call when animation is off
            if (options.animate === false) {
				try {
					options.afterEvent.call();
				} catch (err) { }
            }
			
            // Set the scale values
			for (i = 6; i >= 0; i -= 1) {
				$("#" + data.elementID + "_grid_base_" + i.toString()).html("&nbsp;" + (scale / 6)  * i);
			}
		},
		_processAjax: function (data) {
			var options = data.options;
			
			$.ajax({
				url: options.jsonScript,
				type: 'GET',
				data: options.ajaxData,
				dataType: 'json',
				success: function (jsonData) {
					methods._process(data, jsonData);
				},
				complete: function (jqXHR, textStatus) {
					if (options.onComplete !== $.noop) {
						try {
							options.onComplete.call();
						} catch (err) { }
					}
				}
			});
		},
		_process: function (data, jsonData) {
			var ct = jsonData.axis.length,
				total = ct,
				options = data.options,
				i = 0,
				html = "<div class='graph_body'>\n" + 
					"<div class='header' >\n" + 
						"<div class='graph_caption'><h2></h2><h3></h3></div>\n" +
						"<div class='scaleMsg'></div>\n" +								
					"</div>\n" + 
						"<div class='graph_content clearfix'>\n" + 
							"<div class='titles'>\n",
				html2 = "<div class='graphs'>\n",
				html3 = "";
						
			for (i = 0; i < ct; i += 1) {
				if (i === 0) {
					extraClass = " first_bar";
				} else if (i === (ct -1)) {
					extraClass = " last_bar";
				} else {
					extraClass = "";
				}
						
				html += "<div class='title' >" + jsonData.axis[i] + "</div>\n"
				html2 += "<div class='row'><div id='" + data.elementID + "_graph_" + i.toString() + "' class='bar" + 
					extraClass + "'></div><div id='" + data.elementID + "_graph_" + i.toString() + "_value' class='value'></div></div>\n";
			}
					
			for (i = 0; i < 7; i += 1) {
				html3 += "<div id='" + data.elementID + "_grid_base_" + i.toString() + "' class='axis'></div>";
			}
					
			html2 += "</div>\n";
			html += "</div>\n" + 
						html2 + 
					"<div class='spacer'></div>" + 
						html3 + 
					"</div>\n" + 
				"</div>\n";
					
			if (options.jCarouselEnabled === true) {
				ct = jsonData.metrics.length;
				html += "<ul class='metrics " + options.cssClass + "' >\n";
						
				for (i = 0; i < ct; i += 1) {
					html += "<li><img src='" + jsonData.path + jsonData.metrics[i].img + "' alt='" + jsonData.metrics[i].title + "' height='" + 
						options.imgHeight + "' width='" + options.imgWidth + "' /><p>" + jsonData.metrics[i].name + "</li>\n";
				}
						
				html += "</ul>\n";
						
				data.element.html(html);
						
				ct = 0;
				$("#" + data.elementID + " .metrics li").each( function () {
					$(this).data("test", jsonData.metrics[ct]).data("num", ct + 1);;
							
					if (ct === 0) {
						methods._drawGraph(data, jsonData.metrics[ct]);
						$('#' + data.elementID + " .graph_body").data("num", ct + 1);
					}
							
					$(this).bind(options.imgEvent, function () {
						var me = $(this);
						$('#' + data.elementID + " .graph_body").data("num", me.data("num"));
						methods._drawGraph(data, me.data("test"));
					});
							
					ct += 1;
				});
						
				$("#" + data.elementID + " .metrics").jcarousel({
					scroll: options.columns,
					vertical: options.vertical
				});
			} else {
				data.element.html(html);
				methods._drawGraph(data, jsonData.metrics[0]);
			}
			
			data.total = total;
			
			$("#" + data.elementID).data('graph', data);
		},
		next: function () {
			var data = $(this).data('graph'),
				graph = $('#' + data.elementID + " .graph_body"),
				num = graph.data("num") + 1;
				
			num = num <= data.total ? num : 1;
			graph.data("num", num);
			
			$('#' + data.elementID + " .metrics").data('jcarousel').scroll($.jcarousel.intval(num));
			methods._drawGraph(data, $("#" + data.elementID + " .metrics li:nth-child(" + num + ")").data("test"));
		}
	}
	
	$.fn.graph = function (method) {
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods._init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.graph' );
		} 
	};
})(jQuery)
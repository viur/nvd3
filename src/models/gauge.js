nv.models.gauge = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var margin = {top: 0, right: 0, bottom: 0, left: 0}
        , width = 500
        , height = 500
        , getX = function (d) {
            return d.x
        }
        , getY = function (d) {
            return d.y
        }
        , id = Math.floor(Math.random() * 10000) //Create semi-unique ID in case user doesn't select one
        , container = null
        , color = nv.utils.defaultColor()
        , valueFormat = d3.format(',.2f')
        , labelFormat = function (d) {
            return d;
        }
        , showLabels = true
        , showTicks = true
        , labelsOutside = false
        , labelType = "key"
        , valueType = "absolute"
        , label = ""
        , labelThreshold = .02 //if slice percentage is under this, don't show label
        , donut = true
        , value = 0
        , maxValue = 0
        , growOnHover = true
        , titleOffset = 0
        , labelSunbeamLayout = false
        , startAngle = false
        , pieStartAngle = false
        , pieEndAngle = false
        , padAngle = false
        , image = "none"
        , endAngle = false
        , cornerRadius = 0
        , donutRatio = 0.65
        , arcsRadius = []
        , showClickable = false
        , dispatch = d3.dispatch('chartClick', 'elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout', 'elementMousemove', 'renderEnd')
        ;

    var arcs = [];
    var arcsOver = [];

    //============================================================
    // chart function
    //------------------------------------------------------------

    var renderWatch = nv.utils.renderWatch(dispatch);

    function chart(selection) {
        renderWatch.reset();
        selection.each(function (data) {
            var availableWidth = width - margin.left - margin.right
                , availableHeight = height - margin.top - margin.bottom
                , radius = Math.min(availableWidth, availableHeight) / 1.5
                , arcsRadiusOuter = []
                , arcsRadiusInner = []
                ;

            var max;

            if (maxValue > 0) {
                max = maxValue;
            } else {
                max = data[0][1].value;
            }

            var diff = max - data[0][0].value;

            if (diff < 0) {
                diff = 0;
            }

            if (data[0][0].value == 0) {
                diff = 1
            }

            container = d3.select(this);

            if (arcsRadius.length === 0) {
                var outer = radius - radius / 5;
                var inner = donutRatio * radius;
                for (var i = 0; i < data[0].length; i++) {
                    arcsRadiusOuter.push(outer);
                    arcsRadiusInner.push(inner);
                }
            } else {
                arcsRadiusOuter = arcsRadius.map(function (d) {
                    return (d.outer - d.outer / 5) * radius;
                });
                arcsRadiusInner = arcsRadius.map(function (d) {
                    return (d.inner - d.inner / 5) * radius;
                });
                donutRatio = d3.min(arcsRadius.map(function (d) {
                    return (d.inner - d.inner / 5);
                }));
            }
            nv.utils.initSVG(container);

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('.nv-wrap.nv-pie').data(data);
            var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-pie nv-chart-' + id);
            var gEnter = wrapEnter.append('g');
            var g = wrap.select('g');
            var g_pie = gEnter.append('g').attr('class', 'nv-pie');
            gEnter.append('g').attr('class', 'nv-pieLabels');

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
            g.select('.nv-pie').attr('transform', 'translate(' + availableWidth / 2 + ',' + availableHeight / 2 + ')');
            g.select('.nv-pieLabels').attr('transform', 'translate(' + availableWidth / 2 + ',' + availableHeight / 2 + ')');

            //
            container.on('click', function (d, i) {
                dispatch.chartClick({
                    data: d,
                    index: i,
                    pos: d3.event,
                    id: id
                });
            });

            if (valueType == 'variance') {
                g.select('.nv-pie').style("display", "none");
            } else {
                g.select('.nv-pie').style("display", null);
            }

            arcs = [];
            arcsOver = [];
            for (var i = 0; i < data[0].length; i++) {

                var arc = d3.svg.arc().outerRadius(arcsRadiusOuter[i]);
                var arcOver = d3.svg.arc().outerRadius(arcsRadiusOuter[i] + 5);

                if (startAngle !== false) {
                    arc.startAngle(startAngle);
                    arcOver.startAngle(startAngle);
                }
                if (endAngle !== false) {
                    arc.endAngle(endAngle);
                    arcOver.endAngle(endAngle);
                }
                if (donut) {
                    arc.innerRadius(arcsRadiusInner[i]);
                    arcOver.innerRadius(arcsRadiusInner[i]);
                }

                if (arc.cornerRadius && cornerRadius) {
                    arc.cornerRadius(cornerRadius);
                    arcOver.cornerRadius(cornerRadius);
                }

                arcs.push(arc);
                arcsOver.push(arcOver);
            }

            // Setup the Pie chart and choose the data element
            var pie = d3.layout.pie()
                .sort(null)
                .value(function (d) {
                    if (d.label == "Max") {
                        return diff;
                    }
                    return d.disabled ? 0 : getY(d)
                });

            if (pieStartAngle !== false)
                pie.startAngle(pieStartAngle);

            if (pieEndAngle !== false)
                pie.endAngle(pieEndAngle);

            // padAngle added in d3 3.5
            if (pie.padAngle && padAngle) {
                pie.padAngle(padAngle);
            }

            wrap.select('.nv-pie-image').remove();

            if (image != 'none') {


                var plane_path = "M32.54,8.796c-0.395-0.395-1.035-0.395-1.429,0l-3.076,3.076l-7.359-1.1c-0.166-0.018-0.375,0.033-0.545,0.203l-0.569,0.568c-0.169,0.17-0.126,0.291-0.003,0.345l6.055,2.405l-2.189,2.188" +
                    "l-2.032-0.21c-0.232-0.031-0.362,0.027-0.433,0.078l-0.455,0.35c-0.215,0.174,0.005,0.266,0.092,0.328l2.048,1.045" +
                    "c0.186,0.107,0.411,0.145,0.573,0.085c-0.044,0.161-0.025,0.371,0.044,0.532l1.045,2.049c0.034,0.089,0.154,0.306,0.328,0.092" +
                    "l0.351-0.457c0.051-0.068,0.104-0.208,0.078-0.431l-0.21-2.03l2.173-2.173l2.382,5.997c0.043,0.109,0.166,0.175,0.336,0.006" +
                    "l0.578-0.578c0.169-0.17,0.221-0.395,0.203-0.545l-1.09-7.289l3.105-3.105C32.936,9.831,32.936,9.19,32.54,8.796z";

                var growth_path = "M21.356,17.94v2.984h3.402v-5.55l-0.254-0.252L21.356,17.94z M25.745,16.359v4.565h3.401v-4.909" +
                    "l-1.937,1.804L25.745,16.359z M34.296,7.97l-1.971,0.535c-0.521,0.141-0.731,0.465-0.471,0.723l0.471,0.468l-5.102,4.752" +
                    "l-2.697-2.689l-3.975,3.56l0.805,0.898l3.125-2.798l2.714,2.704l5.988-5.576c0,0,0.231,0.23,0.517,0.514s0.628,0.091,0.765-0.43" +
                    "l0.522-1.974C35.124,8.136,34.813,7.828,34.296,7.97z M30.176,15.056v5.869h3.401v-8.601l-0.208-0.241L30.176,15.056z";

                var world_path = "m27.786,7.411c-3.871,0 -7.018,3.148 -7.018,7.019s3.146,7.019 7.018,7.019c3.869,0 7.018,-3.148 7.018,-7.019s-3.149,-7.019 -7.018,-7.019zm0,12.421c-0.48,0 -0.945,-0.063 -1.389,-0.182c-0.012,-0.082 -0.023,-0.174 -0.029,-0.275c-0.029,-0.421 0.121,-0.382 0.596,-0.712c0.473,-0.332 1.062,-2.186 1.17,-2.416s0.328,-0.271 0.262,-0.516c-0.068,-0.244 -0.357,-0.148 -0.838,-0.263c-0.48,-0.115 -0.85,-0.437 -1.248,-0.806s-0.955,-0.504 -1.164,-0.315c-0.211,0.188 -0.648,0.317 -0.648,0.317c-0.098,0.031 -0.215,0.836 -0.195,1.107s0.303,0.773 0.854,1.181c0.549,0.408 0.314,0.946 0.34,1.292c0.023,0.34 0.326,0.9 0.455,1.266c-2.078,-0.754 -3.566,-2.746 -3.566,-5.081c0,-0.649 0.115,-1.272 0.326,-1.851c0.047,0.272 0.158,0.557 0.271,0.654c0.158,0.138 0.09,0.589 0.355,0.818c0.264,0.23 1.041,0.673 1.041,0.673s-0.031,-0.421 -0.156,-0.784c-0.125,-0.364 -0.002,-0.396 -0.109,-0.488c-0.105,-0.092 -0.26,0.168 -0.537,0.112s-0.279,-0.8 0.148,-1.054c0.43,-0.254 0.785,0.566 0.785,0.566s0.225,0.008 0.271,-0.393c0.037,-0.33 1.012,-1.521 1.619,-2.085c0.129,-0.12 0.508,-0.017 0.592,-0.065c0.059,-0.035 -0.164,-0.277 -0.133,-0.332c0.168,-0.3 -0.045,-0.839 -0.15,-1.066c0.35,-0.071 0.709,-0.108 1.078,-0.108c0.258,0 0.512,0.019 0.76,0.055c0.008,0.192 0.061,0.388 0.307,0.46c0.406,0.121 0.342,0.275 0.709,0.174c0.363,-0.1 0.588,-0.09 0.486,0.215c-0.104,0.305 -0.465,0.828 -0.648,1.039s-0.488,0.457 -0.109,0.553c0.379,0.098 0.395,-0.053 0.734,-0.15c0.34,-0.099 0.223,-0.363 0.379,-0.275c0.152,0.088 0,0.372 0.428,0.441c0.426,0.07 0.486,0.214 0.705,0.15c0.219,-0.066 0.451,-0.281 0.555,-0.213c0.105,0.066 0.555,0.457 -0.006,0.596c-0.562,0.139 -0.479,0.256 -0.98,0.192c-0.5,-0.063 -0.824,-0.438 -1.164,-0.315c0,0 -0.141,0.109 -0.342,0.074s-0.264,0.143 -0.35,0.323c-0.086,0.179 -0.451,0.28 -0.43,0.576c0.02,0.296 0.057,1.187 0.322,1.417c0.264,0.229 0.738,0.247 0.932,0.183s0.945,0.032 1.021,0.052c0.074,0.02 0.461,0.911 0.525,1.131c0.066,0.218 0.408,0.491 0.301,0.747c-0.105,0.256 -0.178,0.634 -0.051,0.675s0.539,-0.436 0.666,-0.768c0.125,-0.332 0.168,-1.129 0.393,-1.467c0.068,-0.104 0.162,-0.238 0.258,-0.385c-0.042,2.944 -2.449,5.326 -5.402,5.326z";

                var img_path, offset;

                if (image == 'plane') {
                    img_path = plane_path;
                    offset = 26
                }
                if (image == 'world') {
                    img_path = world_path;
                    offset = 28;
                }

                if (image == 'growth') {
                    img_path = growth_path;
                    offset = 28;
                }

                var g_image = g.append("g").attr('class', 'nv-pie-image');

                g_image.append("path")
                    .attr("fill-rule", "evenodd")
                    .attr("clip-rule", "evenodd")
                    .attr("fill", "#868686")
                    .attr("d", img_path);

                g.select(".nv-pie-image").attr("transform", function (d) {

                    var scale = Math.min(availableWidth, availableHeight) / 40;

                    var scaledCenterX = (availableWidth / scale) / 2;
                    var scaledCenterY = (availableHeight / scale) / 2;

                    var x = -(offset - scaledCenterX);
                    var y = -(22 - scaledCenterY);

                    return "scale(" + scale + ") translate(" + x + "," + y + ")";

                });
            }

            // if title is specified and donut, put it in the middle

            wrap.select('.nv-pie-text').remove();
            var gText = g.append("g").attr("class", "nv-pie-text");

            gText.append("text").attr('class', 'nv-pie-title');
            gText.classed('nv-cursor-pointer',showClickable);
            gText.on('click', function (d) {
                dispatch.elementClick({
                    data: d[0]
                });
            });

            var valueText = function (d) {

                switch (valueType) {
                    case 'absolute':
                        return valueFormat(value);
                    case 'percent':
                        var percent = max ? d[0].value / max : 1;
                        value = d3.format('%')(percent);
                        return value;
                    case 'variance':
                        var variance = (((d[0].value - max) / max) * 100);
                        if (variance > 0) {
                            return '+' + d3.format('.1f')(variance) + '%';
                        } else {
                            return d3.format('.1f')(variance) + '%';
                        }
                }

                return valueFormat(value);
            };

            var valueFontSize;

            wrap.select('.nv-pie-title')
                .style("text-anchor", "middle")
                .text(valueText)
                .style("font-size", function (d) {
                    var text = valueText(d);
                    var fontSize = (Math.min(availableWidth, availableHeight)) * donutRatio * 1.3 / (text.toString().length + 2);
                    valueFontSize = fontSize;
                    return fontSize + "px"
                })
                .attr("dy", "0.35em"); // trick to vertically center text


            gText.append("text").attr('class', 'nv-pie-label');

            var labelFontSize = (Math.min(availableWidth, availableHeight)) * donutRatio * 1.1 / (label.length + 2);

            wrap.select('.nv-pie-label')
                .style("text-anchor", "middle")
                .text(label)
                .style("font-size", labelFontSize + "px")
                .attr("dy", "0.35em") // trick to vertically center text
                .attr('transform', function (d, i) {
                    return "translate(0, " + valueFontSize / 1.2 + ")";
                });

            if (image != 'none') {
                gText.attr('transform', 'translate(' + availableWidth / 2 + ',' + (availableHeight / 1.6) + ')');
            } else {
                gText.attr('transform', 'translate(' + availableWidth / 2 + ',' + (availableHeight / 2) + ')');
            }

            var slices = wrap.select('.nv-pie').selectAll('.nv-slice').data(pie);
            var pieLabels = wrap.select('.nv-pieLabels').selectAll('.nv-label').data(pie);

            slices.exit().remove();
            pieLabels.exit().remove();

            var ae = slices.enter().append('g');
            ae.attr('class', 'nv-slice');
            ae.on('mouseover', function (d, i) {

                if (d.data.label == "Max") {
                    return;
                }

                d3.select(this).classed('hover', true);
                if (growOnHover) {
                    d3.select(this).select("path").transition()
                        .duration(70)
                        .attr("d", arcsOver[i]);
                }
                dispatch.elementMouseover({
                    data: d.data,
                    index: i,
                    color: d3.select(this).style("fill")
                });
            });
            ae.on('mouseout', function (d, i) {
                d3.select(this).classed('hover', false);
                if (growOnHover) {
                    d3.select(this).select("path").transition()
                        .duration(50)
                        .attr("d", arcs[i]);
                }
                dispatch.elementMouseout({data: d.data, index: i});
            });
            ae.on('mousemove', function (d, i) {
                dispatch.elementMousemove({data: d.data, index: i});
            });
            ae.on('dblclick', function (d, i) {
                dispatch.elementDblClick({
                    data: d.data,
                    index: i,
                    color: d3.select(this).style("fill")
                });
            });

            slices.attr('fill', function (d, i) {
                if (d.data.label == "Max") {
                    return "#D8D8D8";
                }
                return color(d.data, i);
            });
            slices.attr('stroke', function (d, i) {
                return color(d.data, i);
            });

            var paths = ae.append('path')
            //Viur - For PNG Export purposes
                .style("stroke", "#fff")
                .style("stroke-width", "1px")
                .style("stroke-opacity", "1")
                .each(function (d) {
                    this._current = d;
                });

            slices.select('path')
                .transition()
                .attr('d', function (d, i) {
                    return arcs[i](d);
                })
                .attrTween('d', arcTween);

            if (showTicks) {

                pieLabels.enter().append("g").classed("nv-label", true).each(function (d, index) {
                    var group = d3.select(this);
                    group.attr('transform', function (d, i) {
                        d.outerRadius = radius + 10 ; // Set Outer Coordinate
                        d.innerRadius = radius + 15; // Set Inner Coordinate
                        var dist= arcsRadiusInner[i] - 10;
                        var winkel=d.startAngle;
                        if(index!==0){
                            winkel=d.endAngle;
                        }
                        var x=dist*Math.sin(winkel);
                        var y=-dist*Math.cos(winkel);
                        return "translate(" + x + "," + y + ")";
                    });

                    group.append('rect')
                        .style('stroke', '#fff')
                        .style('fill', '#fff')
                        .attr("rx", 3)
                        .attr("ry", 3);

                    group.append('text')
                        .style('text-anchor', 'middle');
                });

                pieLabels.select(".nv-label text")
                    .style('text-anchor', 'middle')
                    .text(function (d, i) {
                        if(i===0){
                            switch (valueType) {
                                case 'absolute':
                                    return '0';
                                case 'percent':
                                    return d3.format('%')(0);
                            }
                        }else{
                            switch (valueType) {
                                case 'absolute':
                                    return valueFormat(max);
                                case 'percent':
                                    return d3.format('%')(1);
                            }
                        }
                    });
            }else{
                pieLabels.remove();
            }


            // Computes the angle of an arc, converting from radians to degrees.
            function angle(d) {
                var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
                return a > 90 ? a - 180 : a;
            }

            function arcTween(a, idx) {
                a.endAngle = isNaN(a.endAngle) ? 0 : a.endAngle;
                a.startAngle = isNaN(a.startAngle) ? 0 : a.startAngle;
                if (!donut) a.innerRadius = 0;
                var i = d3.interpolate(this._current, a);
                this._current = i(0);
                return function (t) {
                    return arcs[idx](i(t));
                };
            }
        });

        renderWatch.renderEnd('gauge immediate');
        return chart;
    }

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.dispatch = dispatch;
    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        arcsRadius: {
            get: function () {
                return arcsRadius;
            }, set: function (_) {
                arcsRadius = _;
            }
        },
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        showLabels: {
            get: function () {
                return showLabels;
            }, set: function (_) {
                showLabels = _;
            }
        },
        showTicks: {
            get: function () {
                return showTicks;
            }, set: function (_) {
                showTicks = _;
            }
        },
        value: {
            get: function () {
                return value;
            }, set: function (_) {
                value = _;
            }
        },
        label: {
            get: function () {
                return label;
            }, set: function (_) {
                label = _;
            }
        },
        titleOffset: {
            get: function () {
                return titleOffset;
            }, set: function (_) {
                titleOffset = _;
            }
        },
        labelThreshold: {
            get: function () {
                return labelThreshold;
            }, set: function (_) {
                labelThreshold = _;
            }
        },
        valueFormat: {
            get: function () {
                return valueFormat;
            }, set: function (_) {
                valueFormat = _;
            }
        },
        x: {
            get: function () {
                return getX;
            }, set: function (_) {
                getX = _;
            }
        },
        id: {
            get: function () {
                return id;
            }, set: function (_) {
                id = _;
            }
        },
        endAngle: {
            get: function () {
                return endAngle;
            }, set: function (_) {
                endAngle = _;
            }
        },
        startAngle: {
            get: function () {
                return startAngle;
            }, set: function (_) {
                startAngle = _;
            }
        },
        padAngle: {
            get: function () {
                return padAngle;
            }, set: function (_) {
                padAngle = _;
            }
        },
        cornerRadius: {
            get: function () {
                return cornerRadius;
            }, set: function (_) {
                cornerRadius = _;
            }
        },
        donutRatio: {
            get: function () {
                return donutRatio;
            }, set: function (_) {
                donutRatio = _;
            }
        },
        labelsOutside: {
            get: function () {
                return labelsOutside;
            }, set: function (_) {
                labelsOutside = _;
            }
        },
        labelSunbeamLayout: {
            get: function () {
                return labelSunbeamLayout;
            }, set: function (_) {
                labelSunbeamLayout = _;
            }
        },
        donut: {
            get: function () {
                return donut;
            }, set: function (_) {
                donut = _;
            }
        },
        growOnHover: {
            get: function () {
                return growOnHover;
            }, set: function (_) {
                growOnHover = _;
            }
        },

        // depreciated after 1.7.1
        pieLabelsOutside: {
            get: function () {
                return labelsOutside;
            }, set: function (_) {
                labelsOutside = _;
                nv.deprecated('pieLabelsOutside', 'use labelsOutside instead');
            }
        },
        // depreciated after 1.7.1
        donutLabelsOutside: {
            get: function () {
                return labelsOutside;
            }, set: function (_) {
                labelsOutside = _;
                nv.deprecated('donutLabelsOutside', 'use labelsOutside instead');
            }
        },
        // deprecated after 1.7.1 Why ?
        labelFormat: {
            get: function () {
                return labelFormat;
            }, set: function (_) {
                labelFormat = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = typeof _.top != 'undefined' ? _.top : margin.top;
                margin.right = typeof _.right != 'undefined' ? _.right : margin.right;
                margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
                margin.left = typeof _.left != 'undefined' ? _.left : margin.left;
            }
        },
        y: {
            get: function () {
                return getY;
            }, set: function (_) {
                getY = d3.functor(_);
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
            }
        },
        labelType: {
            get: function () {
                return labelType;
            }, set: function (_) {
                labelType = _ || 'key';
            }
        },
        valueType: {
            get: function () {
                return valueType;
            }, set: function (_) {
                valueType = _ || 'absolute';
            }
        },
        pieStartAngle: {
            get: function () {
                return pieStartAngle;
            }, set: function (_) {
                pieStartAngle = _;
            }
        },
        pieEndAngle: {
            get: function () {
                return pieEndAngle;
            }, set: function (_) {
                pieEndAngle = _;
            }
        },
        image: {
            get: function () {
                return image;
            }, set: function (_) {
                image = _;
            }
        },
        maxValue: {
            get: function () {
                return maxValue;
            }, set: function (_) {
                maxValue = _;
            }
        },
        showClickable:  {get: function(){return showClickable;}, set: function(_){showClickable=_;}}
    });

    nv.utils.initOptions(chart);
    return chart;
};

nv.models.radarChart = function () {

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var radars = nv.models.radar()
        , legend = nv.models.legend()
        , tooltip = nv.models.tooltip();

    var margin = {top: 10, right: 20, bottom: 10, left: 20}
        , color = nv.utils.defaultColor()
        , width = null
        , height = null
        , showLegend = true
        , legendPosition = "right"
        , legs = []
        , ticks = 3 //Temp to test radar size issue
        , scales = d3.scale.linear()
        , edit = false
        , radius
        , startAngle = 180
        , cursor = 0
        , id = radars.scatter.id()
        , tooltips = true
        , noData = null
        , valueFormat = d3.format(',.2f')
        , transitionDuration = 250
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'prevClick', 'stateChange')
        ;

    tooltip.valueFormatter(function (d, i) {
        return valueFormat(d);
    }).headerFormatter(function (d, i) {
        return d;
    });

    //============================================================


    //============================================================
    // Private Variables
    //------------------------------------------------------------

    //============================================================


    function chart(selection) {
        selection.each(function (data) {
            legs = data[0].values;//TODO: Think in a better way to put only the legs of the radar
            var container = d3.select(this);

            nv.utils.initSVG(container);

            container.classed('nv-chart-' + id, true);

            var availableWidth = nv.utils.availableWidth(width, container, margin),
                availableHeight = nv.utils.availableHeight(height, container, margin);

            chart.update = function () {
                container.transition().duration(transitionDuration).call(chart)
            };
            chart.container = this;

            if (!data || !data.length) {

                nv.utils.noData(chart, container);

                //FIX Clean previous chart
                container.selectAll('.nv-wrap').remove();

                return chart;
            } else {
                container.selectAll('.nv-noData').remove();
            }

            //------------------------------------------------------------
            // Setup Scales

            // scales = radars.scales();
            radius = (availableWidth - 300 >= availableHeight) ? (availableHeight) / 2 : (availableWidth - 300) / 2;
            scales.domain([0, ticks]).range([0, radius]);

            //------------------------------------------------------------

            //------------------------------------------------------------
            // Setup containers and skeleton of chart

            var wrap = container.selectAll('g.nv-wrap.nv-radarChart').data([data]);
            var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-radarChart').append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-radarsWrap');

            gEnter.append('g').attr('class', 'nv-legendWrap');

            //------------------------------------------------------------


            //------------------------------------------------------------
            // Legend

            if (showLegend) {

                legend.width(availableWidth);

                if (legendPosition === "left") {
                    legend.rightAlign(false);
                }

                wrap.select('.nv-legendWrap')
                    .datum(data)
                    .call(legend);

                if (margin.top != legend.height()) {
                    margin.top = legend.height();
                    availableHeight = nv.utils.availableHeight(height, container, margin);
                }

                wrap.select('.nv-legendWrap')
                    .attr('transform', 'translate(0,' + (-margin.top) + ')')

            }

            //------------------------------------------------------------

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            //------------------------------------------------------------
            // Main Chart Component(s)

            radars
                .size(legs.length)
                .max(ticks)
                .startAngle(startAngle)
                .cursor(cursor)
                .radius(radius)
                .color(data.map(function (d, i) {
                    return d.color || color(d, i);
                }).filter(function (d, i) {
                    return !data[i].disabled
                }))
            ;

            radars.width(availableWidth).height(availableHeight);

            var radarWrap = g.select('.nv-radarsWrap')
                .datum(data.filter(function (d) {
                    return !d.disabled
                }));

            d3.transition(radarWrap).call(radars);

            //------------------------------------------------------------


            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------

            radars.dispatch.on('elementClick', function (d, i) {
                /*chart.cursor(legs.length - d.pointIndex);
                 selection.transition().call(chart);*/
            });
            legend.dispatch.on('stateChange', function (newState) {
                //state = newState;
                //dispatch.stateChange(state);
                chart.update();
            });

            dispatch.on('tooltipShow', function (evt) {

                evt.point.x = evt.point.label;
                evt.point.y = evt.point.value;
                evt.point.color = evt.color;

                evt.pos = {top: d3.event.pageY, left: d3.event.pageX};

                tooltip.data(evt).position(evt.pos).hidden(false);
            });

            //============================================================

        });

        return chart;
    }

    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    radars.dispatch.on('elementMouseover.tooltip', function (evt) {
        dispatch.tooltipShow(evt);
    });

    radars.dispatch.on('elementMouseout.tooltip', function (evt) {
        dispatch.tooltipHide(evt);
    });

    dispatch.on('tooltipHide', function () {
        tooltip.hidden(true);
    });

    //============================================================


    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.dispatch = dispatch;
    chart.radars = radars;
    chart.tooltip = tooltip;
    chart.legend = legend;
    chart.xAxis = radars;


    chart.margin = function (_) {
        if (!arguments.length) return margin;
        margin.top = typeof _.top != 'undefined' ? _.top : margin.top;
        margin.right = typeof _.right != 'undefined' ? _.right : margin.right;
        margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
        margin.left = typeof _.left != 'undefined' ? _.left : margin.left;
        return chart;
    };

    chart.width = function (_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };

    chart.height = function (_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    };

    chart.legs = function (_) {
        if (!arguments.length) return legs;
        legs = _;
        return chart;
    };

    chart.showLegend = function (_) {
        if (!arguments.length) return showLegend;
        showLegend = _;
        return chart;
    };

    chart.legendPosition = function (_) {
        if (!arguments.length) return legendPosition;
        legendPosition = _;
        return chart;
    };

    chart.cursor = function (_) {
        if (!arguments.length) return cursor;
        cursor = _;
        return chart;
    };

    chart.next = function (_) {
        cursor = cursor - 1;
        if (Math.abs(cursor) > legs.length - 1) cursor = 0;
        return chart;
    };

    chart.prev = function (_) {
        cursor = cursor + 1;
        if (cursor > legs.length - 1) cursor = 0;
        return chart;
    };

    chart.edit = function (_) {
        if (!arguments.length) return edit;
        edit = _;
        return chart;
    };

    chart.noData = function (_) {
        if (!arguments.length) return noData;
        noData = _;
        return chart;
    };

    chart.color = function (_) {
        if (!arguments.length) return color;
        color = nv.utils.getColor(_);
        legend.color(_);
        return chart;
    };

    chart.valueFormat = function (_) {
        if (!arguments.length) return valueFormat;
        valueFormat = _;
        return chart;
    };

    //============================================================


    return chart;
};

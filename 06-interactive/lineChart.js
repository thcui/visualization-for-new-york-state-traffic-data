class LineChart {

    constructor(parentElement,_data) {
        this.parentElement= parentElement
        this.width= 700
        this.height= 500
        this.margin= {top: 50, right: 50, bottom: 50, left: 50}
        this.data = _data;
        this.initVis();
    }

    initVis() {
        let vis = this

        vis.title_height = 30
        vis.innerHeight = vis.height - vis.margin.bottom - vis.margin.top - vis.title_height
        vis.innerWidth = vis.width - vis.margin.right - vis.margin.left
        vis.margin_btw = 20
        vis.overview_chart_height = 50
        vis.overview_chart_width = vis.innerWidth
        vis.detail_chart_height = vis.innerHeight - vis.overview_chart_height
        vis.detail_chart_width = vis.innerWidth

        // Create SVG area, initialize scales and axes
        vis.svg = d3.select(vis.parentElement)
            .attr('width', vis.width)
            .attr('height', vis.height)

        // Create chart area for the detailed view and the overview.
        vis.chart = vis.svg.append('g')
            .attr('id', 'chart')
            .attr('width', vis.innerWidth)
            .attr('height', vis.innerHeight)
            .attr('transform', `translate(${vis.margin.left},${vis.margin.top + vis.title_height})`);

        //Creat the title for the line chart
        vis.svg.append("text")
            .attr("id", 'linechart_title')

        //Creat the label for the y-axis
        vis.svg.append("text")
            .attr("class", 'axis-name')
            .attr("id", 'y-axis-name')
            .attr("x", vis.margin.left + 50)
            .attr("y", vis.margin.top + vis.title_height - 10)
            .attr("text-anchor", "middle")
            .text("Line Chart");

        //Creat the label for the x-axis
        vis.svg.append("text")
            .attr("class", 'axis-name')
            .attr('transform', `translate(${vis.innerWidth+vis.margin.left},${vis.detail_chart_height +vis.margin.top})`)
            .text("Date");

        // Create scales for detailed view
        vis.xScale_detail = d3.scaleTime()
            .domain(selectedDomain)
            .range([0, vis.detail_chart_width]);

        vis.yScale_detail = d3.scaleLinear()
            .domain([0,300])
            .range([vis.detail_chart_height - vis.margin_btw,0])

        // Create scales for the overview
        vis.xScale_overview = d3.scaleTime()
            .domain([new Date('2018-01'), new Date('2020-12')])
            .range([0, vis.overview_chart_width]);

        vis.yScale_overview = d3.scaleLinear()
            .domain([0,300])
            .range([vis.overview_chart_height,0])

        vis.create_the_axis()
        vis.create_the_area()

        vis.brushG = vis.overview_area.append('g')
            .attr('class', 'brush x-brush');

        // Initialize the brush component
        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.innerWidth, vis.overview_chart_height]])
            .on('brush', function ({selection}) {
                if (selection) vis.brushed(selection);
            })
            .on('end', function ({selection}) {
                if (!selection)
                    vis.brushed(null);
            });



        vis.trackingArea.on('mouseenter', () => {
            vis.tooltip.style('display', 'block');
        })
            .on('mouseleave', () => {
                vis.tooltip.style('display', 'none');
            })
            .on('mousemove', function (event) {
                vis.update_tooltip(event)
            })
        //update the axis groups
        vis.xAxisG_detail
            .call(vis.xAxis_detail)
            .call(g => g.select('.domain').remove())

        vis.xAxisG_overview
            .call(vis.xAxis_overview)

        vis.yAxisG
            .call(vis.yAxis_detail)
            .call(g => g.select('.domain').remove())


        vis.renderLine(vis.detailedView_area, vis.data, vis.xScale_detail, vis.yScale_detail, false, true)
        vis.renderLine(vis.overview_area, vis.data, vis.xScale_overview, vis.yScale_overview, false, true)
        // Update the brush and define a default position
        const defaultBrushSelection = [vis.xScale_detail(selectedDomain[0]), vis.xScale_detail(selectedDomain[1])];
        vis.brushG
            .call(vis.brush)
            .call(vis.brush.move, defaultBrushSelection);

    }


    // React to brush events
    brushed(selection) {

        let vis = this;

        // Check if the brush is still active or if it has been removed
        if (selection) {
            let currentDomain = selection.map(vis.xScale_overview.invert, vis.xScale_overview)
            // Update x-scale of the focus view accordingly
            vis.xScale_detail.domain(currentDomain);
            if (JSON.stringify(selectedDomain) !== JSON.stringify(currentDomain)) {
                // Convert given pixel coordinates (range: [x0,x1]) into a time period (domain: [Date, Date])
                selectedDomain = currentDomain
                let from = vis.get_closest_date(selectedDomain[0], Object.values(vis.data))[0].date
                let end = vis.get_closest_date(selectedDomain[1], Object.values(vis.data))[0].date
                // filterDateRange(formatTime(from), formatTime(end))
            }
        } else {
            // Reset x-scale of the focus view (full time period)
            selectedDomain = vis.xScale_overview.domain()
            vis.xScale_detail.domain(vis.xScale_overview.domain());
            // filterDateRange(formatTime(vis.xScale_overview.domain()[0]), formatTime(vis.xScale_overview.domain()[1]))
        }

        vis.update_Title_and_AxisName()


        let if_animation = true
        //if the selected data is unchanged, we do not want to add animation to the line chart(such as: brush will
        //not need the animation).
        if (JSON.stringify(vis.last_data) === JSON.stringify(vis.data)) {
            if_animation = false
        } else {
            //render the default line in detailed view, which requires the information from the overview.
            vis.renderLine(vis.overview_area, vis.data, vis.xScale_overview, vis.yScale_overview, false, true)
            vis.last_data = vis.data
        }

        // Redraw line
        vis.renderLine(vis.detailedView_area, vis.data, vis.xScale_detail, vis.yScale_detail, true, if_animation)
        // update x-axis labels in focus view
        vis.xAxisG_detail.call(vis.xAxis_detail);
    }

    get_closest_date(date, data) {

        let vis = this
        // Get date that corresponds to current mouse x-coordinate
        vis.bisectDate = d3.bisector(d => d.date).right;
        let temp = []
        for (let obs of data) {
            obs = Object.values(obs)
            if (obs.length !== 0) {
                const index = vis.bisectDate(obs, date, 1);
                const a = obs[index - 1];
                const b = obs[index];
                const d = b && (date - a.date > b.date - date) ? b : a;
                temp.push(d)
            }
        }
        return temp
    }

//The function that is responsible for drawing the line on the line chart,given the target area,data to show,
// scales and if need to label the name
    renderLine(area, data, x_scale, y_scale, if_text, if_animation) {
        let vis = this

        //the function for the animation for the line chart, function needs to be created before use
        vis.transition = function transition(path) {
            let duration = 2000
            if (!if_animation) {
                duration = 0
            }
            path.transition()
                .duration(duration)
                .attrTween("stroke-dasharray", function () {
                    const l = this.getTotalLength(),
                        i = d3.interpolateString("0," + l, l + "," + l);
                    return function (t) {
                        return i(t)
                    }
                })
                .on("end", () => {
                    d3.select(this).call(
                        vis.transition
                    );
                })
        }


        let line = area.selectAll('.line').data([data])

        let lineMerge = line.enter().append('path').attr('class','line').merge(line)

        let mylinegen = d3.line()
        mylinegen
            .x(d => x_scale(d.date))
            .y(d => y_scale(d.count));
        lineMerge
            .attr('stroke','darkblue')
            .attr("fill", "none")
            .attr("stroke-width", 2)
            .attr("d", mylinegen)
            .call(vis.transition);

        line.exit().remove()

    }


    //update the title and axis name based on the data to show
    update_Title_and_AxisName() {
        let vis = this
        vis.svg.select('#y-axis-name')
            .text('Count')
            .attr("x", vis.margin.left)
        vis.svg.select('#linechart_title')
            .attr("x", vis.margin.left + 300)
            .attr("y", vis.title_height)
            .attr("text-anchor", "middle")
            .attr('font-size', '15px')
            .attr('font-weight', 'bold')
            .text("Average Vehicle Count"+ " From " + selectedDomain[0].toDateString() + " to " + selectedDomain[1].toDateString())
    }


    //create the area need for all the components on the line chart
    create_the_area() {
        let vis = this
        // Initialize clipping mask that covers the detailed view
        vis.chart.append('defs')
            .append('clipPath')
            .attr('id', 'lineChart-mask')
            .append('rect')
            .attr('width', vis.detail_chart_width)
            .attr('y', -vis.margin.top)
            .attr('height', vis.detail_chart_height + vis.margin.top);


        // Apply clipping mask to 'vis.drawing_area' to clip semicircles at the very beginning and end of a year
        vis.detailedView_area = vis.chart.append('g')
            .attr('id', 'drawing_area')
            .attr('width', vis.detail_chart_width)
            .attr('height', vis.detail_chart_height)
            .attr('clip-path', 'url(#lineChart-mask)');

        //Append the place for the overview
        vis.overview_area = vis.chart.append('g')
            .attr('id', 'overview_area')
            .attr('width', vis.overview_chart_width)
            .attr('height', vis.overview_chart_height)
            .attr('transform', `translate(0,${vis.detail_chart_height})`);

        // Initialize the tooltip
        vis.tooltip = vis.chart.append('g')
            .attr('class', 'tooltip')
            .style('display', 'none');

        // Initialize the area that will track the user's mouse event
        vis.trackingArea = vis.chart.append('rect')
            .attr('width', vis.innerWidth)
            .attr('height', vis.detail_chart_height - vis.margin_btw)
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
    }


    //draw the axes for both the detailed view and the overview.
    create_the_axis() {
        let vis = this
        //create the x-axis for the detailed view
        vis.xAxis_detail = d3.axisBottom(vis.xScale_detail)
            .tickSize(-vis.innerHeight)
        //create the y-axis for the detailed view
        vis.yAxis_detail = d3.axisLeft(vis.yScale_detail)
            .tickSize(-vis.innerWidth)
        //create the x axis for the overview
        vis.xAxis_overview = d3.axisBottom(vis.xScale_overview)
            .tickSize(1)

        // Add the left y-axis group
        vis.xAxisG_detail = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.detail_chart_height - vis.margin_btw})`);
        vis.xAxisG_overview = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.innerHeight})`);

        // Add the left y-axis group
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');
    }


    //update the tooltip when the mouse is entered the tracking area, or moving on the tracking area
    update_tooltip(event) {

        let vis = this
        // Find nearest data point
        let closestDate = vis.get_closest_date(vis.xScale_detail.invert(d3.pointer(event, this.svg.node())[0] - vis.margin.left),
            [Object.values(vis.data)])

        let tooltip_circle = vis.tooltip.selectAll('.tooltip_point').data(closestDate)
        let tooltip_circleEnter = tooltip_circle.enter().append('g').attr('class', 'tooltip_point')
        tooltip_circleEnter.append('circle')
        tooltip_circleEnter.append('text')
        let tooltip_circleMerge = tooltip_circleEnter.merge(tooltip_circle)
        tooltip_circleMerge.select('circle')
            .attr('r', 4)
            .attr('fill', 'red')
            .attr('transform', d => `translate(${(vis.xScale_detail(d.date))},${(vis.yScale_detail(d.count))})`)
        tooltip_circleMerge.select('text')
            .attr('font-size', '12')
            .attr('fill', 'black')
            .attr('transform', d => `translate(${vis.xScale_detail(d.date)},${(vis.yScale_detail(d.count))})`)
            .text(d => d.count.toFixed(2))
            .attr('stroke','white')
            .attr('font-weight', 'bold')
            .attr('stroke-width','0.3')

        tooltip_circle.exit().remove()
    }

}



class NYSMap {

    constructor(parentElement, data) {
        let vis = this

        vis.county_list = ['Albany',
            'Essex',
            'Greene',
            'Rensselaer',
            'Saratoga',
            'Schenectady',
            'Warren',
            'Washington',
            'Fulton',
            'Hamilton',
            'Herkimer',
            'Madison',
            'Montgomery',
            'Oneida',
            'Cayuga',
            'Cortland',
            'Onondaga',
            'Oswego',
            'Seneca',
            'Tompkins',
            'Genesee',
            'Livingston',
            'Monroe',
            'Ontario',
            'Orleans',
            'Wyoming',
            'Wayne',
            'Cattaraugus',
            'Chautauqua',
            'Erie',
            'Niagara',
            'Allegany',
            'Chemung',
            'Schuyler',
            'Steuben',
            'Yates',
            'Clinton',
            'Franklin',
            'Jefferson',
            'Lewis',
            'St. Lawrence',
            'Columbia',
            'Dutchess',
            'Orange',
            'Putnam',
            'Rockland',
            'Ulster',
            'Westchester',
            'Broome',
            'Chenango',
            'Delaware',
            'Otsego',
            'Schoharie',
            'Sullivan',
            'Tioga',
            'Nassau',
            'Suffolk',
            'Bronx',
            'Kings',
            'New York',
            'Queens',
            'Richmond']


        this.data = data
        this.parentElement = parentElement
        this.width = 550
        this.height = 500
        this.margin = {top: 50, right: 50, bottom: 50, left: 50}
        this.title_height=30

        // Create SVG area, initialize scales and axes
        vis.svg = d3.select(vis.parentElement)
            .attr('width', vis.width)
            .attr('height', vis.height)
        //Creat the title for the map
        vis.svg.append("text")
            .attr("id", 'map_title')

        vis.drawing_area = vis.svg.append('g')
            .attr('id', 'drawing_area')

        vis.map = vis.drawing_area.append('svg')
            .attr('width', vis.innerWidth)
            .attr('height', vis.innerHeight)
            .attr('transform', `translate(${vis.margin.left},${vis.margin.top+vis.title_height})`);

        vis.tooltipDiv = d3.select('#map_tooltip')
            .attr("class", "tooltip")
            .style('display', 'none');


        vis.color_scheme=["#ffffd4",
            "#fed98e",
            "#fe9929",
            "#d95f0e",
            "#993404"]
        vis.color_scale= d3.scaleThreshold().domain([100,200,300,400,500])
            .range(this.color_scheme)
        vis.add_legend()
        // vis.filterDateRange(selectedDomain[0],selectedDomain[1])
    }


    filterDateRange(startDate, endDate) {
        let updated_data = []

        for (let k of Object.keys(data)){
            if ((data[k].date<=endDate) && (data[k].date>=startDate)){
                updated_data.push(data[k])
            }

            if(map !== undefined) {
                map.updateVis(updated_data)
            }

        }
    }

    updateVis(data) {
        let vis = this

        vis.data = data

        vis.county_data = vis.prepare_map_data(data)



        vis.svg.select('#map_title')
            .attr("x", vis.margin.left)
            .attr("y", vis.title_height)
            .attr("text-anchor", "start")
            .attr('font-size', '15px')
            .attr('font-weight', 'bold')
            .text("Average Count for Each County Within the Selected Period")



        d3.json("NYS.json").then(geodata => {
            let projection = d3.geoConicEqualArea()
                .fitSize([500-vis.title_height, 500], geodata);
            let generator = d3.geoPath().projection(projection);
            let map=vis.map
                .selectAll("path")
                .data(geodata['features'])
                .join("path")
                .attr("d", generator)
                .attr('stroke', 'black')
                .attr('stroke-width',1)
                .on("mouseover", function (event, d) {
                    d3.select(this).attr('stroke-width',5)
                    d3.select('#map_tooltip')
                        .style('display', 'block')
                        .style("top", event.pageY + 20 + "px")
                        .style("left", event.pageX + 20 + "px")
                        .html(`<strong>${d.properties.name}</strong>
                                <div>${vis.county_data[d.properties.name].toFixed(2)+"<i> counts/street in one hour</i>"}</div>`);

                })
                .on("mouseout", function (d) {
                    d3.select(this).attr('stroke-width',1)
                    d3.select('#map_tooltip')
                        .style('display', 'none');
                })
            map.transition(3000)
                .attr('fill',d=>vis.color_scale(vis.county_data[d.properties.name]))
        });
    }

    prepare_map_data(data) {

        let vis = this

        let average_data = {}

        for (let c of vis.county_list) {
            let sum = 0
            let count = 0
            let avg = 0
            for (let k of Object.keys(data)) {
                let value = data[k][c]
                if (value !== 'NA') {
                    sum = sum + parseFloat(value)
                    count++
                }
            }
            avg = sum / count
            average_data[c] = avg
        }
        return average_data

    }


    //add the color legend to the map
    add_legend() {
        let vis = this

        vis.legend = d3.select(vis.parentElement).append('g')
            .attr('id','legends')
            .attr('width','100')
            .attr('height','100')
            .style("stroke-width", "8")

        vis.legend.append('text')
            .text('Counts/street in one hour')
            .attr('x',400)
            .attr('y',270)
            .attr('font-size', '12px')
            .attr('color','black')
            .attr('stroke','white')
            .attr('stroke-width',0.1)
            .attr('font-weight','bold')
        let label=["(0,100]", "(100,200]", "(200,300]", "(300,400]", "(400,500]"]
        for (let color of vis.color_scheme) {
            vis.legend.append('text')
                .text(label[vis.color_scheme.indexOf(color)])
                .attr('x',440)
                .attr('y',300+vis.color_scheme.indexOf(color)*30)
                .attr('font-size', '12px')
                .attr('color','black')
                .attr('stroke','white')
                .attr('stroke-width',0.1)
            vis.legend.append("line")
                .attr("y1", 300+vis.color_scheme.indexOf(color)*30)
                .attr("y2", 300+vis.color_scheme.indexOf(color)*30)
                .attr("x1", 400)
                .attr("x2", 430)
                .attr('stroke', color)

        }

    }
}
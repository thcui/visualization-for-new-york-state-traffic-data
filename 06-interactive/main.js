


let data=[]
let selectedDomain = [new Date('2018-01'), new Date('2018-12')];
const parseTime = d3.timeParse("%Y-%m");

d3.csv('../data/data_for_interactivity.csv').then(_d=>{
    data= _d

    data.forEach(row => {
        Object.keys(row).forEach(attr => {
            if (attr === 'date') {
                row[attr] = parseTime(row[attr]);
            }

            if (attr === 'count') {
                row[attr] = +row[attr];
            }
        })
    });
    delete data.columns
    let lineChart = new LineChart('#lineChart', data)
})



let data=[]
let selectedDomain = [new Date('2020-01'), new Date('2020-12')];
const parseTime = d3.timeParse("%Y-%m");
let map
let lineChart

d3.csv('./data/data_for_interactivity.csv').then(_d=>{
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
    map = new NYSMap('#map',data)
    lineChart=new LineChart('#lineChart', data)

})




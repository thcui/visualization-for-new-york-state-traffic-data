


let data=[]
let selectedDomain = [new Date('2018-01-01'), new Date('2018-12-31')];
const parseTime = d3.timeParse("%Y-%m-%d");

d3.csv('../data/data_for_interactivity.csv').then(_d=>{
    data= _d
    data[Date]=parseTime(data[Date]);
    let lineChart = new LineChart('#lineChart', data)
})
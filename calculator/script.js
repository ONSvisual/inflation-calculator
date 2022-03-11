var pymChild = null;
var counter = 0;
var allCategories = inflation_data.map(function(d){return d.cat_id}).filter(function(d,i,a){return a.indexOf(d)==i})
prevSpend=0

function drawGraphic() {

  loadData();
  initialise();
  enablePageButtons();
  updateRunningTotal();

  function initialise() {
    var someContainer = d3.select(".section-container");
    if (parseInt(someContainer.style("width")) < dvc.optional.mobileBreakpoint) {
      size = "sm";
    } else if (parseInt(someContainer.style("width")) < dvc.optional.mediumBreakpoint) {
      size = "md";
    } else {
      size = "lg";
    }
    margin = dvc.optional.margin[size];



  } //end initialise


  function enablePageButtons() {

    // front page next button
    d3.select('button#intro-next-button').on('click', function() {
      hide(d3.select('#inputs' + counter))
      if (counter == 0) {
        disableSkipToEnd();
      } //if on front page and next is clicked remove skip to end button and replace with back button

      if (counter < 5) {
        counter++;
      } else if (counter == 5) {
        calculate(final_data);
        showResults();
      }
      // if we're at the end show the results

      show(d3.select('#inputs' + counter))
      // show next page
      pymChild.sendHeight();
    });

    // skip to the end
    d3.select("#skipToEndButton").on('click', function() {
      prefill();
      calculate(final_data);
      showResults();
    });

    // back button front page
    d3.select("button#backButton-frontpage").on('click', function() {
      hide(d3.select('#inputs' + counter))
      if (counter == 1) {
        enableSkipToEnd();
        counter--;
      }
      if (counter > 1) {
        counter--;
      }
      show(d3.select('#inputs' + counter));
      pymChild.sendHeight();
    });

    // back button for results page
    d3.select("button#backButton-results").on('click', function() {
      hideResults();
    })

    // back to start for results page
    d3.select("button#backToStartButton").on('click', function() {
      enableSkipToEnd()
      hideResults()
      hide(d3.select('#inputs' + counter));
      counter = 0;
      show(d3.select('#inputs' + counter))
    })
  }

  function showResults() {
    hide(d3.selectAll(".frontpage"));
    show(d3.select("#results"));
    pymChild.sendHeight();
  }

  function hideResults() {
    show(d3.selectAll(".frontpage"));
    hide(d3.select("#results"));
  }

  function updateRunningTotal() {
    d3.selectAll('input.money-input').on('change',function(){
      calculateSpending();
    });
  }

  function disableSkipToEnd() {
    hide(d3.select("#skipToEndButton"));
    show(d3.select("#backButton-frontpage"));
  }

  function enableSkipToEnd() {
    show(d3.select("#skipToEndButton"));
    hide(d3.select("#backButton-frontpage"));
  }

  // adapted from https://stackoverflow.com/questions/21070101/show-hide-div-using-javascript
  function hide(elements) {
    elements = elements._groups[0].length ? elements._groups[0] : [elements._groups[0]];
    for (var index = 0; index < elements.length; index++) {
      elements[index].style.display = 'none';
    }
  }

  function show(elements, specifiedDisplay) {
    var computedDisplay, element, index;

    elements = elements._groups[0].length ? elements._groups[0] : [elements._groups[0]];
    for (index = 0; index < elements.length; index++) {
      element = elements[index];

      // Remove the element's inline display styling
      element.style.display = '';
      computedDisplay = window.getComputedStyle(element, null).getPropertyValue('display');

      if (computedDisplay === 'none') {
        element.style.display = specifiedDisplay || 'block';
      }
    }
  }

  function calculateSpending() {
    totalspending = allCategories.reduce(function(prev, curr) {
      return prev + spendXfreq(curr)
    }, 0)

    d3.select("#currentSpend").transition().duration(1000).tween("text",function(d){
      node=this
      numberTransition=d3.interpolateNumber(prevSpend,totalspending)
      return function(t){
        d3.select(node).html("£"+d3.format(",.0f")(numberTransition(t)))
        if(t==1){prevSpend=totalspending}
      }
    })
  }

  function spendXfreq(item) {
    return d3.select("input#" + item).property('value') * d3.select("select#" + item + "-time-period").property('value')/12
  }


  function prefill(){
    inflation_data.forEach(function(category){
      d3.select("#"+category.cat_id).property("value",category.average)
    })
  }

  function calculate(data){

      console.log("Calculating...")
      var total = 0
      var total_change = 0
      pir = 0
      category_data = {}
      Object.keys(data).forEach(function(category){
        category_data[category] = {}
        for (i = 0; i < data[category].length; i++){
          var input = (d3.select("#"+category).property("value")*d3.select("#"+category+"-time-period").property("value"))/12
          var inflation_rate = data[category][i].index
          var change = input-(input/(1+(inflation_rate/100)))
          category_data[category][i] = {
            date: data[category][i].key,
            input: input,
            inflation_rate: inflation_rate,
            change: change,
            weight: 0,
            weighted_index: 0
          }
        }
      })

      overall_inflation = []
      for (i = 0; i < data["foodhotdrinks"].length; i++){
        var total = 0
        var total_change = 0
        var pir = 0
        Object.keys(category_data).forEach(function(category){
          total = total+category_data[category][i].input
          total_change = total_change+category_data[category][i].change
        })
        Object.keys(category_data).forEach(function(category){
          category_data[category][i].weight = category_data[category][i].input/total
          category_data[category][i].weighted_index = category_data[category][i].inflation_rate*category_data[category][i].weight
          pir = pir + category_data[category][i].weighted_index
          overall_inflation[i] = {series: "overall_inflation", date: category_data[category][i].date, total: total, total_change: total_change, pir: pir}
        })
      }
      // console.log(overall_inflation)
      // console.log(category_data)
      // drawBarChart();
    // })

    d3.select("#personalInflation").text(d3.format(".1f")(overall_inflation[0].pir)+"%")
    d3.select("#inflationDifference").text(d3.format(".1f")(overall_inflation[0].pir-cpih[cpih.length-1].pir)+"%")
    d3.select("#overunder").text(function(){
      return overall_inflation[0].pir-cpih[cpih.length-1].pir > 0 ? "over" : "under"
    })
    d3.select("#currentInflationRate").text(d3.format(".1f")(cpih[cpih.length-1].pir)+"%")

    d3.select("#increaseMonthlySpend").text("£"+d3.format(".2f")(overall_inflation[0].total_change))
    d3.selectAll(".dateOneYearPrior").text(d3.timeFormat("%b %Y")(overall_inflation[12].date))
    d3.selectAll(".currentDate").text(d3.timeFormat("%b %Y")(overall_inflation[0].date))

    drawLineChart(overall_inflation, cpih)

    categoryByWeight = []

    console.log(category_data)
    console.log(inflation_data)

    Object.keys(category_data).forEach(function(category){
      var foo = category_data[category][0]
      foo.category = inflation_data.filter(function(d){return d.cat_id == category})[0].category
      foo.cat_id = category
      categoryByWeight.push(foo)
    })
    categoryByWeight.sort(function(a,b){
      return b.weight-a.weight;
    })

    d3.select("#biggestCat").text(categoryByWeight[0].category)
    d3.select("#propBiggestCat").text(d3.format(".0f")(categoryByWeight[0].weight*100)+"%")

    d3.select("#avgPropBiggestCat").text(inflation_data.filter(function(d){return d.cat_id == categoryByWeight[0].cat_id})[0].inf_values[0].weight/10)
    d3.select("#biggestCatInflation").text(d3.format(".1f")(categoryByWeight[0].inflation_rate)+"%")

    d3.select("#biggestCatDiffInflation").text(d3.format(".1f")(categoryByWeight[0].inflation_rate-cpih[cpih.length-1].pir)+"%")
    d3.select("#biggestCatOverUnder").text(function(){
      return categoryByWeight[0].inflation_rate-cpih[cpih.length-1].pir > 0 ? "above" : "below"
    })

    categoryByIncrease = []

    Object.keys(category_data).forEach(function(category){
      var foo = category_data[category][0]
      foo.category = inflation_data.filter(function(d){return d.cat_id == category})[0].category
      foo.cat_id = category
      categoryByIncrease.push(foo)
    })
    categoryByIncrease.sort(function(a,b){
      return b.change-a.change;
    })

    categoryByIncrease = categoryByIncrease.slice(0,5)
    console.log(categoryByIncrease)

    drawBarChart(categoryByIncrease.reverse())

  }//end calculate function

function drawBarChart(data){
  var graphic = d3.select('#barchart');
  graphic.selectAll("*").remove();
  var height = 300
  var chart_width = parseInt(d3.select(".section-container").style("width"));

  var x = d3.scaleLinear()
      .range([0, chart_width]);

  var y = d3.scaleBand()
      .range([height, 0])
      .paddingInner(0.1);

  x.domain([0,d3.max(data, function(d) { return d.change; })]);
  y.domain(data.map(function(d){return d.category}))

  var xAxis = d3.axisBottom(x).tickSize(-height)
  var yAxis = d3.axisLeft(y);

  var svg = d3.select('#barchart').append('svg')
        .style("background-color","#fff")
        .attr("width", chart_width + 20 + 20)
        .attr("height", height + 10 + 10 )  //+30)
        .append("g")

  svg.append("rect")
    .style("fill", "#fff")
    .attr("width", chart_width)
    .attr("height", height);

    svg.append('g')
      .attr('class', 'y axis')
      .attr("transform", "translate(" + 150 + "," + 0 + ")")
      .call(yAxis);

  svg.append('g')
        .attr('class', 'x axis')
        .attr("transform", "translate(" + 150 + "," + height + ")")
        .call(xAxis);

  svg.append('g')
  .attr("transform", "translate(" + 150 + "," + 0 + ")")
    .selectAll('rect').data(data)
    .enter()
    .append('rect')
    .attr('x',x(0))
    .attr('y',function(d){return y(d.category)})
    .attr('height',y.bandwidth())
    .attr('width',function(d){return x(d.change)})
    .attr('fill',"#206095")

}

function drawLineChart(overall_inflation,cpih){
var graphic = d3.select('#graphic');
graphic.selectAll("*").remove();
var height = 300-margin.top-margin.bottom
var width = parseInt(d3.select(".section-container").style("width"));
var chart_width=width-margin.left-margin.right

var x = d3.scaleTime()
    .range([0, chart_width]);

var y = d3.scaleLinear()
    .range([height, 0]);

x.domain(d3.extent(overall_inflation, function(d) { return d.date; }));

var xAxis = d3.axisBottom(x)
  .tickFormat(function(d,i) {
    var fmt = d3.timeFormat("%b %y");
    return fmt(d);
    })
// .tickPadding(5)

var yAxis = d3.axisLeft(y).tickSize(-chart_width);

var line = d3.line()
    .defined(function(d){return d.pir!=null;}) // Right you scallywags, I'm going to tell you what this line does. This means that the line will not be drawn between any points a data point is NaN, or whatever function you want
    .curve(d3.curveLinear)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.pir); });

var lines = d3.nest()
  .key(function(d){return d.series})
  .entries(overall_inflation)

var cpih_line = d3.nest()
  .key(function(d){return d.series})
  .entries(cpih)
console.log(cpih_line[0],lines[0])

maxy=d3.max([d3.max(cpih_line[0].values,function(d){return d.pir}),d3.max(lines[0].values,function(d){return d.pir})])

  var yDomain = [0,maxy]

  y.domain(yDomain).nice();

  var svg = d3.select('#graphic').append('svg')
        .attr("id","chart")
        .style("background-color","#fff")
        .attr("width", chart_width +margin.left+margin.right)
        .attr("height", height +margin.top+margin.bottom )
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // svg.append("rect")
  //   .style("fill", "#fff")
  //   .attr("width", chart_width)
  //   .attr("height", height);

    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis);

    //create x axis, if y axis doesn't start at 0 drop x axis accordingly
		svg.append('g')
	        .attr('class', 'x axis')
          .attr("transform","translate(0,"+height+")")
	        .call(xAxis);

  //create lines
    svg.append('g').attr('id',"pir").selectAll('path')
        .data(d3.entries(lines[0]))
        .enter()
        .append('path')
            //.attr('class', 'line')
      .style("stroke", "#206095")
      .style("fill", 'none')
      .style("stroke-width", 3.5)
      .style("stroke-linecap", 'round')
      .style("stroke-linejoin", 'round')
            .attr('d', function(d) {
              // console.log(d)
                return line(d.value);
            });

    //create lines
      svg.append('g').attr('id', 'cpih').selectAll('path')
          .data(d3.entries(cpih_line[0]))
          .enter()
          .append('path')
        .style("stroke", "#871A5B")
        .style("fill", 'none')
        .style("stroke-width", 3.5)
        .style("stroke-linecap", 'round')
        .style("stroke-linejoin", 'round')
              .attr('d', function(d) {
                // console.log(d)
                  return line(d.value);
              });
  }

  function structureData(inflation, weights, final_data){
    parseTime = d3.timeParse(dvc.time_format)
    formatTime = d3.timeFormat("%B %Y");

    for (var sc = 0; sc < inflation_data.length; sc++){
      subcategory = inflation_data[sc]
      inflation_subcategory = inflation[sc]
      weights_subcategory = d3.nest()
        .key(function(d){return d.year})
        .entries(weights[sc].years)

      //loop through number of specified months and extract necessary data from inflation and weights dataset
      for (var month = 1; month < dvc.time_series_totalmnths+1; month++){
        //get year from inflation data and filter weights data to specified year
        year = inflation_subcategory[dvc.time_period][inflation_subcategory[dvc.time_period].length-month].year
        year = "" + year
        selected_weight_data = weights_subcategory.filter(function (d){ return d.key == year})

        //get monts inflation data
        selected_inf_data = inflation_subcategory[dvc.time_period][inflation_subcategory[dvc.time_period].length-month]

        //combine date, inflation data and weights data for each month into one object
        subcategory.inf_values.push({date: selected_inf_data.month+" "+selected_inf_data.year,index: +selected_inf_data.value, weight: +selected_weight_data[0].values[0].value})
      }
    }


    //nest all data by category
    var nested_data = d3.nest()
      .key(function(d){return d.category})
      .entries(inflation_data)

    // console.log(nested_data)

    //combine all subcategories and dates into one big long format dataset
    nested_data.forEach(function(category){
      var subcategory_inflation = []
      for (var month = 0; month < dvc.time_series_totalmnths; month++){
        category.values.forEach(function(subcategory){
          subcategory_inflation.push(subcategory.inf_values[month])
        })
      }
      //create nested data of long dataset by date
      subcategory_nested = d3.nest()
        .key(function(d){return d.date})
        .entries(subcategory_inflation)

      //within each category, calculate the sum of subcateogry weights for each month
      subcategory_nested.forEach(function(date){
        totalweight = 0
        date.values.forEach(function(subcategory){
          totalweight = totalweight + subcategory.weight
        })
        //use this total category weight to calculate the subcategory weight within the overall category
        index = 0
        date.values.forEach(function(subcategory){
          subcategory.adjweight = subcategory.weight/totalweight
          subcategory.adjindex = subcategory.index*subcategory.adjweight
          //use adjusted subcategory weights to calculated an index for the whole category
          index = index + subcategory.adjindex
        })
        //add this category index to the dataset
        date.index = index
      })
      // console.log(category)
      //add this to a final dataset for use in the calculators
      array_data.push({name: category.key, cat_id: category.values[0].cat_id, values: subcategory_nested})
      // console.log(final_data)
    })

    //convert dates into time format
    array_data.forEach(function(category){
      category.values.forEach(function(d){
        d.key = parseTime(d.key)
      })
    })

    array_data.forEach(function(category){
      var itemkey = category.cat_id
      final_data[itemkey] = category.values
    })

    // structure CPIH headline data
    // cpih_selected = []
    // for (var month = 1; month < dvc.time_series_totalmnths+1; month++){
    //   cpih_selected.push(cpih[0].months[cpih[0].months.length-month])
    // }
    // var parseTime2 = d3.timeParse(dvc.cpih_time_format)
    // cpih_selected.forEach(function(d, i){
    //   d.date = parseTime2(d.date)
    //   cpih_final[i] = {series: "cpih", date: d.date, total: 0, total_change: 0, pir: +d.value}
    // })
    // console.log(cpih_final)

  }//end structureData


  //pass all data into ready function
  function ready(error, everything){

    //seperate out data into inflation and weights data
    inflation=[]
    weights=[]
    // cpih=[]

    everything.forEach((item, i) => {
      if(i%2){weights.push(item)}
      // else if(i == everything.length-1){cpih.push(item)}
      else{inflation.push(item)}
    });
    // console.log(everything)
    //
    // console.log("cpih:", cpih)
    //
    // console.log("inflation:",inflation)
    // console.log("weights:",weights)

    //pass these into structureData function to format for calculators
    array_data = []
    final_data = {}
    cpih_final = {}
    structureData(inflation, weights, final_data)
    // drawGraphic(final_data, cpih_final)
    // calculate(final_data)
    // console.log(cpih)
    // console.log(overall_inflation)
    // console.log(category_data)

  }//end ready

  function loadData(){

    // console.log(inflation_data)

    //load all json files from ONS time series
    q=d3.queue()

    inflation_data.forEach(function(item){
        q.defer(d3.json,"https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/"+item.inflation_cdid+"/data")
        q.defer(d3.json,"https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/"+item.weight_cdid+"/data")
    })

    // q.defer(d3.json,"https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/l55o/mm23/data")

    //once all files are loaded, execute ready function
    q.awaitAll(ready);
  }//end load data
} //ends drawGraphic



if (Modernizr.svg) {

d3.csv("cpih.csv", function(error,csv){
  cpih = csv;
  cpih.forEach(function(d){
    d.date = d3.timeParse(dvc.time_format)(d.date)
    d.pir = +d.pir
  })

  //use pym to create iframed chart dependent on specified variables
  pymChild = new pym.Child({
    renderCallback: drawGraphic
  })
})

} else {
  //use pym to create iframe containing fallback image (which is set as default)
  pymChild = new pym.Child();
  if (pymChild) {
    pymChild.sendHeight();
  }
}

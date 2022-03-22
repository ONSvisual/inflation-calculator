var pymChild = null;
var counter = 0;
var allCategories = inflation_data.map(function(d) {
  return d.cat_id;
}).filter(function(d, i, a) {
  return a.indexOf(d) == i;
});
prevSpend = 0;

function drawGraphic() {

  loadData();
  getSize();
  enablePageButtons();
  enableIncomePage();
  addTooltips();
  addScreenReaderLabels();

  function getSize() {
    var someContainer = d3.select(".section-container");
    if (parseInt(someContainer.style("width")) < dvc.mobileBreakpoint) {
      size = "sm";
    } else if (parseInt(someContainer.style("width")) < dvc.mediumBreakpoint) {
      size = "md";
    } else {
      size = "lg";
    }
    lineMargin = dvc.lineChartMargin[size];
    barMargins = dvc.barChartMargin[size];

    d3.selectAll('input.money-input').on('focus',function(){
      if(d3.select(this).property('value')==0){d3.select(this).property('value',"")}
    }).on('blur',function(){
      if(d3.select(this).property('value')==""){d3.select(this).property('value',0)}
    })

  } //end initialise


  function enablePageButtons() {

    // front page next button
    d3.select('button#intro-next-button').on('click', function() {
      hide(d3.select('#inputs' + counter))
      if (counter == 0) {
        disableSkipToEnd();
        if (d3.select('input[name="income"]:checked').node().value == "net-income") {
          var decile = getDecile(d3.select("#netincome").property("value") * (d3.select("#netincome-time-period").property("value") / 12));
        } else {
          decile = 0
        }
        addAverages(decile);
        updateRunningTotal(decile);
        show(d3.select("#monthlyexpenditure"))
      } //if on front page and next is clicked remove skip to end button and replace with back button

      if (counter < 6) {
        if(!checkIfInputsAreBlank()){hide(d3.select("#calculateError"))}
        counter++;
        show(d3.select('#inputs' + counter))
        // show next page
        pymChild.sendHeight();
      } else if (counter == 6) {
        inputtotal = 0;
        inflation_data.forEach(function(category) {
          value = +d3.select("#" + category.cat_id).property("value")
          inputtotal = inputtotal + value
        })
        if (!checkIfInputsAreBlank()) {
          d3.select("#calculateError").text("")
          hide(d3.select("#calculateError"))
          showResults();
          calculate(final_data, cpih_selected);
        } else {
          show(d3.select("#calculateError"))
          d3.select("#calculateError").text("You must enter some spending for this calculator to estimate your personal inflation rate")
          pymChild.sendHeight()
        }
      }
      // if we're at the end show the results

      show(d3.select('#inputs' + counter))
      // show next page
      pymChild.sendHeight();
    });

    // skip to the end
    d3.select("#skipToEndButton").on('click', function() {
      if (d3.select('input[name="income"]:checked').node().value == "net-income") {
        var decile = getDecile(d3.select("#netincome").property("value") * (d3.select("#netincome-time-period").property("value") / 12));
      } else {
        decile = 0
      }
      prefill(decile);
      showResults();
      calculateSpending();
      calculate(final_data, cpih_selected);
      pymChild.sendHeight();
    });

    // back button front page
    d3.select("button#backButton-frontpage").on('click', function() {
      if(!checkIfInputsAreBlank()){hide(d3.select("#calculateError"));pymChild.sendHeight();}

      hide(d3.select('#inputs' + counter))
      if (counter == 1) {
        enableSkipToEnd();
        d3.select("#monthlyexpenditure").style("display", "none")
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
      if(counter==0){hide(d3.select("#monthlyexpenditure"))}
      pymChild.sendHeight()
    })

    // back to start for results page
    d3.select("button#backToStartButton").on('click', function() {
      d3.selectAll('input.spending').property("value", 0)
      calculateSpending()
      enableSkipToEnd()
      hideResults()
      hide(d3.select('#inputs' + counter));
      counter = 0;
      show(d3.select('#inputs' + counter))
      hide(d3.select("#monthlyexpenditure"))
      pymChild.sendHeight()
    })
  }

  function enableIncomePage() {
    tippy('#netincome-question', {
      content: "This is the income of all the adults in your household (for example, earnings, benefits, pension), minus any taxes paid on that income (for example, income tax, national insurance).",
      theme: "ons",
      placement: "top"
    })
    d3.select("#net-income-radio").on('click', function() {
      show(d3.select('#net-income-input'))
      d3.select("#skipToEndButton").property("disabled", false).classed("disabled", false)
      pymChild.sendHeight();
    })
    d3.select("#average-radio").on('click', function() {
      hide(d3.select('#net-income-input'))
      d3.select("#skipToEndButton").property("disabled", true).classed("disabled", true)
      pymChild.sendHeight();
    })
  }

  function getDecile(income) {
    var decile = 0;
    // keep adding 1 to decile if income is still above current decile band. Also stop when we've exhausted deciles.
    while (decile < dvc.deciles.length && income > dvc.deciles[decile]["value"]) {
      decile++;
    }
    // decile is an index in the array, which starts at 0, but in practice deciles start from 1 so need to add 1 to adjust
    decile++;
    return decile;
  }

  function addAverages(decile) {
    inflation_data.forEach(function(category) {
      category_spend = deciles_data.filter(function(d) {
        return d.cat_id == category.cat_id
      })
      category_spend = Object.values(category_spend[0])
      if (decile == 0) {
        d3.select("#" + category.cat_id + "-avgcompare")
          .text("UK average: £" + (d3.format(".2f")(category_spend[decile + 1] / (d3.select("#" + category.cat_id + "-time-period").property("value") / 12))))
      } else {
        d3.select("#" + category.cat_id + "-avgcompare")
          .text("Similar households spend on average: £" + (d3.format(".2f")(category_spend[decile + 1] / (d3.select("#" + category.cat_id + "-time-period").property("value") / 12))))
      }
    })
  }

  function addTooltips() {
    inflation_data.forEach(function(category) {
      d3.select("#" + category.cat_id + "-question .question").text(category.category);
      if (category.description != "Add description here...") {
        tippy('#' + category.cat_id + '-question', {
          content: category.description,
          theme: "ons",
          placement: "top"
        });
      } else {
        d3.select("#" + category.cat_id + "-question .information").remove();
      }
    });

    tippy('#copyToClipboard', {
      placement: "top-start",
      content: "Link copied to clipboard",
      trigger: 'click',
      theme: "ons",
      duration: 1000
    });

  }

  function checkIfInputsAreBlank(){
    inputtotal = 0;
    inflation_data.forEach(function(category) {
      value = +d3.select("#" + category.cat_id).property("value")
      inputtotal = inputtotal + value
    })
    if(inputtotal==0){return true}else{return false};
  }

  function addScreenReaderLabels() {
    inflation_data.forEach(function(category) {
      d3.selectAll("#" + category.cat_id + "-label").text(category.category)
    })
  }

  function showResults() {
    hide(d3.selectAll(".frontpage"));
    hide(d3.select("#monthlyexpenditure"))
    hide(d3.select(".heading"))
    show(d3.select("#results"));
    pymChild.sendHeight();
  }

  function hideResults() {
    show(d3.selectAll(".frontpage"));
    show(d3.select(".heading"))
    hide(d3.select("#results"));
  }

  function updateSpendComparison(id,decile){
    var category_spend = Object.values(deciles_data.filter(function(d){
      return d.cat_id == id
    })[0])

    d3.select("input#"+id).property("value",function(){
      return d3.select("input#"+id).property("value").replace(/^0+/, '')
    })

    input = +d3.select("#" + id).property("value") * d3.select("#" + id + "-time-period").property("value") / 12

    diff = ((input - category_spend[decile + 1]) / category_spend[decile + 1]) * 100

    if (diff > 0) {
      moreless = "more than"
    } else if (diff < 0) {
      moreless = "less than"
      diff = diff * -1
    } else if (diff == 0) {
      moreless = "Equal to"
    }

    if (d3.select("#" + id).property("value") != 0 && diff == 0 && decile > 0) {
      d3.select("#" + id + "-avgcompare").text(moreless + " similar households")
    } else if (d3.select("#" + itemid).property("value") != 0 && diff == 0 && decile == 0) {
      d3.select("#" + id + "-avgcompare").text(moreless + " the average household")
    } else if (d3.select("#" + itemid).property("value") != 0 && decile > 0) {
      d3.select("#" + id + "-avgcompare").text(d3.format(".0f")(diff) + "% " + moreless + " similar households")
    } else if (d3.select("#" + itemid).property("value") != 0 && decile == 0) {
      d3.select("#" + id + "-avgcompare").text(d3.format(".0f")(diff) + "% " + moreless + " the average household")
    } else if (d3.select("#" + itemid).property("value") == 0 && decile > 0) {
      d3.select("#" + id + "-avgcompare").text("Similar households spend on average: £" + (d3.format(".2f")(category_spend[decile + 1] / (d3.select("#" + id + "-time-period").property("value") / 12))))
    } else if(d3.select("#" + itemid).property("value") == 0 && decile == 0){
      d3.select("#" + id + "-avgcompare").text("UK average: £" + (d3.format(".2f")(category_spend[decile + 1] / (d3.select("#" + id + "-time-period").property("value") / 12))))
    }
  }

  function updateRunningTotal(decile) {
    d3.selectAll('input.spending').on('change', function() {
      calculateSpending();
      itemid = d3.select(this).attr("id")
      updateSpendComparison(itemid,decile)
    });

    d3.selectAll('select.spending').on('change', function() {
      calculateSpending();

      itemid = d3.select(this).attr("id").split("-")

      updateSpendComparison(itemid[0],decile)
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

    d3.select("#currentSpend").transition().duration(1000).tween("text", function(d) {
      node = this
      numberTransition = d3.interpolateNumber(prevSpend, totalspending)
      return function(t) {
        d3.select(node).html("£" + d3.format(",.0f")(numberTransition(t)))
        if (t == 1) {
          prevSpend = totalspending
        }
      }
    })
  }

  function spendXfreq(item) {
    return d3.select("input#" + item).property('value') * d3.select("select#" + item + "-time-period").property('value') / 12
  }

  function prefill(decile) {
    inflation_data.forEach(function(category) {
      category_spend = deciles_data.filter(function(d) {
        return d.cat_id == category.cat_id
      })
      category_spend = Object.values(category_spend[0])
      d3.select("#" + category.cat_id).property("value", category_spend[decile + 1])
    })
  }

  function calculate(data, cpih) {

    var total = 0
    var total_change = 0
    pir = 0
    category_data = {}
    Object.keys(data).forEach(function(category) {
      category_data[category] = {}
      for (i = 0; i < data[category].length; i++) {
        var input = (d3.select("#" + category).property("value") * d3.select("#" + category + "-time-period").property("value")) / 12
        var inflation_rate = data[category][i].index
        var change = input - (input / (1 + (inflation_rate / 100)))
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
    for (i = 0; i < data["foodhotdrinks"].length; i++) {
      var total = 0
      var total_change = 0
      var pir = 0
      Object.keys(category_data).forEach(function(category) {
        total = total + category_data[category][i].input
        total_change = total_change + category_data[category][i].change
      })
      Object.keys(category_data).forEach(function(category) {
        category_data[category][i].weight = category_data[category][i].input / total
        category_data[category][i].weighted_index = category_data[category][i].inflation_rate * category_data[category][i].weight
        pir = pir + category_data[category][i].weighted_index
        overall_inflation[i] = {
          series: "overall_inflation",
          date: category_data[category][i].date,
          total: total,
          total_change: total_change,
          pir: pir
        }
      })
    }

    d3.select("#personalInflation").text(d3.format(".1f")(overall_inflation[0].pir) + "%")
    d3.select("#inflationDifference").text(d3.format(".1f")(overall_inflation[0].pir - cpih[0].value) + " percentage points")
    d3.select("#overunder").text(function() {
      return overall_inflation[0].pir - cpih[0].value > 0 ? "over" : "under"
    })
    d3.select("#currentInflationRate").text(d3.format(".1f")(cpih[0].value) + "%")

    d3.select("#increaseMonthlySpend").text("£" + d3.format(".2f")(overall_inflation[0].total_change))
    d3.selectAll(".dateOneYearPrior").text(d3.timeFormat("%B %Y")(overall_inflation[12].date))
    d3.selectAll(".dateFiveYearsPrior").text(d3.timeFormat("%B %Y")(overall_inflation[59].date))
    d3.selectAll(".currentDate").text(d3.timeFormat("%B %Y")(overall_inflation[0].date))

    drawLineChart(overall_inflation, cpih)

    categoryByWeight = []

    Object.keys(category_data).forEach(function(category) {
      var foo = category_data[category][0]
      foo.category = inflation_data.filter(function(d) {
        return d.cat_id == category
      })[0].category
      foo.cat_id = category
      categoryByWeight.push(foo)
    })
    categoryByWeight.sort(function(a, b) {
      return b.weight - a.weight;
    })

    d3.select("#biggestCat").text("The largest share of your spending is on " + categoryByWeight[0].category.toLowerCase()+".")
    d3.select("#propBiggestCat").text(d3.format(".1f")(categoryByWeight[0].weight * 100) + "%")

    d3.select("#avgPropBiggestCat").text(inflation_data.filter(function(d) {
      return d.cat_id == categoryByWeight[0].cat_id
    })[0].inf_values[0].weight / 10)
    d3.select("#biggestCatInflation").text(d3.format(".1f")(categoryByWeight[0].inflation_rate) + "%")

    d3.select("#biggestCatDiffInflation").text(d3.format(".1f")(categoryByWeight[0].inflation_rate - cpih[0].value))
    d3.select("#biggestCatOverUnder").text(function() {
      return categoryByWeight[0].inflation_rate - cpih[0].value > 0 ? "above" : "below"
    })
    d3.select("#biggestCatOverallInflation").text(d3.format(".1f")(cpih[0].value) + "%")

    categoryByIncrease = []

    Object.keys(category_data).forEach(function(category) {
      var foo = category_data[category][0]
      foo.category = inflation_data.filter(function(d) {
        return d.cat_id == category
      })[0].category
      foo.cat_id = category
      categoryByIncrease.push(foo)
    })
    categoryByIncrease.sort(function(a, b) {
      return b.change - a.change;
    })

    categoryByIncrease = categoryByIncrease.slice(0, 5)

    drawBarChart(categoryByIncrease.reverse())

  } //end calculate function

  function drawBarChart(data) {
    var graphic = d3.select('#barchart');
    graphic.selectAll("*").remove();
    var height = 250;
    var chart_width = parseInt(d3.select(".results-input").style("width")) - barMargins.left - barMargins.right;

    var x = d3.scaleLinear()
      .range([0, chart_width]);

    var y = d3.scaleBand()
      .range([height, 0])
      .paddingInner(0.4);

    x.domain([0, d3.max(data, function(d) {
      return d.change;
    })]);
    y.domain(data.map(function(d) {
      return d.category;
    }));

    var xAxis = d3.axisBottom(x).tickSize(-height).tickValues([0]).tickFormat("");
    var yAxis = d3.axisLeft(y).tickSize(0);


    var svg = d3.select('#barchart').append('svg')
      .attr("width", chart_width + barMargins.left + barMargins.right)
      .attr("height", height + barMargins.top + barMargins.bottom)
      .append("g")
      .attr("transform", "translate(" + barMargins.left + "," + barMargins.top + ")");

    svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis).selectAll("text").each(function(d, i) {
        d3.select(this).call(wrap, barMargins.left - 10);
      });

    svg.append('g')
      .attr('class', 'x axis')
      .attr("transform", "translate(" + 0 + "," + height + ")")
      .call(xAxis);

    svg.append('g')
      .selectAll('rect').data(data)
      .enter()
      .append('rect')
      .attr('x', x(0))
      .attr('y', function(d) {
        return y(d.category)
      })
      .attr('height', y.bandwidth())
      .attr('width', function(d) {
        return x(d.change)
      })
      .attr('fill', "#206095")

    //add text label
    svg.append('g')
      .selectAll('text.value')
      .data(data)
      .enter()
      .append('text')
      .attr('x', function(d) {
        return x(d.change)
      })
      .attr('y', function(d) {
        return y(d.category) + y.bandwidth()
      })
      .attr('dx', function(d) {
        return (x(d.change) - x(0)) > chart_width / 8 ? -10 : 10
      })
      .attr('dy', -12)
      .attr('text-anchor', function(d) {
        return (x(d.change) - x(0)) > chart_width / 8 ? "end" : "start"
      })
      .attr('fill', function(d) {
        return (x(d.change) - x(0)) > chart_width / 8 ? "#fff" : "#206095";
      })
      .text(function(d) {
        return "£" + d3.format(",.2f")(d.change)
      })



  } // ends drawBarChart

  function drawLineChart(overall_inflation, cpih) {
    var graphic = d3.select('#graphic');
    graphic.selectAll("*").remove();
    var height = 300 - lineMargin.top - lineMargin.bottom
    var width = parseInt(d3.select(".results-input").style("width"));
    var chart_width = width - lineMargin.left - lineMargin.right

    var x = d3.scaleTime()
      .range([0, chart_width]);

    var y = d3.scaleLinear()
      .range([height, 0]);

    x.domain(d3.extent(overall_inflation, function(d) {
      return d.date;
    }));

    var xAxis = d3.axisBottom(x).ticks(dvc.x_num_ticks[size])


    var yAxis = d3.axisLeft(y).tickSize(-chart_width);

    var line = d3.line()
      .defined(function(d) {
        return d.pir != null;
      }) // Right you scallywags, I'm going to tell you what this line does. This means that the line will not be drawn between any points a data point is NaN, or whatever function you want
      .curve(d3.curveLinear)
      .x(function(d) {
        return x(d.date);
      })
      .y(function(d) {
        return y(d.pir);
      });

    var line2 = d3.line()
      .defined(function(d) {
        return d.value != null;
      }) // Right you scallywags, I'm going to tell you what this line does. This means that the line will not be drawn between any points a data point is NaN, or whatever function you want
      .curve(d3.curveLinear)
      .x(function(d) {
        return x(d.date);
      })
      .y(function(d) {
        return y(d.value);
      });


    lines = d3.nest()
      .key(function(d) {
        return d.series
      })
      .entries(overall_inflation)

    var cpih_line = d3.nest()
      .key(function(d) {
        return d.sourceDataset
      })
      .entries(cpih)

    maxy = d3.max([d3.max(cpih_line[0].values, function(d) {
      return d.value
    }), d3.max(lines[0].values, function(d) {
      return d.pir
    })])
    miny = d3.min([d3.min(cpih_line[0].values, function(d) {
      return d.value
    }), d3.min(lines[0].values, function(d) {
      return d.pir
    })])

    var yDomain = [d3.min([0, miny]), maxy]

    y.domain(yDomain).nice();

    var svg = d3.select('#graphic').append('svg')
      .attr("id", "chart")
      .style("background-color", "#fff")
      .attr("width", chart_width + lineMargin.left + lineMargin.right)
      .attr("height", height + lineMargin.top + lineMargin.bottom)
      .append("g")
      .attr("transform", "translate(" + lineMargin.left + "," + lineMargin.top + ")");

    svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis)
      .append('text')
      .attr('dy', -10)
      .text("%");

    //create x axis, if y axis doesn't start at 0 drop x axis accordingly
    svg.append('g')
      .attr('class', 'x axis')
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

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
        return line2(d.value);
      });

    //create lines
    svg.append('g').attr('id', "pir").selectAll('path')
      .data(d3.entries(lines[0]))
      .enter()
      .append('path')
      .style("stroke", "#206095")
      .style("fill", 'none')
      .style("stroke-width", 3.5)
      .style("stroke-linecap", 'round')
      .style("stroke-linejoin", 'round')
      .attr('d', function(d) {
        return line(d.value);
      });


    // add dots
    svg.append('g').selectAll('circle.cpih')
      .data([cpih_line[0].values[0]])
      .enter()
      .append('circle')
      .attr('cy', function(d) {
        return y(d.value)
      })
      .attr('cx', function(d) {
        return x(d.date)
      })
      .attr('r', 5)
      .attr('fill', dvc.lineColours[0])

    svg.append('g').selectAll('circle.pir')
      .data([lines[0].values[0]])
      .enter()
      .append('circle')
      .attr('cy', function(d) {
        return y(d.pir)
      })
      .attr('cx', function(d) {
        return x(d.date)
      })
      .attr('r', 5)
      .attr('fill', dvc.lineColours[1])

  }

  function structureData(inflation, weights, cpih, final_data) {
    parseTime = d3.timeParse(dvc.time_format)
    formatTime = d3.timeFormat("%B %Y");

    for (var sc = 0; sc < inflation_data.length; sc++) {
      subcategory = inflation_data[sc]
      inflation_subcategory = inflation[sc]
      weights_subcategory = d3.nest()
        .key(function(d) {
          return d.year
        })
        .entries(weights[sc].years)

      //loop through number of specified months and extract necessary data from inflation and weights dataset
      for (var month = 1; month < dvc.time_series_totalmnths + 1; month++) {
        //get year from inflation data and filter weights data to specified year
        year = inflation_subcategory[dvc.time_period][inflation_subcategory[dvc.time_period].length - month].year
        year = "" + year
        selected_weight_data = weights_subcategory.filter(function(d) {
          return d.key == year
        })

        //get monts inflation data
        selected_inf_data = inflation_subcategory[dvc.time_period][inflation_subcategory[dvc.time_period].length - month]

        //combine date, inflation data and weights data for each month into one object
        subcategory.inf_values.push({
          date: selected_inf_data.month + " " + selected_inf_data.year,
          index: +selected_inf_data.value,
          weight: +selected_weight_data[0].values[0].value
        })
      }
    }


    //nest all data by category
    var nested_data = d3.nest()
      .key(function(d) {
        return d.category
      })
      .entries(inflation_data)

    //combine all subcategories and dates into one big long format dataset
    nested_data.forEach(function(category) {
      var subcategory_inflation = []
      for (var month = 0; month < dvc.time_series_totalmnths; month++) {
        category.values.forEach(function(subcategory) {
          subcategory_inflation.push(subcategory.inf_values[month])
        })
      }
      //create nested data of long dataset by date
      subcategory_nested = d3.nest()
        .key(function(d) {
          return d.date
        })
        .entries(subcategory_inflation)

      //within each category, calculate the sum of subcateogry weights for each month
      subcategory_nested.forEach(function(date) {
        totalweight = 0
        date.values.forEach(function(subcategory) {
          totalweight = totalweight + subcategory.weight
        })
        //use this total category weight to calculate the subcategory weight within the overall category
        index = 0
        date.values.forEach(function(subcategory) {
          subcategory.adjweight = subcategory.weight / totalweight
          subcategory.adjindex = subcategory.index * subcategory.adjweight
          //use adjusted subcategory weights to calculated an index for the whole category
          index = index + subcategory.adjindex
        })
        //add this category index to the dataset
        date.index = index
      })
      //add this to a final dataset for use in the calculators
      array_data.push({
        name: category.key,
        cat_id: category.values[0].cat_id,
        values: subcategory_nested
      })
    })

    //convert dates into time format
    array_data.forEach(function(category) {
      category.values.forEach(function(d) {
        d.key = parseTime(d.key)
      })
    })

    array_data.forEach(function(category) {
      var itemkey = category.cat_id
      final_data[itemkey] = category.values
    })

    // structure CPIH headline data
    cpih_selected = []
    for (var month = 1; month < dvc.time_series_totalmnths + 1; month++) {
      cpih_selected.push(cpih[0].months[cpih[0].months.length - month])
    }
    var parseTime2 = d3.timeParse(dvc.cpih_time_format)
    cpih_selected.forEach(function(d, i) {
      d.date = parseTime2(d.date)
      d.value = +d.value
      // cpih_final[i] = {series: "cpih", date: d.date, total: 0, total_change: 0, pir: +d.value}
    })

  } //end structureData

  //pass all data into ready function
  function ready(error, everything) {
    //seperate out data into inflation and weights data
    inflation = []
    weights = []
    cpih_new = []

    everything.forEach((item, i) => {
      if (i % 2) {
        weights.push(item)
      } else if (i == everything.length - 1) {
        cpih_new.push(item)
      } else {
        inflation.push(item)
      }
    });
    //pass these into structureData function to format for calculators
    array_data = []
    final_data = {}
    structureData(inflation, weights, cpih_new, final_data)
  } //end ready

  function loadData() {


    //load all json files from ONS time series
    q = d3.queue()

    inflation_data.forEach(function(item) {
      q.defer(d3.json, "https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/" + item.inflation_cdid + "/data")
      q.defer(d3.json, "https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/" + item.weight_cdid + "/data")
    })

    q.defer(d3.json, "https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/l55o/mm23/data")

    //once all files are loaded, execute ready function
    q.awaitAll(ready);
  } //end load data

  function wrap(text, width) {
    text.each(function() {
      var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        // y = text.attr("y"),
        x = text.attr("x"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr('x', x);
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr('x', x).attr("dy", lineHeight + "em").text(word);
        }
      }
    });

    var breaks = text.selectAll("tspan").size();
    text.attr("y", function() {
      return (-6 * (breaks - 1))
    });
  } //ends wrap


} //ends drawGraphic



if (Modernizr.svg) {

  d3.csv("deciles.csv", function(error, csv) {
    deciles_data = csv;
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

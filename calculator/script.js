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

  quickcategories = dvc.quickcategories

  enablePageButtons();
  enableIncomePage();
  addTooltips();
  addScreenReaderLabels();

  function getSize() {
    someContainer = d3.select("#graphic-container");
    if (parseInt(someContainer.style("width")) < dvc.mobileBreakpoint) {
      size = "sm";
    } else if (parseInt(someContainer.style("width")) < dvc.mediumBreakpoint) {
      size = "md";
    } else {
      size = "lg";
    }
    lineMargin = dvc.lineChartMargin[size];
    barMargins = dvc.barChartMargin[size];
    propMargins = dvc.propChartMargin[size];
  } //end initialise


  function enablePageButtons() {

    // d3.select(".button-select").style('display','block')

    option = d3.select("#option-button").property("value");

    d3.selectAll('.button-select').on('click',function(){
      option = d3.select(this).property("value");
      hide(d3.select('#launchpage'))
      show(d3.select('#inputs0'))
      show(d3.select('#navbuttons'))
      if (option != "superfast"){
        hide(d3.select("#skipToEndButton"))
      }
      if (option == "superfast"){
        hide(d3.select("#intro-next-button"))
        d3.select("#income-description").text("What is your household's net income?")
        hide(d3.select("#averagespend"))
        hide(d3.select("#netincome"))
        show(d3.select("#net-income-input"))
        hide(d3.select(".sidebar"))
      }
      pymChild.sendHeight();
      document.getElementById("graphic-container").scrollIntoView(true)
    })

    // front page next button
    d3.select('button#intro-next-button').on('click', function() {
      hide(d3.select('#inputs' + counter))
      if (counter == 0 & option == "detailed") {
        disableSkipToEnd();
        if (d3.select('input[name="income"]:checked').node().value == "net-income") {
          var decile = getDecile(d3.select("#netincome-input").property("value") * (d3.select("#netincome-time-period").property("value") / 12));
        } else {
          decile = 0
        }
        addAverages(decile);
        updateRunningTotal(decile);
        hide(d3.select('#inputs' + counter))
        counter++
        show(d3.select("#option-select"))
        show(d3.select("#monthlyexpenditure"))
        hide(d3.select("#currentinflation"))
        // show(d3.select("#inflationrate-summary"))
        show(d3.select('#inputs' + counter))
        pymChild.sendHeight();
        document.getElementById("graphic-container").scrollIntoView(true)
      } //if on front page and next is clicked remove skip to end button and replace with back button

      else if (counter == 0 & option == "quick"){
        disableSkipToEnd();
        if (d3.select('input[name="income"]:checked').node().value == "net-income") {
          var decile = getDecile(d3.select("#netincome-input").property("value") * (d3.select("#netincome-time-period").property("value") / 12));
        } else {
          decile = 0
        }
        addAverages(decile);
        updateRunningTotal(decile);
        calculate(final_data, cpih_selected, decile, option)
        d3.select("#currentinflation").text(d3.format(".1f")(overall_inflation[0].pir)+"%")
        // show(d3.select("#monthlyexpenditure"))
        // show(d3.select("#monthlyexpenditure"))
        show(d3.select("#inflationrate-summary"))
        show(d3.select("#inputs-quick"))
        show(d3.select("#option-select"))
        if(housingsit == "mortgage"){
          hide(d3.select("#rent-quickinput"))
          show(d3.select("#ooh-quickinput"))
        }
        else if(housingsit == "rent"){
          hide(d3.select("#ooh-quickinput"))
          show(d3.select("#rent-quickinput"))
        }
        else if(housingsit == "nohcost"){
          hide(d3.select("#ooh-quickinput"))
          hide(d3.select("#rent-quickinput"))
        }
        else{
          show(d3.select("#ooh-quickinput"))
          show(d3.select("#rent-quickinput"))
        }
        counter++
        pymChild.sendHeight();
        document.getElementById("graphic-container").scrollIntoView(true)
      }

      else if (counter < 6 & option == "detailed") {
        if(!checkIfInputsAreBlank()){hide(d3.select("#calculateError"))}
        counter++;
        show(d3.select('#inputs' + counter))
        // show next page
        pymChild.sendHeight();
        document.getElementById("graphic-container").scrollIntoView(true)
      } else if (counter == 6 & option == "detailed") {
        inputtotal = 0;
        inflation_data.forEach(function(category) {
          value = +d3.select("#" + category.cat_id).property("value")
          inputtotal = inputtotal + value
        })
        if (!checkIfInputsAreBlank()) {
          d3.select("#calculateError").text("")
          hide(d3.select("#backtoDetailed"))
          hide(d3.select("#calculateError"))
          showResults();
          pymChild.sendHeight()
          document.getElementById("graphic-container").scrollIntoView(true)
          calculate(final_data, cpih_selected, decile, option)
        } else {
          show(d3.select("#calculateError"))
          d3.select("#calculateError").text("You must enter some spending for this calculator to estimate your personal inflation rate")
          pymChild.sendHeight()
        }
      }
      else if (counter > 0 & option == "quick"){
        counter++
        showResults();
        hide(d3.select("#inputs-quick"))
        show(d3.select("#backtoDetailed"))
        pymChild.sendHeight()
        document.getElementById("graphic-container").scrollIntoView(true)
        calculate(final_data, cpih_selected, decile, option)
      }
      // if we're at the end show the results

    });

    d3.select("#option-button").on('click',function(){
      // d3.select(this).text(option.charAt(0).toUpperCase() + option.slice(1))
      if (option == "quick"){
        d3.select("#option-button-text").text("Too many categories?")
        d3.select(this).text("Click here to go back to our quick calculator")
        d3.select(this).property("value","detailed")
        option = d3.select(this).property("value")
        counter = 0
        disableSkipToEnd();
        if (d3.select('input[name="income"]:checked').node().value == "net-income") {
          var decile = getDecile(d3.select("#netincome-input").property("value") * (d3.select("#netincome-time-period").property("value") / 12));
        } else {
          decile = 0
        }
        quickcategories.forEach(function(category){
          var val = d3.select("#"+category+"-quick").property("value")
          d3.select("#"+category).property("value",val)
        })
        addAverages(decile);
        updateRunningTotal(decile);
        // hide(d3.select('#inputs' + counter))
        hide(d3.select('#inputs-quick'))
        counter++
        calculateSpending()
        show(d3.select("#monthlyexpenditure"))
        hide(d3.select("#inflationrate-summary"))
        show(d3.select('#inputs' + counter))
        pymChild.sendHeight();
        document.getElementById("graphic-container").scrollIntoView(true)
      }
      else{
        d3.select("#option-button-text").text("Want more accurate results?")
        d3.select(this).text("Why not use our detailed calculator")
        d3.select(this).property("value","quick")
        option = d3.select(this).property("value")
        counter = 0
        disableSkipToEnd();
        if (d3.select('input[name="income"]:checked').node().value == "net-income") {
          var decile = getDecile(d3.select("#netincome-input").property("value") * (d3.select("#netincome-time-period").property("value") / 12));
        } else {
          decile = 0
        }
        quickcategories.forEach(function(category){
          var val = d3.select("#"+category).property("value")
          d3.select("#"+category+"-quick").property("value",val)
        })
        addAverages(decile);
        updateRunningTotal(decile);
        // show(d3.select("#monthlyexpenditure"))
        hide(d3.select("#monthlyexpenditure"))
        show(d3.select("#inflationrate-summary"))
        show(d3.select("#inputs-quick"))
        for (var i = 0; i < 6; i++){
          hide(d3.select("#inputs" + i))
        }
        // show(d3.select("#option-button"))
        counter++
        pymChild.sendHeight();
        document.getElementById("graphic-container").scrollIntoView(true)
      }
    })

    d3.select("#results-detailed").on('click',function(){
      hide(d3.select("#results"))
      show(d3.select("#inputs1"))
      show(d3.select("#navbuttons"))
      show(d3.select("#option-select"))
      show(d3.select(".heading"))
      // show(d3.select("#intro-next-button"))
      // show(d3.select("#backButton-frontpage"))
      show(d3.select("#monthlyexpenditure"))
      d3.select("#option-button").text("Click here to go back to our quick calculator")
      counter = 1
      option = "detailed"
      quickcategories.forEach(function(category){
        var val = d3.select("#"+category+"-quick").property("value")
        d3.select("#"+category).property("value",val)
      })
      calculateSpending()
    })


    // skip to the end
    d3.select("#skipToEndButton")
      .on('click', function() {
      if (d3.select('input[name="income"]:checked').node().value == "net-income") {
        var decile = getDecile(d3.select("#netincome-input").property("value") * (d3.select("#netincome-time-period").property("value") / 12));
      } else {
        decile = 0
      }
      option = "superfast"
      prefill(decile);
      addAverages(decile);
      showResults();
      calculateSpending();
      calculate(final_data, cpih_selected, decile, option);
      pymChild.sendHeight();
      document.getElementById("graphic-container").scrollIntoView(true)
    });

    if (size == "sm"){
      d3.select("#skipToEndButton").text("Skip to end")
    }

    // back button front page
    d3.select("button#backButton-frontpage").on('click', function() {
      if(!checkIfInputsAreBlank()){hide(d3.select("#calculateError"));pymChild.sendHeight();}
      hide(d3.select('#inputs-quick'))
      hide(d3.select('#inputs' + counter))
      if (counter == 1 | option == "quick") {
        enableSkipToEnd();
        d3.select("#monthlyexpenditure").style("display", "none")
        d3.select("#inflationrate-summary").style("display", "none")
        d3.select("#option-select").style("display", "none")
        counter--;
      }
      if (counter > 1) {
        counter--;
      }
      // if (counter == 0){
      //   show(d3.select('#launchpage'));
      //   hide(d3.select('#inputs0'));
      //   pymChild.sendHeight();
      //   document.getElementById("graphic-container").scrollIntoView(true)
      // }
      show(d3.select('#inputs' + counter));
      pymChild.sendHeight();
      document.getElementById("graphic-container").scrollIntoView(true)
    });

    // back button for results page
    d3.select("button#backButton-results").on('click', function() {
      hideResults();
      // if(counter==0){
      //   hide(d3.select("#monthlyexpenditure"))
      //   hide(d3.select("#inflationrate-summary"))
      // }
      if (option == "detailed"){
        show(d3.select("#inputs"+counter))
        hide(d3.select("#inflationrate-summary"))
      }
      else if (option == "quick"){
        show(d3.select("#inputs-quick"))
        hide(d3.select("#monthlyexpenditure"))
      }
      else{
        option = "quick"
        show(d3.select("#inputs"+counter))
        hide(d3.select("#monthlyexpenditure"))
        hide(d3.select("#inflationrate-summary"))
      }
      pymChild.sendHeight();
      document.getElementById("graphic-container").scrollIntoView(true)
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
      hide(d3.select("#inflationrate-summary"))
      hide(d3.select("#option-select"))
      option = "quick"
      pymChild.sendHeight();
      document.getElementById("graphic-container").scrollIntoView(true)
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
    averages = []
    runningAvgTotal = 0
    var prevCat = "blank"
    housingsit = document.querySelector('input[name="housing"]:checked').value;
    inflation_data.forEach(function(category) {
      category_spend = deciles_data.filter(function(d) {
        return d.cat_id == category.cat_id
      })
      category_spend = Object.values(category_spend[0])
      if (category.cat_id == "rent" & (housingsit == "mortgage" | housingsit == "nohcost")){
        d3.selectAll("#" + category.cat_id + "-avgcompare")
          .text("Similar households spend on average: £0")
      }
      else if (category.cat_id == "ooh" & (housingsit == "rent" | housingsit == "nohcost")){
        d3.selectAll("#" + category.cat_id + "-avgcompare")
          .text("Similar households spend on average: £0")
      }
      else if (category.cat_id == "ooh" | category.cat_id == "rent"){
        d3.selectAll("#" + category.cat_id + "-avgcompare")
          .text("Similar households spend on average: £" + (d3.format(".2f")(category_spend[decile + 1] / (d3.select("#" + category.cat_id + "-time-period").property("value") / 12))))
      }
      else if (decile == 0 & category.cat_id != "other") {
        d3.selectAll("#" + category.cat_id + "-avgcompare")
          .text("UK average: £" + (d3.format(".2f")(category_spend[decile + 1] / (d3.select("#" + category.cat_id + "-time-period").property("value") / 12))))
      } else if (decile > 0 & category.cat_id != "other") {
        d3.selectAll("#" + category.cat_id + "-avgcompare")
          .text("Similar households spend on average: £" + (d3.format(".2f")(category_spend[decile + 1] / (d3.select("#" + category.cat_id + "-time-period").property("value") / 12))))
      }
      // else if (category.cat_id != "other") {
      //   d3.select("#" + category.cat_id + "-avgcompare")
      //     .text("Similar households spend on average: £" + (d3.format(".2f")(category_spend[decile + 1] / (d3.select("#" + category.cat_id + "-time-period").property("value") / 12))))
      //   }
      // console.log(category,category_spend[decile + 1])
      if (category.cat_id != prevCat & category.cat_id != "other"){
        if (category.cat_id == "rent" & (housingsit == "mortgage" | housingsit == "nohcost")){
          averages.push({key: category.cat_id, value: 0})
        }
        else if (category.cat_id == "ooh" & (housingsit == "rent" | housingsit == "nohcost")){
          averages.push({key: category.cat_id, value: 0})
        }
        else{
          averages.push({key: category.cat_id, value: +category_spend[decile + 1]})
          runningAvgTotal = runningAvgTotal + +category_spend[decile + 1]
        }
      }
      prevCat = category.cat_id
    })
  }

  function addTooltips() {
    inflation_data.forEach(function(category) {
      d3.selectAll("#" + category.cat_id + "-question .question").text(category.category);
      if (category.description != "Add description here...") {
        tippy('#' + category.cat_id + '-question', {
          content: category.description,
          theme: "ons",
          placement: "top"
        });
      } else {
        d3.selectAll("#" + category.cat_id + "-question .information").remove();
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
    hide(d3.selectAll("#inputs0"));
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

    if (option == "detailed"){
      d3.select("input#"+id).property("value",function(){
        return d3.select("input#"+id).property("value").replace(/^0+/, '')
      })
      input = +d3.select("#" + id).property("value") * d3.select("#" + id + "-time-period").property("value") / 12
      var idoption = ""
    }
    else{
      d3.select("input#"+id+"-quick").property("value",function(){
        return d3.select("input#"+id+"-quick").property("value").replace(/^0+/, '')
      })
      input = +d3.select("#" + id+"-quick").property("value") * d3.select("#" + id + "-time-period-quick").property("value") / 12
      var idoption = "-quick"
    }

    diff = ((input - category_spend[decile + 1]) / category_spend[decile + 1]) * 100

    if (diff > 0) {
      moreless = "more than"
    } else if (diff < 0) {
      moreless = "less than"
      diff = diff * -1
    } else if (diff == 0) {
      moreless = "Equal to"
    }

    if (input != 0 && diff == 0 && decile > 0 && id != "other") {
      d3.selectAll("#" + id + "-avgcompare").text(moreless + " similar households")
    } else if (input != 0 && diff == 0 && decile == 0 && id != "other") {
      d3.selectAll("#" + id + "-avgcompare").text(moreless + " the average household")
    } else if (input != 0 && decile > 0 && id != "other") {
      d3.selectAll("#" + id + "-avgcompare").text(d3.format(".0f")(diff) + "% " + moreless + " similar households")
    } else if (input != 0 && decile == 0 && id != "other") {
      d3.selectAll("#" + id + "-avgcompare").text(d3.format(".0f")(diff) + "% " + moreless + " the average household")
    } else if (input == 0 && decile > 0 && id != "other") {
      d3.selectAll("#" + id + "-avgcompare").text("Similar households spend on average: £" + (d3.format(".2f")(category_spend[decile + 1] / (d3.select("#" + id + "-time-period" + idoption).property("value") / 12))))
    } else if(input == 0 && decile == 0 && id != "other" && id != "rent" && id != "ooh"){
      d3.selectAll("#" + id + "-avgcompare").text("UK average: £" + (d3.format(".2f")(category_spend[decile + 1] / (d3.select("#" + id + "-time-period" + idoption).property("value") / 12))))
    } else if (input == 0 && decile == 0 && id != "other") {
      d3.selectAll("#" + id + "-avgcompare").text("Similar households spend on average: £" + (d3.format(".2f")(category_spend[decile + 1] / (d3.select("#" + id + "-time-period" + idoption).property("value") / 12))))
    }
  }

  function updateRunningTotal(decile) {
    d3.selectAll('input.spending').on('change', function() {
      calculateSpending();
      itemid = d3.select(this).attr("id").split("-")
      updateSpendComparison(itemid[0],decile)
      if (option == "quick"){
        prevInflation = overall_inflation[0].pir
        calculate(final_data, cpih_selected, decile, option)
        currInflation = overall_inflation[0].pir
        // d3.select("#currentinflation").transition().duration(1000).tween("text",d3.format(".1f")(overall_inflation[0].pir)+"%")
        d3.select("#currentinflation").transition().duration(1000).tween("text", function(d) {
          node = this
          numberTransition = d3.interpolateNumber(prevInflation, currInflation)
          return function(t) {
            d3.select(node).html(d3.format(",.1f")(numberTransition(t))+"%")
            if (t == 1) {
              prevInflation = currInflation
            }
          }
        })
      }
    });

    // if (option == "detailed"){
      d3.selectAll('select.spending').on('change', function() {
        calculateSpending();
        itemid = d3.select(this).attr("id").split("-")
        updateSpendComparison(itemid[0],decile)
        // console.log($(this).val())
        var selected = d3.select(this).attr('id').split("-")
        var value = $(this).val()
        // console.log(selected)
        // var selectedtimeperiod = selected[0] + "-" + selected[1] + "-" selected[2]
        if (option == "quick"){
          $("#"+selected[0]+"-"+selected[1]+"-"+selected[2]+" option[value="+value+"]").attr('selected', 'selected');
        }
        if (option == "detailed"){
          $("#"+selected[0]+"-"+selected[1]+"-"+selected[2]+"-quick option[value="+value+"]").attr('selected', 'selected');
        }
      });
    // }
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
    housingsit = document.querySelector('input[name="housing"]:checked').value;
    inflation_data.forEach(function(category) {
      category_spend = deciles_data.filter(function(d) {
        return d.cat_id == category.cat_id
      })
      category_spend = Object.values(category_spend[0])
      if (category.cat_id == "rent" & (housingsit == "mortgage" | housingsit == "nohcost")){
        d3.select("#" + category.cat_id).property("value", 0)
      }
      else if (category.cat_id == "ooh" & (housingsit == "rent" | housingsit == "nohcost")){
        d3.select("#" + category.cat_id).property("value", 0)
      }
      else{
        d3.select("#" + category.cat_id).property("value", category_spend[decile + 1])
      }
    })
  }

  function calculate(data, cpih, decile, option) {
    var total = 0
    var total_change = 0
    pir = 0
    category_data = {}
    compare_avg_user = {}
    //loop through each category
    Object.keys(data).forEach(function(category, i) {
      category_data[category] = {}
      quickcategories = dvc.quickcategories
      //loop through each month
      for (i = 0; i < data[category].length; i++) {
        if (option == "detailed" | option == "superfast"){
          var input = (d3.select("#" + category).property("value") * d3.select("#" + category + "-time-period").property("value")) / 12
        }
        else if (option == "quick"){
          if(quickcategories.includes(category) == true){
            var input = (d3.select("#" + category + "-quick").property("value") * d3.select("#" + category + "-time-period-quick").property("value")) / 12
          }
          else if(quickcategories.includes(category) == false & category != "other"){
              var input = averages.filter(function(d) {
                return d.key == category
              })[0].value
            }
          else{
            var input = 0
          }
        }
        var inflation_rate = data[category][i].index
        var previous_spend = (input / (1 + (inflation_rate / 100)))
        var change = input - previous_spend
        category_data[category][i] = {
          date: data[category][i].key,
          input: input,
          inflation_rate: inflation_rate,
          change: change,
          previous_spend: previous_spend,
          weight: 0,
          weighted_index: 0
        }
        if (i == 0){
          compare_avg_user[category] = {
            userinput: input,
            userchange: change,
            inflation_rate: inflation_rate
          }
        }
      }
    })

    averages.forEach(function(d){
      category = d.key
      selected_infdata = inflation_data.filter(function(infdata){return infdata.cat_id == d.key})
      d.category = selected_infdata[0].category
      d.inflation_rate = data[category][0].index
      d.change = d.value - (d.value / (1 + (d.inflation_rate / 100)))
      d.previous_spend = d.value - d.change
      // d.weighted_index = d.proportion * (d.inflation_rate / 100)
      compare_avg_user[category].category = d.category
      compare_avg_user[category].avginput = d.value
      compare_avg_user[category].avgchange = d.change
      compare_avg_user[category].inputdiff = compare_avg_user[category].userinput - compare_avg_user[category].avginput
      compare_avg_user[category].changediff = compare_avg_user[category].userchange - compare_avg_user[category].avgchange
    })

    compare_ordered = []
    for (var category in compare_avg_user){
      compare_ordered.push(compare_avg_user[category])
    }


    compare_ordered.sort(function(a, b) {
      return b.changediff - a.changediff;
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
      pir = (total_change/(total-total_change))*100
      Object.keys(category_data).forEach(function(category) {
        // console.log(category_data[category][i])
        category_data[category][i].weight = category_data[category][i].change/total_change
        category_data[category][i].weighted_index = pir*category_data[category][i].weight
        // category_data[category][i].weight = category_data[category][i].input / total
        // category_data[category][i].weighted_index = category_data[category][i].inflation_rate * category_data[category][i].weight
        // pir = pir + category_data[category][i].weighted_index
        overall_inflation[i] = {
          series: "overall_inflation",
          date: category_data[category][i].date,
          total: total,
          total_change: total_change,
          pir: pir
        }
      })
    }

    if (counter > 1 | option == "superfast"){

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
        // if ((category == "rent" | category == "ooh") & category_data[category][0].input == 0){
        //   averages.filter(function(d){return d.key == category})[0].value = 0
        // }
        runningAvgTotal = 0
        averages.forEach(function(category){
          runningAvgTotal = runningAvgTotal + category.value
        })
        averages.forEach(function(category){
          category.proportion = +d3.format(".3f")(category.value/runningAvgTotal)
          category.weighted_index = category.proportion * category.inflation_rate
        })
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

      // d3.select("#biggestCat").text("The largest difference in your spending compared to similar households is on " + compare_ordered[0].category.toLowerCase()+".")
      // d3.select("#propBiggestCat").text(d3.format(".2f")(compare_ordered[0].userinput))
      // selectedAvg = averages.filter(function(d){ return d.key == categoryByWeight[0].cat_id})
      // d3.select("#avgPropBiggestCat").text(d3.format(".2f")(compare_ordered[0].avginput))
      // d3.select("#biggestCatInflation").text(d3.format(".1f")(categoryByWeight[0].inflation_rate) + "%")
      // if (decile == 0){
      //   d3.select("#avgorsimHousehold").text("an average household")
      // }
      // else{
      //   d3.select("#avgorsimHousehold").text("similar households")
      // }
      //
      // d3.select("#biggestCatDiffInflation").text(d3.format(".1f")(categoryByWeight[0].inflation_rate - cpih[0].value))
      // d3.select("#biggestCatOverUnder").text(function() {
      //   return categoryByWeight[0].inflation_rate - cpih[0].value > 0 ? "above" : "below"
      // })
      // d3.select("#biggestCatOverallInflation").text(d3.format(".1f")(cpih[0].value) + "%")

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

      categoryByIncrease_slice = categoryByIncrease.slice(0, 5)

      averages_slice = []
      categoryByIncrease_slice.forEach(function(d,i){
        averages.forEach(function(avgdata){
          if (d.cat_id == avgdata.key){
            averages_slice[i] = avgdata
          }
        })
      })
        // console.log(averages_filter)

      categoryByIncrease_slice.reverse()
      categoryByIncrease.reverse()

      categoryByWeight = categoryByWeight.sort(function(a, b){
        return b.weighted_index - a.weighted_index
      })

      // averages = categoryByWeight.sort(function(a, b){
      //   return b.weighted_index - a.weighted_index
      // })

      proportiondata = []
      ranks_data = {}
      proportiondata.push({key: "Your inflation", data: categoryByWeight})
      total_inf = 0
      proportiondata[0].data.forEach(function(d, i){
        if (i < dvc.prop_colour_palette.length){
          d.propid = d.cat_id
          d.propname = d.category
          d.previous_total = total_inf
          total_inf = total_inf + d.weighted_index
          d.running_total = total_inf
          d.rank = i+1
          ranks_data[d.cat_id]= d.rank
        }
        else{
          var otherprop = proportiondata[0].data[dvc.prop_colour_palette.length]
          if (i == dvc.prop_colour_palette.length){
            otherprop.previous_total = total_inf
            otherprop.propid = "allotherspend"
            otherprop.propname = "All other categories"
          }
          total_inf = total_inf + d.weighted_index
          otherprop.running_total = total_inf
          if (i > dvc.prop_colour_palette.length){
            otherprop.weighted_index = otherprop.weighted_index + d.weighted_index
          }
          otherprop.rank = i+1
          ranks_data[d.cat_id]= otherprop.rank
        }
      })

      proportiondata[0].data = proportiondata[0].data.splice(0,6)

      averages.forEach(function(d){
        d.rank = ranks_data[d.key]
      })

      averages.sort(function(a ,b){
        return a.rank - b.rank
      })

      total_inf = 0
      averages.forEach(function(d){
        d.previous_total = total_inf
        total_inf = total_inf + d.weighted_index
        d.running_total = total_inf
      })

      // proportiondata.push({key: "Similar household", data: averages})

      similarhh_ir = 0

      averages.forEach(function(category){
        similarhh_ir = similarhh_ir + category.weighted_index
      })


      baroption = "condensed"
      drawProportionChart(proportiondata,baroption)
      drawBarChart(categoryByIncrease_slice,averages_slice,baroption)

      d3.select("#seemore-button").on("click",function(){
        if (baroption == "condensed"){
          baroption = "expanded"
          drawBarChart(categoryByIncrease,averages,baroption)
          d3.select("#seemore").text("See less ")
        }
        else if (baroption == "expanded"){
          baroption = "condensed"
          drawBarChart(categoryByIncrease_slice,averages_slice,baroption)
          d3.select("#seemore").text("See more ")
        }
      })
    }

  } //end calculate function

  function drawProportionChart(data, baroption){
    var graphic = d3.select('#proportionchart');
    graphic.selectAll("*").remove();
    // if (baroption == "condensed"){
    height = 100;
    var chart_width = parseInt(d3.select(".results-input").style("width")) - propMargins.left - propMargins.right;

    var x = d3.scaleLinear()
      .range([0, chart_width]);

    var y = d3.scaleBand()
      .range([0, height])
      .paddingInner(0.5);

    max_inf = d3.max([overall_inflation[0].pir,similarhh_ir])

    x.domain([0, Math.ceil(max_inf)])
    y.domain(data.map(function(d) {
      return d.key;
    }));

    var xAxis = d3.axisBottom(x).tickSize(-y.bandwidth()-20).tickPadding(10).ticks(5)
      // .tickValues([0]).tickFormat("");
    var yAxis = d3.axisLeft(y).tickSize(0);

    var svg = d3.select('#proportionchart').append('svg')
      .attr("width", chart_width + propMargins.left + propMargins.right)
      .attr("height", height + propMargins.top + propMargins.bottom)
      .append("g")
      .attr("transform", "translate(" + propMargins.left + "," + propMargins.top + ")");

    // svg.append('g')
    //   .attr('class', 'y axis')
    //   .call(yAxis).selectAll("text").each(function(d, i) {
    //     d3.select(this).call(wrap, propMargins.left - 10);
    //   });

    svg.append('g')
      .attr('class', 'x axis')
      .attr("transform", "translate(" + 0 + "," + (y.bandwidth()+30) + ")")
      .call(xAxis)
      .selectAll("line")
      .style("stroke","#CCC")

    // svg.append('g')
    //   .attr('class', 'x axis')
    //   .attr("transform", "translate(" + 0 + "," + (height) + ")")
    //   .call(xAxis)
    //   .selectAll("line")
    //   .style("stroke","#CCC")
    data.forEach(function(d){
      svg.append('g')
        .selectAll('rect').data(d.data)
        .enter()
        .append('rect')
        .attr('class','propDataRect')
        .attr('id',function(propd){
          if (d.key == "Your inflation"){
            return 'propDataRect-'+propd.propid
          }
          else{
            return 'propDataRect-'+propd.key
          }
        })
        .attr('x', function(propd){
          return x(propd.previous_total)
        })
        .attr('y', y(d.key))
        .attr('height', y.bandwidth()-5)
        .attr('width', function(propd) {
          if (propd.change >= 0){
            return x(propd.weighted_index)
          }
          else{
            return 0
          }
        })
        .attr('fill', function(d, i){
          if (i < dvc.prop_colour_palette.length){
            return dvc.prop_colour_palette[i]
          }
          else{
            return "#CCC"
          }
        })
        .style('stroke', function(d, i){
          if (i < dvc.prop_colour_palette.length){
            return dvc.prop_colour_palette[i]
          }
          else{
            return "#CCC"
          }
        })
        .style('stroke-width', function(d, i){
          if (i < dvc.prop_colour_palette.length+1){
            0
          }
          else{
            return 1
          }
        })

        d3.selectAll(".propDataRect")
          .on("mouseover",handleMouseOverProp)
          .on("mouseout",handleMouseOutProp)

        function handleMouseOverProp(d,i){
          // if (i < dvc.prop_colour_palette.length | (i >= data[0].data.length && i < data[0].data.length+dvc.prop_colour_palette.length)){
            var selectedCat = d.propid
            if (typeof selectedCat == 'undefined'){
              var selectedCat = d.key
              i = i - data[0].data.length
            }
            d3.selectAll("#propDataRect-"+selectedCat).style("stroke-width",1.5).style("stroke","black").moveToFront()
            d3.select("#selectedProp").text(data[0].data[i].propname.charAt(0).toLowerCase()+data[0].data[i].propname.slice(1)).style("fill",dvc.prop_colour_palette[i])
            d3.select("#selectedPropVal").text(d3.format(".1f")(data[0].data[i].weighted_index)+"%")
            d3.select("#infProp").text(d3.format(".1f")((data[0].data[i].weighted_index/overall_inflation[0].pir)*100)+"%")
            // d3.select("#selectedProp_avg").text(data[1].data[i].category.charAt(0).toLowerCase()+data[1].data[i].category.slice(1)).style("fill",dvc.prop_colour_palette[i])
            // d3.select("#selectedPropVal_avg").text(d3.format(".1f")(data[1].data[i].weighted_index)+"%")
            // d3.select("#infProp_avg").text(d3.format(".1f")((data[1].data[i].weighted_index/overall_inflation[0].pir)*100)+"%")
          // }
        }

        function handleMouseOutProp(d,i){
          // if (i < dvc.prop_colour_palette.length | (i >= data[0].data.length && i < data[0].data.length+dvc.prop_colour_palette.length)){
            var selectedCat = d.propid
            if (typeof selectedCat == 'undefined'){
              var selectedCat = d.key
            }
            d3.selectAll("#propDataRect-"+selectedCat).style("stroke-width",0)
            d3.select("#selectedProp").text((firstcat.category.charAt(0).toLowerCase()+firstcat.category.slice(1))).style("fill",dvc.prop_colour_palette[0])
            d3.select("#selectedPropVal").text(d3.format(".1f")(firstcat.weighted_index)+"%")
            d3.select("#infProp").text(d3.format(".1f")((firstcat.weighted_index/overall_inflation[0].pir)*100)+"%")
            // d3.select("#selectedProp_avg").text((firstcat_avg.category.charAt(0).toLowerCase()+firstcat.category.slice(1))).style("fill",dvc.prop_colour_palette[0])
            // d3.select("#selectedPropVal_avg").text(d3.format(".1f")(firstcat_avg.weighted_index)+"%")
            // d3.select("#infProp_avg").text(d3.format(".1f")((firstcat_avg.weighted_index/overall_inflation[0].pir)*100)+"%")

          // }
        }
        // svg.append('g')
        //   .selectAll('text').data(d.data)
        //   .enter()
        //   .append('text')
        //   .attr('class','propgraph-label')
        //   .text(function(propd){
        //     if (propd.weighted_index > max_inf*0.095){
        //       if (d.key == "Your inflation"){
        //         return propd.category + " ("+d3.format(".0f")((propd.weighted_index/overall_inflation[0].pir)*100)+"%)"
        //       }
        //       else{
        //         return propd.category + " ("+d3.format(".0f")((propd.weighted_index/similarhh_ir)*100)+"%)"
        //       }
        //     }
        //     else{
        //       return ""
        //     }
        //   })
        //   .attr('transform',function(propd){
        //     return 'translate('+(x(propd.previous_total)+5)+','+(y(d.key)+y.bandwidth()-10)+')'
        //   })
        //   .call(wrap2,max_inf*0.095)
        //
        svg.append('text')
          .attr('class','propgraph-cat-label')
          .text(d.key)
          .attr('transform','translate(5,'+(y(d.key)-5)+')')
      })

      var firstcat = data[0].data[0]


      var textnode = svg.append('text')
        .attr('class','propgraph-label row-major')
        .attr('transform','translate('+(chart_width/2)+','+(y("Your inflation")+y.bandwidth()+70)+')')
        // .text("Spend on "+(firstcat.category.charAt(0).toLowerCase()+firstcat.category.slice(1))+" caused your monthly spend to increase by "+d3.format(".1f")(firstcat.weighted_index)+"%")

      var chart_width = parseInt(someContainer.style("width"))

      textnode.append('tspan').attr('id','proptext1').text("Spend on ")
      textnode.append('tspan').attr('id','selectedProp').text((firstcat.category.charAt(0).toLowerCase()+firstcat.category.slice(1))).style("fill",dvc.prop_colour_palette[0]).style("font-weight",700)
      textnode.append('tspan').attr('id','proptext2').text(" have caused your average monthly costs to increase by ")
      textnode.append('tspan').attr('id','selectedPropVal').text(d3.format(".1f")(firstcat.weighted_index)+"%").style("font-weight",700)
      textnode.append("br")
      textnode.append('tspan').attr('id','proptext3').text("This accounted for ").attr('dy',20).attr('x',0)
      textnode.append('tspan').attr('id','infProp').text(d3.format(".1f")((firstcat.weighted_index/overall_inflation[0].pir)*100)+"%").style("font-weight",700)
      textnode.append('tspan').attr('id','proptext4').text(" of your total inflation rate")



      console.log(parseInt(someContainer.style("width")))

      // var firstcat_avg = data[1].data[0]
      // var textnode2 = svg.append('text')
      //   .attr('class','propgraph-label')
      //   .attr('transform','translate('+(chart_width/2)+','+(height+40)+')')
      //
      // textnode2.append('tspan').text("In comparison, spend on ")
      // textnode2.append('tspan').attr('id','selectedProp_avg').text((firstcat_avg.category.charAt(0).toLowerCase()+firstcat.category.slice(1))).style("fill",dvc.prop_colour_palette[0]).style("font-weight",700)
      // textnode2.append('tspan').text(" caused similar households monthly costs to increase by ")
      // textnode2.append('tspan').attr('id','selectedPropVal_avg').text(d3.format(".1f")(firstcat_avg.weighted_index)+"%").style("font-weight",700)
      // textnode2.append("br")
      // textnode2.append('tspan').text("This accounted for ").attr('dy',20).attr('x',0)
      // textnode2.append('tspan').attr('id','infProp_avg').text(d3.format(".1f")((firstcat_avg.weighted_index/overall_inflation[0].pir)*100)+"%").style("font-weight",700)
      // textnode2.append('tspan').text(" of their total inflation rate")
      //



      // var points = [firstcat.]
      //
      // svg.append('path')
      //   .attr('d',points)


  }

  function drawBarChart(data, averagesdata, baroption) {
    var legend = d3.select("#barlegend")
    // console.log(data)
    var graphic = d3.select('#barchart');
    graphic.selectAll("*").remove();
    if (baroption == "condensed"){
      height = 250;
      textpos = -12
    }
    else if (baroption == "expanded"){
      if (size == "sm"){
        height = 1650;
      }
      else{
        height = 1050;
      }
      textpos = -5
    }
    var chart_width = parseInt(d3.select(".results-input").style("width")) - barMargins.left - barMargins.right;

    var x = d3.scaleLinear()
      .range([0, chart_width]);

    var y = d3.scaleBand()
      .range([height, 0])
      .paddingInner(0.4);

    x.domain([0, d3.max(data, function(d) {
      return d.input;
    })]);
    y.domain(data.map(function(d) {
      return d.category;
    }));
    if (size == "sm"){
      var xAxis = d3.axisBottom(x).tickSize(-height).tickPadding(10).tickFormat(function(d){return "£"+d}).ticks(2)
    }
    else{
      var xAxis = d3.axisBottom(x).tickSize(-height).tickPadding(10).tickFormat(function(d){return "£"+d}).ticks(5)
    }

      // .tickValues([0]).tickFormat("");
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
      .attr("transform", "translate(" + 0 + "," + (height) + ")")
      .call(xAxis)
      .selectAll("line")
      .style("stroke","#CCC")

    // svg.append('g')
    //   .attr('class','xAxisLabel')
    //   .append('text')
    //   .attr("transform", "translate(" + (chart_width-80) + "," + (height+10) + ")")
    //   .attr("text-anchor","end")
    //   .text("£")


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
        if(d.change >= 0){
          return x(d.previous_spend)
        }
        else{
          return x(d.previous_spend+d.change)
        }
      })
      .attr('fill', "#27A0CC")

    svg.append('g')
      .selectAll('rect').data(data)
      .enter()
      .append('rect')
      .attr('x', function(d) {
        if(d.change >= 0){
          return x(d.previous_spend)
        }
        else{
          return x(d.previous_spend+d.change)
        }
      })
      .attr('y', function(d) {
        return y(d.category)
      })
      .attr('height', y.bandwidth())
      .attr('width', function(d) {
        if(d.change >= 0){
          return x(d.change)
        }
        else{
          return x(-d.change)
        }
      })
      .attr('fill', function(d){
        if (d.change >= 0){
          return "#206095"
        }
        else{
          return "#871A5B"
        }
      })

    //add text label
    svg.append('g')
      .selectAll('text.value')
      .data(data)
      .enter()
      .append('text')
      .attr('x', function(d) {
        return x(d.input)
      })
      .attr('y', function(d) {
        return y(d.category)+y.bandwidth()
      })
      // .attr('dx', function(d) {
      //   return (x(d.change) - x(0)) > chart_width / 8 ? -5 : 5
      // })
      .attr('dx',5)
      .attr('dy', textpos)
      // .attr('text-anchor', function(d) {
      //   return (x(d.change) - x(0)) > chart_width / 8 ? "end" : "start"
      // })
      .attr('text-anchor','start')
      // .attr('fill', function(d) {
      //   return (x(d.change) - x(0)) > chart_width / 8 ? "#fff" : "#206095";
      // })
      .attr('fill',"#206095")
      .text(function(d) {
        if (d.change > 0){
          return "▲ £" + d3.format(",.2f")(d.change) + " (+"+ d3.format(",.0f")(d.inflation_rate)+"%)"
        }
        else if (d.change < 0){
          return "▼ £" + d3.format(",.2f")(d.change) + " ("+ d3.format(",.0f")(d.inflation_rate)+"%)"
        }
        else{
          return "No change"
        }
      })

      // svg.append('g')
      //   .selectAll('rect').data(averagesdata)
      //   .enter()
      //   .append('rect')
      //   .attr('x', x(0))
      //   .attr('y', function(d) {
      //     return y(d.category)+y.bandwidth()/2 + 2.5
      //   })
      //   .attr('height', y.bandwidth()/2)
      //   .attr('width', function(d) {
      //     return x(d.previous_spend)
      //   })
      //   .attr('fill', "#F66068")
      //
      // svg.append('g')
      //   .selectAll('rect').data(averagesdata)
      //   .enter()
      //   .append('rect')
      //   .attr('x', function(d) {
      //     return x(d.previous_spend)
      //   })
      //   .attr('y', function(d) {
      //     return y(d.category)+y.bandwidth()/2 + 2.5
      //   })
      //   .attr('height', y.bandwidth()/2)
      //   .attr('width', function(d) {
      //     return x(d.change)
      //   })
      //   .attr('fill', "#871A5B")



  } // ends drawBarChart

  function drawLineChart(overall_inflation, cpih) {
    var graphic = d3.select('#graphic');
    graphic.selectAll("*").remove();
    var height = 250 - lineMargin.top - lineMargin.bottom
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


    var yAxis = d3.axisLeft(y).tickSize(-chart_width).ticks(5);

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
      .style("stroke", dvc.lineColours[0])
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
      .style("stroke", dvc.lineColours[1])
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

  function addUpdateTime(data){
    var update = inflation[0].description.releaseDate
    var update = update.slice(0, 10)
    var update = d3.timeParse("%Y-%m-%d")(update)
    var update = d3.timeFormat("%d %b %Y")(update)
    d3.select("#inflation-updated").text("Inflation data last updated: "+update)
  }

  function structureData(inflation, weights, cpih, final_data) {
    addUpdateTime(inflation)
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
    console.log(text)
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

  function wrap2(text, width) {
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
        breaks = 0
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          breaks = breaks + 1
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr('x', 0).attr("dy", lineHeight + "em").text(word);
        }
      }
      text.attr('y',function(){
        return (-14 * breaks)
      })
    });

    // var breaks = text.selectAll("tspan").size();
    // console.log(breaks)
    // text.attr("y", function() {
    //   return (-6 * (breaks - 1))
    // });
  } //ends wrap

  d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  };



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

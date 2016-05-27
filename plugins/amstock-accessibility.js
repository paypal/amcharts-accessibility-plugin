/* ========================================================================
* Copyright (c) <2014> PayPal

* All rights reserved.

* Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

* Neither the name of PayPal or any of its subsidiaries or affiliates nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
* ======================================================================== */

var amChartAccess = {};

(function () {
"use strict";

amChartAccess.prototype = {
    stockchart: null,
    sChart: null,
    statusDiv: null,
    startIndex: 0,
    endIndex: 0,
    graphs: null,
    panelsContainer: null,
    dragger: null,
    iconLeft:null,
    iconRight: null,
    initLeftPos:0,
    initRightPos:0,
    ind: -1,
    sliderMin: 0,
    sliderMax:0,
    step:1,
    scrollWidth:0,
    allBullets:null,
    'chartLabel': 'Chart from',
    'chartHlpTxtNav': 'Press Left or Right Arrow to Navigate',
    'chartHlpTxtStart': 'Start of Chart',
    'chartHlpTxtEnd': 'End of Chart',
    'leftSliderLabel': 'Start',
    'rightSliderLabel': 'End',

    init: function (stockchart, chartArguments) {
        this.setUpConfig(stockchart, chartArguments);
        this.createStatusDiv();
        this.createChartLabel();
        this.addChartListeners();
        this.addAriaLeftSlider();
        this.addAriaRightSlider();
    },

    setUpConfig: function(stockchart, chartArguments){
        this.stockchart= stockchart;
        this.sChart = stockchart.scrollbarChart;            //sChart means Serial Chart and we get it from stockChart
        this.panelsContainer = this.stockchart.panelsContainer;
        this.startIndex = this.sChart.startIndex;
        this.endIndex = this.sChart.endIndex;
        this.graphs = stockchart.panels[0].graphs;
        this.sChart.chartScrollbar.iconLeft.node.setAttribute('tabIndex','0');
        console.log(this.sChart.chartScrollbar.iconLeft.node.parentNode.parentNode);

        this.iconLeft = this.sChart.chartScrollbar.iconLeft;
        this.iconRight = this.sChart.chartScrollbar.iconRight;
        this.sliderMin = AmCharts.formatDate(this.sChart.chartData[0].category, this.sChart.balloonDateFormat);
        this.sliderMax = AmCharts.formatDate(this.sChart.chartData[this.sChart.chartData.length-1].category, this.sChart.balloonDateFormat);
        this.step = this.sChart.chartScrollbar.stepWidth;
        this.dragger = this.sChart.chartScrollbar.dragger;
        this.initRightPos = this.sChart.chartScrollbar.width;
        this.scrollWidth = this.sChart.chartScrollbar.width;

        this.chartLabel =  chartArguments.chartLabel;
        this.chartHlpTxtNav =chartArguments.chartHlpTxtNav;
        this.chartHlpTxtStart = chartArguments.chartHlpTxtStart;
        this.chartHlpTxtEnd = chartArguments.chartHlpTxtEnd;
        this.leftSliderLabel = chartArguments.leftSliderLabel,
        this.rightSliderLabel = chartArguments.rightSliderLabel
    },

    createStatusDiv: function(){
        this.statusDiv = document.createElement("div");
        var statusStyle = this.statusDiv.style;
        statusStyle.position = "absolute";
        statusStyle.height = "1px";
        statusStyle.width = "1px";
        statusStyle.overflow ="hidden";
        statusStyle.clip = "rect(1px, 1px, 1px, 1px)";
        this.statusDiv.setAttribute("id","statusDiv");
        this.statusDiv.setAttribute("aria-live","polite");
        this.statusDiv.setAttribute("aria-atomic","true");

       if(!document.getElementById('statusDiv')){
         this.stockchart.centerContainer.appendChild(this.statusDiv);
        }
    },
    createChartLabel: function(){
        var  allBullets,
            chart = this.stockchart.chartCursors[0].chart,
            firstTime = new Date(chart.firstTime),
            lastTime = new Date(chart.lastTime),
            startLbl = AmCharts.formatDate(firstTime, 'MMM DD'),
            endLbl = AmCharts.formatDate(lastTime, 'MMM DD')

            this.chartLabel += startLbl + ' to ' + endLbl +'. ';
            this.chartLabel += this.chartHlpTxtNav;                

            this.panelsContainer.setAttribute('aria-label',this.chartLabel);
            this.panelsContainer.setAttribute('tabIndex',0);    
            this.panelsContainer.setAttribute('role', 'application');            
    },
    addChartListeners: function () {
        var _this=this;
        if (AmCharts.isNN) {
            this.panelsContainer.addEventListener('keydown',function(e){
                _this.chartKeyNavigation(e)
            })
        }

        if (AmCharts.isIE) {
            this.panelsContainer.attachEvent('onkeydown',function(e){
                _this.chartKeyNavigation(e)
            })
        }         
    },
    findInd: function (myArray, searchTerm, property) {
        for(var i = 0, len = myArray.length; i < len; i++) {
            if (myArray[i][property] == searchTerm) {
                return i;
            }    
        }
        return -1;
    },
    chartKeyNavigation: function(e){
        var keyCode = e.keyCode || e.which,
            liveText='', i,j= this.graphs.length, graph,graphDataItem, serialDataItem, balloonText,
            chartCursor = this.stockchart.chartCursors[0],
            scrollbarChart = this.stockchart.scrollbarChart;

            // console.log(chartCursor.chart);

        if (!/(37|39)/.test(keyCode)) return;

        this.startIndex = chartCursor.chart.startIndex;
        this.endIndex = chartCursor.chart.endIndex;

        if(keyCode === 39) this.ind += 1;
        if(keyCode === 37) this.ind -= 1;

        //Stick to end or beginning and do not wrap
        if (this.ind > this.endIndex) this.ind = this.endIndex;
        if (this.ind < this.startIndex) this.ind = this.startIndex;

        // console.log(this.ind, this.stockchart.mainDataSet.dataProvider[this.ind]);
        var curObj= chartCursor.chart.chartData[this.ind]; 
        chartCursor.showCursorAt(curObj.category);
        this.speakBalloon(chartCursor, curObj.category, this.ind, this.startIndex,this.endIndex)

    },
    speakBalloon: function(chartCursor, category, index, startIndex, endIndex ){
        var liveText='', i, j= this.graphs.length, graph, graphDataItem, serialDataItem, balloonText, fDate = null;
        fDate= AmCharts.formatDate(category, chartCursor.categoryBalloonDateFormat);
        liveText =  this.sChart.categoryField + ' ' + fDate + '<br>';
       
        for (i = 0; i < j; i++) {
            graph = this.graphs[i];
            serialDataItem= this.graphs[i].data[index];
            graphDataItem = serialDataItem.axes[graph.valueAxis.id].graphs[graph.id];
            balloonText = this.sChart.formatString(graph.balloonText, graphDataItem, graph);
            liveText = liveText + graph.title + ' : ' + balloonText + '<br>';
        }
        
        if(index === this.endIndex) liveText =   this.chartHlpTxtEnd + '. ' + liveText;
        if(index === this.startIndex) liveText = this.chartHlpTxtStart  + '. ' + liveText;

        this.statusDiv.innerHTML = liveText;

        // console.log(liveText );
    },
    addAriaLeftSlider: function(){
        console.log(this.iconLeft.node);
        var _this=this,
            iconLeftLabel = this.leftSliderLabel + this.sChart.categoryField;

        this.iconLeft.node.setAttribute('aria-label',iconLeftLabel);
        this.iconLeft.node.setAttribute("tabIndex","0");
        this.iconLeft.node.setAttribute("focusable","true");
        this.iconLeft.node.setAttribute("role","slider");
        this.iconLeft.node.setAttribute("aria-orientation","horizontal");
        this.iconLeft.node.setAttribute("aria-valuemin", this.sliderMin);
        this.iconLeft.node.setAttribute("aria-valuemax", this.sliderMax);
        this.iconLeft.node.setAttribute("aria-valuetext", this.sliderMin);
        if (AmCharts.isNN) {
            this.iconLeft.node.addEventListener('keydown', function(e){ _this.leftSliderKeyNav(e)});
            this.iconLeft.node.addEventListener('focusout', function(e){}); 
        }        
        if (AmCharts.isIE) {
            this.iconLeft.node.attachEvent('onkeydown', function(e){  _this.leftSliderKeyNav(e)});
        } 
    },
    leftSliderKeyNav: function(e){
        var keyCode = e.keyCode || e.which, 
            currTime;

        if (!/(37|39)/.test(keyCode)) return;

        if(this.step < 1) this.step = 1;

        if(keyCode === 39) this.initLeftPos += this.step;
        if(keyCode === 37) this.initLeftPos -= this.step;

        if(this.initLeftPos > this.scrollWidth) this.initLeftPos -= this.step;
        if(this.initLeftPos < 0 ) this.initLeftPos = 0;

        this.dragger.setAttr('x', this.initLeftPos);
        this.dragger.setAttr('width', this.initRightPos - this.initLeftPos);

        this.sChart.chartScrollbar.clipDragger(true);
        this.sChart.chartScrollbar.updateOnRelease();

        currTime = new Date(this.sChart.startTime);
        this.iconLeft.node.setAttribute("aria-valuenow", this.initLeftPos);
        this.iconLeft.node.setAttribute("aria-valuetext", AmCharts.formatDate(currTime, this.sChart.balloonDateFormat));

        this.updateChartLabel();
   },
   addAriaRightSlider: function(){
        var _this=this,
            iconRightLabel = this.rightSliderLabel + this.sChart.categoryField;

        this.iconRight.node.setAttribute('aria-label',iconRightLabel);                                       
        this.iconRight.node.setAttribute("tabIndex","0");
        this.iconRight.node.setAttribute("focusable","true");
        this.iconRight.node.setAttribute("role","slider");
        this.iconRight.node.setAttribute("aria-orientation","horizontal");

        this.iconRight.node.setAttribute("aria-valuemin", this.sliderMin);
        this.iconRight.node.setAttribute("aria-valuemax", this.sliderMax);
        this.iconRight.node.setAttribute("aria-valuetext", this.sliderMax);

        if (AmCharts.isNN) {
            this.iconRight.node.addEventListener('keydown', function(e){ _this.rightSliderKeyNav(e)});
            this.iconRight.node.addEventListener('focusout', function(e){});
        }
        if (AmCharts.isIE) {
            this.iconRight.node.attachEvent('onkeydown', function(e){ _this.rightSliderKeyNav(e)});
        }          

   },
   rightSliderKeyNav: function(e){
        var keyCode = e.keyCode || e.which,
            currEndTime;

        if (!/(37|39)/.test(keyCode)) return;   

        if(keyCode==39) this.initRightPos += this.step;
        if(keyCode==37) this.initRightPos -= this.step ;

        if(this.initRightPos < 0) this.initRightPos = 0.1;          //_this.width
        if(this.initRightPos > this.scrollWidth ) this.initRightPos = this.scrollWidth;

        this.dragger.setAttr('width', this.initRightPos - this.initLeftPos);

        this.sChart.chartScrollbar.clipDragger(true);
        this.sChart.chartScrollbar.updateOnRelease();

        currEndTime = new Date(this.sChart.endTime); 
        this.iconRight.node.setAttribute("aria-valuenow", this.initRightPos);
        this.iconRight.node.setAttribute("aria-valuetext", AmCharts.formatDate(currEndTime, this.sChart.balloonDateFormat));

        this.updateChartLabel();
   },
   updateChartLabel: function(){
            var startLbl = AmCharts.formatDate(new Date(this.sChart.startTime), 'MMM DD'),
            endLbl = AmCharts.formatDate(new Date(this.sChart.endTime) , 'MMM DD');

            this.chartLabel = startLbl + ' to ' + endLbl +'. ';
            this.chartLabel += this.chartHlpTxtNav;
            this.panelsContainer.setAttribute('aria-label',this.chartLabel);
   }     

}

}() );  
$scope.hasResultCate = false;//有无结果
$scope.faceResultsCate = null;//返回结果combine后
$scope.orderByColumnNameCate = "name";//categories 排序列

//20170803 query category audit statistics
$scope.showResultCate = function(){
	$scope.hasResult = false;
	$scope.faceResults = null;
    $scope.categoryResultArray = [];
	$scope.faceResultsCate = null;
	$scope.hasResultCate = false;
    if($.inArray("submitTime",$scope.selectedFilters)>=0){
    	if($scope.isSubmitTimeFilterChecked){
    		$scope.startDateValue = $scope.startDate;
    		$scope.endDateValue = $scope.endDate;
    		if(typeof($scope.startDateValue) === "undefined"  && typeof($scope.endDateValue) === "undefined" ){
    			$scope.timeFilterError = true;
    		}
    		$scope.queryFilterSubmitTime = true;
    	}
    }
    if($scope.timeFilterError){
    	return;
    }
	$scope.executeQueryCate();
}

$scope.executeQueryCate = function(){
	$scope.querying = true;
	var queryUrl = "/mw/products/search/faceted/ezhome?offset=0&limit=1&fieldsToStat=categoriesIdsSearchString";
    if($scope.queryFilterSubmitTime){
    	var startDateString = "";
    	var endDateString = "";
    	if(typeof($scope.startDateValue) !== "undefined"){
    		startDateString = $scope.startDateValue.getFullYear() + "-"+($scope.adjustDateString($scope.startDateValue.getMonth() + 1)) + "-"
    						+ ($scope.adjustDateString($scope.startDateValue.getDate()))+"T00:00:00.000Z";
    		$scope.startDateValue = $scope.startDateValue.getFullYear() + "/"+($scope.adjustDateString($scope.startDateValue.getMonth() + 1))
    		                + "/" + ($scope.adjustDateString($scope.startDateValue.getDate()));
    	}
    	if(typeof($scope.endDateValue) !== "undefined"){
    	    endDateString = $scope.endDateValue.getFullYear() + "-"+($scope.adjustDateString($scope.endDateValue.getMonth() + 1)) + "-"
    	    				+ ($scope.adjustDateString($scope.endDateValue.getDate()))+"T23:59:59.000Z";
    		$scope.endDateValue = $scope.endDateValue.getFullYear() + "/"+($scope.adjustDateString($scope.endDateValue.getMonth() + 1))
    		                + "/" + ($scope.adjustDateString($scope.endDateValue.getDate()));
    	}

    	var filterDateString = startDateString +"TO"+endDateString;
    	queryUrl +="&creationTimeRange="+filterDateString;
    }
    var cateIds = "";
    for(cateKey in $scope.queryCategoryMap){
        cateIds += $scope.queryCategoryMap[cateKey] + ",";
    }
    var qUrl = queryUrl + "&categoriesIds=" + cateIds.substr(0,cateIds.length-1) + "&attributeIds=";
	var qUrlVariation = qUrl + "attr-isVariation_attr-isVariation-true";
	var urlObj = {};
    urlObj.auditPassActive = qUrl + $scope.queryCategoryAuditMap["passActive"];
    urlObj.auditPassActiveV = qUrlVariation + $scope.queryCategoryAuditMap["passActive"];
    urlObj.auditPassInactive = qUrl + $scope.queryCategoryAuditMap["passInactive"];
    urlObj.auditPassInactiveV = qUrlVariation + $scope.queryCategoryAuditMap["passInactive"];
    urlObj.auditWait = qUrl + $scope.queryCategoryAuditMap["wait"];
    urlObj.auditWaitV = qUrlVariation + $scope.queryCategoryAuditMap["wait"];
    urlObj.auditFail = qUrl + $scope.queryCategoryAuditMap["fail"];
    urlObj.auditFailV = qUrlVariation + $scope.queryCategoryAuditMap["fail"];
    $scope.fetchFromWS(urlObj);
}

$scope.fetchFromWS = function(qUrlObj){
    $q.all([$http.get(qUrlObj.auditPassActive), $http.get(qUrlObj.auditPassActiveV)
    	,$http.get(qUrlObj.auditPassInactive), $http.get(qUrlObj.auditPassInactiveV)
    	,$http.get(qUrlObj.auditWait), $http.get(qUrlObj.auditWaitV)
    	,$http.get(qUrlObj.auditFail), $http.get(qUrlObj.auditFailV)]).then(function(response) {
    $scope.querying = false;
    var combinedResult = $scope.combineUnion($scope.combineUnion($scope.combineUnion(
    $scope.combineAdd(response[0].data, response[1].data),
    $scope.combineAdd(response[2].data, response[3].data),"auditPassInactiveCount"),
    $scope.combineAdd(response[4].data, response[5].data),"auditWaitCount"),
    $scope.combineAdd(response[6].data, response[7].data),"auditFailCount");
    console.log("8个查询OK");
    $scope.processQueryResultCate(combinedResult);
})}
//a=[{name:"品牌",count:500,auditPassInactiveCount:10},...]
$scope.processQueryResultCate = function(a){
	a.map(function(obj,idx){
		var tmp=0;
		for(var i in a[idx]){
			tmp += isNaN(a[idx][i])?0:a[idx][i];
		}
		a[idx].totalCount=tmp;
	});
	//query OK !
	$scope.faceResultsCate = a;
	$scope.orderByColumnNameCate = "name";
	$scope.hasResultCate = true;
}
//a.facetResults.categoriesIdsSearchString=[{name:"品牌",count:250,id:"asf"},{}...]
$scope.combineAdd = function(a,b){
	a = a.facetResults.categoriesIdsSearchString;
	b = b.facetResults.categoriesIdsSearchString;
	var combineAddResult = [];
	a.map(function(value){
		b.map(function(v){
			if(value.name!=null && v.name!=null && value.name==v.name)
			combineAddResult.push({name:value.name, count:v.count+value.count});
		})
	});
	return combineAddResult;
}
//a=[{name:"品牌",count:500},...] ----> a=[{name:"品牌",count:500,auditPassInactiveCount:10},...]
$scope.combineUnion = function(a,b,expandName){
	a.map(function(value,index){
		b.map(function(v,i){
			if(value.name==v.name)
			eval("a[index]." + expandName + "=v.count");
		})
	});
	return a;
}

$scope.toExcel = function(){
	var tableNodes = document.getElementsByTagName('table');
	var tableNode;
	for(var i=0;i<tableNodes.length;i++){
	    if(tableNodes[i].innerText.length>80){
	        tableNode = tableNodes[i];
	        i = tableNodes.length;
	    }
	}
	var explorer = window.navigator.userAgent;
    if(explorer.indexOf("MSIE")>= 0 || explorer.indexOf("Trident")>= 0 || explorer.indexOf(".NET CLR") >= 0)
        $scope.tableToExcelTrident(tableNode);
    else $scope.tableToExcelGecko(tableNode);
}
$scope.tableToExcelTrident = function(tableNode)
{
    try{
	    var curTbl = tableNode;
        var oXL = new ActiveXObject("Excel.Application");
        var oWB = oXL.Workbooks.Add();
        var oSheet = oWB.ActiveSheet;
        var Lenr = curTbl.rows.length;
        for (i = 0; i < Lenr; i++)
        {        var Lenc = curTbl.rows(i).cells.length;
            for (j = 0; j < Lenc; j++)
            {
                oSheet.Cells(i + 1, j + 1).value = curTbl.rows(i).cells(j).innerText;
            }

        }
        oXL.Visible = true;
    }catch(e){
        $scope.ActiveXObjectError = true;
    }
}
$scope.tableToExcelGecko = (function() {
    var uri = 'data:application/vnd.ms-excel;base64,',
            template = '<html><head><meta charset="UTF-8"></head><body><table>{table}</table></body></html>',
            base64 = function(s) { return window.btoa(unescape(encodeURIComponent(s))) },
            format = function(s, c) {
                return s.replace(/{(\w+)}/g,
                        function(m, p) { return c[p]; }) }
    return function(tableNode, name) {
        var ctx = {worksheet: name || 'Worksheet', table: eval("tableNode.innerHTML")}
        window.location.href = uri + base64(format(template, ctx))
    }
})()
$scope.tableToExcelGecko = function (tableNode)
{
    var dt = new Date();
    var day = $scope.adjustDateString(dt.getDate());
    var month = $scope.adjustDateString(dt.getMonth() + 1);
    var year = dt.getFullYear();
    var hour = $scope.adjustDateString(dt.getHours());
    var mins = $scope.adjustDateString(dt.getMinutes());
    var secs = $scope.adjustDateString(dt.getSeconds())
    var postfix = year + month + day + hour + mins + secs;
    var a = document.createElement('a');
    var data_type = 'data:application/vnd.ms-excel';
    a.href = data_type + ', ' + encodeURIComponent(tableNode.outerHTML);
    a.download = '各品类模型审核状态统计' + postfix + '.xls';
    a.click();
}
//form post hidden area
        $scope.postToExcel = function(){
            var options = {
              url:'//localhost:9012/mw/respondexcel',
              data:[{"id":16086,"name":"舒"},{"id":10001,"name":"zhuwei"}],
              method:'post'
            };
            var config = $.extend(true, { method: 'post' }, options);
            var $iframe = $('<iframe id="down-file-iframe" />');
            var $form = $('<form target="down-file-iframe" method="' + config.method + '" />');
            $form.attr('action', config.url);
//          for (var key in config.data) {
//              $form.append('<input type="hidden" name="' + key + '" value="' + config.data[key] + '" />');
//          }
            $form.append('<input type="hidden" name="data" value=' + encodeURIComponent(JSON.stringify(config.data)) + ' />');
            $iframe.append($form);
            $(document.body).append($iframe);
            $form[0].submit();
            $iframe.remove();
        }
//$scope.queryCategoryAuditMap = {
//      "passActive":"&auditStatus=0&status=1",
//		"passInactive":"&auditStatus=0&status=2",
//		"wait":"&auditStatus=1",
//		"fail":"&auditStatus=2"
//}
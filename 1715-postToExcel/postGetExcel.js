//postGetExcel @arguments[0] tableNode
        $scope.postGetExcel = function(tableClass,headCount){
            $scope.downloading = true;
            var tableNode = $('.' + tableClass)[0];
            var listBodyArray = $scope.parseTableNodeToArray(tableNode)
            //package to json
            var reqJson = {"sheetName": "","headCount": headCount,"tabBody": listBodyArray}
            $scope.postToExcel(reqJson)
        }
        $scope.parseTableNodeToArray = function(tableNode){
            var listBodyArray = [];
            var listArray = [];
            for (var i = 0, row; row = tableNode.rows[i]; i++) {
                for (var j = 0, col; col = row.cells[j]; j++) {
            	    listArray.push(col.innerText)
            	    if(col.colSpan > 1) {
            	        var nbsp = col.colSpan;
            	        while(--nbsp) listArray.push("");
            	    }
                }
                listBodyArray.push(listArray);
                listArray = [];
            }
            return listBodyArray;
        }
        $scope.postToExcel = function(reqJson){
            $http({
                url: '/mw/respondexcel/ezhome',
                method: "POST",
                data: reqJson,
                headers: {
                   'Content-type': 'application/json'
                },
                responseType: 'arraybuffer'
            }).success(function (data, status, headers, config) {
                $scope.downloading = false;
                var blob = new Blob([data], {type: "application/vnd.ms-excel"});
                var objectUrl = URL.createObjectURL(blob);
                var aForExcel = $("<a><span id='forExcel'>_excel</span></a>")
                                .attr("href", objectUrl)
                                .attr("download", '模型统计' + $scope.getFilePostfix() + '.xlsx');
                $("body").append(aForExcel);
                $("#forExcel").click();
                window.URL.revokeObjectURL(aForExcel.href);
                aForExcel.remove();
            }).error(function (data, status, headers, config) {
            //config carries request payload (data,header,method,url...
                alert("status: " + status + ", unexpected error!")
                $scope.downloading = false;
            });
        }
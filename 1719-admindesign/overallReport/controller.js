cmtoolApp.controller('CtrlOverallReport', [
    '$window',
    'base64',
    '$timeout',
    '$rootScope',
    '$routeParams',
    '$scope',
    '$http',
    'PageData',
    '$q',
    '$filter',
    '$location',
    'ProductIO',
    'ProductService',
    'LocaleService',
    'UserService',
    function($window, base64, $timeout, $rootScope, $routeParams, $scope, $http, PageData, $q, $filter, $location, ProductIO, ProductService, LocaleService, UserService) {
        $scope.loading = true;
        //TODO get company statustics
        $scope.userRoles = $rootScope.RoleEnum;
        $scope.user = UserService.get();
        var userRole = ($scope.user) ? $scope.user.role.name : "";
        $scope.isAdmin = userRole === $scope.userRoles.ADMIN;
        $scope.isModelUploaderRole = userRole === $scope.userRoles.MODEL_UPLOADER;

        $scope.adjustDateString = function(num){
            var resultString = "";
            if(num<10){
                resultString = "0" + num;
            }
            else{
                resultString = num;
            }
            return resultString;
        }
        var d = new Date();
        $scope.statisticDate = d.toLocaleString().substring(0,10);
        $scope.todayTimeRange = d.getFullYear() + "-"+($scope.adjustDateString(d.getMonth() + 1)) + "-"
                            			+ ($scope.adjustDateString(d.getDate())) + "T00:00:00.000ZTO" +
                            d.getFullYear() + "-"+($scope.adjustDateString(d.getMonth() + 1)) + "-"
                            			  + ($scope.adjustDateString(d.getDate())) + "T23:59:59.000Z";


//        $scope.data = { 'auditRange': 'showAll' };

        $scope.mouseover = function($event) {
            var elem = $event.currentTarget || $event.srcElement;
            var thisElement = angular.element(elem);
            if (!thisElement.hasClass('hover')) {
                thisElement.addClass('hover');
            }

        };
        $scope.mouseout = function($event) {
            var elem = $event.currentTarget || $event.srcElement;
            var thisElement = angular.element(elem);
            if (thisElement.hasClass('hover')) {
                thisElement.removeClass('hover');
            }
        };

        $scope.drawCoStats = [];
        $scope.drawCoHisStats = [];

        $scope.refreshSearchResults = function(submit_time_range) {
            $scope.loading = true;
            $scope.companies.forEach(function(company){
                $scope.queryDrawCoAuditFacet(company, submit_time_range);
            });

        };

        $scope.readAuditFacetWait = 0;
        $scope.queryDrawCoAuditFacet = function(company, submit_time_range) {
            var data = {
                userIds: company.drawerIds,
                attributes: [],
                fieldsToStat: [],
                assetType:[4,6],
                fieldsToStat:["auditStatus"],
                offset: 0,
                limit: 0,
                sortField: "lastTimeModified",
                sortOrder: "desc"
            };

            if(submit_time_range == "showToday"){
                data['timeField'] = "submitTime";
                data['timeRange'] = $scope.todayTimeRange;
            }
            //todo facet
            ProductIO.searchProducts(data).then(function(res){
                var resultArr = res.data.facetResults.auditStatus;
                //console.log(resultArr);
                var rowObj = {companyName: company.name,pending:0,pass:0,reject:0,submitSum:0,passRate:"-"};

                $.each(resultArr, function(index, item){
                    if(item.id == "1") rowObj.pending = item.count;
                    else if(item.id == "0") rowObj.pass = item.count;
                    else if(item.id == "2") rowObj.reject = item.count;
                });
                rowObj.submitSum = rowObj.pending + rowObj.pass + rowObj.reject;
                rowObj.passRate = rowObj.submitSum==0?"-":((rowObj.pass/rowObj.submitSum*100).toFixed(1) + "%");
                if(submit_time_range == "showToday"){
                    $scope.drawCoStats.push(rowObj);
                }else{
                    $scope.drawCoHisStats.push(rowObj);
                }

                $scope.readAuditFacetWait ++;
//                console.log(company.name + $scope.readAuditFacetWait);
                if($scope.readAuditFacetWait == $scope.drawCoLength*2){
                    $scope.addUpTotal($scope.drawCoStats);
                    $scope.addUpTotal($scope.drawCoHisStats);
                    $scope.loading = false;
                }
            },
            function(err){
                cmtoolDialog.alert($filter('translate')('servererror_normal'));
            });
        };

        $scope.addUpTotal = function(stat){
            var rowObj = {companyName: "合计",pending:0,pass:0,reject:0,submitSum:0,passRate:"-"};
            stat.forEach(function(row){
                rowObj.pending += row.pending;
                rowObj.pass += row.pass;
                rowObj.reject += row.reject;
                rowObj.submitSum += row.submitSum;
            });
            rowObj.passRate = rowObj.submitSum==0?"-":((rowObj.pass/rowObj.submitSum*100).toFixed(1) + "%");
            stat.push(rowObj);
        };

        $scope.readDrawersWait = 0;
        ProductIO.getCompaniesInfo().then(function(res){
            $scope.companiesData = res.data;
            $scope.companies = angular.copy($scope.companiesData.groups);
            $scope.drawCoLength = $scope.companies.length;
            $scope.companies.forEach(function(company){
                ProductIO.getCompanyDrawers(company.gid,0,2000).then(function(res){
                    company.drawerIds = [];
                    res.data.users.forEach(function(user){
                        company.drawerIds.push(user.uid);
                    });
                    $scope.readDrawersWait ++;
                    if($scope.readDrawersWait == $scope.drawCoLength){
//                        console.log($scope.companies);
                        $scope.refreshSearchResults("showToday");
                        $scope.refreshSearchResults("showAll");
                        //todo refresh search results
                    }
                }, function(err){cmtoolDialog.alert('get drawers info error');})
            });
        }, function(err){cmtoolDialog.alert('get company info error');});

    }
]);

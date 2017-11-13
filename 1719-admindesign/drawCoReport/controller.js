cmtoolApp.controller('CtrlDrawCoReport', [
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
        //TODO query data - draw company report
        $scope.userRoles = $rootScope.RoleEnum;
        $scope.user = UserService.get();
        var userRole = ($scope.user) ? $scope.user.role.name : "";
        $scope.isAdmin = userRole === $scope.userRoles.ADMIN;
        $scope.isModelUploaderRole = userRole === $scope.userRoles.MODEL_UPLOADER;

        $scope.selectedCompany = { id: '', title: ''};
        $scope.totalDrawersCount = 0;
        $scope.drawerAuditStats = [];

        $scope.mouseover = function($event) {
            var elem = $event.currentTarget || $event.srcElement
            var thisElement = angular.element(elem);
            if (!thisElement.hasClass('hover')) {
                thisElement.addClass('hover');
            }

        };
        $scope.mouseout = function($event) {
            var elem = $event.currentTarget || $event.srcElement
            var thisElement = angular.element(elem);
            if (thisElement.hasClass('hover')) {
                thisElement.removeClass('hover');
            }
        };
        $scope.onKeyChanged = function($event){
            var keycode = $event.which || $event.keyCode
            if (keycode === 13) {
                var reg = /^[0-9]+$/;
                if(reg.test($scope.currentPageJumpNo)){
                    if($scope.currentPageJumpNo > $scope.totalPages){
                        $scope.currentPageJumpNo = $scope.totalPages
                    }else if($scope.currentPageJumpNo < 1){
                        $scope.currentPageJumpNo = 1
                    }
                    $scope.currentPage = $scope.currentPageJumpNo - 1;
                    $('#products-pagination').twbsPagination('destroy');
                    $scope.refreshSearchResults(true);
                }
            }
        }

         // available PAGE params
         $scope.productsPerPage = {
             selected: 10,
             options: [10, 20, 50, 100]
         };
         $scope.currentPage = 0;
         // items on page functionality
         $scope.onItemsOnPageChanged = function() {
             $scope.currentPage = 0;
             $scope.refreshSearchResults(true);
         };


        $scope.drawers = [];

        //todo invoke fpmw service to get USERS by company_name
        $scope.refreshSearchResults = function(refreshPagePlugin) {
            $scope.refreshPagePlugin = refreshPagePlugin;
            $scope.loading = true;
            $scope.drawers = [];
            $scope.drawerAuditStats = [];
            $scope.readAuditFacetWait = 0;
            ProductIO.getCompanyDrawers($scope.selectedCompany.id,
                                        $scope.currentPage * $scope.productsPerPage.selected,
                                        $scope.productsPerPage.selected ).then(function(res){
                $scope.totalDrawersCount = res.data.total;
                $scope.drawers = res.data.users;
                $scope.drawers.forEach(function(drawer){
                    $scope.queryDrawerAuditFacet(drawer);
                });
            }, function(err){cmtoolDialog.alert('get drawers info error');})
        };

        $scope.readAuditFacetWait = 0;
        $scope.queryDrawerAuditFacet = function(drawer) {
            var data = {
                userIds: [drawer.uid],
                attributes: [],
                assetType:[4,6],
                fieldsToStat:["auditStatus"],
                offset: 0,
                limit: 0,
                sortField: "lastTimeModified",
                sortOrder: "desc"
            };
            //todo facet
            ProductIO.searchProducts(data).then(function(res){
                var resultArr = res.data.facetResults.auditStatus;
                //console.log(resultArr);
                var rowObj = {nickname: drawer.nickname,phone:drawer.phone,pending:0,pass:0,reject:0,submitSum:0,passRate:"-"};

                $.each(resultArr, function(index, item){
                    if(item.id == "1") rowObj.pending = item.count;
                    else if(item.id == "0") rowObj.pass = item.count;
                    else if(item.id == "2") rowObj.reject = item.count;
                });
                rowObj.submitSum = rowObj.pending + rowObj.pass + rowObj.reject;
                rowObj.passRate = rowObj.submitSum==0?"-":((rowObj.pass/rowObj.submitSum*100).toFixed(1) + "%");
                $scope.drawerAuditStats.push(rowObj);

                $scope.readAuditFacetWait ++;
                if($scope.readAuditFacetWait == $scope.drawers.length){
//                    console.log($scope.drawerAuditStats);
                    if($scope.refreshPagePlugin) $scope.refreshPagination($scope.totalDrawersCount);
                    $scope.loading = false;
                }
            },
            function(err){
                cmtoolDialog.alert($filter('translate')('servererror_normal'));
            });
        };

        // todo pagination
        $scope.refreshPagination = function(totalCount) {
            if ($scope.drawers.length > 0) {
                var totalPages = Math.ceil(totalCount / $scope.productsPerPage.selected);
                $scope.totalPages = totalPages;
                var twbsParams = {
                    totalPages: totalPages,
                    visiblePages: Math.min(5, totalPages),
                    startPage: $scope.currentPage + 1,
                    first: "首页",
                    prev: "上一页",
                    next: "下一页",
                    last: "末页",
                    //startPage: 1,
                    onPageClick: function(event, page) {
                        $scope.currentPage = page - 1;
                        $scope.refreshSearchResults(false);
                    }
                };
                $('#products-pagination').empty();
                $('#products-pagination').removeData("twbs-pagination");
                $('#products-pagination').unbind("page");
                $('#products-pagination').twbsPagination(twbsParams);
            }
        };


        $scope.onCompanyChanged = function() {
//            console.log($scope.selectedCompany);
            $scope.refreshSearchResults(true);
        }

        $scope.readDrawersWait = 0;
        ProductIO.getCompaniesInfo().then(function(res){
            $scope.companiesData = res.data;
            $scope.companies = angular.copy($scope.companiesData.groups);
            $scope.drawCoLength = $scope.companies.length;
            $scope.availableCompanies = [];
            $scope.companies.forEach(function(company){
                $scope.availableCompanies.push({id:company.gid, title:company.name});
                $scope.readDrawersWait ++;
                if($scope.readDrawersWait == $scope.drawCoLength){
//                    console.log($scope.availableCompanies);
                    $scope.selectedCompany = $scope.availableCompanies[0];
                    $scope.refreshSearchResults(true);
                    //todo refresh search results
                }
            });
        }, function(err){cmtoolDialog.alert('get company info error');});

    }
]);

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
                    $('#products-pagination').twbsPagination('destroy');//删除viewstate
                    $scope.refreshSearchResults(true);
                }
            }
        }
		
// pagination
$scope.refreshPagination = function(totalProducts) {
    if ($scope.products.length > 0) {
        var totalPages = Math.ceil(totalProducts / $scope.productsPerPage.selected);
        $scope.totalPages = totalPages;
        var twbsParams = {
            totalPages: totalPages,
            visiblePages: Math.min(5, totalPages),
            startPage: $scope.currentPage + 1,
            first: "首页",
            prev: "上一页",
            next: "下一页",
            last: "末页",
            onPageClick: function(event, page) {
                $scope.currentPage = page - 1;
                $scope.refreshSearchResults(false);
            }
        };
        $('#products-pagination').empty();
        $('#products-pagination').removeData("twbs-pagination");
        $('#products-pagination').unbind("page");//删除viewstate
        $('#products-pagination').twbsPagination(twbsParams);
    }
};
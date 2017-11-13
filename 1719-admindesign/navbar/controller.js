cmtoolApp.controller('CtrlNavigator', ["$rootScope", "$scope", "$http", "UserService", "AuthService", "AUTH_EVENTS", '$location','$window', 'StorageService',
    function($rootScope, $scope, $http, UserService, AuthService, AUTH_EVENTS, $location, $window, StorageService) {
        $scope.userRoles = $rootScope.RoleEnum;
        $scope.user = UserService.get();
        var userRole = ($scope.user) ? $scope.user.role.name : "";
        $scope.isAdmin = userRole === $scope.userRoles.ADMIN;
        $scope.isModelUploaderRole = userRole === $scope.userRoles.MODEL_UPLOADER;

        $scope.title = "户型库审核后台";
        $scope.dbg = ($location.search().dbg === "true");

        $scope.showAbout = function() {
            cmtoolDialog.alert('户型库审核后台, version ' + cmtoolConsts.appVersion);
        };

        $scope.logout = function() {
//            AuthService.logout().then(function() {
//                //$rootScope.redirectToLogin();
//            }, function(message) {
//                // Pop up error window.
//            });
              StorageService.remove("currentUser");
              StorageService.remove("access_token");
              StorageService.remove("isssouser");
              var shejijiaPage = cmtoolConsts.URLForSSOLogout
              $window.location.href = shejijiaPage;
        };
        $scope.currentUrl = $location.url();
        $scope.$on('$routeChangeStart', function(next, current) {
            $scope.currentUrl = $location.url();
        });

        var update = function() {
            $scope.moduleId = "";
            $scope.user = UserService.get();

            var user = $scope.user;
            var tenantId = $rootScope.tenantId;
            $scope.userRoles = $rootScope.RoleEnum;
            var userRole = (user) ? user.role.name : "";
            $scope.isAdmin = userRole === $scope.userRoles.ADMIN ||
                userRole === $scope.userRoles.TENANT_ADMIN;
            $scope.isVendorRole = userRole === $scope.userRoles.VENDOR;
            $scope.isModelUploaderRole = userRole === $scope.userRoles.MODEL_UPLOADER;
            $scope.isSSORole = userRole === $scope.userRoles.SSO_VENDOR;


            $scope.showTenant = !$scope.editTenant && user && tenantId != "";
        };
        $scope.$on(AUTH_EVENTS.loginSuccess, update);
        $scope.$on(AUTH_EVENTS.loginFailed, update);
        //$scope.$on(AUTH_EVENTS.logoutSuccess, update);
        $scope.$on(AUTH_EVENTS.sessionTimeout, update);
        $scope.$on(AUTH_EVENTS.notAuthenticated, update);
        $scope.$on(AUTH_EVENTS.authenticated, update);

        //update();
    }
]);

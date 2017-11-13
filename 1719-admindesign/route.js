//Define Routing for admin-design app only.

cmtoolApp.constant("ViewManifest", {
    '/': {
        templateUrl: 'appversion/app/components/home/view.html'
    },
    '/:tenantId/manageproduct': {
        templateUrl: 'appversion/app/components/manageproduct/view.html',
        controller: 'CtrlManageProduct',
        data: {
            permission: AppModule.ProductsManage
        }
    }
    ,
    '/:tenantId/overallReport': {
        templateUrl: 'appversion/app/components/overallReport/view.html',
        controller: 'CtrlOverallReport',
        data: {
            permission: AppModule.ReportOverall
        }
    },
    '/:tenantId/drawCoReport': {
        templateUrl: 'appversion/app/components/drawCoReport/view.html',
        controller: 'CtrlDrawCoReport',
        data: {
            permission: AppModule.ReportDrawCo,
        }
    }
});

cmtoolApp.config(['$routeProvider', 'ViewManifest', function($routeProvider, ViewManifest) {

    var addGlobalResolveToRoutes = function(manifest) {
        for (var p in manifest) {
            if (manifest.hasOwnProperty(p)) {
                manifest[p].resolve = {
                    app: ['$rootScope', function($rootScope) {
                        return $rootScope.initApp();
                    }]
                };
            }
        }
        return manifest;
    };

    var routes = addGlobalResolveToRoutes(ViewManifest);
    for (var p in routes) {
        if (routes.hasOwnProperty(p)) {
            $routeProvider.when(p, routes[p]);
        }
    }

    $routeProvider.
//    when('/signup', {
//        templateUrl: 'appversion/app/components/signup/view.html',
//        controller: 'CtrlSignup',
//    }).
    when('/login', {
        templateUrl: 'appversion/app/components/login/view.html',
        controller: 'CtrlLogin',
    }).
    otherwise({
        redirectTo: '/'
    });
}]);

var app = angular.module(
    "LegoViz",
    ["ngResource", "ngSanitize", "ngRoute", "ui.bootstrap"]
);

app
    .config(function ($routeProvider, $locationProvider, $httpProvider) {
        $routeProvider.otherwise({
            templateUrl: "app/scoreboard.html",
            controller: "scoreboardCtrl"
        });
    });

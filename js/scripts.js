(function() {
    var app = angular.module("martingaleDemo", ["ngRoute"]);

    app.config(function($routeProvider) {
        $routeProvider.when("/", {
            templateUrl : "start.html",
            controller : "GameController"
        });
    });

    app.factory("$gameService", function() {
        var game = null;

        function hasValidData()  {
            return game !== null && !isNaN(game.maxBet) && game.maxBet > 0 && !isNaN(game.initialBet) && game.initialBet > 0 && !isNaN(game.target) && game.target > 0;
        }

        function setRoi() {
            if (game !== null && game.maxBet != 0) {
                game.roi = (game.target / game.maxBet) * 100;
                game.roiFormat = game.roi.toFixed(2) + "%";
            } else {
                game.roi = 0;
                game.roiFormat = "0%";
            }
        }

        function setGameStats() {
            if (hasValidData()) {
                game.neededRounds = Math.ceil(game.target /  game.initialBet);
                game.maxTries = Math.floor(Math.log2(game.maxBet / game.initialBet) + 1);
                game.probability = Math.pow(1 - Math.pow(1/2, game.maxTries), game.neededRounds);
                game.probabilityFormat = game.probability.toFixed(2) + " in 1";
            } else {
                game.neededRounds = 0;
                game.maxTries = 0;
                game.probabilityFormat = null;
                game.probability = null;
            }
        }

        return {
            set : function(data) {
                game = data;
            },
            get : function() {
                return game;
            },
            reset : function() {
                game = {
                    initialBet : 1,
                    maxBet : 100,
                    target: 30,
                    roi : 0,
                    roiFormat : "",
                    neededRounds : 0,
                    maxTries : 0,
                    probability : 0,
                    probabilityFormat : 0,
                };
            },
            updateData : function() {
                setRoi();
                setGameStats();
            },
            validateLimits : function() {
                if (parseInt(game.maxBet) < parseInt(game.initialBet)) {
                    game.maxBet = game.initialBet;
                }
            },
            getValidation : function() {
                function validateIsNumberGreater0(value) {
                    return !isNaN(value) && parseInt(value) > 0;
                }

                var initialBetValidated = validateIsNumberGreater0(game.initialBet);
                var targetValidated = validateIsNumberGreater0(game.target);
                var maxBetValidated = validateIsNumberGreater0(game.maxBet);

                return {
                    initialBet : initialBetValidated,
                    target : targetValidated,
                    maxBet : maxBetValidated,
                    hasErrors : !initialBetValidated || !targetValidated || !maxBetValidated
                }
            }
        }
    });

    app.controller("GameController", function($scope, $gameService) {
        $scope.init = function() {
            $gameService.reset();
            $scope.game = $gameService.get();
        };

        $scope.$watchGroup(["game.maxBet", "game.target", "game.initialBet"], function(newValue, oldValue) {
            $gameService.updateData();
        });

        $scope.startGame = function() {
            $scope.validation = {};
            var validation = $gameService.getValidation();
            if (!validation.initialBet) {
                $scope.validation.initialBet = "The initial bet must be a number greater than 0";
            }
            if (!validation.target) {
                $scope.validation.target = "The earnings target must be a number greater than 0";
            }
            if (!validation.maxBet) {
                $scope.validation.target = "The maximum bet must be a number greater than 0";
            }
            if (!validation.hasErrors) {
                // start game
            }
        };
        $scope.validateLimits = $gameService.validateLimits;
    });
})();
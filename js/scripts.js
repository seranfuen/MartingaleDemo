(function() {
    var app = angular.module("martingaleDemo", ["ngRoute"]);

    app.config(function($routeProvider) {
        $routeProvider.when("/", {
            templateUrl : "start.html",
            controller : "GameController"
        }).when("/game", {
            templateUrl : "game.html",
            controller: "RoundController"
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
                game.currentTries = game.maxTries;
                game.probability = Math.pow(1 - Math.pow(1/2, game.maxTries), game.neededRounds);
                game.probabilityFormat = game.probability.toFixed(2) + " in 1";
            } else {
                game.neededRounds = 0;
                game.maxTries = 0;
                game.currentTries = 0;
                game.probabilityFormat = null;
                game.probability = null;
            }
        }

        function generateRandomBool() {
            return Math.random() >= 0.5;
        }

        function getRandomColor() {
            var randomBool = generateRandomBool();
            return randomBool ? "red" : "black";
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
                    currentBet : 0,
                    currentRound : 0,
                    totalWonRounds: 0,
                    earnings: 0,
                    roundHistory : [],
                    gameOver : false
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
            },
            startGame : function() {
                game.currentBet = game.initialBet;
                game.currentRound = 1;
            },
            playBet : function(color) {
                if (game.gameOver) return;

                var randomColor = getRandomColor();
                var betWon = randomColor === color;
                var gameWon = false;
                var roundContinue = false;
                var betResult = null;
                var gameOver = false;

                if (betWon) {
                    game.earnings += game.initialBet;
                    gameWon = game.earnings >= game.target;
                    game.totalWonRounds++;
                    if (!gameWon) {
                        game.currentRound++;
                        game.currentBet = game.initialBet;
                        game.currentTries = game.maxTries;
                        game.roundHistory = [];
                    } else {
                        gameOver = true;
                    }
                } else {
                    game.currentTries--;
                    if (game.currentTries > 0) {
                        game.currentBet *= 2;
                        roundContinue = true;
                        game.roundHistory.push(randomColor);
                    } else {
                        gameOver = true;
                   }
                }
                betResult = {
                    color : randomColor,
                    userColor : color,
                    betWon : betWon,
                    gameWon : gameWon,
                    roundContinue : roundContinue,
                    gameOver : gameOver
                };
                return betResult;
            }
        }
    });

    app.controller("GameController", function($scope, $gameService, $location) {
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
                $location.path("game");
            }
        };
        $scope.validateLimits = $gameService.validateLimits;
    });

    app.controller("RoundController", function($scope, $gameService) {
        $scope.init = function() {
            $scope.game = $gameService.get();
            $gameService.startGame();
        };

        $scope.placeBet = function(color) {
            var result = $gameService.playBet(color);
            $scope.$broadcast("betPlaced", result);
        };
    });

    app.directive("betButtons", function() {
        return {
            templateUrl: "buttons.html",
            link: function(scope, element, attr) {

                function getMessageClass(result) {
                    if (result.gameWon || result.betWon) {
                        return "good-message";
                    } 
                    else {
                        return "bad-message";
                    }
                }

                function getMessage(result) {
                    if (result.gameOver) {
                        if (result.gameWon) {
                            return "You won the game!";
                        } 
                        else {
                            return "You ran out of money. You are now in debt and broke!";
                        }
                    } 
                    else if (result.betWon) {
                        return "You won the bet. Continue to the next round";
                    } 
                    else {
                        return "You lost your bet. You are doubling your wager now to try to compensate";
                    }
                }

                function setMessage(result) {
                    scope.messageClass = getMessageClass(result);
                    scope.resultMessage = getMessage(result);
                }

                scope.$on("betPlaced", function(events, args) {
                    setMessage(args);
                    if (args.gameOver) {
                        $("#button-container").fadeOut("fast");
                    }
                });
            }
        };
    });
})();
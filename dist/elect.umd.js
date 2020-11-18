(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["elect"] = factory();
	else
		root["elect"] = factory();
})(self, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./Election.js":
/*!*********************!*\
  !*** ./Election.js ***!
  \*********************/
/*! unknown exports (runtime-defined) */
/*! runtime requirements: module, __webpack_require__ */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var proto = __webpack_require__(/*! proto */ "./node_modules/proto/proto.js")

var utils = __webpack_require__(/*! ./utils */ "./utils.js")
var aggregateFns = __webpack_require__(/*! ./aggregateFns */ "./aggregateFns.js")
var random = utils.random

var Election = module.exports = proto(function() {
    this.init = function(numberOfVoters, numberOfCandidates, numberOfSocietalOptions) {

        var voters = [], candidates = []
        for(var j=0;j<numberOfVoters;j++) {
            voters.push(generatePerson(numberOfSocietalOptions))
        }
        for(var j=0;j<numberOfCandidates;j++) {
            candidates.push(generatePerson(numberOfSocietalOptions))
        }

        var netUtilities = findNetUtilities(voters)
        var optimalOutcomes = netUtilities.map(function(optionUtility) {
            return optionUtility > 0
        })
        var leastOptimalOutcomes = optimalOutcomes.map(function(outcome) {
            return !outcome
        })

        this.maxUtility = totalOutcomeUtility(voters, optimalOutcomes)
        this.minUtility = totalOutcomeUtility(voters, leastOptimalOutcomes)
        this.maxRegret = this.maxUtility - this.minUtility
        this.voters = voters
        this.candidates = candidates

        this.aggregates = {}
        for(var k in aggregateFns) {
            this.addAggregateFn(k, aggregateFns[k])
        }
    }

    // returns an array of winning candidates represented by objects that have the properties:
        // weight - That winner's voting weight in the legislature
        // utilities - That winner's option utilities (in the same form as returned by generatePerson)
    // algorithm(votes, candidates) - A function that should return the winning candidates in the same form as this.elect returns
    // strategy(voter, candidates) - A function that should return the given voter's vote in whatever form that algorithm requires
    this.elect = function(algorithm, strategy, voters, candidates, maxWinners) {
        var votes = voters.map(function(voter, index) {
            var voterAggregates = {}
            for(var k in this.aggregates) {
                voterAggregates[k] = this.aggregates[k][index]
            }

            return strategy(voter, voterAggregates)
        }.bind(this))

        var results = algorithm(votes, candidates, maxWinners)

        results.forEach(function(winner) {
            winner.preferences = candidates[winner.index]
            if(winner.weight < 0) throw new Error("Winner weight can't be less than 0")
        })

        return results
    }

    this.addAggregateFn = function(name,fn) {
        var that = this
        if(name in this.aggregates) throw new Error("Aggregate function '"+name+"' already exists")

        var values
        Object.defineProperty(this.aggregates, name, {
            get: function() {
                if(values === undefined) {
                    values = fn.call(this, that.voters,that.candidates) // memoize
                }
                return values
            },
            enumerable:true
        })
    }

    // returns a number from 0 to 1 indicating what percentage of the maximum possible voter regret the deciders cause
    this.regretFraction = function(people, deciders) {
        var outcomes = utils.findSocietalOptionsOutcomes(deciders)
        var totalUtility = totalOutcomeUtility(people, outcomes)
        var regret = this.maxUtility - totalUtility

        return regret/this.maxRegret
    }

    // returns the total utility change for the given people if the given outcomes happened
    function totalOutcomeUtility(people, outcomes) {
        var utility = 0
        people.forEach(function(person) {
            utility += utils.voterOutcomeUtility(person, outcomes)
        })

        return utility
    }

    // returns an array where the index indicates a societal option and the value indicates
    // the net utility for that option for the people passed in
    function findNetUtilities(people) {
        var netUtility = []
        people.forEach(function(person) {
            person.forEach(function(optionUtility, index) {
                if(netUtility[index] === undefined) {
                    netUtility[index] = 0
                }

                netUtility[index] += optionUtility
            })
        })

        return netUtility
    }

    // Returns an array where each element is a number from -1 to 1 indicating the utility that person would get
    // from a given societal option (identified by the index)
    function generatePerson(numberOfSocietalOptions, optionPopularityModifiers) {
        var voter = []
        for(var n=0;n<numberOfSocietalOptions;n++) {
            if(optionPopularityModifiers) {
                modifier = optionPopularityModifiers[n]
            } else {
                modifier = 1
            }

            voter[n] = 2*random()*modifier-1
        }

        return voter
    }
})


/***/ }),

/***/ "./aggregateFns.js":
/*!*************************!*\
  !*** ./aggregateFns.js ***!
  \*************************/
/*! unknown exports (runtime-defined) */
/*! runtime requirements: module, __webpack_require__ */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var utils = __webpack_require__(/*! ./utils */ "./utils.js")

module.exports = {
    candidateDictatorUtilities: function(voters, candidates) {
        var candidateOutcomes = candidates.map(function(candidate) {
            return  utils.findSocietalOptionsOutcomes([{weight:1, preferences:candidate}])
        })
        // the utility each voter would get if each candidate were elected dictator
        return voters.map(function(voter) {
            return candidateOutcomes.map(function(outcomes) {
                return  utils.voterOutcomeUtility(voter, outcomes)
            })
        })
    }
}

/***/ }),

/***/ "./ballots.js":
/*!********************!*\
  !*** ./ballots.js ***!
  \********************/
/*! unknown exports (runtime-defined) */
/*! runtime requirements: module */
/***/ ((module) => {

var noop = function(vote){return vote}

module.exports = {
    noop: {'':noop},
    ranked: {
        "raw":noop,
        "Max 3": function(vote) {
            return vote.slice(0,3)
        }
    },
    scored: {
        "raw":noop,
        "Nearest 1-5": function(vote) {
            return vote.map(function(candidateScore) {
                return Math.round(5*candidateScore)/5
            })
        }
    }
}

/***/ }),

/***/ "./elect.js":
/*!******************!*\
  !*** ./elect.js ***!
  \******************/
/*! default exports */
/*! export Election [provided] [maybe used in main (runtime-defined)] [usage and provision prevents renaming] -> ./Election.js */
/*!   exports [maybe provided (runtime-defined)] [no usage info] */
/*! export ballots [provided] [maybe used in main (runtime-defined)] [usage and provision prevents renaming] -> ./ballots.js */
/*!   exports [maybe provided (runtime-defined)] [no usage info] */
/*! export strategies [provided] [maybe used in main (runtime-defined)] [usage and provision prevents renaming] -> ./votingStrategies.js */
/*!   exports [maybe provided (runtime-defined)] [no usage info] */
/*! export systems [provided] [maybe used in main (runtime-defined)] [usage and provision prevents renaming] -> ./votingSystems.js */
/*!   exports [maybe provided (runtime-defined)] [no usage info] */
/*! export test [provided] [maybe used in main (runtime-defined)] [usage prevents renaming] */
/*! export testSystems [provided] [maybe used in main (runtime-defined)] [usage prevents renaming] */
/*! other exports [not provided] [maybe used in main (runtime-defined)] */
/*! runtime requirements: __webpack_exports__, __webpack_require__ */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var Election = exports.Election = __webpack_require__(/*! ./Election */ "./Election.js")

var systems = exports.systems = __webpack_require__(/*! ./votingSystems */ "./votingSystems.js")
var strat = exports.strategies = __webpack_require__(/*! ./votingStrategies */ "./votingStrategies.js")
var ballots = exports.ballots = __webpack_require__(/*! ./ballots */ "./ballots.js")


// For each system:
// algorithm
    // takes in an array of votes where each vote is the output of a given `strategy` for the system
    // returns an object where each key is a winner, and each value is an object with the properties:
        // weight - the winner's vote weight
        // preferences - the winner's voting preferences for each societal option
// each strategy:
    // returns a "vote", a set of data used by votingSystem to determine winners
exports.testSystems = {
    'Power Instant Runoff': {
        winners: [1], // [1,3],
        strategies: strat.ranked,
        ballots: ballots.ranked,
        systems: systems.powerInstantRunoff
    },
}

// exports.testSystems = {
//     Random: {
//         winners: [1,3],
//         strategies: strat.noop,
//         systems: systems.random
//     },
//     'Random Voters\' Choice': {
//         winners: [1,3],
//         strategies: strat.ranked,
//         ballots: ballots.ranked,
//         systems: systems.randomVotersChoice
//     },
//     Plurality: {
//         winners: [1,3],
//         strategies: strat.ranked,
//         ballots: ballots.ranked,
//         systems: systems.plurality
//     },
//     Range: {
//         winners: [1,3],
//         strategies: strat.scored,
//         systems: systems.scored,
//         ballots: ballots.scored
//     },
//     'Single-Transferable Vote': {
//         winners: [1,3],
//         strategies: strat.ranked,
//         ballots: ballots.ranked,
//         systems: systems.singleTransferableVote
//     },
//     'Proportional Ranked, 15-Percent Threshold': {
//         winners: [3],//[1,3],
//         strategies: strat.ranked,
//         ballots: ballots.ranked,
//         systems: systems.singleTransferableVote
//     },
//     'Proportional Ranged': {
//         winners: [3, Infinity],//[1,3, Infinity],
//         strategies: strat.scored,
//         ballots: ballots.scored,
//         systems: {
//             'split-weight, 0% threshold': systems.directRepresentativeRanged['split-weight, 0% threshold'],
//             'highest-weight, 20% threshold': systems.directRepresentativeRanged['highest-weight, 20% threshold'],
//             'split-weight, minority-max, 20% threshold': systems.directRepresentativeRanged['split-weight, minority-max, 20% threshold'],
//             'split-weight, <b>reweighted</b>': systems.directRepresentativeRanged['split-weight, <b>reweighted</b>'],
//             'equal-weight, <b>reweighted</b>': systems.directRepresentativeRanged['split-weight, <b>reweighted</b>'],
//         }
//     },
// }

exports.test = function(resultsDiv, options, votingSystems) {
    if(votingSystems === undefined) throw new Error("No voting systems to test")

    var numberOfSocietalOptions = options.issues,
        numberOfCandidates = options.candidates,
        numberOfVoters = options.voters,
        iterations = options.iterations

    var knobsOutput = '<div>Societal Options: '+numberOfSocietalOptions+'</div>'+
                      '<div>Candidates: '+numberOfCandidates+'</div>'+
                      '<div>Voters: '+numberOfVoters+'</div>'+
                      '<div>Iterations: '+iterations+'</div>'+
                      '<br>'

    var n=1, totalRegretFractionSumPerSystem = {}, totalWinnersPerSystem = {}
    function iteration(complete) {
        var election = Election(numberOfVoters, numberOfCandidates, numberOfSocietalOptions)

        for(var systemName in votingSystems) {
            var votingSet = votingSystems[systemName]

            console.log("Running: " + systemName);

            var curBallots = votingSet.ballots
            if(curBallots === undefined) {
                curBallots = ballots.noop
            }

            for(var strategyName in votingSet.strategies) {
                var rawStrategy = votingSet.strategies[strategyName]
                for(var ballotName in curBallots) {
                    var ballot = curBallots[ballotName]
                    var ballotStrategyName = strategyName+' '+ballotName
                    var strategy = function() {
                        return ballot(rawStrategy.apply(this,arguments))
                    }

                    for(var algorithmName in votingSet.systems) {
                        votingSet.winners.forEach(function(maxWinners) {
                            var winners = election.elect(votingSet.systems[algorithmName], strategy, election.voters, election.candidates, maxWinners)
                            var regretFraction = election.regretFraction(election.voters, winners)

                            var systemStrategyName = getVotingTypeName(systemName, ballotStrategyName, algorithmName, maxWinners)
                            if(totalRegretFractionSumPerSystem[systemStrategyName] === undefined) {
                                totalRegretFractionSumPerSystem[systemStrategyName] = 0
                                totalWinnersPerSystem[systemStrategyName] = 0
                            }

                            totalRegretFractionSumPerSystem[systemStrategyName] += regretFraction
                            totalWinnersPerSystem[systemStrategyName] += winners.length
                        })
                    }
                }
            }
        }

        resultsDiv.innerHTML = resultsHtml(n/iterations, true)
        setTimeout(function() {
            if(n<iterations) {
                iteration(complete)
                n++
            } else {
                complete()
            }
        })
    }

    var resultsHtml = function(completionFraction, sort) {
        var content = knobsOutput+'Completion: '+Number(100*completionFraction).toPrecision(3)+'%<br>'+
                      '<div><b>Voter Satisfaction Averages (inverse of Bayesian Regret):</b></div>'+
                      '<table>'

        Object.keys(totalRegretFractionSumPerSystem).map(function(name) {
            return {name:name, totalRegret:totalRegretFractionSumPerSystem[name]}
        }).sort(function(a,b) {
            if(sort) {
                return a.totalRegret - b.totalRegret
            } else {
                return 0
            }
        }).forEach(function(votingType) {
            var systemStrategyName = votingType.name
            var totalRegret = votingType.totalRegret

            var averageRegretFraction = totalRegret/n
            var avgWinners = (totalWinnersPerSystem[systemStrategyName]/n).toPrecision(2)

            var displayAverage = Number(100*(1-averageRegretFraction)).toPrecision(2)
            content += '<tr><td style="text-align:right;">'+systemStrategyName+"</td><td><b>"+displayAverage+'%</b> with avg of '+avgWinners+' winners</td></tr>'
        })

        content+= '</table>'
        return content
    }

    iteration(function() {
        resultsDiv.innerHTML = resultsHtml(1, true)
    })
}


// The name of an election run with a particular system and strategy
function getVotingTypeName(systemName,strategyName, algorithmName, maxWinners) {
    if(strategyName === 'noname') {
        return systemName
    } else {
        return '<span style="color:rgb(0,50,150)">'+systemName+'</span> '+algorithmName+' '+strategyName+' max '+maxWinners+' winners'
    }
}


/***/ }),

/***/ "./node_modules/proto/proto.js":
/*!*************************************!*\
  !*** ./node_modules/proto/proto.js ***!
  \*************************************/
/*! unknown exports (runtime-defined) */
/*! runtime requirements: module */
/***/ ((module) => {

"use strict";

/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License*/

var noop = function() {}

var prototypeName='prototype', undefined, protoUndefined='undefined', init='init', ownProperty=({}).hasOwnProperty; // minifiable variables
function proto() {
    var args = arguments // minifiable variables

    if(args.length == 1) {
        var parent = {init: noop}
        var prototypeBuilder = args[0]

    } else { // length == 2
        var parent = args[0]
        var prototypeBuilder = args[1]
    }

    // special handling for Error objects
    var namePointer = {}    // name used only for Error Objects
    if([Error, EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError].indexOf(parent) !== -1) {
        parent = normalizeErrorObject(parent, namePointer)
    }

    // set up the parent into the prototype chain if a parent is passed
    var parentIsFunction = typeof(parent) === "function"
    if(parentIsFunction) {
        prototypeBuilder[prototypeName] = parent[prototypeName]
    } else {
        prototypeBuilder[prototypeName] = parent
    }

    // the prototype that will be used to make instances
    var prototype = new prototypeBuilder(parent)
    namePointer.name = prototype.name

    // if there's no init, assume its inheriting a non-proto class, so default to applying the superclass's constructor.
    if(!prototype[init] && parentIsFunction) {
        prototype[init] = function() {
            parent.apply(this, arguments)
        }
    }

    // constructor for empty object which will be populated via the constructor
    var F = function() {}
        F[prototypeName] = prototype    // set the prototype for created instances

    var constructorName = prototype.name?prototype.name:''
    if(prototype[init] === undefined || prototype[init] === noop) {
        var ProtoObjectFactory = new Function('F',
            "return function " + constructorName + "(){" +
                "return new F()" +
            "}"
        )(F)
    } else {
        // dynamically creating this function cause there's no other way to dynamically name a function
        var ProtoObjectFactory = new Function('F','i','u','n', // shitty variables cause minifiers aren't gonna minify my function string here
            "return function " + constructorName + "(){ " +
                "var x=new F(),r=i.apply(x,arguments)\n" +    // populate object via the constructor
                "if(r===n)\n" +
                    "return x\n" +
                "else if(r===u)\n" +
                    "return n\n" +
                "else\n" +
                    "return r\n" +
            "}"
        )(F, prototype[init], proto[protoUndefined]) // note that n is undefined
    }

    prototype.constructor = ProtoObjectFactory;    // set the constructor property on the prototype

    // add all the prototype properties onto the static class as well (so you can access that class when you want to reference superclass properties)
    for(var n in prototype) {
        addProperty(ProtoObjectFactory, prototype, n)
    }

    // add properties from parent that don't exist in the static class object yet
    for(var n in parent) {
        if(ownProperty.call(parent, n) && ProtoObjectFactory[n] === undefined) {
            addProperty(ProtoObjectFactory, parent, n)
        }
    }

    ProtoObjectFactory.parent = parent;            // special parent property only available on the returned proto class
    ProtoObjectFactory[prototypeName] = prototype  // set the prototype on the object factory

    return ProtoObjectFactory;
}

proto[protoUndefined] = {} // a special marker for when you want to return undefined from a constructor

module.exports = proto

function normalizeErrorObject(ErrorObject, namePointer) {
    function NormalizedError() {
        var tmp = new ErrorObject(arguments[0])
        tmp.name = namePointer.name

        this.message = tmp.message
        if(Object.defineProperty) {
            /*this.stack = */Object.defineProperty(this, 'stack', { // getter for more optimizy goodness
                get: function() {
                    return tmp.stack
                },
                configurable: true // so you can change it if you want
            })
        } else {
            this.stack = tmp.stack
        }

        return this
    }

    var IntermediateInheritor = function() {}
        IntermediateInheritor.prototype = ErrorObject.prototype
    NormalizedError.prototype = new IntermediateInheritor()

    return NormalizedError
}

function addProperty(factoryObject, prototype, property) {
    try {
        var info = Object.getOwnPropertyDescriptor(prototype, property)
        if(info.get !== undefined || info.get !== undefined && Object.defineProperty !== undefined) {
            Object.defineProperty(factoryObject, property, info)
        } else {
            factoryObject[property] = prototype[property]
        }
    } catch(e) {
        // do nothing, if a property (like `name`) can't be set, just ignore it
    }
}

/***/ }),

/***/ "./utils.js":
/*!******************!*\
  !*** ./utils.js ***!
  \******************/
/*! default exports */
/*! export findSocietalOptionsOutcomes [provided] [no usage info] [missing usage info prevents renaming] */
/*! export random [provided] [no usage info] [missing usage info prevents renaming] */
/*! export voterOutcomeUtility [provided] [no usage info] [missing usage info prevents renaming] */
/*! other exports [not provided] [no usage info] */
/*! runtime requirements: __webpack_exports__, module */
/***/ ((module, exports) => {



// random number between 0 and 1 (just like Math.random)
exports.random = function() {
    var randomInteger = getRandomInt(0,255)
    return randomInteger/255
}

function getRandomInt(min, max) {
    // Create byte array and fill with 1 random number
    var byteArray = new Uint8Array(1);
    window.crypto.getRandomValues(byteArray);

    var range = max - min + 1;
    var max_range = 256;
    if (byteArray[0] >= Math.floor(max_range / range) * range)
        return getRandomInt(min, max);
    return min + (byteArray[0] % range);
}

// Returns the results of a yes/no weighted majority vote on each societal preference as an array where
// each index indicates the societal option and the value is either true or false
// deciders - An array of winning candidates in the same form as this.elect returns
module.exports.findSocietalOptionsOutcomes = function(deciders) {
    var voteWeightTotal = 0
    var societalOptionsVotes = []
    deciders.forEach(function(person) {
        voteWeightTotal += person.weight
        person.preferences.forEach(function(preference, index) {
            if(societalOptionsVotes[index] === undefined) {
                societalOptionsVotes[index] = 0
            }

            if(preference > 0) {
                societalOptionsVotes[index] += person.weight
            }
        })
    })

    return societalOptionsVotes.map(function(votesForOneSocietalOption) {
        return votesForOneSocietalOption/voteWeightTotal > .5
    })
}

module.exports.voterOutcomeUtility = function(voter, outcomes) {
    var totalUtility =  0
    voter.forEach(function(utility,index) {
        if(outcomes[index])
            totalUtility += utility
    })

    return totalUtility
}

/***/ }),

/***/ "./votingStrategies.js":
/*!*****************************!*\
  !*** ./votingStrategies.js ***!
  \*****************************/
/*! unknown exports (runtime-defined) */
/*! runtime requirements: module, __webpack_require__ */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


var utils = __webpack_require__(/*! ./utils */ "./utils.js")

// votes are floating point numbers between 0 and 1
function rangeStrategy_honestExact(voter, aggregates) {
    // the maximum utility that the best dictator-candidate would give for this voter
    var maxUtility = Math.max.apply(null, aggregates.candidateDictatorUtilities)
    var minUtility = Math.min.apply(null, aggregates.candidateDictatorUtilities)

    return aggregates.candidateDictatorUtilities.map(function(utility) {
        if(maxUtility === minUtility) { // this branch prevents a divide by 0 error
            return .5
        } else {
            var utilityFraction = (utility-minUtility)/(maxUtility-minUtility)
            return utilityFraction
        }
    })
}

function rankedVote_honest(voter, aggregates) {
    var order = aggregates.candidateDictatorUtilities.map(function(candidateUtility, index) {
        return {utility: candidateUtility, index:index}
    }).sort(function(a,b) {
        return b.utility-a.utility // highest to lowest
    })

    return order.map(function(x) {
        return x.index
    })
}


module.exports = {
    ranked: {
        Honest: rankedVote_honest
    },
    scored: {
        Honest: rangeStrategy_honestExact
    },
    noop: {
        '':function(){}
    }
}

/***/ }),

/***/ "./votingSystems.js":
/*!**************************!*\
  !*** ./votingSystems.js ***!
  \**************************/
/*! unknown exports (runtime-defined) */
/*! runtime requirements: __webpack_require__, module */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var random = __webpack_require__(/*! ./utils */ "./utils.js").random


function pluralityAlg(votes, candidates, maxWinners) {
    var results = []
    for(var n=0; n<candidates.length;n++) {
        results[n] = 0
    }

    votes.forEach(function(vote) {
        results[vote[0]]++
    })

    var sortedTransformedResults = results.map(function(value,index){
        return {candidate:index,votes:value}
    }).sort(function(a,b) {
        return b.votes - a.votes // reverse sort
    })

    return sortedTransformedResults.slice(0,maxWinners).map(function(winner) {
        return {index: winner.candidate, weight:1}
    })
}


// countType can either be "normal" or "maxMinority"
    // normal is where the winners are the x candidates with the greatest total score
    // maxMinority is where each successive winner is chosen from only the votes of those who haven't chosen a winner as their top choice
    // reweighted is for a reweighted range vote described here; http://www.rangevoting.org/RRV.html
// winnerWeightType can either be "highest" or "split"
    // "highest" means winner vote weight will be the sum of the number of voters who gave that winner the highest score
    // "split" means winner vote weight is the sum of all votes
    // "equal" means each winner gets an equal vote weight
// minThreshold is a number from 0 to 1 representing the ratio of average score to the average score of the highest scoring candidate
    // note that the votes are shifted so that they're a range from 0 to 2 for the purposes of calculating this
function directRepresentationRange(countType, winnerWeightType, minThreshold) {
    return function(votes, candidates, maxWinners) {

        var winners = {}, disqualified = {}

        var countedVotes = countVotes(candidates, votes, winners, disqualified)
        var nextWinner = findNextWinner(countedVotes)
        var highestAvgScore = getAvgScore(countedVotes[nextWinner])

        countedVotes.forEach(function(info, candidate) {
            var avgScore = getAvgScore(info)
            if(avgScore < highestAvgScore*minThreshold) {
                disqualified[candidate] = true
            }
        })

        winners[nextWinner] = true

        while(Object.keys(winners).length < maxWinners && Object.keys(winners).length+Object.keys(disqualified).length < candidates.length) {
            var nextWinnerCountedVotes = countVotes(candidates, votes, winners, disqualified, countType)

            var nextWinner = findNextWinner(nextWinnerCountedVotes)
            winners[nextWinner] = true
        }

        if(winnerWeightType === 'highest') {
            var results = []
            var resultsMap = {} //maps a winner to a result index
            for(var winner in winners) {
                resultsMap[winner] = results.length
                results.push({index:winner, weight:0})
            }

            votes.forEach(function(vote) {
                var highestWinners = {}, highestWinnerScore = -Infinity
                vote.forEach(function(score, candidateIndex) {
                    if(candidateIndex in winners) {
                        if(score > highestWinnerScore) {
                            highestWinners = {}
                            highestWinners[candidateIndex] = true
                            highestWinnerScore = score
                        } else if(score === highestWinnerScore) {
                            highestWinners[candidateIndex] = true
                        }
                    }
                })

                var numberOfHighestWinners = Object.keys(highestWinners).length
                for(var winner in highestWinners) {
                    results[resultsMap[winner]].weight += 1/numberOfHighestWinners
                }
            })
        } else if(winnerWeightType === 'split') {
            var results = []
            for(var winner in winners) {
                var avgScore = countedVotes[winner].totalScore/countedVotes[winner].totalNumber
                results.push({index:winner, weight:avgScore})
            }
        } else if(winnerWeightType === 'equal') {
            var results = []
            for(var winner in winners) {
                results.push({index:winner, weight:1})
            }
        }

        return results
    }

    function getAvgScore(candidateInfo) {
        return candidateInfo.totalScore/candidateInfo.totalNumber
    }

    function findNextWinner(countedVotes) {
        var nextWinner, curWinnerScore = -Infinity
        countedVotes.forEach(function(info, candidate) {
            if(info.totalScore > curWinnerScore) {
                nextWinner = candidate
                curWinnerScore = info.totalScore
            }
        })

        return nextWinner
    }

    function countVotes(candidates, votes, winners, disqualified, countType) {
        if(winners === undefined) winners = {}
        var countedVotes = candidates.map(function(p,c){
            if(!(c in winners) && !(c in disqualified)) {
                return {totalScore:0, totalNumber:0}
            } else {
                return {totalScore:-Infinity, totalNumber:0}
            }
        })
        votes.forEach(function(vote) {
            if(countType === 'maxMinority') {
                var highestCandidates = {}, highestScore = -Infinity
                vote.forEach(function(score, candidateIndex) {
                    if(score > highestScore) {
                        highestCandidates = {}
                        highestCandidates[candidateIndex] = true
                        highestScore = score
                    } else if(score === highestScore) {
                        highestCandidates[candidateIndex] = true
                    }
                })

                for(var c in highestCandidates) {  // only count votes for people who's highest choice isn't a winner
                    if(c in winners) {
                        return; // continue
                    }
                }
            } else if(countType === 'reweighted') {
                var sumScoreForWinners = 0
                vote.forEach(function(score, candidateIndex) {
                    if(candidateIndex in winners) {
                        sumScoreForWinners += score
                    }
                })

                var weight = 1/(1+sumScoreForWinners/2)
            }

            vote.forEach(function(score, candidateIndex) {
                if(!(candidateIndex in disqualified)) {
                    var hasntChosenAWinner = !(candidateIndex in winners)
                    if(countType === 'reweighted') {
                        countedVotes[candidateIndex].totalScore += score*weight
                        countedVotes[candidateIndex].totalNumber ++
                    } else if(countType !== 'maxMinority' || hasntChosenAWinner) {  // only count votes for new potential winners
                        countedVotes[candidateIndex].totalScore += score
                        countedVotes[candidateIndex].totalNumber ++
                    }
                }
            })
        })
        return countedVotes
    }
}

// threshold - a number between 0 and 1 inclusive
function fractionalRepresentativeRankedVote(threshold) {
    return function(votes, candidates, maxWinners) {
        var minimumWinningVotes = votes.length*threshold
        var originalVotes = votes

        var currentWinners = {}, countedVotes = candidates.map(function(){return 0})
        votes.forEach(function(vote) {
            var candidateIndex = vote[0]
            countedVotes[candidateIndex] ++
        })

        // select initial winners
        for(var candidateIndex in countedVotes) {
            var votesForThisCandidate = countedVotes[candidateIndex]
            if(votesForThisCandidate >= minimumWinningVotes) {
                currentWinners[candidateIndex] = true
            }
        }

        // remove votes of those who have chosen a winner
        votes = votes.filter(function(vote) {
            return !(vote[0] in currentWinners)
        })

        // iterate through preferences to find more winners
        for(var currentPreferenceIndex = 1; currentPreferenceIndex<candidates.length; currentPreferenceIndex++) {
            votes.forEach(function(vote) {
                var candidateIndex = vote[currentPreferenceIndex]
                countedVotes[candidateIndex] ++
            })

            // if there are any winners combining preferences 0 through n, choose best winner who isn't already a winner
            var leadingNonWinner, leadingNonWinnerVotes = 0
            for(var candidateIndex in countedVotes) {
                var votesForThisCandidate = countedVotes[candidateIndex]
                if(votesForThisCandidate >= minimumWinningVotes) {
                    if(!(candidateIndex in currentWinners) && votesForThisCandidate > leadingNonWinnerVotes) {
                        leadingNonWinner = candidateIndex
                        leadingNonWinnerVotes = votesForThisCandidate
                    }
                }
            }

            if(leadingNonWinner !== undefined) {
                currentWinners[leadingNonWinner] = true
            }

            // redact votes by voters who have chosen a winner from non-winners they previously chose
            votes.forEach(function(vote) {
                var curCandidateIndex = vote[currentPreferenceIndex]
                if(curCandidateIndex in currentWinners) {
                    for(var n=0; n<currentPreferenceIndex; n++) {
                        var candidatePreferenceIndex = vote[n]
                        countedVotes[candidatePreferenceIndex] --
                    }
                }
            })

            // remove votes of those who have just chosen a winner
            votes = votes.filter(function(vote) {
                return !(vote[currentPreferenceIndex] in currentWinners)
            })
        }

        // this needs to happen because its possible for a vote to be counted for an earlier winner,
        // when the vote's preference is for a winner that was chosen in a later round
        var winnersRecount = candidates.map(function(){return 0})
        originalVotes.forEach(function(vote) {
            for(var n=0;n<vote.length;n++) {
                if(vote[n] in currentWinners) {
                    winnersRecount[vote[n]] ++
                    break;
                }
            }
        })

        var finalWinners = []
        for(var candidateIndex in currentWinners) {
            var votesForThisCandidate = winnersRecount[candidateIndex]
            finalWinners.push({index: candidateIndex, weight:votesForThisCandidate/originalVotes.length})
        }

        return finalWinners.slice(0, maxWinners)
    }
}

function singleTransferrableVote(votes, candidates, maxWinners) {
    var seats = maxWinners
    var voteQuota = 1+votes.length/(seats+1)

    var newVotesMap = function() {
        var votesList = {}
        candidates.forEach(function(candidate, index){
            votesList[index] = {currentVotes: [], currentCount:0}
        })

        return votesList
    }

    var countedVotes = newVotesMap(), currentWinners = {}, eliminatedCandidates = {}
    votes.forEach(function(vote) {
        var candidate = countedVotes[vote[0]]
        candidate.currentVotes.push({vote:vote, weight:1, currentPreferenceIndex:0})
        candidate.currentCount ++
    })

    var transferVotes = function(transferOrigin, transferDestination, ratioToTransfer) {
        transferOrigin.currentVotes.forEach(function(voteInfo) {
            var newCandidatePreference = voteInfo.currentPreferenceIndex +1
            while(true) {
                var nextCandidatePreference = voteInfo.vote[newCandidatePreference]
                if(nextCandidatePreference in eliminatedCandidates || nextCandidatePreference in currentWinners) {
                    newCandidatePreference ++
                } else {
                    break
                }
            }

            var candidateIndex = voteInfo.vote[newCandidatePreference]
            if(candidateIndex !== undefined) {
                transferDestination[candidateIndex].currentVotes.push({        // transfer the excess
                    vote:voteInfo.vote,
                    weight:voteInfo.weight*ratioToTransfer,
                    currentPreferenceIndex:newCandidatePreference
                })
                transferDestination[candidateIndex].currentCount += voteInfo.weight*ratioToTransfer
            }

            //transferOrigin.currentCount -= voteInfo.weight*ratioToTransfer // just for testing // todo: comment this out
            voteInfo.weight *= (1-ratioToTransfer) // keep the remainder
        })
    }

    while(true) {
        var votesInTranfer = newVotesMap()
        while(true) {
            var excessFound = false
            for(var candidateIndex in countedVotes) {
                var votes = countedVotes[candidateIndex].currentCount
                if(votes >= voteQuota - .01) {
                    currentWinners[candidateIndex] = true
                    if(votes > voteQuota) {
                        excessFound = true
                        var excessVotes = votes - voteQuota
                        var excessRatio = excessVotes/votes

                        transferVotes(countedVotes[candidateIndex], votesInTranfer, excessRatio)

                        // When testing, ensure that countedVotes[candidateIndex].currentCount already is equal to voteQuota when testing line A is uncommented
                        countedVotes[candidateIndex].currentCount = voteQuota
                    }
                }
            }

            if(!excessFound) {
                break
            } else {
                for(var candidateIndex in votesInTranfer) {
                    var newVotes = votesInTranfer[candidateIndex]
                    newVotes.currentVotes.forEach(function(vote) {
                        countedVotes[candidateIndex].currentVotes.push(vote)
                    })

                    if(newVotes.currentCount > 0)
                        countedVotes[candidateIndex].currentCount += newVotes.currentCount
                }

                votesInTranfer = newVotesMap()
            }
        }

        if(Object.keys(currentWinners).length < seats) {
            // find candidate with least votes
            var candidateWithLeastCount=undefined, lowestCount=undefined
            for(var candidateIndex in countedVotes) {
                var candidate = countedVotes[candidateIndex]
                if(lowestCount === undefined || candidate.currentCount < lowestCount) {
                    lowestCount = candidate.currentCount
                    candidateWithLeastCount = candidateIndex
                }
            }

            eliminatedCandidates[candidateWithLeastCount] = true

            // transfer votes from that candidate
            transferVotes(countedVotes[candidateWithLeastCount], countedVotes, 1)

            if(Object.keys(countedVotes).length === 1) { // if there's only one candidate left, make them a winner even tho they didn't reach the quota
                currentWinners[candidateWithLeastCount] = true
                break
            } else {
                // eliminate the candidate
                delete countedVotes[candidateWithLeastCount]
            }
        } else {
            break
        }
    }

    var finalWinners = []
    for(var candidateIndex in currentWinners) {
        finalWinners.push({index: candidateIndex, weight:1})
    }

    return finalWinners
}


function powerInstantRunoff(votes, candidates, maxWinners) {

    var winners = singleTransferrableVote(votes, candidates, Math.max(3, maxWinners));

    return winners;

    // if (maxWinner >= 3) return winners;


}


module.exports = {
    random: {
        '':function(votes, candidates, maxWinners) {
            if(candidates.length < maxWinners) maxWinners = candidates.length

            var winners = []
            for(var n=0; n<maxWinners;) {
                var winner = Math.round(random()*(candidates.length-1))
                if(winners.indexOf(winner) === -1) {
                    winners.push(winner)
                    n++
                }
            }

            return winners.map(function(winner) {
                return {index: winner, weight:1}
            })
        }
    },
    randomVotersChoice: {
        'single voter':function(votes, candidates, maxWinners) {
            var luckyWinnerIndex = Math.round(random()*(votes.length-1))
            var luckyWinnerVote = votes[luckyWinnerIndex]

            return luckyWinnerVote.slice(0,maxWinners).map(function(vote) {
                return {index: vote, weight:1}
            })
        },
        '10% of the voters': function(votes, candidates, maxWinners) {
            var luckyVotes = []
            while(luckyVotes.length < votes.length*.1) {
                var luckyWinnerIndex = Math.round(random()*(votes.length-1))
                luckyVotes.push(votes[luckyWinnerIndex][0])
            }

            return pluralityAlg(luckyVotes, candidates, maxWinners)
        }
    },
    plurality: {
        '':pluralityAlg
    },
    range: {
        'One Winner': function(votes, candidates) {
            var results = []
            for(var n=0; n<candidates.length;n++) {
                results[n] = 0
            }

            votes.forEach(function(vote){
                vote.forEach(function(value, index) {
                    results[index] += value
                })
            })

            var transformedResults = results.map(function(value,index){
                return {candidate:index,votes:value}
            })

            transformedResults.sort(function(a,b) {
                return b.votes - a.votes // reverse sort
            })

            var winner = transformedResults[0].candidate
            return [{index: winner, weight:1, preferences:candidates[winner]}]
        },
        'Three Winners': function(votes, candidates) {
            var results = []
            for(var n=0; n<candidates.length;n++) {
                results[n] = 0
            }

            votes.forEach(function(vote){
                vote.forEach(function(value, index) {
                    results[index] += value
                })
            })

            var transformedResults = results.map(function(value,index){
                return {candidate:index,votes:value}
            })

            transformedResults.sort(function(a,b) {
                return b.votes - a.votes // reverse sort (most votes foist)
            })

            var winners = [], totalScore = 0
            for(var n=0; n<3; n++) {
                var winnerIndex = transformedResults[n].candidate
                var winner = candidates[winnerIndex]
                winners.push({index: winnerIndex, preferences:winner})
                totalScore+= transformedResults[n].votes
            }

            winners.forEach(function(winner, index) {
                winner.weight = transformedResults[index].votes/totalScore
            })

            return winners
        }
    },
    singleTransferableVote: {
        '':singleTransferrableVote
    },
    powerInstantRunoff: {
        '':powerInstantRunoff
    },
    directRepresentativeRanked: {
        '15% Threshold': {'':fractionalRepresentativeRankedVote(.15)},
    },
    directRepresentativeRanged: {
        'split-weight, 0% threshold': directRepresentationRange('normal', 'split',0),
        'highest-weight, 20% threshold': directRepresentationRange('normal', 'highest', .5),
        'split-weight, 20% threshold': directRepresentationRange('normal', 'split', .9),
        'equal-weight, 20% threshold': directRepresentationRange('normal', 'equal', .9),
        'highest-weight, minority-max, 20% threshold': directRepresentationRange('maxMinority', 'highest', .9),
        'split-weight, minority-max, 20% threshold': directRepresentationRange('maxMinority', 'split', .9),
        'equal-weight, minority-max, 20% threshold': directRepresentationRange('maxMinority', 'equal', .9),
        'highest-weight, <b>reweighted</b>': directRepresentationRange('reweighted', 'highest', 0),
        'split-weight, <b>reweighted</b>': directRepresentationRange('reweighted', 'split', 0),
        'equal-weight, <b>reweighted</b>': directRepresentationRange('reweighted', 'equal', 0),
    }
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__("./elect.js");
/******/ })()
;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9lbGVjdC93ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24iLCJ3ZWJwYWNrOi8vZWxlY3QvLi9FbGVjdGlvbi5qcyIsIndlYnBhY2s6Ly9lbGVjdC8uL2FnZ3JlZ2F0ZUZucy5qcyIsIndlYnBhY2s6Ly9lbGVjdC8uL2JhbGxvdHMuanMiLCJ3ZWJwYWNrOi8vZWxlY3QvLi9lbGVjdC5qcyIsIndlYnBhY2s6Ly9lbGVjdC8uL25vZGVfbW9kdWxlcy9wcm90by9wcm90by5qcyIsIndlYnBhY2s6Ly9lbGVjdC8uL3V0aWxzLmpzIiwid2VicGFjazovL2VsZWN0Ly4vdm90aW5nU3RyYXRlZ2llcy5qcyIsIndlYnBhY2s6Ly9lbGVjdC8uL3ZvdGluZ1N5c3RlbXMuanMiLCJ3ZWJwYWNrOi8vZWxlY3Qvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vZWxlY3Qvd2VicGFjay9zdGFydHVwIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxPOzs7Ozs7Ozs7OztBQ1ZBLFlBQVksbUJBQU8sQ0FBQyw0Q0FBTzs7QUFFM0IsWUFBWSxtQkFBTyxDQUFDLDJCQUFTO0FBQzdCLG1CQUFtQixtQkFBTyxDQUFDLHlDQUFnQjtBQUMzQzs7QUFFQTtBQUNBOztBQUVBO0FBQ0Esb0JBQW9CLGlCQUFpQjtBQUNyQztBQUNBO0FBQ0Esb0JBQW9CLHFCQUFxQjtBQUN6QztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUzs7QUFFVDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFNBQVM7O0FBRVQ7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLFNBQVM7QUFDVDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxhQUFhO0FBQ2IsU0FBUzs7QUFFVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLDBCQUEwQjtBQUM5QztBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7QUNqSUQsWUFBWSxtQkFBTyxDQUFDLDJCQUFTOztBQUU3QjtBQUNBO0FBQ0E7QUFDQSx3REFBd0QsZ0NBQWdDO0FBQ3hGLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYixTQUFTO0FBQ1Q7QUFDQSxDOzs7Ozs7Ozs7Ozs7QUNmQSwwQkFBMEI7O0FBRTFCO0FBQ0EsV0FBVyxRQUFRO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNsQkEsZUFBZSx5RUFBd0M7O0FBRXZELGNBQWMsa0ZBQTRDO0FBQzFELFlBQVksMkZBQWtEO0FBQzlELGNBQWMsc0VBQXNDOzs7QUFHcEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQjtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7O0FBRUEsWUFBWTtBQUNaOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsaURBQWlEO0FBQ2pEO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxvQkFBb0I7QUFDcEIsU0FBUztBQUNUO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSx3REFBd0Q7QUFDeEQsU0FBUzs7QUFFVDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEtBQUs7QUFDTDs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7OztBQ3RMYTtBQUNiOztBQUVBOztBQUVBLGtHQUFrRyxpQkFBaUI7QUFDbkg7QUFDQTs7QUFFQTtBQUNBLHNCQUFzQjtBQUN0Qjs7QUFFQSxLQUFLLE9BQU87QUFDWjtBQUNBO0FBQ0E7O0FBRUE7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsdURBQXVEO0FBQ3ZEO0FBQ0EsY0FBYztBQUNkO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSx1REFBdUQ7QUFDdkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTs7QUFFQSwrQ0FBK0M7O0FBRS9DO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSx1Q0FBdUM7QUFDdkM7O0FBRUE7QUFDQTs7QUFFQSwwQkFBMEI7O0FBRTFCOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxtRUFBbUU7QUFDbkU7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBLGFBQWE7QUFDYixTQUFTO0FBQ1Q7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDaklBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsMENBQTBDO0FBQzFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULEtBQUs7O0FBRUw7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQSxrQ0FBa0M7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0EsQzs7Ozs7Ozs7Ozs7OztBQ25EQSxZQUFZLG1CQUFPLENBQUMsMkJBQVM7O0FBRTdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSx1Q0FBdUM7QUFDdkM7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQSxnQkFBZ0I7QUFDaEIsS0FBSztBQUNMO0FBQ0EsS0FBSzs7QUFFTDtBQUNBO0FBQ0EsS0FBSztBQUNMOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxDOzs7Ozs7Ozs7Ozs7QUMxQ0EsYUFBYSx1REFBeUI7OztBQUd0QztBQUNBO0FBQ0EsZ0JBQWdCLHFCQUFxQjtBQUNyQztBQUNBOztBQUVBO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0EsZ0JBQWdCO0FBQ2hCLEtBQUs7QUFDTDtBQUNBLEtBQUs7O0FBRUw7QUFDQSxnQkFBZ0I7QUFDaEIsS0FBSztBQUNMOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQSxnRUFBZ0U7QUFDaEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSx3QkFBd0I7O0FBRXhCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVDs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsK0JBQStCO0FBQy9CO0FBQ0E7QUFDQSw4QkFBOEIsdUJBQXVCO0FBQ3JEOztBQUVBO0FBQ0EsdUNBQXVDO0FBQ3ZDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7O0FBRWpCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSw4QkFBOEIsOEJBQThCO0FBQzVEO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSw4QkFBOEIsdUJBQXVCO0FBQ3JEO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTOztBQUVUO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEIsYUFBYTtBQUNiLHdCQUF3QjtBQUN4QjtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsMENBQTBDO0FBQzFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBLGlCQUFpQjs7QUFFakIsaURBQWlEO0FBQ2pEO0FBQ0EsK0JBQStCO0FBQy9CO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjs7QUFFakI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUIsNkRBQTZEO0FBQ2xGO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLFNBQVM7QUFDVDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSwrQkFBK0IsMkNBQTJDLFNBQVM7QUFDbkY7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxTQUFTOztBQUVUO0FBQ0EsMkNBQTJDLDBDQUEwQztBQUNyRjtBQUNBO0FBQ0E7QUFDQSxhQUFhOztBQUViO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0NBQWdDLDBCQUEwQjtBQUMxRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7O0FBRWI7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiOztBQUVBO0FBQ0E7QUFDQSx1REFBdUQsU0FBUztBQUNoRTtBQUNBLHdCQUF3QixjQUFjO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTOztBQUVUO0FBQ0E7QUFDQTtBQUNBLCtCQUErQix5RUFBeUU7QUFDeEc7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnQ0FBZ0M7QUFDaEMsU0FBUzs7QUFFVDtBQUNBOztBQUVBLHlEQUF5RDtBQUN6RDtBQUNBO0FBQ0EscUNBQXFDLDhDQUE4QztBQUNuRjtBQUNBLEtBQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1RUFBdUU7QUFDdkU7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFNBQVM7QUFDVDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCOztBQUVyQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUEsd0RBQXdEO0FBQ3hEO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsMkJBQTJCLGdDQUFnQztBQUMzRDs7QUFFQTtBQUNBOzs7QUFHQTs7QUFFQTs7QUFFQTs7QUFFQTs7O0FBR0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0Esd0JBQXdCLGNBQWM7QUFDdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0Esd0JBQXdCO0FBQ3hCLGFBQWE7QUFDYjtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLHdCQUF3QjtBQUN4QixhQUFhO0FBQ2IsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLHFCQUFxQjtBQUM3QztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhOztBQUViO0FBQ0Esd0JBQXdCO0FBQ3hCLGFBQWE7O0FBRWI7QUFDQTtBQUNBLGFBQWE7O0FBRWI7QUFDQSxxQkFBcUIsd0RBQXdEO0FBQzdFLFNBQVM7QUFDVDtBQUNBO0FBQ0Esd0JBQXdCLHFCQUFxQjtBQUM3QztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhOztBQUViO0FBQ0Esd0JBQXdCO0FBQ3hCLGFBQWE7O0FBRWI7QUFDQTtBQUNBLGFBQWE7O0FBRWI7QUFDQSx3QkFBd0IsS0FBSztBQUM3QjtBQUNBO0FBQ0EsOEJBQThCLHVDQUF1QztBQUNyRTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxhQUFhOztBQUViO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0EsMEJBQTBCLDJDQUEyQztBQUNyRSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQzs7Ozs7O1VDcGdCQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7O1VDckJBO1VBQ0E7VUFDQTtVQUNBIiwiZmlsZSI6ImVsZWN0LnVtZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcImVsZWN0XCJdID0gZmFjdG9yeSgpO1xuXHRlbHNlXG5cdFx0cm9vdFtcImVsZWN0XCJdID0gZmFjdG9yeSgpO1xufSkoc2VsZiwgZnVuY3Rpb24oKSB7XG5yZXR1cm4gIiwidmFyIHByb3RvID0gcmVxdWlyZShcInByb3RvXCIpXG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKVxudmFyIGFnZ3JlZ2F0ZUZucyA9IHJlcXVpcmUoJy4vYWdncmVnYXRlRm5zJylcbnZhciByYW5kb20gPSB1dGlscy5yYW5kb21cblxudmFyIEVsZWN0aW9uID0gbW9kdWxlLmV4cG9ydHMgPSBwcm90byhmdW5jdGlvbigpIHtcbiAgICB0aGlzLmluaXQgPSBmdW5jdGlvbihudW1iZXJPZlZvdGVycywgbnVtYmVyT2ZDYW5kaWRhdGVzLCBudW1iZXJPZlNvY2lldGFsT3B0aW9ucykge1xuXG4gICAgICAgIHZhciB2b3RlcnMgPSBbXSwgY2FuZGlkYXRlcyA9IFtdXG4gICAgICAgIGZvcih2YXIgaj0wO2o8bnVtYmVyT2ZWb3RlcnM7aisrKSB7XG4gICAgICAgICAgICB2b3RlcnMucHVzaChnZW5lcmF0ZVBlcnNvbihudW1iZXJPZlNvY2lldGFsT3B0aW9ucykpXG4gICAgICAgIH1cbiAgICAgICAgZm9yKHZhciBqPTA7ajxudW1iZXJPZkNhbmRpZGF0ZXM7aisrKSB7XG4gICAgICAgICAgICBjYW5kaWRhdGVzLnB1c2goZ2VuZXJhdGVQZXJzb24obnVtYmVyT2ZTb2NpZXRhbE9wdGlvbnMpKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG5ldFV0aWxpdGllcyA9IGZpbmROZXRVdGlsaXRpZXModm90ZXJzKVxuICAgICAgICB2YXIgb3B0aW1hbE91dGNvbWVzID0gbmV0VXRpbGl0aWVzLm1hcChmdW5jdGlvbihvcHRpb25VdGlsaXR5KSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9uVXRpbGl0eSA+IDBcbiAgICAgICAgfSlcbiAgICAgICAgdmFyIGxlYXN0T3B0aW1hbE91dGNvbWVzID0gb3B0aW1hbE91dGNvbWVzLm1hcChmdW5jdGlvbihvdXRjb21lKSB7XG4gICAgICAgICAgICByZXR1cm4gIW91dGNvbWVcbiAgICAgICAgfSlcblxuICAgICAgICB0aGlzLm1heFV0aWxpdHkgPSB0b3RhbE91dGNvbWVVdGlsaXR5KHZvdGVycywgb3B0aW1hbE91dGNvbWVzKVxuICAgICAgICB0aGlzLm1pblV0aWxpdHkgPSB0b3RhbE91dGNvbWVVdGlsaXR5KHZvdGVycywgbGVhc3RPcHRpbWFsT3V0Y29tZXMpXG4gICAgICAgIHRoaXMubWF4UmVncmV0ID0gdGhpcy5tYXhVdGlsaXR5IC0gdGhpcy5taW5VdGlsaXR5XG4gICAgICAgIHRoaXMudm90ZXJzID0gdm90ZXJzXG4gICAgICAgIHRoaXMuY2FuZGlkYXRlcyA9IGNhbmRpZGF0ZXNcblxuICAgICAgICB0aGlzLmFnZ3JlZ2F0ZXMgPSB7fVxuICAgICAgICBmb3IodmFyIGsgaW4gYWdncmVnYXRlRm5zKSB7XG4gICAgICAgICAgICB0aGlzLmFkZEFnZ3JlZ2F0ZUZuKGssIGFnZ3JlZ2F0ZUZuc1trXSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIHJldHVybnMgYW4gYXJyYXkgb2Ygd2lubmluZyBjYW5kaWRhdGVzIHJlcHJlc2VudGVkIGJ5IG9iamVjdHMgdGhhdCBoYXZlIHRoZSBwcm9wZXJ0aWVzOlxuICAgICAgICAvLyB3ZWlnaHQgLSBUaGF0IHdpbm5lcidzIHZvdGluZyB3ZWlnaHQgaW4gdGhlIGxlZ2lzbGF0dXJlXG4gICAgICAgIC8vIHV0aWxpdGllcyAtIFRoYXQgd2lubmVyJ3Mgb3B0aW9uIHV0aWxpdGllcyAoaW4gdGhlIHNhbWUgZm9ybSBhcyByZXR1cm5lZCBieSBnZW5lcmF0ZVBlcnNvbilcbiAgICAvLyBhbGdvcml0aG0odm90ZXMsIGNhbmRpZGF0ZXMpIC0gQSBmdW5jdGlvbiB0aGF0IHNob3VsZCByZXR1cm4gdGhlIHdpbm5pbmcgY2FuZGlkYXRlcyBpbiB0aGUgc2FtZSBmb3JtIGFzIHRoaXMuZWxlY3QgcmV0dXJuc1xuICAgIC8vIHN0cmF0ZWd5KHZvdGVyLCBjYW5kaWRhdGVzKSAtIEEgZnVuY3Rpb24gdGhhdCBzaG91bGQgcmV0dXJuIHRoZSBnaXZlbiB2b3RlcidzIHZvdGUgaW4gd2hhdGV2ZXIgZm9ybSB0aGF0IGFsZ29yaXRobSByZXF1aXJlc1xuICAgIHRoaXMuZWxlY3QgPSBmdW5jdGlvbihhbGdvcml0aG0sIHN0cmF0ZWd5LCB2b3RlcnMsIGNhbmRpZGF0ZXMsIG1heFdpbm5lcnMpIHtcbiAgICAgICAgdmFyIHZvdGVzID0gdm90ZXJzLm1hcChmdW5jdGlvbih2b3RlciwgaW5kZXgpIHtcbiAgICAgICAgICAgIHZhciB2b3RlckFnZ3JlZ2F0ZXMgPSB7fVxuICAgICAgICAgICAgZm9yKHZhciBrIGluIHRoaXMuYWdncmVnYXRlcykge1xuICAgICAgICAgICAgICAgIHZvdGVyQWdncmVnYXRlc1trXSA9IHRoaXMuYWdncmVnYXRlc1trXVtpbmRleF1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHN0cmF0ZWd5KHZvdGVyLCB2b3RlckFnZ3JlZ2F0ZXMpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICB2YXIgcmVzdWx0cyA9IGFsZ29yaXRobSh2b3RlcywgY2FuZGlkYXRlcywgbWF4V2lubmVycylcblxuICAgICAgICByZXN1bHRzLmZvckVhY2goZnVuY3Rpb24od2lubmVyKSB7XG4gICAgICAgICAgICB3aW5uZXIucHJlZmVyZW5jZXMgPSBjYW5kaWRhdGVzW3dpbm5lci5pbmRleF1cbiAgICAgICAgICAgIGlmKHdpbm5lci53ZWlnaHQgPCAwKSB0aHJvdyBuZXcgRXJyb3IoXCJXaW5uZXIgd2VpZ2h0IGNhbid0IGJlIGxlc3MgdGhhbiAwXCIpXG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdHNcbiAgICB9XG5cbiAgICB0aGlzLmFkZEFnZ3JlZ2F0ZUZuID0gZnVuY3Rpb24obmFtZSxmbikge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICAgICAgaWYobmFtZSBpbiB0aGlzLmFnZ3JlZ2F0ZXMpIHRocm93IG5ldyBFcnJvcihcIkFnZ3JlZ2F0ZSBmdW5jdGlvbiAnXCIrbmFtZStcIicgYWxyZWFkeSBleGlzdHNcIilcblxuICAgICAgICB2YXIgdmFsdWVzXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLmFnZ3JlZ2F0ZXMsIG5hbWUsIHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYodmFsdWVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzID0gZm4uY2FsbCh0aGlzLCB0aGF0LnZvdGVycyx0aGF0LmNhbmRpZGF0ZXMpIC8vIG1lbW9pemVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlc1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6dHJ1ZVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8vIHJldHVybnMgYSBudW1iZXIgZnJvbSAwIHRvIDEgaW5kaWNhdGluZyB3aGF0IHBlcmNlbnRhZ2Ugb2YgdGhlIG1heGltdW0gcG9zc2libGUgdm90ZXIgcmVncmV0IHRoZSBkZWNpZGVycyBjYXVzZVxuICAgIHRoaXMucmVncmV0RnJhY3Rpb24gPSBmdW5jdGlvbihwZW9wbGUsIGRlY2lkZXJzKSB7XG4gICAgICAgIHZhciBvdXRjb21lcyA9IHV0aWxzLmZpbmRTb2NpZXRhbE9wdGlvbnNPdXRjb21lcyhkZWNpZGVycylcbiAgICAgICAgdmFyIHRvdGFsVXRpbGl0eSA9IHRvdGFsT3V0Y29tZVV0aWxpdHkocGVvcGxlLCBvdXRjb21lcylcbiAgICAgICAgdmFyIHJlZ3JldCA9IHRoaXMubWF4VXRpbGl0eSAtIHRvdGFsVXRpbGl0eVxuXG4gICAgICAgIHJldHVybiByZWdyZXQvdGhpcy5tYXhSZWdyZXRcbiAgICB9XG5cbiAgICAvLyByZXR1cm5zIHRoZSB0b3RhbCB1dGlsaXR5IGNoYW5nZSBmb3IgdGhlIGdpdmVuIHBlb3BsZSBpZiB0aGUgZ2l2ZW4gb3V0Y29tZXMgaGFwcGVuZWRcbiAgICBmdW5jdGlvbiB0b3RhbE91dGNvbWVVdGlsaXR5KHBlb3BsZSwgb3V0Y29tZXMpIHtcbiAgICAgICAgdmFyIHV0aWxpdHkgPSAwXG4gICAgICAgIHBlb3BsZS5mb3JFYWNoKGZ1bmN0aW9uKHBlcnNvbikge1xuICAgICAgICAgICAgdXRpbGl0eSArPSB1dGlscy52b3Rlck91dGNvbWVVdGlsaXR5KHBlcnNvbiwgb3V0Y29tZXMpXG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIHV0aWxpdHlcbiAgICB9XG5cbiAgICAvLyByZXR1cm5zIGFuIGFycmF5IHdoZXJlIHRoZSBpbmRleCBpbmRpY2F0ZXMgYSBzb2NpZXRhbCBvcHRpb24gYW5kIHRoZSB2YWx1ZSBpbmRpY2F0ZXNcbiAgICAvLyB0aGUgbmV0IHV0aWxpdHkgZm9yIHRoYXQgb3B0aW9uIGZvciB0aGUgcGVvcGxlIHBhc3NlZCBpblxuICAgIGZ1bmN0aW9uIGZpbmROZXRVdGlsaXRpZXMocGVvcGxlKSB7XG4gICAgICAgIHZhciBuZXRVdGlsaXR5ID0gW11cbiAgICAgICAgcGVvcGxlLmZvckVhY2goZnVuY3Rpb24ocGVyc29uKSB7XG4gICAgICAgICAgICBwZXJzb24uZm9yRWFjaChmdW5jdGlvbihvcHRpb25VdGlsaXR5LCBpbmRleCkge1xuICAgICAgICAgICAgICAgIGlmKG5ldFV0aWxpdHlbaW5kZXhdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV0VXRpbGl0eVtpbmRleF0gPSAwXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbmV0VXRpbGl0eVtpbmRleF0gKz0gb3B0aW9uVXRpbGl0eVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcblxuICAgICAgICByZXR1cm4gbmV0VXRpbGl0eVxuICAgIH1cblxuICAgIC8vIFJldHVybnMgYW4gYXJyYXkgd2hlcmUgZWFjaCBlbGVtZW50IGlzIGEgbnVtYmVyIGZyb20gLTEgdG8gMSBpbmRpY2F0aW5nIHRoZSB1dGlsaXR5IHRoYXQgcGVyc29uIHdvdWxkIGdldFxuICAgIC8vIGZyb20gYSBnaXZlbiBzb2NpZXRhbCBvcHRpb24gKGlkZW50aWZpZWQgYnkgdGhlIGluZGV4KVxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlUGVyc29uKG51bWJlck9mU29jaWV0YWxPcHRpb25zLCBvcHRpb25Qb3B1bGFyaXR5TW9kaWZpZXJzKSB7XG4gICAgICAgIHZhciB2b3RlciA9IFtdXG4gICAgICAgIGZvcih2YXIgbj0wO248bnVtYmVyT2ZTb2NpZXRhbE9wdGlvbnM7bisrKSB7XG4gICAgICAgICAgICBpZihvcHRpb25Qb3B1bGFyaXR5TW9kaWZpZXJzKSB7XG4gICAgICAgICAgICAgICAgbW9kaWZpZXIgPSBvcHRpb25Qb3B1bGFyaXR5TW9kaWZpZXJzW25dXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1vZGlmaWVyID0gMVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2b3RlcltuXSA9IDIqcmFuZG9tKCkqbW9kaWZpZXItMVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZvdGVyXG4gICAgfVxufSlcbiIsIlxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNhbmRpZGF0ZURpY3RhdG9yVXRpbGl0aWVzOiBmdW5jdGlvbih2b3RlcnMsIGNhbmRpZGF0ZXMpIHtcbiAgICAgICAgdmFyIGNhbmRpZGF0ZU91dGNvbWVzID0gY2FuZGlkYXRlcy5tYXAoZnVuY3Rpb24oY2FuZGlkYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gIHV0aWxzLmZpbmRTb2NpZXRhbE9wdGlvbnNPdXRjb21lcyhbe3dlaWdodDoxLCBwcmVmZXJlbmNlczpjYW5kaWRhdGV9XSlcbiAgICAgICAgfSlcbiAgICAgICAgLy8gdGhlIHV0aWxpdHkgZWFjaCB2b3RlciB3b3VsZCBnZXQgaWYgZWFjaCBjYW5kaWRhdGUgd2VyZSBlbGVjdGVkIGRpY3RhdG9yXG4gICAgICAgIHJldHVybiB2b3RlcnMubWFwKGZ1bmN0aW9uKHZvdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FuZGlkYXRlT3V0Y29tZXMubWFwKGZ1bmN0aW9uKG91dGNvbWVzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICB1dGlscy52b3Rlck91dGNvbWVVdGlsaXR5KHZvdGVyLCBvdXRjb21lcylcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfVxufSIsInZhciBub29wID0gZnVuY3Rpb24odm90ZSl7cmV0dXJuIHZvdGV9XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG5vb3A6IHsnJzpub29wfSxcbiAgICByYW5rZWQ6IHtcbiAgICAgICAgXCJyYXdcIjpub29wLFxuICAgICAgICBcIk1heCAzXCI6IGZ1bmN0aW9uKHZvdGUpIHtcbiAgICAgICAgICAgIHJldHVybiB2b3RlLnNsaWNlKDAsMylcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2NvcmVkOiB7XG4gICAgICAgIFwicmF3XCI6bm9vcCxcbiAgICAgICAgXCJOZWFyZXN0IDEtNVwiOiBmdW5jdGlvbih2b3RlKSB7XG4gICAgICAgICAgICByZXR1cm4gdm90ZS5tYXAoZnVuY3Rpb24oY2FuZGlkYXRlU2NvcmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCg1KmNhbmRpZGF0ZVNjb3JlKS81XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufSIsInZhciBFbGVjdGlvbiA9IGV4cG9ydHMuRWxlY3Rpb24gPSByZXF1aXJlKFwiLi9FbGVjdGlvblwiKVxuXG52YXIgc3lzdGVtcyA9IGV4cG9ydHMuc3lzdGVtcyA9IHJlcXVpcmUoJy4vdm90aW5nU3lzdGVtcycpXG52YXIgc3RyYXQgPSBleHBvcnRzLnN0cmF0ZWdpZXMgPSByZXF1aXJlKCcuL3ZvdGluZ1N0cmF0ZWdpZXMnKVxudmFyIGJhbGxvdHMgPSBleHBvcnRzLmJhbGxvdHMgPSByZXF1aXJlKCcuL2JhbGxvdHMnKVxuXG5cbi8vIEZvciBlYWNoIHN5c3RlbTpcbi8vIGFsZ29yaXRobVxuICAgIC8vIHRha2VzIGluIGFuIGFycmF5IG9mIHZvdGVzIHdoZXJlIGVhY2ggdm90ZSBpcyB0aGUgb3V0cHV0IG9mIGEgZ2l2ZW4gYHN0cmF0ZWd5YCBmb3IgdGhlIHN5c3RlbVxuICAgIC8vIHJldHVybnMgYW4gb2JqZWN0IHdoZXJlIGVhY2gga2V5IGlzIGEgd2lubmVyLCBhbmQgZWFjaCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCB0aGUgcHJvcGVydGllczpcbiAgICAgICAgLy8gd2VpZ2h0IC0gdGhlIHdpbm5lcidzIHZvdGUgd2VpZ2h0XG4gICAgICAgIC8vIHByZWZlcmVuY2VzIC0gdGhlIHdpbm5lcidzIHZvdGluZyBwcmVmZXJlbmNlcyBmb3IgZWFjaCBzb2NpZXRhbCBvcHRpb25cbi8vIGVhY2ggc3RyYXRlZ3k6XG4gICAgLy8gcmV0dXJucyBhIFwidm90ZVwiLCBhIHNldCBvZiBkYXRhIHVzZWQgYnkgdm90aW5nU3lzdGVtIHRvIGRldGVybWluZSB3aW5uZXJzXG5leHBvcnRzLnRlc3RTeXN0ZW1zID0ge1xuICAgICdQb3dlciBJbnN0YW50IFJ1bm9mZic6IHtcbiAgICAgICAgd2lubmVyczogWzFdLCAvLyBbMSwzXSxcbiAgICAgICAgc3RyYXRlZ2llczogc3RyYXQucmFua2VkLFxuICAgICAgICBiYWxsb3RzOiBiYWxsb3RzLnJhbmtlZCxcbiAgICAgICAgc3lzdGVtczogc3lzdGVtcy5wb3dlckluc3RhbnRSdW5vZmZcbiAgICB9LFxufVxuXG4vLyBleHBvcnRzLnRlc3RTeXN0ZW1zID0ge1xuLy8gICAgIFJhbmRvbToge1xuLy8gICAgICAgICB3aW5uZXJzOiBbMSwzXSxcbi8vICAgICAgICAgc3RyYXRlZ2llczogc3RyYXQubm9vcCxcbi8vICAgICAgICAgc3lzdGVtczogc3lzdGVtcy5yYW5kb21cbi8vICAgICB9LFxuLy8gICAgICdSYW5kb20gVm90ZXJzXFwnIENob2ljZSc6IHtcbi8vICAgICAgICAgd2lubmVyczogWzEsM10sXG4vLyAgICAgICAgIHN0cmF0ZWdpZXM6IHN0cmF0LnJhbmtlZCxcbi8vICAgICAgICAgYmFsbG90czogYmFsbG90cy5yYW5rZWQsXG4vLyAgICAgICAgIHN5c3RlbXM6IHN5c3RlbXMucmFuZG9tVm90ZXJzQ2hvaWNlXG4vLyAgICAgfSxcbi8vICAgICBQbHVyYWxpdHk6IHtcbi8vICAgICAgICAgd2lubmVyczogWzEsM10sXG4vLyAgICAgICAgIHN0cmF0ZWdpZXM6IHN0cmF0LnJhbmtlZCxcbi8vICAgICAgICAgYmFsbG90czogYmFsbG90cy5yYW5rZWQsXG4vLyAgICAgICAgIHN5c3RlbXM6IHN5c3RlbXMucGx1cmFsaXR5XG4vLyAgICAgfSxcbi8vICAgICBSYW5nZToge1xuLy8gICAgICAgICB3aW5uZXJzOiBbMSwzXSxcbi8vICAgICAgICAgc3RyYXRlZ2llczogc3RyYXQuc2NvcmVkLFxuLy8gICAgICAgICBzeXN0ZW1zOiBzeXN0ZW1zLnNjb3JlZCxcbi8vICAgICAgICAgYmFsbG90czogYmFsbG90cy5zY29yZWRcbi8vICAgICB9LFxuLy8gICAgICdTaW5nbGUtVHJhbnNmZXJhYmxlIFZvdGUnOiB7XG4vLyAgICAgICAgIHdpbm5lcnM6IFsxLDNdLFxuLy8gICAgICAgICBzdHJhdGVnaWVzOiBzdHJhdC5yYW5rZWQsXG4vLyAgICAgICAgIGJhbGxvdHM6IGJhbGxvdHMucmFua2VkLFxuLy8gICAgICAgICBzeXN0ZW1zOiBzeXN0ZW1zLnNpbmdsZVRyYW5zZmVyYWJsZVZvdGVcbi8vICAgICB9LFxuLy8gICAgICdQcm9wb3J0aW9uYWwgUmFua2VkLCAxNS1QZXJjZW50IFRocmVzaG9sZCc6IHtcbi8vICAgICAgICAgd2lubmVyczogWzNdLC8vWzEsM10sXG4vLyAgICAgICAgIHN0cmF0ZWdpZXM6IHN0cmF0LnJhbmtlZCxcbi8vICAgICAgICAgYmFsbG90czogYmFsbG90cy5yYW5rZWQsXG4vLyAgICAgICAgIHN5c3RlbXM6IHN5c3RlbXMuc2luZ2xlVHJhbnNmZXJhYmxlVm90ZVxuLy8gICAgIH0sXG4vLyAgICAgJ1Byb3BvcnRpb25hbCBSYW5nZWQnOiB7XG4vLyAgICAgICAgIHdpbm5lcnM6IFszLCBJbmZpbml0eV0sLy9bMSwzLCBJbmZpbml0eV0sXG4vLyAgICAgICAgIHN0cmF0ZWdpZXM6IHN0cmF0LnNjb3JlZCxcbi8vICAgICAgICAgYmFsbG90czogYmFsbG90cy5zY29yZWQsXG4vLyAgICAgICAgIHN5c3RlbXM6IHtcbi8vICAgICAgICAgICAgICdzcGxpdC13ZWlnaHQsIDAlIHRocmVzaG9sZCc6IHN5c3RlbXMuZGlyZWN0UmVwcmVzZW50YXRpdmVSYW5nZWRbJ3NwbGl0LXdlaWdodCwgMCUgdGhyZXNob2xkJ10sXG4vLyAgICAgICAgICAgICAnaGlnaGVzdC13ZWlnaHQsIDIwJSB0aHJlc2hvbGQnOiBzeXN0ZW1zLmRpcmVjdFJlcHJlc2VudGF0aXZlUmFuZ2VkWydoaWdoZXN0LXdlaWdodCwgMjAlIHRocmVzaG9sZCddLFxuLy8gICAgICAgICAgICAgJ3NwbGl0LXdlaWdodCwgbWlub3JpdHktbWF4LCAyMCUgdGhyZXNob2xkJzogc3lzdGVtcy5kaXJlY3RSZXByZXNlbnRhdGl2ZVJhbmdlZFsnc3BsaXQtd2VpZ2h0LCBtaW5vcml0eS1tYXgsIDIwJSB0aHJlc2hvbGQnXSxcbi8vICAgICAgICAgICAgICdzcGxpdC13ZWlnaHQsIDxiPnJld2VpZ2h0ZWQ8L2I+Jzogc3lzdGVtcy5kaXJlY3RSZXByZXNlbnRhdGl2ZVJhbmdlZFsnc3BsaXQtd2VpZ2h0LCA8Yj5yZXdlaWdodGVkPC9iPiddLFxuLy8gICAgICAgICAgICAgJ2VxdWFsLXdlaWdodCwgPGI+cmV3ZWlnaHRlZDwvYj4nOiBzeXN0ZW1zLmRpcmVjdFJlcHJlc2VudGF0aXZlUmFuZ2VkWydzcGxpdC13ZWlnaHQsIDxiPnJld2VpZ2h0ZWQ8L2I+J10sXG4vLyAgICAgICAgIH1cbi8vICAgICB9LFxuLy8gfVxuXG5leHBvcnRzLnRlc3QgPSBmdW5jdGlvbihyZXN1bHRzRGl2LCBvcHRpb25zLCB2b3RpbmdTeXN0ZW1zKSB7XG4gICAgaWYodm90aW5nU3lzdGVtcyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgRXJyb3IoXCJObyB2b3Rpbmcgc3lzdGVtcyB0byB0ZXN0XCIpXG5cbiAgICB2YXIgbnVtYmVyT2ZTb2NpZXRhbE9wdGlvbnMgPSBvcHRpb25zLmlzc3VlcyxcbiAgICAgICAgbnVtYmVyT2ZDYW5kaWRhdGVzID0gb3B0aW9ucy5jYW5kaWRhdGVzLFxuICAgICAgICBudW1iZXJPZlZvdGVycyA9IG9wdGlvbnMudm90ZXJzLFxuICAgICAgICBpdGVyYXRpb25zID0gb3B0aW9ucy5pdGVyYXRpb25zXG5cbiAgICB2YXIga25vYnNPdXRwdXQgPSAnPGRpdj5Tb2NpZXRhbCBPcHRpb25zOiAnK251bWJlck9mU29jaWV0YWxPcHRpb25zKyc8L2Rpdj4nK1xuICAgICAgICAgICAgICAgICAgICAgICc8ZGl2PkNhbmRpZGF0ZXM6ICcrbnVtYmVyT2ZDYW5kaWRhdGVzKyc8L2Rpdj4nK1xuICAgICAgICAgICAgICAgICAgICAgICc8ZGl2PlZvdGVyczogJytudW1iZXJPZlZvdGVycysnPC9kaXY+JytcbiAgICAgICAgICAgICAgICAgICAgICAnPGRpdj5JdGVyYXRpb25zOiAnK2l0ZXJhdGlvbnMrJzwvZGl2PicrXG4gICAgICAgICAgICAgICAgICAgICAgJzxicj4nXG5cbiAgICB2YXIgbj0xLCB0b3RhbFJlZ3JldEZyYWN0aW9uU3VtUGVyU3lzdGVtID0ge30sIHRvdGFsV2lubmVyc1BlclN5c3RlbSA9IHt9XG4gICAgZnVuY3Rpb24gaXRlcmF0aW9uKGNvbXBsZXRlKSB7XG4gICAgICAgIHZhciBlbGVjdGlvbiA9IEVsZWN0aW9uKG51bWJlck9mVm90ZXJzLCBudW1iZXJPZkNhbmRpZGF0ZXMsIG51bWJlck9mU29jaWV0YWxPcHRpb25zKVxuXG4gICAgICAgIGZvcih2YXIgc3lzdGVtTmFtZSBpbiB2b3RpbmdTeXN0ZW1zKSB7XG4gICAgICAgICAgICB2YXIgdm90aW5nU2V0ID0gdm90aW5nU3lzdGVtc1tzeXN0ZW1OYW1lXVxuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJ1bm5pbmc6IFwiICsgc3lzdGVtTmFtZSk7XG5cbiAgICAgICAgICAgIHZhciBjdXJCYWxsb3RzID0gdm90aW5nU2V0LmJhbGxvdHNcbiAgICAgICAgICAgIGlmKGN1ckJhbGxvdHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGN1ckJhbGxvdHMgPSBiYWxsb3RzLm5vb3BcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yKHZhciBzdHJhdGVneU5hbWUgaW4gdm90aW5nU2V0LnN0cmF0ZWdpZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmF3U3RyYXRlZ3kgPSB2b3RpbmdTZXQuc3RyYXRlZ2llc1tzdHJhdGVneU5hbWVdXG4gICAgICAgICAgICAgICAgZm9yKHZhciBiYWxsb3ROYW1lIGluIGN1ckJhbGxvdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJhbGxvdCA9IGN1ckJhbGxvdHNbYmFsbG90TmFtZV1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGJhbGxvdFN0cmF0ZWd5TmFtZSA9IHN0cmF0ZWd5TmFtZSsnICcrYmFsbG90TmFtZVxuICAgICAgICAgICAgICAgICAgICB2YXIgc3RyYXRlZ3kgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBiYWxsb3QocmF3U3RyYXRlZ3kuYXBwbHkodGhpcyxhcmd1bWVudHMpKVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yKHZhciBhbGdvcml0aG1OYW1lIGluIHZvdGluZ1NldC5zeXN0ZW1zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2b3RpbmdTZXQud2lubmVycy5mb3JFYWNoKGZ1bmN0aW9uKG1heFdpbm5lcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgd2lubmVycyA9IGVsZWN0aW9uLmVsZWN0KHZvdGluZ1NldC5zeXN0ZW1zW2FsZ29yaXRobU5hbWVdLCBzdHJhdGVneSwgZWxlY3Rpb24udm90ZXJzLCBlbGVjdGlvbi5jYW5kaWRhdGVzLCBtYXhXaW5uZXJzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZWdyZXRGcmFjdGlvbiA9IGVsZWN0aW9uLnJlZ3JldEZyYWN0aW9uKGVsZWN0aW9uLnZvdGVycywgd2lubmVycylcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzeXN0ZW1TdHJhdGVneU5hbWUgPSBnZXRWb3RpbmdUeXBlTmFtZShzeXN0ZW1OYW1lLCBiYWxsb3RTdHJhdGVneU5hbWUsIGFsZ29yaXRobU5hbWUsIG1heFdpbm5lcnMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYodG90YWxSZWdyZXRGcmFjdGlvblN1bVBlclN5c3RlbVtzeXN0ZW1TdHJhdGVneU5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxSZWdyZXRGcmFjdGlvblN1bVBlclN5c3RlbVtzeXN0ZW1TdHJhdGVneU5hbWVdID0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFdpbm5lcnNQZXJTeXN0ZW1bc3lzdGVtU3RyYXRlZ3lOYW1lXSA9IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFJlZ3JldEZyYWN0aW9uU3VtUGVyU3lzdGVtW3N5c3RlbVN0cmF0ZWd5TmFtZV0gKz0gcmVncmV0RnJhY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFdpbm5lcnNQZXJTeXN0ZW1bc3lzdGVtU3RyYXRlZ3lOYW1lXSArPSB3aW5uZXJzLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJlc3VsdHNEaXYuaW5uZXJIVE1MID0gcmVzdWx0c0h0bWwobi9pdGVyYXRpb25zLCB0cnVlKVxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYobjxpdGVyYXRpb25zKSB7XG4gICAgICAgICAgICAgICAgaXRlcmF0aW9uKGNvbXBsZXRlKVxuICAgICAgICAgICAgICAgIG4rK1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb21wbGV0ZSgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgdmFyIHJlc3VsdHNIdG1sID0gZnVuY3Rpb24oY29tcGxldGlvbkZyYWN0aW9uLCBzb3J0KSB7XG4gICAgICAgIHZhciBjb250ZW50ID0ga25vYnNPdXRwdXQrJ0NvbXBsZXRpb246ICcrTnVtYmVyKDEwMCpjb21wbGV0aW9uRnJhY3Rpb24pLnRvUHJlY2lzaW9uKDMpKyclPGJyPicrXG4gICAgICAgICAgICAgICAgICAgICAgJzxkaXY+PGI+Vm90ZXIgU2F0aXNmYWN0aW9uIEF2ZXJhZ2VzIChpbnZlcnNlIG9mIEJheWVzaWFuIFJlZ3JldCk6PC9iPjwvZGl2PicrXG4gICAgICAgICAgICAgICAgICAgICAgJzx0YWJsZT4nXG5cbiAgICAgICAgT2JqZWN0LmtleXModG90YWxSZWdyZXRGcmFjdGlvblN1bVBlclN5c3RlbSkubWFwKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiB7bmFtZTpuYW1lLCB0b3RhbFJlZ3JldDp0b3RhbFJlZ3JldEZyYWN0aW9uU3VtUGVyU3lzdGVtW25hbWVdfVxuICAgICAgICB9KS5zb3J0KGZ1bmN0aW9uKGEsYikge1xuICAgICAgICAgICAgaWYoc29ydCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhLnRvdGFsUmVncmV0IC0gYi50b3RhbFJlZ3JldFxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICAgICAgfVxuICAgICAgICB9KS5mb3JFYWNoKGZ1bmN0aW9uKHZvdGluZ1R5cGUpIHtcbiAgICAgICAgICAgIHZhciBzeXN0ZW1TdHJhdGVneU5hbWUgPSB2b3RpbmdUeXBlLm5hbWVcbiAgICAgICAgICAgIHZhciB0b3RhbFJlZ3JldCA9IHZvdGluZ1R5cGUudG90YWxSZWdyZXRcblxuICAgICAgICAgICAgdmFyIGF2ZXJhZ2VSZWdyZXRGcmFjdGlvbiA9IHRvdGFsUmVncmV0L25cbiAgICAgICAgICAgIHZhciBhdmdXaW5uZXJzID0gKHRvdGFsV2lubmVyc1BlclN5c3RlbVtzeXN0ZW1TdHJhdGVneU5hbWVdL24pLnRvUHJlY2lzaW9uKDIpXG5cbiAgICAgICAgICAgIHZhciBkaXNwbGF5QXZlcmFnZSA9IE51bWJlcigxMDAqKDEtYXZlcmFnZVJlZ3JldEZyYWN0aW9uKSkudG9QcmVjaXNpb24oMilcbiAgICAgICAgICAgIGNvbnRlbnQgKz0gJzx0cj48dGQgc3R5bGU9XCJ0ZXh0LWFsaWduOnJpZ2h0O1wiPicrc3lzdGVtU3RyYXRlZ3lOYW1lK1wiPC90ZD48dGQ+PGI+XCIrZGlzcGxheUF2ZXJhZ2UrJyU8L2I+IHdpdGggYXZnIG9mICcrYXZnV2lubmVycysnIHdpbm5lcnM8L3RkPjwvdHI+J1xuICAgICAgICB9KVxuXG4gICAgICAgIGNvbnRlbnQrPSAnPC90YWJsZT4nXG4gICAgICAgIHJldHVybiBjb250ZW50XG4gICAgfVxuXG4gICAgaXRlcmF0aW9uKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXN1bHRzRGl2LmlubmVySFRNTCA9IHJlc3VsdHNIdG1sKDEsIHRydWUpXG4gICAgfSlcbn1cblxuXG4vLyBUaGUgbmFtZSBvZiBhbiBlbGVjdGlvbiBydW4gd2l0aCBhIHBhcnRpY3VsYXIgc3lzdGVtIGFuZCBzdHJhdGVneVxuZnVuY3Rpb24gZ2V0Vm90aW5nVHlwZU5hbWUoc3lzdGVtTmFtZSxzdHJhdGVneU5hbWUsIGFsZ29yaXRobU5hbWUsIG1heFdpbm5lcnMpIHtcbiAgICBpZihzdHJhdGVneU5hbWUgPT09ICdub25hbWUnKSB7XG4gICAgICAgIHJldHVybiBzeXN0ZW1OYW1lXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICc8c3BhbiBzdHlsZT1cImNvbG9yOnJnYigwLDUwLDE1MClcIj4nK3N5c3RlbU5hbWUrJzwvc3Bhbj4gJythbGdvcml0aG1OYW1lKycgJytzdHJhdGVneU5hbWUrJyBtYXggJyttYXhXaW5uZXJzKycgd2lubmVycydcbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIjtcclxuLyogQ29weXJpZ2h0IChjKSAyMDEzIEJpbGx5IFRldHJ1ZCAtIEZyZWUgdG8gdXNlIGZvciBhbnkgcHVycG9zZTogTUlUIExpY2Vuc2UqL1xyXG5cclxudmFyIG5vb3AgPSBmdW5jdGlvbigpIHt9XHJcblxyXG52YXIgcHJvdG90eXBlTmFtZT0ncHJvdG90eXBlJywgdW5kZWZpbmVkLCBwcm90b1VuZGVmaW5lZD0ndW5kZWZpbmVkJywgaW5pdD0naW5pdCcsIG93blByb3BlcnR5PSh7fSkuaGFzT3duUHJvcGVydHk7IC8vIG1pbmlmaWFibGUgdmFyaWFibGVzXHJcbmZ1bmN0aW9uIHByb3RvKCkge1xyXG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMgLy8gbWluaWZpYWJsZSB2YXJpYWJsZXNcclxuXHJcbiAgICBpZihhcmdzLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgdmFyIHBhcmVudCA9IHtpbml0OiBub29wfVxyXG4gICAgICAgIHZhciBwcm90b3R5cGVCdWlsZGVyID0gYXJnc1swXVxyXG5cclxuICAgIH0gZWxzZSB7IC8vIGxlbmd0aCA9PSAyXHJcbiAgICAgICAgdmFyIHBhcmVudCA9IGFyZ3NbMF1cclxuICAgICAgICB2YXIgcHJvdG90eXBlQnVpbGRlciA9IGFyZ3NbMV1cclxuICAgIH1cclxuXHJcbiAgICAvLyBzcGVjaWFsIGhhbmRsaW5nIGZvciBFcnJvciBvYmplY3RzXHJcbiAgICB2YXIgbmFtZVBvaW50ZXIgPSB7fSAgICAvLyBuYW1lIHVzZWQgb25seSBmb3IgRXJyb3IgT2JqZWN0c1xyXG4gICAgaWYoW0Vycm9yLCBFdmFsRXJyb3IsIFJhbmdlRXJyb3IsIFJlZmVyZW5jZUVycm9yLCBTeW50YXhFcnJvciwgVHlwZUVycm9yLCBVUklFcnJvcl0uaW5kZXhPZihwYXJlbnQpICE9PSAtMSkge1xyXG4gICAgICAgIHBhcmVudCA9IG5vcm1hbGl6ZUVycm9yT2JqZWN0KHBhcmVudCwgbmFtZVBvaW50ZXIpXHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2V0IHVwIHRoZSBwYXJlbnQgaW50byB0aGUgcHJvdG90eXBlIGNoYWluIGlmIGEgcGFyZW50IGlzIHBhc3NlZFxyXG4gICAgdmFyIHBhcmVudElzRnVuY3Rpb24gPSB0eXBlb2YocGFyZW50KSA9PT0gXCJmdW5jdGlvblwiXHJcbiAgICBpZihwYXJlbnRJc0Z1bmN0aW9uKSB7XHJcbiAgICAgICAgcHJvdG90eXBlQnVpbGRlcltwcm90b3R5cGVOYW1lXSA9IHBhcmVudFtwcm90b3R5cGVOYW1lXVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBwcm90b3R5cGVCdWlsZGVyW3Byb3RvdHlwZU5hbWVdID0gcGFyZW50XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdGhlIHByb3RvdHlwZSB0aGF0IHdpbGwgYmUgdXNlZCB0byBtYWtlIGluc3RhbmNlc1xyXG4gICAgdmFyIHByb3RvdHlwZSA9IG5ldyBwcm90b3R5cGVCdWlsZGVyKHBhcmVudClcclxuICAgIG5hbWVQb2ludGVyLm5hbWUgPSBwcm90b3R5cGUubmFtZVxyXG5cclxuICAgIC8vIGlmIHRoZXJlJ3Mgbm8gaW5pdCwgYXNzdW1lIGl0cyBpbmhlcml0aW5nIGEgbm9uLXByb3RvIGNsYXNzLCBzbyBkZWZhdWx0IHRvIGFwcGx5aW5nIHRoZSBzdXBlcmNsYXNzJ3MgY29uc3RydWN0b3IuXHJcbiAgICBpZighcHJvdG90eXBlW2luaXRdICYmIHBhcmVudElzRnVuY3Rpb24pIHtcclxuICAgICAgICBwcm90b3R5cGVbaW5pdF0gPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gY29uc3RydWN0b3IgZm9yIGVtcHR5IG9iamVjdCB3aGljaCB3aWxsIGJlIHBvcHVsYXRlZCB2aWEgdGhlIGNvbnN0cnVjdG9yXHJcbiAgICB2YXIgRiA9IGZ1bmN0aW9uKCkge31cclxuICAgICAgICBGW3Byb3RvdHlwZU5hbWVdID0gcHJvdG90eXBlICAgIC8vIHNldCB0aGUgcHJvdG90eXBlIGZvciBjcmVhdGVkIGluc3RhbmNlc1xyXG5cclxuICAgIHZhciBjb25zdHJ1Y3Rvck5hbWUgPSBwcm90b3R5cGUubmFtZT9wcm90b3R5cGUubmFtZTonJ1xyXG4gICAgaWYocHJvdG90eXBlW2luaXRdID09PSB1bmRlZmluZWQgfHwgcHJvdG90eXBlW2luaXRdID09PSBub29wKSB7XHJcbiAgICAgICAgdmFyIFByb3RvT2JqZWN0RmFjdG9yeSA9IG5ldyBGdW5jdGlvbignRicsXHJcbiAgICAgICAgICAgIFwicmV0dXJuIGZ1bmN0aW9uIFwiICsgY29uc3RydWN0b3JOYW1lICsgXCIoKXtcIiArXHJcbiAgICAgICAgICAgICAgICBcInJldHVybiBuZXcgRigpXCIgK1xyXG4gICAgICAgICAgICBcIn1cIlxyXG4gICAgICAgICkoRilcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gZHluYW1pY2FsbHkgY3JlYXRpbmcgdGhpcyBmdW5jdGlvbiBjYXVzZSB0aGVyZSdzIG5vIG90aGVyIHdheSB0byBkeW5hbWljYWxseSBuYW1lIGEgZnVuY3Rpb25cclxuICAgICAgICB2YXIgUHJvdG9PYmplY3RGYWN0b3J5ID0gbmV3IEZ1bmN0aW9uKCdGJywnaScsJ3UnLCduJywgLy8gc2hpdHR5IHZhcmlhYmxlcyBjYXVzZSBtaW5pZmllcnMgYXJlbid0IGdvbm5hIG1pbmlmeSBteSBmdW5jdGlvbiBzdHJpbmcgaGVyZVxyXG4gICAgICAgICAgICBcInJldHVybiBmdW5jdGlvbiBcIiArIGNvbnN0cnVjdG9yTmFtZSArIFwiKCl7IFwiICtcclxuICAgICAgICAgICAgICAgIFwidmFyIHg9bmV3IEYoKSxyPWkuYXBwbHkoeCxhcmd1bWVudHMpXFxuXCIgKyAgICAvLyBwb3B1bGF0ZSBvYmplY3QgdmlhIHRoZSBjb25zdHJ1Y3RvclxyXG4gICAgICAgICAgICAgICAgXCJpZihyPT09bilcXG5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgXCJyZXR1cm4geFxcblwiICtcclxuICAgICAgICAgICAgICAgIFwiZWxzZSBpZihyPT09dSlcXG5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgXCJyZXR1cm4gblxcblwiICtcclxuICAgICAgICAgICAgICAgIFwiZWxzZVxcblwiICtcclxuICAgICAgICAgICAgICAgICAgICBcInJldHVybiByXFxuXCIgK1xyXG4gICAgICAgICAgICBcIn1cIlxyXG4gICAgICAgICkoRiwgcHJvdG90eXBlW2luaXRdLCBwcm90b1twcm90b1VuZGVmaW5lZF0pIC8vIG5vdGUgdGhhdCBuIGlzIHVuZGVmaW5lZFxyXG4gICAgfVxyXG5cclxuICAgIHByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFByb3RvT2JqZWN0RmFjdG9yeTsgICAgLy8gc2V0IHRoZSBjb25zdHJ1Y3RvciBwcm9wZXJ0eSBvbiB0aGUgcHJvdG90eXBlXHJcblxyXG4gICAgLy8gYWRkIGFsbCB0aGUgcHJvdG90eXBlIHByb3BlcnRpZXMgb250byB0aGUgc3RhdGljIGNsYXNzIGFzIHdlbGwgKHNvIHlvdSBjYW4gYWNjZXNzIHRoYXQgY2xhc3Mgd2hlbiB5b3Ugd2FudCB0byByZWZlcmVuY2Ugc3VwZXJjbGFzcyBwcm9wZXJ0aWVzKVxyXG4gICAgZm9yKHZhciBuIGluIHByb3RvdHlwZSkge1xyXG4gICAgICAgIGFkZFByb3BlcnR5KFByb3RvT2JqZWN0RmFjdG9yeSwgcHJvdG90eXBlLCBuKVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGFkZCBwcm9wZXJ0aWVzIGZyb20gcGFyZW50IHRoYXQgZG9uJ3QgZXhpc3QgaW4gdGhlIHN0YXRpYyBjbGFzcyBvYmplY3QgeWV0XHJcbiAgICBmb3IodmFyIG4gaW4gcGFyZW50KSB7XHJcbiAgICAgICAgaWYob3duUHJvcGVydHkuY2FsbChwYXJlbnQsIG4pICYmIFByb3RvT2JqZWN0RmFjdG9yeVtuXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGFkZFByb3BlcnR5KFByb3RvT2JqZWN0RmFjdG9yeSwgcGFyZW50LCBuKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBQcm90b09iamVjdEZhY3RvcnkucGFyZW50ID0gcGFyZW50OyAgICAgICAgICAgIC8vIHNwZWNpYWwgcGFyZW50IHByb3BlcnR5IG9ubHkgYXZhaWxhYmxlIG9uIHRoZSByZXR1cm5lZCBwcm90byBjbGFzc1xyXG4gICAgUHJvdG9PYmplY3RGYWN0b3J5W3Byb3RvdHlwZU5hbWVdID0gcHJvdG90eXBlICAvLyBzZXQgdGhlIHByb3RvdHlwZSBvbiB0aGUgb2JqZWN0IGZhY3RvcnlcclxuXHJcbiAgICByZXR1cm4gUHJvdG9PYmplY3RGYWN0b3J5O1xyXG59XHJcblxyXG5wcm90b1twcm90b1VuZGVmaW5lZF0gPSB7fSAvLyBhIHNwZWNpYWwgbWFya2VyIGZvciB3aGVuIHlvdSB3YW50IHRvIHJldHVybiB1bmRlZmluZWQgZnJvbSBhIGNvbnN0cnVjdG9yXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHByb3RvXHJcblxyXG5mdW5jdGlvbiBub3JtYWxpemVFcnJvck9iamVjdChFcnJvck9iamVjdCwgbmFtZVBvaW50ZXIpIHtcclxuICAgIGZ1bmN0aW9uIE5vcm1hbGl6ZWRFcnJvcigpIHtcclxuICAgICAgICB2YXIgdG1wID0gbmV3IEVycm9yT2JqZWN0KGFyZ3VtZW50c1swXSlcclxuICAgICAgICB0bXAubmFtZSA9IG5hbWVQb2ludGVyLm5hbWVcclxuXHJcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gdG1wLm1lc3NhZ2VcclxuICAgICAgICBpZihPYmplY3QuZGVmaW5lUHJvcGVydHkpIHtcclxuICAgICAgICAgICAgLyp0aGlzLnN0YWNrID0gKi9PYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ3N0YWNrJywgeyAvLyBnZXR0ZXIgZm9yIG1vcmUgb3B0aW1penkgZ29vZG5lc3NcclxuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRtcC5zdGFja1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSAvLyBzbyB5b3UgY2FuIGNoYW5nZSBpdCBpZiB5b3Ugd2FudFxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhY2sgPSB0bXAuc3RhY2tcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcblxyXG4gICAgdmFyIEludGVybWVkaWF0ZUluaGVyaXRvciA9IGZ1bmN0aW9uKCkge31cclxuICAgICAgICBJbnRlcm1lZGlhdGVJbmhlcml0b3IucHJvdG90eXBlID0gRXJyb3JPYmplY3QucHJvdG90eXBlXHJcbiAgICBOb3JtYWxpemVkRXJyb3IucHJvdG90eXBlID0gbmV3IEludGVybWVkaWF0ZUluaGVyaXRvcigpXHJcblxyXG4gICAgcmV0dXJuIE5vcm1hbGl6ZWRFcnJvclxyXG59XHJcblxyXG5mdW5jdGlvbiBhZGRQcm9wZXJ0eShmYWN0b3J5T2JqZWN0LCBwcm90b3R5cGUsIHByb3BlcnR5KSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHZhciBpbmZvID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihwcm90b3R5cGUsIHByb3BlcnR5KVxyXG4gICAgICAgIGlmKGluZm8uZ2V0ICE9PSB1bmRlZmluZWQgfHwgaW5mby5nZXQgIT09IHVuZGVmaW5lZCAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZmFjdG9yeU9iamVjdCwgcHJvcGVydHksIGluZm8pXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZmFjdG9yeU9iamVjdFtwcm9wZXJ0eV0gPSBwcm90b3R5cGVbcHJvcGVydHldXHJcbiAgICAgICAgfVxyXG4gICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgLy8gZG8gbm90aGluZywgaWYgYSBwcm9wZXJ0eSAobGlrZSBgbmFtZWApIGNhbid0IGJlIHNldCwganVzdCBpZ25vcmUgaXRcclxuICAgIH1cclxufSIsIlxuXG4vLyByYW5kb20gbnVtYmVyIGJldHdlZW4gMCBhbmQgMSAoanVzdCBsaWtlIE1hdGgucmFuZG9tKVxuZXhwb3J0cy5yYW5kb20gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmFuZG9tSW50ZWdlciA9IGdldFJhbmRvbUludCgwLDI1NSlcbiAgICByZXR1cm4gcmFuZG9tSW50ZWdlci8yNTVcbn1cblxuZnVuY3Rpb24gZ2V0UmFuZG9tSW50KG1pbiwgbWF4KSB7XG4gICAgLy8gQ3JlYXRlIGJ5dGUgYXJyYXkgYW5kIGZpbGwgd2l0aCAxIHJhbmRvbSBudW1iZXJcbiAgICB2YXIgYnl0ZUFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoMSk7XG4gICAgd2luZG93LmNyeXB0by5nZXRSYW5kb21WYWx1ZXMoYnl0ZUFycmF5KTtcblxuICAgIHZhciByYW5nZSA9IG1heCAtIG1pbiArIDE7XG4gICAgdmFyIG1heF9yYW5nZSA9IDI1NjtcbiAgICBpZiAoYnl0ZUFycmF5WzBdID49IE1hdGguZmxvb3IobWF4X3JhbmdlIC8gcmFuZ2UpICogcmFuZ2UpXG4gICAgICAgIHJldHVybiBnZXRSYW5kb21JbnQobWluLCBtYXgpO1xuICAgIHJldHVybiBtaW4gKyAoYnl0ZUFycmF5WzBdICUgcmFuZ2UpO1xufVxuXG4vLyBSZXR1cm5zIHRoZSByZXN1bHRzIG9mIGEgeWVzL25vIHdlaWdodGVkIG1ham9yaXR5IHZvdGUgb24gZWFjaCBzb2NpZXRhbCBwcmVmZXJlbmNlIGFzIGFuIGFycmF5IHdoZXJlXG4vLyBlYWNoIGluZGV4IGluZGljYXRlcyB0aGUgc29jaWV0YWwgb3B0aW9uIGFuZCB0aGUgdmFsdWUgaXMgZWl0aGVyIHRydWUgb3IgZmFsc2Vcbi8vIGRlY2lkZXJzIC0gQW4gYXJyYXkgb2Ygd2lubmluZyBjYW5kaWRhdGVzIGluIHRoZSBzYW1lIGZvcm0gYXMgdGhpcy5lbGVjdCByZXR1cm5zXG5tb2R1bGUuZXhwb3J0cy5maW5kU29jaWV0YWxPcHRpb25zT3V0Y29tZXMgPSBmdW5jdGlvbihkZWNpZGVycykge1xuICAgIHZhciB2b3RlV2VpZ2h0VG90YWwgPSAwXG4gICAgdmFyIHNvY2lldGFsT3B0aW9uc1ZvdGVzID0gW11cbiAgICBkZWNpZGVycy5mb3JFYWNoKGZ1bmN0aW9uKHBlcnNvbikge1xuICAgICAgICB2b3RlV2VpZ2h0VG90YWwgKz0gcGVyc29uLndlaWdodFxuICAgICAgICBwZXJzb24ucHJlZmVyZW5jZXMuZm9yRWFjaChmdW5jdGlvbihwcmVmZXJlbmNlLCBpbmRleCkge1xuICAgICAgICAgICAgaWYoc29jaWV0YWxPcHRpb25zVm90ZXNbaW5kZXhdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBzb2NpZXRhbE9wdGlvbnNWb3Rlc1tpbmRleF0gPSAwXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKHByZWZlcmVuY2UgPiAwKSB7XG4gICAgICAgICAgICAgICAgc29jaWV0YWxPcHRpb25zVm90ZXNbaW5kZXhdICs9IHBlcnNvbi53ZWlnaHRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHNvY2lldGFsT3B0aW9uc1ZvdGVzLm1hcChmdW5jdGlvbih2b3Rlc0Zvck9uZVNvY2lldGFsT3B0aW9uKSB7XG4gICAgICAgIHJldHVybiB2b3Rlc0Zvck9uZVNvY2lldGFsT3B0aW9uL3ZvdGVXZWlnaHRUb3RhbCA+IC41XG4gICAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMudm90ZXJPdXRjb21lVXRpbGl0eSA9IGZ1bmN0aW9uKHZvdGVyLCBvdXRjb21lcykge1xuICAgIHZhciB0b3RhbFV0aWxpdHkgPSAgMFxuICAgIHZvdGVyLmZvckVhY2goZnVuY3Rpb24odXRpbGl0eSxpbmRleCkge1xuICAgICAgICBpZihvdXRjb21lc1tpbmRleF0pXG4gICAgICAgICAgICB0b3RhbFV0aWxpdHkgKz0gdXRpbGl0eVxuICAgIH0pXG5cbiAgICByZXR1cm4gdG90YWxVdGlsaXR5XG59IiwiXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJylcblxuLy8gdm90ZXMgYXJlIGZsb2F0aW5nIHBvaW50IG51bWJlcnMgYmV0d2VlbiAwIGFuZCAxXG5mdW5jdGlvbiByYW5nZVN0cmF0ZWd5X2hvbmVzdEV4YWN0KHZvdGVyLCBhZ2dyZWdhdGVzKSB7XG4gICAgLy8gdGhlIG1heGltdW0gdXRpbGl0eSB0aGF0IHRoZSBiZXN0IGRpY3RhdG9yLWNhbmRpZGF0ZSB3b3VsZCBnaXZlIGZvciB0aGlzIHZvdGVyXG4gICAgdmFyIG1heFV0aWxpdHkgPSBNYXRoLm1heC5hcHBseShudWxsLCBhZ2dyZWdhdGVzLmNhbmRpZGF0ZURpY3RhdG9yVXRpbGl0aWVzKVxuICAgIHZhciBtaW5VdGlsaXR5ID0gTWF0aC5taW4uYXBwbHkobnVsbCwgYWdncmVnYXRlcy5jYW5kaWRhdGVEaWN0YXRvclV0aWxpdGllcylcblxuICAgIHJldHVybiBhZ2dyZWdhdGVzLmNhbmRpZGF0ZURpY3RhdG9yVXRpbGl0aWVzLm1hcChmdW5jdGlvbih1dGlsaXR5KSB7XG4gICAgICAgIGlmKG1heFV0aWxpdHkgPT09IG1pblV0aWxpdHkpIHsgLy8gdGhpcyBicmFuY2ggcHJldmVudHMgYSBkaXZpZGUgYnkgMCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIC41XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgdXRpbGl0eUZyYWN0aW9uID0gKHV0aWxpdHktbWluVXRpbGl0eSkvKG1heFV0aWxpdHktbWluVXRpbGl0eSlcbiAgICAgICAgICAgIHJldHVybiB1dGlsaXR5RnJhY3Rpb25cbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIHJhbmtlZFZvdGVfaG9uZXN0KHZvdGVyLCBhZ2dyZWdhdGVzKSB7XG4gICAgdmFyIG9yZGVyID0gYWdncmVnYXRlcy5jYW5kaWRhdGVEaWN0YXRvclV0aWxpdGllcy5tYXAoZnVuY3Rpb24oY2FuZGlkYXRlVXRpbGl0eSwgaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIHt1dGlsaXR5OiBjYW5kaWRhdGVVdGlsaXR5LCBpbmRleDppbmRleH1cbiAgICB9KS5zb3J0KGZ1bmN0aW9uKGEsYikge1xuICAgICAgICByZXR1cm4gYi51dGlsaXR5LWEudXRpbGl0eSAvLyBoaWdoZXN0IHRvIGxvd2VzdFxuICAgIH0pXG5cbiAgICByZXR1cm4gb3JkZXIubWFwKGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgcmV0dXJuIHguaW5kZXhcbiAgICB9KVxufVxuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHJhbmtlZDoge1xuICAgICAgICBIb25lc3Q6IHJhbmtlZFZvdGVfaG9uZXN0XG4gICAgfSxcbiAgICBzY29yZWQ6IHtcbiAgICAgICAgSG9uZXN0OiByYW5nZVN0cmF0ZWd5X2hvbmVzdEV4YWN0XG4gICAgfSxcbiAgICBub29wOiB7XG4gICAgICAgICcnOmZ1bmN0aW9uKCl7fVxuICAgIH1cbn0iLCJ2YXIgcmFuZG9tID0gcmVxdWlyZShcIi4vdXRpbHNcIikucmFuZG9tXG5cblxuZnVuY3Rpb24gcGx1cmFsaXR5QWxnKHZvdGVzLCBjYW5kaWRhdGVzLCBtYXhXaW5uZXJzKSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXVxuICAgIGZvcih2YXIgbj0wOyBuPGNhbmRpZGF0ZXMubGVuZ3RoO24rKykge1xuICAgICAgICByZXN1bHRzW25dID0gMFxuICAgIH1cblxuICAgIHZvdGVzLmZvckVhY2goZnVuY3Rpb24odm90ZSkge1xuICAgICAgICByZXN1bHRzW3ZvdGVbMF1dKytcbiAgICB9KVxuXG4gICAgdmFyIHNvcnRlZFRyYW5zZm9ybWVkUmVzdWx0cyA9IHJlc3VsdHMubWFwKGZ1bmN0aW9uKHZhbHVlLGluZGV4KXtcbiAgICAgICAgcmV0dXJuIHtjYW5kaWRhdGU6aW5kZXgsdm90ZXM6dmFsdWV9XG4gICAgfSkuc29ydChmdW5jdGlvbihhLGIpIHtcbiAgICAgICAgcmV0dXJuIGIudm90ZXMgLSBhLnZvdGVzIC8vIHJldmVyc2Ugc29ydFxuICAgIH0pXG5cbiAgICByZXR1cm4gc29ydGVkVHJhbnNmb3JtZWRSZXN1bHRzLnNsaWNlKDAsbWF4V2lubmVycykubWFwKGZ1bmN0aW9uKHdpbm5lcikge1xuICAgICAgICByZXR1cm4ge2luZGV4OiB3aW5uZXIuY2FuZGlkYXRlLCB3ZWlnaHQ6MX1cbiAgICB9KVxufVxuXG5cbi8vIGNvdW50VHlwZSBjYW4gZWl0aGVyIGJlIFwibm9ybWFsXCIgb3IgXCJtYXhNaW5vcml0eVwiXG4gICAgLy8gbm9ybWFsIGlzIHdoZXJlIHRoZSB3aW5uZXJzIGFyZSB0aGUgeCBjYW5kaWRhdGVzIHdpdGggdGhlIGdyZWF0ZXN0IHRvdGFsIHNjb3JlXG4gICAgLy8gbWF4TWlub3JpdHkgaXMgd2hlcmUgZWFjaCBzdWNjZXNzaXZlIHdpbm5lciBpcyBjaG9zZW4gZnJvbSBvbmx5IHRoZSB2b3RlcyBvZiB0aG9zZSB3aG8gaGF2ZW4ndCBjaG9zZW4gYSB3aW5uZXIgYXMgdGhlaXIgdG9wIGNob2ljZVxuICAgIC8vIHJld2VpZ2h0ZWQgaXMgZm9yIGEgcmV3ZWlnaHRlZCByYW5nZSB2b3RlIGRlc2NyaWJlZCBoZXJlOyBodHRwOi8vd3d3LnJhbmdldm90aW5nLm9yZy9SUlYuaHRtbFxuLy8gd2lubmVyV2VpZ2h0VHlwZSBjYW4gZWl0aGVyIGJlIFwiaGlnaGVzdFwiIG9yIFwic3BsaXRcIlxuICAgIC8vIFwiaGlnaGVzdFwiIG1lYW5zIHdpbm5lciB2b3RlIHdlaWdodCB3aWxsIGJlIHRoZSBzdW0gb2YgdGhlIG51bWJlciBvZiB2b3RlcnMgd2hvIGdhdmUgdGhhdCB3aW5uZXIgdGhlIGhpZ2hlc3Qgc2NvcmVcbiAgICAvLyBcInNwbGl0XCIgbWVhbnMgd2lubmVyIHZvdGUgd2VpZ2h0IGlzIHRoZSBzdW0gb2YgYWxsIHZvdGVzXG4gICAgLy8gXCJlcXVhbFwiIG1lYW5zIGVhY2ggd2lubmVyIGdldHMgYW4gZXF1YWwgdm90ZSB3ZWlnaHRcbi8vIG1pblRocmVzaG9sZCBpcyBhIG51bWJlciBmcm9tIDAgdG8gMSByZXByZXNlbnRpbmcgdGhlIHJhdGlvIG9mIGF2ZXJhZ2Ugc2NvcmUgdG8gdGhlIGF2ZXJhZ2Ugc2NvcmUgb2YgdGhlIGhpZ2hlc3Qgc2NvcmluZyBjYW5kaWRhdGVcbiAgICAvLyBub3RlIHRoYXQgdGhlIHZvdGVzIGFyZSBzaGlmdGVkIHNvIHRoYXQgdGhleSdyZSBhIHJhbmdlIGZyb20gMCB0byAyIGZvciB0aGUgcHVycG9zZXMgb2YgY2FsY3VsYXRpbmcgdGhpc1xuZnVuY3Rpb24gZGlyZWN0UmVwcmVzZW50YXRpb25SYW5nZShjb3VudFR5cGUsIHdpbm5lcldlaWdodFR5cGUsIG1pblRocmVzaG9sZCkge1xuICAgIHJldHVybiBmdW5jdGlvbih2b3RlcywgY2FuZGlkYXRlcywgbWF4V2lubmVycykge1xuXG4gICAgICAgIHZhciB3aW5uZXJzID0ge30sIGRpc3F1YWxpZmllZCA9IHt9XG5cbiAgICAgICAgdmFyIGNvdW50ZWRWb3RlcyA9IGNvdW50Vm90ZXMoY2FuZGlkYXRlcywgdm90ZXMsIHdpbm5lcnMsIGRpc3F1YWxpZmllZClcbiAgICAgICAgdmFyIG5leHRXaW5uZXIgPSBmaW5kTmV4dFdpbm5lcihjb3VudGVkVm90ZXMpXG4gICAgICAgIHZhciBoaWdoZXN0QXZnU2NvcmUgPSBnZXRBdmdTY29yZShjb3VudGVkVm90ZXNbbmV4dFdpbm5lcl0pXG5cbiAgICAgICAgY291bnRlZFZvdGVzLmZvckVhY2goZnVuY3Rpb24oaW5mbywgY2FuZGlkYXRlKSB7XG4gICAgICAgICAgICB2YXIgYXZnU2NvcmUgPSBnZXRBdmdTY29yZShpbmZvKVxuICAgICAgICAgICAgaWYoYXZnU2NvcmUgPCBoaWdoZXN0QXZnU2NvcmUqbWluVGhyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgZGlzcXVhbGlmaWVkW2NhbmRpZGF0ZV0gPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgd2lubmVyc1tuZXh0V2lubmVyXSA9IHRydWVcblxuICAgICAgICB3aGlsZShPYmplY3Qua2V5cyh3aW5uZXJzKS5sZW5ndGggPCBtYXhXaW5uZXJzICYmIE9iamVjdC5rZXlzKHdpbm5lcnMpLmxlbmd0aCtPYmplY3Qua2V5cyhkaXNxdWFsaWZpZWQpLmxlbmd0aCA8IGNhbmRpZGF0ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgbmV4dFdpbm5lckNvdW50ZWRWb3RlcyA9IGNvdW50Vm90ZXMoY2FuZGlkYXRlcywgdm90ZXMsIHdpbm5lcnMsIGRpc3F1YWxpZmllZCwgY291bnRUeXBlKVxuXG4gICAgICAgICAgICB2YXIgbmV4dFdpbm5lciA9IGZpbmROZXh0V2lubmVyKG5leHRXaW5uZXJDb3VudGVkVm90ZXMpXG4gICAgICAgICAgICB3aW5uZXJzW25leHRXaW5uZXJdID0gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYod2lubmVyV2VpZ2h0VHlwZSA9PT0gJ2hpZ2hlc3QnKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0cyA9IFtdXG4gICAgICAgICAgICB2YXIgcmVzdWx0c01hcCA9IHt9IC8vbWFwcyBhIHdpbm5lciB0byBhIHJlc3VsdCBpbmRleFxuICAgICAgICAgICAgZm9yKHZhciB3aW5uZXIgaW4gd2lubmVycykge1xuICAgICAgICAgICAgICAgIHJlc3VsdHNNYXBbd2lubmVyXSA9IHJlc3VsdHMubGVuZ3RoXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHtpbmRleDp3aW5uZXIsIHdlaWdodDowfSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdm90ZXMuZm9yRWFjaChmdW5jdGlvbih2b3RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhpZ2hlc3RXaW5uZXJzID0ge30sIGhpZ2hlc3RXaW5uZXJTY29yZSA9IC1JbmZpbml0eVxuICAgICAgICAgICAgICAgIHZvdGUuZm9yRWFjaChmdW5jdGlvbihzY29yZSwgY2FuZGlkYXRlSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYoY2FuZGlkYXRlSW5kZXggaW4gd2lubmVycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2NvcmUgPiBoaWdoZXN0V2lubmVyU2NvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWdoZXN0V2lubmVycyA9IHt9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGVzdFdpbm5lcnNbY2FuZGlkYXRlSW5kZXhdID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hlc3RXaW5uZXJTY29yZSA9IHNjb3JlXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoc2NvcmUgPT09IGhpZ2hlc3RXaW5uZXJTY29yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hlc3RXaW5uZXJzW2NhbmRpZGF0ZUluZGV4XSA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICB2YXIgbnVtYmVyT2ZIaWdoZXN0V2lubmVycyA9IE9iamVjdC5rZXlzKGhpZ2hlc3RXaW5uZXJzKS5sZW5ndGhcbiAgICAgICAgICAgICAgICBmb3IodmFyIHdpbm5lciBpbiBoaWdoZXN0V2lubmVycykge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzW3Jlc3VsdHNNYXBbd2lubmVyXV0ud2VpZ2h0ICs9IDEvbnVtYmVyT2ZIaWdoZXN0V2lubmVyc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSBpZih3aW5uZXJXZWlnaHRUeXBlID09PSAnc3BsaXQnKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0cyA9IFtdXG4gICAgICAgICAgICBmb3IodmFyIHdpbm5lciBpbiB3aW5uZXJzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGF2Z1Njb3JlID0gY291bnRlZFZvdGVzW3dpbm5lcl0udG90YWxTY29yZS9jb3VudGVkVm90ZXNbd2lubmVyXS50b3RhbE51bWJlclxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7aW5kZXg6d2lubmVyLCB3ZWlnaHQ6YXZnU2NvcmV9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYod2lubmVyV2VpZ2h0VHlwZSA9PT0gJ2VxdWFsJykge1xuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBbXVxuICAgICAgICAgICAgZm9yKHZhciB3aW5uZXIgaW4gd2lubmVycykge1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7aW5kZXg6d2lubmVyLCB3ZWlnaHQ6MX0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0c1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEF2Z1Njb3JlKGNhbmRpZGF0ZUluZm8pIHtcbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZUluZm8udG90YWxTY29yZS9jYW5kaWRhdGVJbmZvLnRvdGFsTnVtYmVyXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmluZE5leHRXaW5uZXIoY291bnRlZFZvdGVzKSB7XG4gICAgICAgIHZhciBuZXh0V2lubmVyLCBjdXJXaW5uZXJTY29yZSA9IC1JbmZpbml0eVxuICAgICAgICBjb3VudGVkVm90ZXMuZm9yRWFjaChmdW5jdGlvbihpbmZvLCBjYW5kaWRhdGUpIHtcbiAgICAgICAgICAgIGlmKGluZm8udG90YWxTY29yZSA+IGN1cldpbm5lclNjb3JlKSB7XG4gICAgICAgICAgICAgICAgbmV4dFdpbm5lciA9IGNhbmRpZGF0ZVxuICAgICAgICAgICAgICAgIGN1cldpbm5lclNjb3JlID0gaW5mby50b3RhbFNjb3JlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIG5leHRXaW5uZXJcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb3VudFZvdGVzKGNhbmRpZGF0ZXMsIHZvdGVzLCB3aW5uZXJzLCBkaXNxdWFsaWZpZWQsIGNvdW50VHlwZSkge1xuICAgICAgICBpZih3aW5uZXJzID09PSB1bmRlZmluZWQpIHdpbm5lcnMgPSB7fVxuICAgICAgICB2YXIgY291bnRlZFZvdGVzID0gY2FuZGlkYXRlcy5tYXAoZnVuY3Rpb24ocCxjKXtcbiAgICAgICAgICAgIGlmKCEoYyBpbiB3aW5uZXJzKSAmJiAhKGMgaW4gZGlzcXVhbGlmaWVkKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7dG90YWxTY29yZTowLCB0b3RhbE51bWJlcjowfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge3RvdGFsU2NvcmU6LUluZmluaXR5LCB0b3RhbE51bWJlcjowfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICB2b3Rlcy5mb3JFYWNoKGZ1bmN0aW9uKHZvdGUpIHtcbiAgICAgICAgICAgIGlmKGNvdW50VHlwZSA9PT0gJ21heE1pbm9yaXR5Jykge1xuICAgICAgICAgICAgICAgIHZhciBoaWdoZXN0Q2FuZGlkYXRlcyA9IHt9LCBoaWdoZXN0U2NvcmUgPSAtSW5maW5pdHlcbiAgICAgICAgICAgICAgICB2b3RlLmZvckVhY2goZnVuY3Rpb24oc2NvcmUsIGNhbmRpZGF0ZUluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKHNjb3JlID4gaGlnaGVzdFNjb3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoaWdoZXN0Q2FuZGlkYXRlcyA9IHt9XG4gICAgICAgICAgICAgICAgICAgICAgICBoaWdoZXN0Q2FuZGlkYXRlc1tjYW5kaWRhdGVJbmRleF0gPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICBoaWdoZXN0U2NvcmUgPSBzY29yZVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoc2NvcmUgPT09IGhpZ2hlc3RTY29yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGVzdENhbmRpZGF0ZXNbY2FuZGlkYXRlSW5kZXhdID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIGZvcih2YXIgYyBpbiBoaWdoZXN0Q2FuZGlkYXRlcykgeyAgLy8gb25seSBjb3VudCB2b3RlcyBmb3IgcGVvcGxlIHdobydzIGhpZ2hlc3QgY2hvaWNlIGlzbid0IGEgd2lubmVyXG4gICAgICAgICAgICAgICAgICAgIGlmKGMgaW4gd2lubmVycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuOyAvLyBjb250aW51ZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmKGNvdW50VHlwZSA9PT0gJ3Jld2VpZ2h0ZWQnKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN1bVNjb3JlRm9yV2lubmVycyA9IDBcbiAgICAgICAgICAgICAgICB2b3RlLmZvckVhY2goZnVuY3Rpb24oc2NvcmUsIGNhbmRpZGF0ZUluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKGNhbmRpZGF0ZUluZGV4IGluIHdpbm5lcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1bVNjb3JlRm9yV2lubmVycyArPSBzY29yZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIHZhciB3ZWlnaHQgPSAxLygxK3N1bVNjb3JlRm9yV2lubmVycy8yKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2b3RlLmZvckVhY2goZnVuY3Rpb24oc2NvcmUsIGNhbmRpZGF0ZUluZGV4KSB7XG4gICAgICAgICAgICAgICAgaWYoIShjYW5kaWRhdGVJbmRleCBpbiBkaXNxdWFsaWZpZWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoYXNudENob3NlbkFXaW5uZXIgPSAhKGNhbmRpZGF0ZUluZGV4IGluIHdpbm5lcnMpXG4gICAgICAgICAgICAgICAgICAgIGlmKGNvdW50VHlwZSA9PT0gJ3Jld2VpZ2h0ZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudGVkVm90ZXNbY2FuZGlkYXRlSW5kZXhdLnRvdGFsU2NvcmUgKz0gc2NvcmUqd2VpZ2h0XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudGVkVm90ZXNbY2FuZGlkYXRlSW5kZXhdLnRvdGFsTnVtYmVyICsrXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZihjb3VudFR5cGUgIT09ICdtYXhNaW5vcml0eScgfHwgaGFzbnRDaG9zZW5BV2lubmVyKSB7ICAvLyBvbmx5IGNvdW50IHZvdGVzIGZvciBuZXcgcG90ZW50aWFsIHdpbm5lcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVJbmRleF0udG90YWxTY29yZSArPSBzY29yZVxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRlZFZvdGVzW2NhbmRpZGF0ZUluZGV4XS50b3RhbE51bWJlciArK1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgICAgcmV0dXJuIGNvdW50ZWRWb3Rlc1xuICAgIH1cbn1cblxuLy8gdGhyZXNob2xkIC0gYSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxIGluY2x1c2l2ZVxuZnVuY3Rpb24gZnJhY3Rpb25hbFJlcHJlc2VudGF0aXZlUmFua2VkVm90ZSh0aHJlc2hvbGQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24odm90ZXMsIGNhbmRpZGF0ZXMsIG1heFdpbm5lcnMpIHtcbiAgICAgICAgdmFyIG1pbmltdW1XaW5uaW5nVm90ZXMgPSB2b3Rlcy5sZW5ndGgqdGhyZXNob2xkXG4gICAgICAgIHZhciBvcmlnaW5hbFZvdGVzID0gdm90ZXNcblxuICAgICAgICB2YXIgY3VycmVudFdpbm5lcnMgPSB7fSwgY291bnRlZFZvdGVzID0gY2FuZGlkYXRlcy5tYXAoZnVuY3Rpb24oKXtyZXR1cm4gMH0pXG4gICAgICAgIHZvdGVzLmZvckVhY2goZnVuY3Rpb24odm90ZSkge1xuICAgICAgICAgICAgdmFyIGNhbmRpZGF0ZUluZGV4ID0gdm90ZVswXVxuICAgICAgICAgICAgY291bnRlZFZvdGVzW2NhbmRpZGF0ZUluZGV4XSArK1xuICAgICAgICB9KVxuXG4gICAgICAgIC8vIHNlbGVjdCBpbml0aWFsIHdpbm5lcnNcbiAgICAgICAgZm9yKHZhciBjYW5kaWRhdGVJbmRleCBpbiBjb3VudGVkVm90ZXMpIHtcbiAgICAgICAgICAgIHZhciB2b3Rlc0ZvclRoaXNDYW5kaWRhdGUgPSBjb3VudGVkVm90ZXNbY2FuZGlkYXRlSW5kZXhdXG4gICAgICAgICAgICBpZih2b3Rlc0ZvclRoaXNDYW5kaWRhdGUgPj0gbWluaW11bVdpbm5pbmdWb3Rlcykge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRXaW5uZXJzW2NhbmRpZGF0ZUluZGV4XSA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlbW92ZSB2b3RlcyBvZiB0aG9zZSB3aG8gaGF2ZSBjaG9zZW4gYSB3aW5uZXJcbiAgICAgICAgdm90ZXMgPSB2b3Rlcy5maWx0ZXIoZnVuY3Rpb24odm90ZSkge1xuICAgICAgICAgICAgcmV0dXJuICEodm90ZVswXSBpbiBjdXJyZW50V2lubmVycylcbiAgICAgICAgfSlcblxuICAgICAgICAvLyBpdGVyYXRlIHRocm91Z2ggcHJlZmVyZW5jZXMgdG8gZmluZCBtb3JlIHdpbm5lcnNcbiAgICAgICAgZm9yKHZhciBjdXJyZW50UHJlZmVyZW5jZUluZGV4ID0gMTsgY3VycmVudFByZWZlcmVuY2VJbmRleDxjYW5kaWRhdGVzLmxlbmd0aDsgY3VycmVudFByZWZlcmVuY2VJbmRleCsrKSB7XG4gICAgICAgICAgICB2b3Rlcy5mb3JFYWNoKGZ1bmN0aW9uKHZvdGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2FuZGlkYXRlSW5kZXggPSB2b3RlW2N1cnJlbnRQcmVmZXJlbmNlSW5kZXhdXG4gICAgICAgICAgICAgICAgY291bnRlZFZvdGVzW2NhbmRpZGF0ZUluZGV4XSArK1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgLy8gaWYgdGhlcmUgYXJlIGFueSB3aW5uZXJzIGNvbWJpbmluZyBwcmVmZXJlbmNlcyAwIHRocm91Z2ggbiwgY2hvb3NlIGJlc3Qgd2lubmVyIHdobyBpc24ndCBhbHJlYWR5IGEgd2lubmVyXG4gICAgICAgICAgICB2YXIgbGVhZGluZ05vbldpbm5lciwgbGVhZGluZ05vbldpbm5lclZvdGVzID0gMFxuICAgICAgICAgICAgZm9yKHZhciBjYW5kaWRhdGVJbmRleCBpbiBjb3VudGVkVm90ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgdm90ZXNGb3JUaGlzQ2FuZGlkYXRlID0gY291bnRlZFZvdGVzW2NhbmRpZGF0ZUluZGV4XVxuICAgICAgICAgICAgICAgIGlmKHZvdGVzRm9yVGhpc0NhbmRpZGF0ZSA+PSBtaW5pbXVtV2lubmluZ1ZvdGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKCEoY2FuZGlkYXRlSW5kZXggaW4gY3VycmVudFdpbm5lcnMpICYmIHZvdGVzRm9yVGhpc0NhbmRpZGF0ZSA+IGxlYWRpbmdOb25XaW5uZXJWb3Rlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGVhZGluZ05vbldpbm5lciA9IGNhbmRpZGF0ZUluZGV4XG4gICAgICAgICAgICAgICAgICAgICAgICBsZWFkaW5nTm9uV2lubmVyVm90ZXMgPSB2b3Rlc0ZvclRoaXNDYW5kaWRhdGVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYobGVhZGluZ05vbldpbm5lciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFdpbm5lcnNbbGVhZGluZ05vbldpbm5lcl0gPSB0cnVlXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHJlZGFjdCB2b3RlcyBieSB2b3RlcnMgd2hvIGhhdmUgY2hvc2VuIGEgd2lubmVyIGZyb20gbm9uLXdpbm5lcnMgdGhleSBwcmV2aW91c2x5IGNob3NlXG4gICAgICAgICAgICB2b3Rlcy5mb3JFYWNoKGZ1bmN0aW9uKHZvdGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgY3VyQ2FuZGlkYXRlSW5kZXggPSB2b3RlW2N1cnJlbnRQcmVmZXJlbmNlSW5kZXhdXG4gICAgICAgICAgICAgICAgaWYoY3VyQ2FuZGlkYXRlSW5kZXggaW4gY3VycmVudFdpbm5lcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yKHZhciBuPTA7IG48Y3VycmVudFByZWZlcmVuY2VJbmRleDsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2FuZGlkYXRlUHJlZmVyZW5jZUluZGV4ID0gdm90ZVtuXVxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRlZFZvdGVzW2NhbmRpZGF0ZVByZWZlcmVuY2VJbmRleF0gLS1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIC8vIHJlbW92ZSB2b3RlcyBvZiB0aG9zZSB3aG8gaGF2ZSBqdXN0IGNob3NlbiBhIHdpbm5lclxuICAgICAgICAgICAgdm90ZXMgPSB2b3Rlcy5maWx0ZXIoZnVuY3Rpb24odm90ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAhKHZvdGVbY3VycmVudFByZWZlcmVuY2VJbmRleF0gaW4gY3VycmVudFdpbm5lcnMpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGhpcyBuZWVkcyB0byBoYXBwZW4gYmVjYXVzZSBpdHMgcG9zc2libGUgZm9yIGEgdm90ZSB0byBiZSBjb3VudGVkIGZvciBhbiBlYXJsaWVyIHdpbm5lcixcbiAgICAgICAgLy8gd2hlbiB0aGUgdm90ZSdzIHByZWZlcmVuY2UgaXMgZm9yIGEgd2lubmVyIHRoYXQgd2FzIGNob3NlbiBpbiBhIGxhdGVyIHJvdW5kXG4gICAgICAgIHZhciB3aW5uZXJzUmVjb3VudCA9IGNhbmRpZGF0ZXMubWFwKGZ1bmN0aW9uKCl7cmV0dXJuIDB9KVxuICAgICAgICBvcmlnaW5hbFZvdGVzLmZvckVhY2goZnVuY3Rpb24odm90ZSkge1xuICAgICAgICAgICAgZm9yKHZhciBuPTA7bjx2b3RlLmxlbmd0aDtuKyspIHtcbiAgICAgICAgICAgICAgICBpZih2b3RlW25dIGluIGN1cnJlbnRXaW5uZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbm5lcnNSZWNvdW50W3ZvdGVbbl1dICsrXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICB2YXIgZmluYWxXaW5uZXJzID0gW11cbiAgICAgICAgZm9yKHZhciBjYW5kaWRhdGVJbmRleCBpbiBjdXJyZW50V2lubmVycykge1xuICAgICAgICAgICAgdmFyIHZvdGVzRm9yVGhpc0NhbmRpZGF0ZSA9IHdpbm5lcnNSZWNvdW50W2NhbmRpZGF0ZUluZGV4XVxuICAgICAgICAgICAgZmluYWxXaW5uZXJzLnB1c2goe2luZGV4OiBjYW5kaWRhdGVJbmRleCwgd2VpZ2h0OnZvdGVzRm9yVGhpc0NhbmRpZGF0ZS9vcmlnaW5hbFZvdGVzLmxlbmd0aH0pXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmluYWxXaW5uZXJzLnNsaWNlKDAsIG1heFdpbm5lcnMpXG4gICAgfVxufVxuXG5mdW5jdGlvbiBzaW5nbGVUcmFuc2ZlcnJhYmxlVm90ZSh2b3RlcywgY2FuZGlkYXRlcywgbWF4V2lubmVycykge1xuICAgIHZhciBzZWF0cyA9IG1heFdpbm5lcnNcbiAgICB2YXIgdm90ZVF1b3RhID0gMSt2b3Rlcy5sZW5ndGgvKHNlYXRzKzEpXG5cbiAgICB2YXIgbmV3Vm90ZXNNYXAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHZvdGVzTGlzdCA9IHt9XG4gICAgICAgIGNhbmRpZGF0ZXMuZm9yRWFjaChmdW5jdGlvbihjYW5kaWRhdGUsIGluZGV4KXtcbiAgICAgICAgICAgIHZvdGVzTGlzdFtpbmRleF0gPSB7Y3VycmVudFZvdGVzOiBbXSwgY3VycmVudENvdW50OjB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIHZvdGVzTGlzdFxuICAgIH1cblxuICAgIHZhciBjb3VudGVkVm90ZXMgPSBuZXdWb3Rlc01hcCgpLCBjdXJyZW50V2lubmVycyA9IHt9LCBlbGltaW5hdGVkQ2FuZGlkYXRlcyA9IHt9XG4gICAgdm90ZXMuZm9yRWFjaChmdW5jdGlvbih2b3RlKSB7XG4gICAgICAgIHZhciBjYW5kaWRhdGUgPSBjb3VudGVkVm90ZXNbdm90ZVswXV1cbiAgICAgICAgY2FuZGlkYXRlLmN1cnJlbnRWb3Rlcy5wdXNoKHt2b3RlOnZvdGUsIHdlaWdodDoxLCBjdXJyZW50UHJlZmVyZW5jZUluZGV4OjB9KVxuICAgICAgICBjYW5kaWRhdGUuY3VycmVudENvdW50ICsrXG4gICAgfSlcblxuICAgIHZhciB0cmFuc2ZlclZvdGVzID0gZnVuY3Rpb24odHJhbnNmZXJPcmlnaW4sIHRyYW5zZmVyRGVzdGluYXRpb24sIHJhdGlvVG9UcmFuc2Zlcikge1xuICAgICAgICB0cmFuc2Zlck9yaWdpbi5jdXJyZW50Vm90ZXMuZm9yRWFjaChmdW5jdGlvbih2b3RlSW5mbykge1xuICAgICAgICAgICAgdmFyIG5ld0NhbmRpZGF0ZVByZWZlcmVuY2UgPSB2b3RlSW5mby5jdXJyZW50UHJlZmVyZW5jZUluZGV4ICsxXG4gICAgICAgICAgICB3aGlsZSh0cnVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRDYW5kaWRhdGVQcmVmZXJlbmNlID0gdm90ZUluZm8udm90ZVtuZXdDYW5kaWRhdGVQcmVmZXJlbmNlXVxuICAgICAgICAgICAgICAgIGlmKG5leHRDYW5kaWRhdGVQcmVmZXJlbmNlIGluIGVsaW1pbmF0ZWRDYW5kaWRhdGVzIHx8IG5leHRDYW5kaWRhdGVQcmVmZXJlbmNlIGluIGN1cnJlbnRXaW5uZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld0NhbmRpZGF0ZVByZWZlcmVuY2UgKytcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGNhbmRpZGF0ZUluZGV4ID0gdm90ZUluZm8udm90ZVtuZXdDYW5kaWRhdGVQcmVmZXJlbmNlXVxuICAgICAgICAgICAgaWYoY2FuZGlkYXRlSW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRyYW5zZmVyRGVzdGluYXRpb25bY2FuZGlkYXRlSW5kZXhdLmN1cnJlbnRWb3Rlcy5wdXNoKHsgICAgICAgIC8vIHRyYW5zZmVyIHRoZSBleGNlc3NcbiAgICAgICAgICAgICAgICAgICAgdm90ZTp2b3RlSW5mby52b3RlLFxuICAgICAgICAgICAgICAgICAgICB3ZWlnaHQ6dm90ZUluZm8ud2VpZ2h0KnJhdGlvVG9UcmFuc2ZlcixcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFByZWZlcmVuY2VJbmRleDpuZXdDYW5kaWRhdGVQcmVmZXJlbmNlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB0cmFuc2ZlckRlc3RpbmF0aW9uW2NhbmRpZGF0ZUluZGV4XS5jdXJyZW50Q291bnQgKz0gdm90ZUluZm8ud2VpZ2h0KnJhdGlvVG9UcmFuc2ZlclxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL3RyYW5zZmVyT3JpZ2luLmN1cnJlbnRDb3VudCAtPSB2b3RlSW5mby53ZWlnaHQqcmF0aW9Ub1RyYW5zZmVyIC8vIGp1c3QgZm9yIHRlc3RpbmcgLy8gdG9kbzogY29tbWVudCB0aGlzIG91dFxuICAgICAgICAgICAgdm90ZUluZm8ud2VpZ2h0ICo9ICgxLXJhdGlvVG9UcmFuc2ZlcikgLy8ga2VlcCB0aGUgcmVtYWluZGVyXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgd2hpbGUodHJ1ZSkge1xuICAgICAgICB2YXIgdm90ZXNJblRyYW5mZXIgPSBuZXdWb3Rlc01hcCgpXG4gICAgICAgIHdoaWxlKHRydWUpIHtcbiAgICAgICAgICAgIHZhciBleGNlc3NGb3VuZCA9IGZhbHNlXG4gICAgICAgICAgICBmb3IodmFyIGNhbmRpZGF0ZUluZGV4IGluIGNvdW50ZWRWb3Rlcykge1xuICAgICAgICAgICAgICAgIHZhciB2b3RlcyA9IGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVJbmRleF0uY3VycmVudENvdW50XG4gICAgICAgICAgICAgICAgaWYodm90ZXMgPj0gdm90ZVF1b3RhIC0gLjAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRXaW5uZXJzW2NhbmRpZGF0ZUluZGV4XSA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgaWYodm90ZXMgPiB2b3RlUXVvdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4Y2Vzc0ZvdW5kID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4Y2Vzc1ZvdGVzID0gdm90ZXMgLSB2b3RlUXVvdGFcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBleGNlc3NSYXRpbyA9IGV4Y2Vzc1ZvdGVzL3ZvdGVzXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZmVyVm90ZXMoY291bnRlZFZvdGVzW2NhbmRpZGF0ZUluZGV4XSwgdm90ZXNJblRyYW5mZXIsIGV4Y2Vzc1JhdGlvKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXaGVuIHRlc3RpbmcsIGVuc3VyZSB0aGF0IGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVJbmRleF0uY3VycmVudENvdW50IGFscmVhZHkgaXMgZXF1YWwgdG8gdm90ZVF1b3RhIHdoZW4gdGVzdGluZyBsaW5lIEEgaXMgdW5jb21tZW50ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVJbmRleF0uY3VycmVudENvdW50ID0gdm90ZVF1b3RhXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKCFleGNlc3NGb3VuZCkge1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvcih2YXIgY2FuZGlkYXRlSW5kZXggaW4gdm90ZXNJblRyYW5mZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld1ZvdGVzID0gdm90ZXNJblRyYW5mZXJbY2FuZGlkYXRlSW5kZXhdXG4gICAgICAgICAgICAgICAgICAgIG5ld1ZvdGVzLmN1cnJlbnRWb3Rlcy5mb3JFYWNoKGZ1bmN0aW9uKHZvdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVJbmRleF0uY3VycmVudFZvdGVzLnB1c2godm90ZSlcbiAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICBpZihuZXdWb3Rlcy5jdXJyZW50Q291bnQgPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRlZFZvdGVzW2NhbmRpZGF0ZUluZGV4XS5jdXJyZW50Q291bnQgKz0gbmV3Vm90ZXMuY3VycmVudENvdW50XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdm90ZXNJblRyYW5mZXIgPSBuZXdWb3Rlc01hcCgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZihPYmplY3Qua2V5cyhjdXJyZW50V2lubmVycykubGVuZ3RoIDwgc2VhdHMpIHtcbiAgICAgICAgICAgIC8vIGZpbmQgY2FuZGlkYXRlIHdpdGggbGVhc3Qgdm90ZXNcbiAgICAgICAgICAgIHZhciBjYW5kaWRhdGVXaXRoTGVhc3RDb3VudD11bmRlZmluZWQsIGxvd2VzdENvdW50PXVuZGVmaW5lZFxuICAgICAgICAgICAgZm9yKHZhciBjYW5kaWRhdGVJbmRleCBpbiBjb3VudGVkVm90ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2FuZGlkYXRlID0gY291bnRlZFZvdGVzW2NhbmRpZGF0ZUluZGV4XVxuICAgICAgICAgICAgICAgIGlmKGxvd2VzdENvdW50ID09PSB1bmRlZmluZWQgfHwgY2FuZGlkYXRlLmN1cnJlbnRDb3VudCA8IGxvd2VzdENvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGxvd2VzdENvdW50ID0gY2FuZGlkYXRlLmN1cnJlbnRDb3VudFxuICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGVXaXRoTGVhc3RDb3VudCA9IGNhbmRpZGF0ZUluZGV4XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGltaW5hdGVkQ2FuZGlkYXRlc1tjYW5kaWRhdGVXaXRoTGVhc3RDb3VudF0gPSB0cnVlXG5cbiAgICAgICAgICAgIC8vIHRyYW5zZmVyIHZvdGVzIGZyb20gdGhhdCBjYW5kaWRhdGVcbiAgICAgICAgICAgIHRyYW5zZmVyVm90ZXMoY291bnRlZFZvdGVzW2NhbmRpZGF0ZVdpdGhMZWFzdENvdW50XSwgY291bnRlZFZvdGVzLCAxKVxuXG4gICAgICAgICAgICBpZihPYmplY3Qua2V5cyhjb3VudGVkVm90ZXMpLmxlbmd0aCA9PT0gMSkgeyAvLyBpZiB0aGVyZSdzIG9ubHkgb25lIGNhbmRpZGF0ZSBsZWZ0LCBtYWtlIHRoZW0gYSB3aW5uZXIgZXZlbiB0aG8gdGhleSBkaWRuJ3QgcmVhY2ggdGhlIHF1b3RhXG4gICAgICAgICAgICAgICAgY3VycmVudFdpbm5lcnNbY2FuZGlkYXRlV2l0aExlYXN0Q291bnRdID0gdHJ1ZVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGVsaW1pbmF0ZSB0aGUgY2FuZGlkYXRlXG4gICAgICAgICAgICAgICAgZGVsZXRlIGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVXaXRoTGVhc3RDb3VudF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZmluYWxXaW5uZXJzID0gW11cbiAgICBmb3IodmFyIGNhbmRpZGF0ZUluZGV4IGluIGN1cnJlbnRXaW5uZXJzKSB7XG4gICAgICAgIGZpbmFsV2lubmVycy5wdXNoKHtpbmRleDogY2FuZGlkYXRlSW5kZXgsIHdlaWdodDoxfSlcbiAgICB9XG5cbiAgICByZXR1cm4gZmluYWxXaW5uZXJzXG59XG5cblxuZnVuY3Rpb24gcG93ZXJJbnN0YW50UnVub2ZmKHZvdGVzLCBjYW5kaWRhdGVzLCBtYXhXaW5uZXJzKSB7XG5cbiAgICB2YXIgd2lubmVycyA9IHNpbmdsZVRyYW5zZmVycmFibGVWb3RlKHZvdGVzLCBjYW5kaWRhdGVzLCBNYXRoLm1heCgzLCBtYXhXaW5uZXJzKSk7XG5cbiAgICByZXR1cm4gd2lubmVycztcblxuICAgIC8vIGlmIChtYXhXaW5uZXIgPj0gMykgcmV0dXJuIHdpbm5lcnM7XG5cblxufVxuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHJhbmRvbToge1xuICAgICAgICAnJzpmdW5jdGlvbih2b3RlcywgY2FuZGlkYXRlcywgbWF4V2lubmVycykge1xuICAgICAgICAgICAgaWYoY2FuZGlkYXRlcy5sZW5ndGggPCBtYXhXaW5uZXJzKSBtYXhXaW5uZXJzID0gY2FuZGlkYXRlcy5sZW5ndGhcblxuICAgICAgICAgICAgdmFyIHdpbm5lcnMgPSBbXVxuICAgICAgICAgICAgZm9yKHZhciBuPTA7IG48bWF4V2lubmVyczspIHtcbiAgICAgICAgICAgICAgICB2YXIgd2lubmVyID0gTWF0aC5yb3VuZChyYW5kb20oKSooY2FuZGlkYXRlcy5sZW5ndGgtMSkpXG4gICAgICAgICAgICAgICAgaWYod2lubmVycy5pbmRleE9mKHdpbm5lcikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbm5lcnMucHVzaCh3aW5uZXIpXG4gICAgICAgICAgICAgICAgICAgIG4rK1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHdpbm5lcnMubWFwKGZ1bmN0aW9uKHdpbm5lcikge1xuICAgICAgICAgICAgICAgIHJldHVybiB7aW5kZXg6IHdpbm5lciwgd2VpZ2h0OjF9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfSxcbiAgICByYW5kb21Wb3RlcnNDaG9pY2U6IHtcbiAgICAgICAgJ3NpbmdsZSB2b3Rlcic6ZnVuY3Rpb24odm90ZXMsIGNhbmRpZGF0ZXMsIG1heFdpbm5lcnMpIHtcbiAgICAgICAgICAgIHZhciBsdWNreVdpbm5lckluZGV4ID0gTWF0aC5yb3VuZChyYW5kb20oKSoodm90ZXMubGVuZ3RoLTEpKVxuICAgICAgICAgICAgdmFyIGx1Y2t5V2lubmVyVm90ZSA9IHZvdGVzW2x1Y2t5V2lubmVySW5kZXhdXG5cbiAgICAgICAgICAgIHJldHVybiBsdWNreVdpbm5lclZvdGUuc2xpY2UoMCxtYXhXaW5uZXJzKS5tYXAoZnVuY3Rpb24odm90ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7aW5kZXg6IHZvdGUsIHdlaWdodDoxfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgJzEwJSBvZiB0aGUgdm90ZXJzJzogZnVuY3Rpb24odm90ZXMsIGNhbmRpZGF0ZXMsIG1heFdpbm5lcnMpIHtcbiAgICAgICAgICAgIHZhciBsdWNreVZvdGVzID0gW11cbiAgICAgICAgICAgIHdoaWxlKGx1Y2t5Vm90ZXMubGVuZ3RoIDwgdm90ZXMubGVuZ3RoKi4xKSB7XG4gICAgICAgICAgICAgICAgdmFyIGx1Y2t5V2lubmVySW5kZXggPSBNYXRoLnJvdW5kKHJhbmRvbSgpKih2b3Rlcy5sZW5ndGgtMSkpXG4gICAgICAgICAgICAgICAgbHVja3lWb3Rlcy5wdXNoKHZvdGVzW2x1Y2t5V2lubmVySW5kZXhdWzBdKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcGx1cmFsaXR5QWxnKGx1Y2t5Vm90ZXMsIGNhbmRpZGF0ZXMsIG1heFdpbm5lcnMpXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHBsdXJhbGl0eToge1xuICAgICAgICAnJzpwbHVyYWxpdHlBbGdcbiAgICB9LFxuICAgIHJhbmdlOiB7XG4gICAgICAgICdPbmUgV2lubmVyJzogZnVuY3Rpb24odm90ZXMsIGNhbmRpZGF0ZXMpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHRzID0gW11cbiAgICAgICAgICAgIGZvcih2YXIgbj0wOyBuPGNhbmRpZGF0ZXMubGVuZ3RoO24rKykge1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbbl0gPSAwXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZvdGVzLmZvckVhY2goZnVuY3Rpb24odm90ZSl7XG4gICAgICAgICAgICAgICAgdm90ZS5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzW2luZGV4XSArPSB2YWx1ZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICB2YXIgdHJhbnNmb3JtZWRSZXN1bHRzID0gcmVzdWx0cy5tYXAoZnVuY3Rpb24odmFsdWUsaW5kZXgpe1xuICAgICAgICAgICAgICAgIHJldHVybiB7Y2FuZGlkYXRlOmluZGV4LHZvdGVzOnZhbHVlfVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgdHJhbnNmb3JtZWRSZXN1bHRzLnNvcnQoZnVuY3Rpb24oYSxiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGIudm90ZXMgLSBhLnZvdGVzIC8vIHJldmVyc2Ugc29ydFxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgdmFyIHdpbm5lciA9IHRyYW5zZm9ybWVkUmVzdWx0c1swXS5jYW5kaWRhdGVcbiAgICAgICAgICAgIHJldHVybiBbe2luZGV4OiB3aW5uZXIsIHdlaWdodDoxLCBwcmVmZXJlbmNlczpjYW5kaWRhdGVzW3dpbm5lcl19XVxuICAgICAgICB9LFxuICAgICAgICAnVGhyZWUgV2lubmVycyc6IGZ1bmN0aW9uKHZvdGVzLCBjYW5kaWRhdGVzKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0cyA9IFtdXG4gICAgICAgICAgICBmb3IodmFyIG49MDsgbjxjYW5kaWRhdGVzLmxlbmd0aDtuKyspIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzW25dID0gMFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2b3Rlcy5mb3JFYWNoKGZ1bmN0aW9uKHZvdGUpe1xuICAgICAgICAgICAgICAgIHZvdGUuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1tpbmRleF0gKz0gdmFsdWVcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgdmFyIHRyYW5zZm9ybWVkUmVzdWx0cyA9IHJlc3VsdHMubWFwKGZ1bmN0aW9uKHZhbHVlLGluZGV4KXtcbiAgICAgICAgICAgICAgICByZXR1cm4ge2NhbmRpZGF0ZTppbmRleCx2b3Rlczp2YWx1ZX1cbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIHRyYW5zZm9ybWVkUmVzdWx0cy5zb3J0KGZ1bmN0aW9uKGEsYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBiLnZvdGVzIC0gYS52b3RlcyAvLyByZXZlcnNlIHNvcnQgKG1vc3Qgdm90ZXMgZm9pc3QpXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICB2YXIgd2lubmVycyA9IFtdLCB0b3RhbFNjb3JlID0gMFxuICAgICAgICAgICAgZm9yKHZhciBuPTA7IG48MzsgbisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHdpbm5lckluZGV4ID0gdHJhbnNmb3JtZWRSZXN1bHRzW25dLmNhbmRpZGF0ZVxuICAgICAgICAgICAgICAgIHZhciB3aW5uZXIgPSBjYW5kaWRhdGVzW3dpbm5lckluZGV4XVxuICAgICAgICAgICAgICAgIHdpbm5lcnMucHVzaCh7aW5kZXg6IHdpbm5lckluZGV4LCBwcmVmZXJlbmNlczp3aW5uZXJ9KVxuICAgICAgICAgICAgICAgIHRvdGFsU2NvcmUrPSB0cmFuc2Zvcm1lZFJlc3VsdHNbbl0udm90ZXNcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgd2lubmVycy5mb3JFYWNoKGZ1bmN0aW9uKHdpbm5lciwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICB3aW5uZXIud2VpZ2h0ID0gdHJhbnNmb3JtZWRSZXN1bHRzW2luZGV4XS52b3Rlcy90b3RhbFNjb3JlXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICByZXR1cm4gd2lubmVyc1xuICAgICAgICB9XG4gICAgfSxcbiAgICBzaW5nbGVUcmFuc2ZlcmFibGVWb3RlOiB7XG4gICAgICAgICcnOnNpbmdsZVRyYW5zZmVycmFibGVWb3RlXG4gICAgfSxcbiAgICBwb3dlckluc3RhbnRSdW5vZmY6IHtcbiAgICAgICAgJyc6cG93ZXJJbnN0YW50UnVub2ZmXG4gICAgfSxcbiAgICBkaXJlY3RSZXByZXNlbnRhdGl2ZVJhbmtlZDoge1xuICAgICAgICAnMTUlIFRocmVzaG9sZCc6IHsnJzpmcmFjdGlvbmFsUmVwcmVzZW50YXRpdmVSYW5rZWRWb3RlKC4xNSl9LFxuICAgIH0sXG4gICAgZGlyZWN0UmVwcmVzZW50YXRpdmVSYW5nZWQ6IHtcbiAgICAgICAgJ3NwbGl0LXdlaWdodCwgMCUgdGhyZXNob2xkJzogZGlyZWN0UmVwcmVzZW50YXRpb25SYW5nZSgnbm9ybWFsJywgJ3NwbGl0JywwKSxcbiAgICAgICAgJ2hpZ2hlc3Qtd2VpZ2h0LCAyMCUgdGhyZXNob2xkJzogZGlyZWN0UmVwcmVzZW50YXRpb25SYW5nZSgnbm9ybWFsJywgJ2hpZ2hlc3QnLCAuNSksXG4gICAgICAgICdzcGxpdC13ZWlnaHQsIDIwJSB0aHJlc2hvbGQnOiBkaXJlY3RSZXByZXNlbnRhdGlvblJhbmdlKCdub3JtYWwnLCAnc3BsaXQnLCAuOSksXG4gICAgICAgICdlcXVhbC13ZWlnaHQsIDIwJSB0aHJlc2hvbGQnOiBkaXJlY3RSZXByZXNlbnRhdGlvblJhbmdlKCdub3JtYWwnLCAnZXF1YWwnLCAuOSksXG4gICAgICAgICdoaWdoZXN0LXdlaWdodCwgbWlub3JpdHktbWF4LCAyMCUgdGhyZXNob2xkJzogZGlyZWN0UmVwcmVzZW50YXRpb25SYW5nZSgnbWF4TWlub3JpdHknLCAnaGlnaGVzdCcsIC45KSxcbiAgICAgICAgJ3NwbGl0LXdlaWdodCwgbWlub3JpdHktbWF4LCAyMCUgdGhyZXNob2xkJzogZGlyZWN0UmVwcmVzZW50YXRpb25SYW5nZSgnbWF4TWlub3JpdHknLCAnc3BsaXQnLCAuOSksXG4gICAgICAgICdlcXVhbC13ZWlnaHQsIG1pbm9yaXR5LW1heCwgMjAlIHRocmVzaG9sZCc6IGRpcmVjdFJlcHJlc2VudGF0aW9uUmFuZ2UoJ21heE1pbm9yaXR5JywgJ2VxdWFsJywgLjkpLFxuICAgICAgICAnaGlnaGVzdC13ZWlnaHQsIDxiPnJld2VpZ2h0ZWQ8L2I+JzogZGlyZWN0UmVwcmVzZW50YXRpb25SYW5nZSgncmV3ZWlnaHRlZCcsICdoaWdoZXN0JywgMCksXG4gICAgICAgICdzcGxpdC13ZWlnaHQsIDxiPnJld2VpZ2h0ZWQ8L2I+JzogZGlyZWN0UmVwcmVzZW50YXRpb25SYW5nZSgncmV3ZWlnaHRlZCcsICdzcGxpdCcsIDApLFxuICAgICAgICAnZXF1YWwtd2VpZ2h0LCA8Yj5yZXdlaWdodGVkPC9iPic6IGRpcmVjdFJlcHJlc2VudGF0aW9uUmFuZ2UoJ3Jld2VpZ2h0ZWQnLCAnZXF1YWwnLCAwKSxcbiAgICB9XG59IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0aWYoX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSkge1xuXHRcdHJldHVybiBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBtb2R1bGUgZXhwb3J0cyBtdXN0IGJlIHJldHVybmVkIGZyb20gcnVudGltZSBzbyBlbnRyeSBpbmxpbmluZyBpcyBkaXNhYmxlZFxuLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG5yZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vZWxlY3QuanNcIik7XG4iXSwic291cmNlUm9vdCI6IiJ9
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

        console.log(votes);
        console.log(candidates);

        var results = algorithm(votes, candidates, maxWinners);

        console.log(votes);
        console.log(results);

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
/*! CommonJS bailout: module.exports is used directly at 476:0-14 */
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

// Honestly this will only return maxWinners = 1 no matter what right now
function powerInstantRunoff(votes, candidates, maxWinners) {

    var topWinners = singleTransferrableVote(votes, candidates, Math.max(4, maxWinners + 1));

    if (maxWinners == topWinners.length) return topWinners;

    // Find Condorcet / weighted winner

    // map of result counts for candidate vs each of the others
    var newVotesMap = function() {
        var votesList = {
            [topWinners[0].index]: {[topWinners[1].index]: 0,[topWinners[2].index]: 0 },
            [topWinners[1].index]: {[topWinners[0].index]: 0,[topWinners[2].index]: 0 },
            [topWinners[2].index]: {[topWinners[0].index]: 0,[topWinners[1].index]: 0 },
        }
        return votesList
    }

    var countedVotes = newVotesMap(), currentWinner = null, topCount = 0;

    for (var i=0; i<topWinners.length, i++;) {
        var iIndex = topWinners[i].index;
        for (var j=0; j<topWinners.length, j++;) {
            if (i == j) continue;
            var jIndex = topWinners[j].index;

            votes.forEach(function(vote) {
                // See who is earlier in the vote sequence
                // Do we want to test for -1?
                if (vote.indexOf(iIndex) < vote.indexOf(jIndex)) {
                    // voter ranked candidate i ahead of j
                    if(++countedVotes[iIndex][jIndex] >= topCount) {
                       topCount = countedVotes[iIndex][jIndex];
                        currentWinner = iIndex;
                    }
                } else {
                    // voter ranked candidate j ahead of i
                    if(++countedVotes[jIndex][iIndex] >= topCount) {
                        topCount = countedVotes[jIndex][iIndex];
                        currentWinner = jIndex;
                    }
                }
            })
        }
    }

    // returns the winner index if there is a Condorcet winner, else null
    function findCondorcetWinner(voteMap) {

        console.log(voteMap);

        var cWinner = null;
        var keys = Object.keys(voteMap);
        for (var i=0; i<3; i++) {
            if (voteMap[keys[0]][keys[1]] > voteMap[keys[1]][keys[0]] &&
                voteMap[keys[0]][keys[2]] > voteMap[keys[2]][keys[0]]) {
                cWinner = [key];
                break;
            }
            keys.push(keys.shift());
        }
        return cWinner;
    }

    console.log(countedVotes);

    // Check for Condorcet winner
    var finalWinner = findCondorcetWinner(countedVotes);

    console.log(finalWinner);

    // If no winner use the highest count(s)
    if (!finalWinner) {
        finalWinner = [];
        for (const [index, value] of Object.entries(countedVotes)) {
            {
                if (Object.values(value).indexOf(topCount) >= 0) {
                    finalWinner.push(index);
                }
            }
        }
    }

    var ret = topWinners.filter(x => { return finalWinner.indexOf(x.index) >= 0 });

    console.log(ret);

    return ret;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9lbGVjdC93ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24iLCJ3ZWJwYWNrOi8vZWxlY3QvLi9FbGVjdGlvbi5qcyIsIndlYnBhY2s6Ly9lbGVjdC8uL2FnZ3JlZ2F0ZUZucy5qcyIsIndlYnBhY2s6Ly9lbGVjdC8uL2JhbGxvdHMuanMiLCJ3ZWJwYWNrOi8vZWxlY3QvLi9lbGVjdC5qcyIsIndlYnBhY2s6Ly9lbGVjdC8uL25vZGVfbW9kdWxlcy9wcm90by9wcm90by5qcyIsIndlYnBhY2s6Ly9lbGVjdC8uL3V0aWxzLmpzIiwid2VicGFjazovL2VsZWN0Ly4vdm90aW5nU3RyYXRlZ2llcy5qcyIsIndlYnBhY2s6Ly9lbGVjdC8uL3ZvdGluZ1N5c3RlbXMuanMiLCJ3ZWJwYWNrOi8vZWxlY3Qvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vZWxlY3Qvd2VicGFjay9zdGFydHVwIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxPOzs7Ozs7Ozs7OztBQ1ZBLFlBQVksbUJBQU8sQ0FBQyw0Q0FBTzs7QUFFM0IsWUFBWSxtQkFBTyxDQUFDLDJCQUFTO0FBQzdCLG1CQUFtQixtQkFBTyxDQUFDLHlDQUFnQjtBQUMzQzs7QUFFQTtBQUNBOztBQUVBO0FBQ0Esb0JBQW9CLGlCQUFpQjtBQUNyQztBQUNBO0FBQ0Esb0JBQW9CLHFCQUFxQjtBQUN6QztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUzs7QUFFVDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FB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QTtBQUNBLGFBQWE7O0FBRWI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSwwQkFBMEIsMkNBQTJDO0FBQ3JFLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDOzs7Ozs7VUNwbEJBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7VUNyQkE7VUFDQTtVQUNBO1VBQ0EiLCJmaWxlIjoiZWxlY3QudW1kLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHRlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHRlbHNlIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jylcblx0XHRleHBvcnRzW1wiZWxlY3RcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wiZWxlY3RcIl0gPSBmYWN0b3J5KCk7XG59KShzZWxmLCBmdW5jdGlvbigpIHtcbnJldHVybiAiLCJ2YXIgcHJvdG8gPSByZXF1aXJlKFwicHJvdG9cIilcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpXG52YXIgYWdncmVnYXRlRm5zID0gcmVxdWlyZSgnLi9hZ2dyZWdhdGVGbnMnKVxudmFyIHJhbmRvbSA9IHV0aWxzLnJhbmRvbVxuXG52YXIgRWxlY3Rpb24gPSBtb2R1bGUuZXhwb3J0cyA9IHByb3RvKGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaW5pdCA9IGZ1bmN0aW9uKG51bWJlck9mVm90ZXJzLCBudW1iZXJPZkNhbmRpZGF0ZXMsIG51bWJlck9mU29jaWV0YWxPcHRpb25zKSB7XG5cbiAgICAgICAgdmFyIHZvdGVycyA9IFtdLCBjYW5kaWRhdGVzID0gW11cbiAgICAgICAgZm9yKHZhciBqPTA7ajxudW1iZXJPZlZvdGVycztqKyspIHtcbiAgICAgICAgICAgIHZvdGVycy5wdXNoKGdlbmVyYXRlUGVyc29uKG51bWJlck9mU29jaWV0YWxPcHRpb25zKSlcbiAgICAgICAgfVxuICAgICAgICBmb3IodmFyIGo9MDtqPG51bWJlck9mQ2FuZGlkYXRlcztqKyspIHtcbiAgICAgICAgICAgIGNhbmRpZGF0ZXMucHVzaChnZW5lcmF0ZVBlcnNvbihudW1iZXJPZlNvY2lldGFsT3B0aW9ucykpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbmV0VXRpbGl0aWVzID0gZmluZE5ldFV0aWxpdGllcyh2b3RlcnMpXG4gICAgICAgIHZhciBvcHRpbWFsT3V0Y29tZXMgPSBuZXRVdGlsaXRpZXMubWFwKGZ1bmN0aW9uKG9wdGlvblV0aWxpdHkpIHtcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25VdGlsaXR5ID4gMFxuICAgICAgICB9KVxuICAgICAgICB2YXIgbGVhc3RPcHRpbWFsT3V0Y29tZXMgPSBvcHRpbWFsT3V0Y29tZXMubWFwKGZ1bmN0aW9uKG91dGNvbWUpIHtcbiAgICAgICAgICAgIHJldHVybiAhb3V0Y29tZVxuICAgICAgICB9KVxuXG4gICAgICAgIHRoaXMubWF4VXRpbGl0eSA9IHRvdGFsT3V0Y29tZVV0aWxpdHkodm90ZXJzLCBvcHRpbWFsT3V0Y29tZXMpXG4gICAgICAgIHRoaXMubWluVXRpbGl0eSA9IHRvdGFsT3V0Y29tZVV0aWxpdHkodm90ZXJzLCBsZWFzdE9wdGltYWxPdXRjb21lcylcbiAgICAgICAgdGhpcy5tYXhSZWdyZXQgPSB0aGlzLm1heFV0aWxpdHkgLSB0aGlzLm1pblV0aWxpdHlcbiAgICAgICAgdGhpcy52b3RlcnMgPSB2b3RlcnNcbiAgICAgICAgdGhpcy5jYW5kaWRhdGVzID0gY2FuZGlkYXRlc1xuXG4gICAgICAgIHRoaXMuYWdncmVnYXRlcyA9IHt9XG4gICAgICAgIGZvcih2YXIgayBpbiBhZ2dyZWdhdGVGbnMpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkQWdncmVnYXRlRm4oaywgYWdncmVnYXRlRm5zW2tdKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gcmV0dXJucyBhbiBhcnJheSBvZiB3aW5uaW5nIGNhbmRpZGF0ZXMgcmVwcmVzZW50ZWQgYnkgb2JqZWN0cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXM6XG4gICAgICAgIC8vIHdlaWdodCAtIFRoYXQgd2lubmVyJ3Mgdm90aW5nIHdlaWdodCBpbiB0aGUgbGVnaXNsYXR1cmVcbiAgICAgICAgLy8gdXRpbGl0aWVzIC0gVGhhdCB3aW5uZXIncyBvcHRpb24gdXRpbGl0aWVzIChpbiB0aGUgc2FtZSBmb3JtIGFzIHJldHVybmVkIGJ5IGdlbmVyYXRlUGVyc29uKVxuICAgIC8vIGFsZ29yaXRobSh2b3RlcywgY2FuZGlkYXRlcykgLSBBIGZ1bmN0aW9uIHRoYXQgc2hvdWxkIHJldHVybiB0aGUgd2lubmluZyBjYW5kaWRhdGVzIGluIHRoZSBzYW1lIGZvcm0gYXMgdGhpcy5lbGVjdCByZXR1cm5zXG4gICAgLy8gc3RyYXRlZ3kodm90ZXIsIGNhbmRpZGF0ZXMpIC0gQSBmdW5jdGlvbiB0aGF0IHNob3VsZCByZXR1cm4gdGhlIGdpdmVuIHZvdGVyJ3Mgdm90ZSBpbiB3aGF0ZXZlciBmb3JtIHRoYXQgYWxnb3JpdGhtIHJlcXVpcmVzXG4gICAgdGhpcy5lbGVjdCA9IGZ1bmN0aW9uKGFsZ29yaXRobSwgc3RyYXRlZ3ksIHZvdGVycywgY2FuZGlkYXRlcywgbWF4V2lubmVycykge1xuICAgICAgICB2YXIgdm90ZXMgPSB2b3RlcnMubWFwKGZ1bmN0aW9uKHZvdGVyLCBpbmRleCkge1xuICAgICAgICAgICAgdmFyIHZvdGVyQWdncmVnYXRlcyA9IHt9XG4gICAgICAgICAgICBmb3IodmFyIGsgaW4gdGhpcy5hZ2dyZWdhdGVzKSB7XG4gICAgICAgICAgICAgICAgdm90ZXJBZ2dyZWdhdGVzW2tdID0gdGhpcy5hZ2dyZWdhdGVzW2tdW2luZGV4XVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gc3RyYXRlZ3kodm90ZXIsIHZvdGVyQWdncmVnYXRlcylcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIGNvbnNvbGUubG9nKHZvdGVzKTtcbiAgICAgICAgY29uc29sZS5sb2coY2FuZGlkYXRlcyk7XG5cbiAgICAgICAgdmFyIHJlc3VsdHMgPSBhbGdvcml0aG0odm90ZXMsIGNhbmRpZGF0ZXMsIG1heFdpbm5lcnMpO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHZvdGVzKTtcbiAgICAgICAgY29uc29sZS5sb2cocmVzdWx0cyk7XG5cbiAgICAgICAgcmVzdWx0cy5mb3JFYWNoKGZ1bmN0aW9uKHdpbm5lcikge1xuICAgICAgICAgICAgd2lubmVyLnByZWZlcmVuY2VzID0gY2FuZGlkYXRlc1t3aW5uZXIuaW5kZXhdXG4gICAgICAgICAgICBpZih3aW5uZXIud2VpZ2h0IDwgMCkgdGhyb3cgbmV3IEVycm9yKFwiV2lubmVyIHdlaWdodCBjYW4ndCBiZSBsZXNzIHRoYW4gMFwiKVxuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiByZXN1bHRzXG4gICAgfVxuXG4gICAgdGhpcy5hZGRBZ2dyZWdhdGVGbiA9IGZ1bmN0aW9uKG5hbWUsZm4pIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzXG4gICAgICAgIGlmKG5hbWUgaW4gdGhpcy5hZ2dyZWdhdGVzKSB0aHJvdyBuZXcgRXJyb3IoXCJBZ2dyZWdhdGUgZnVuY3Rpb24gJ1wiK25hbWUrXCInIGFscmVhZHkgZXhpc3RzXCIpXG5cbiAgICAgICAgdmFyIHZhbHVlc1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcy5hZ2dyZWdhdGVzLCBuYW1lLCB7XG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmKHZhbHVlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IGZuLmNhbGwodGhpcywgdGhhdC52b3RlcnMsdGhhdC5jYW5kaWRhdGVzKSAvLyBtZW1vaXplXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZXNcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbnVtZXJhYmxlOnRydWVcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyByZXR1cm5zIGEgbnVtYmVyIGZyb20gMCB0byAxIGluZGljYXRpbmcgd2hhdCBwZXJjZW50YWdlIG9mIHRoZSBtYXhpbXVtIHBvc3NpYmxlIHZvdGVyIHJlZ3JldCB0aGUgZGVjaWRlcnMgY2F1c2VcbiAgICB0aGlzLnJlZ3JldEZyYWN0aW9uID0gZnVuY3Rpb24ocGVvcGxlLCBkZWNpZGVycykge1xuICAgICAgICB2YXIgb3V0Y29tZXMgPSB1dGlscy5maW5kU29jaWV0YWxPcHRpb25zT3V0Y29tZXMoZGVjaWRlcnMpXG4gICAgICAgIHZhciB0b3RhbFV0aWxpdHkgPSB0b3RhbE91dGNvbWVVdGlsaXR5KHBlb3BsZSwgb3V0Y29tZXMpXG4gICAgICAgIHZhciByZWdyZXQgPSB0aGlzLm1heFV0aWxpdHkgLSB0b3RhbFV0aWxpdHlcblxuICAgICAgICByZXR1cm4gcmVncmV0L3RoaXMubWF4UmVncmV0XG4gICAgfVxuXG4gICAgLy8gcmV0dXJucyB0aGUgdG90YWwgdXRpbGl0eSBjaGFuZ2UgZm9yIHRoZSBnaXZlbiBwZW9wbGUgaWYgdGhlIGdpdmVuIG91dGNvbWVzIGhhcHBlbmVkXG4gICAgZnVuY3Rpb24gdG90YWxPdXRjb21lVXRpbGl0eShwZW9wbGUsIG91dGNvbWVzKSB7XG4gICAgICAgIHZhciB1dGlsaXR5ID0gMFxuICAgICAgICBwZW9wbGUuZm9yRWFjaChmdW5jdGlvbihwZXJzb24pIHtcbiAgICAgICAgICAgIHV0aWxpdHkgKz0gdXRpbHMudm90ZXJPdXRjb21lVXRpbGl0eShwZXJzb24sIG91dGNvbWVzKVxuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiB1dGlsaXR5XG4gICAgfVxuXG4gICAgLy8gcmV0dXJucyBhbiBhcnJheSB3aGVyZSB0aGUgaW5kZXggaW5kaWNhdGVzIGEgc29jaWV0YWwgb3B0aW9uIGFuZCB0aGUgdmFsdWUgaW5kaWNhdGVzXG4gICAgLy8gdGhlIG5ldCB1dGlsaXR5IGZvciB0aGF0IG9wdGlvbiBmb3IgdGhlIHBlb3BsZSBwYXNzZWQgaW5cbiAgICBmdW5jdGlvbiBmaW5kTmV0VXRpbGl0aWVzKHBlb3BsZSkge1xuICAgICAgICB2YXIgbmV0VXRpbGl0eSA9IFtdXG4gICAgICAgIHBlb3BsZS5mb3JFYWNoKGZ1bmN0aW9uKHBlcnNvbikge1xuICAgICAgICAgICAgcGVyc29uLmZvckVhY2goZnVuY3Rpb24ob3B0aW9uVXRpbGl0eSwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpZihuZXRVdGlsaXR5W2luZGV4XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ldFV0aWxpdHlbaW5kZXhdID0gMFxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG5ldFV0aWxpdHlbaW5kZXhdICs9IG9wdGlvblV0aWxpdHlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIG5ldFV0aWxpdHlcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIGFuIGFycmF5IHdoZXJlIGVhY2ggZWxlbWVudCBpcyBhIG51bWJlciBmcm9tIC0xIHRvIDEgaW5kaWNhdGluZyB0aGUgdXRpbGl0eSB0aGF0IHBlcnNvbiB3b3VsZCBnZXRcbiAgICAvLyBmcm9tIGEgZ2l2ZW4gc29jaWV0YWwgb3B0aW9uIChpZGVudGlmaWVkIGJ5IHRoZSBpbmRleClcbiAgICBmdW5jdGlvbiBnZW5lcmF0ZVBlcnNvbihudW1iZXJPZlNvY2lldGFsT3B0aW9ucywgb3B0aW9uUG9wdWxhcml0eU1vZGlmaWVycykge1xuICAgICAgICB2YXIgdm90ZXIgPSBbXVxuICAgICAgICBmb3IodmFyIG49MDtuPG51bWJlck9mU29jaWV0YWxPcHRpb25zO24rKykge1xuICAgICAgICAgICAgaWYob3B0aW9uUG9wdWxhcml0eU1vZGlmaWVycykge1xuICAgICAgICAgICAgICAgIG1vZGlmaWVyID0gb3B0aW9uUG9wdWxhcml0eU1vZGlmaWVyc1tuXVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtb2RpZmllciA9IDFcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdm90ZXJbbl0gPSAyKnJhbmRvbSgpKm1vZGlmaWVyLTFcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2b3RlclxuICAgIH1cbn0pXG4iLCJcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjYW5kaWRhdGVEaWN0YXRvclV0aWxpdGllczogZnVuY3Rpb24odm90ZXJzLCBjYW5kaWRhdGVzKSB7XG4gICAgICAgIHZhciBjYW5kaWRhdGVPdXRjb21lcyA9IGNhbmRpZGF0ZXMubWFwKGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuICB1dGlscy5maW5kU29jaWV0YWxPcHRpb25zT3V0Y29tZXMoW3t3ZWlnaHQ6MSwgcHJlZmVyZW5jZXM6Y2FuZGlkYXRlfV0pXG4gICAgICAgIH0pXG4gICAgICAgIC8vIHRoZSB1dGlsaXR5IGVhY2ggdm90ZXIgd291bGQgZ2V0IGlmIGVhY2ggY2FuZGlkYXRlIHdlcmUgZWxlY3RlZCBkaWN0YXRvclxuICAgICAgICByZXR1cm4gdm90ZXJzLm1hcChmdW5jdGlvbih2b3Rlcikge1xuICAgICAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZU91dGNvbWVzLm1hcChmdW5jdGlvbihvdXRjb21lcykge1xuICAgICAgICAgICAgICAgIHJldHVybiAgdXRpbHMudm90ZXJPdXRjb21lVXRpbGl0eSh2b3Rlciwgb3V0Y29tZXMpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH1cbn0iLCJ2YXIgbm9vcCA9IGZ1bmN0aW9uKHZvdGUpe3JldHVybiB2b3RlfVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBub29wOiB7Jyc6bm9vcH0sXG4gICAgcmFua2VkOiB7XG4gICAgICAgIFwicmF3XCI6bm9vcCxcbiAgICAgICAgXCJNYXggM1wiOiBmdW5jdGlvbih2b3RlKSB7XG4gICAgICAgICAgICByZXR1cm4gdm90ZS5zbGljZSgwLDMpXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNjb3JlZDoge1xuICAgICAgICBcInJhd1wiOm5vb3AsXG4gICAgICAgIFwiTmVhcmVzdCAxLTVcIjogZnVuY3Rpb24odm90ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHZvdGUubWFwKGZ1bmN0aW9uKGNhbmRpZGF0ZVNjb3JlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoNSpjYW5kaWRhdGVTY29yZSkvNVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn0iLCJ2YXIgRWxlY3Rpb24gPSBleHBvcnRzLkVsZWN0aW9uID0gcmVxdWlyZShcIi4vRWxlY3Rpb25cIilcblxudmFyIHN5c3RlbXMgPSBleHBvcnRzLnN5c3RlbXMgPSByZXF1aXJlKCcuL3ZvdGluZ1N5c3RlbXMnKVxudmFyIHN0cmF0ID0gZXhwb3J0cy5zdHJhdGVnaWVzID0gcmVxdWlyZSgnLi92b3RpbmdTdHJhdGVnaWVzJylcbnZhciBiYWxsb3RzID0gZXhwb3J0cy5iYWxsb3RzID0gcmVxdWlyZSgnLi9iYWxsb3RzJylcblxuXG4vLyBGb3IgZWFjaCBzeXN0ZW06XG4vLyBhbGdvcml0aG1cbiAgICAvLyB0YWtlcyBpbiBhbiBhcnJheSBvZiB2b3RlcyB3aGVyZSBlYWNoIHZvdGUgaXMgdGhlIG91dHB1dCBvZiBhIGdpdmVuIGBzdHJhdGVneWAgZm9yIHRoZSBzeXN0ZW1cbiAgICAvLyByZXR1cm5zIGFuIG9iamVjdCB3aGVyZSBlYWNoIGtleSBpcyBhIHdpbm5lciwgYW5kIGVhY2ggdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggdGhlIHByb3BlcnRpZXM6XG4gICAgICAgIC8vIHdlaWdodCAtIHRoZSB3aW5uZXIncyB2b3RlIHdlaWdodFxuICAgICAgICAvLyBwcmVmZXJlbmNlcyAtIHRoZSB3aW5uZXIncyB2b3RpbmcgcHJlZmVyZW5jZXMgZm9yIGVhY2ggc29jaWV0YWwgb3B0aW9uXG4vLyBlYWNoIHN0cmF0ZWd5OlxuICAgIC8vIHJldHVybnMgYSBcInZvdGVcIiwgYSBzZXQgb2YgZGF0YSB1c2VkIGJ5IHZvdGluZ1N5c3RlbSB0byBkZXRlcm1pbmUgd2lubmVyc1xuZXhwb3J0cy50ZXN0U3lzdGVtcyA9IHtcbiAgICAnUG93ZXIgSW5zdGFudCBSdW5vZmYnOiB7XG4gICAgICAgIHdpbm5lcnM6IFsxXSwgLy8gWzEsM10sXG4gICAgICAgIHN0cmF0ZWdpZXM6IHN0cmF0LnJhbmtlZCxcbiAgICAgICAgYmFsbG90czogYmFsbG90cy5yYW5rZWQsXG4gICAgICAgIHN5c3RlbXM6IHN5c3RlbXMucG93ZXJJbnN0YW50UnVub2ZmXG4gICAgfSxcbn1cblxuLy8gZXhwb3J0cy50ZXN0U3lzdGVtcyA9IHtcbi8vICAgICBSYW5kb206IHtcbi8vICAgICAgICAgd2lubmVyczogWzEsM10sXG4vLyAgICAgICAgIHN0cmF0ZWdpZXM6IHN0cmF0Lm5vb3AsXG4vLyAgICAgICAgIHN5c3RlbXM6IHN5c3RlbXMucmFuZG9tXG4vLyAgICAgfSxcbi8vICAgICAnUmFuZG9tIFZvdGVyc1xcJyBDaG9pY2UnOiB7XG4vLyAgICAgICAgIHdpbm5lcnM6IFsxLDNdLFxuLy8gICAgICAgICBzdHJhdGVnaWVzOiBzdHJhdC5yYW5rZWQsXG4vLyAgICAgICAgIGJhbGxvdHM6IGJhbGxvdHMucmFua2VkLFxuLy8gICAgICAgICBzeXN0ZW1zOiBzeXN0ZW1zLnJhbmRvbVZvdGVyc0Nob2ljZVxuLy8gICAgIH0sXG4vLyAgICAgUGx1cmFsaXR5OiB7XG4vLyAgICAgICAgIHdpbm5lcnM6IFsxLDNdLFxuLy8gICAgICAgICBzdHJhdGVnaWVzOiBzdHJhdC5yYW5rZWQsXG4vLyAgICAgICAgIGJhbGxvdHM6IGJhbGxvdHMucmFua2VkLFxuLy8gICAgICAgICBzeXN0ZW1zOiBzeXN0ZW1zLnBsdXJhbGl0eVxuLy8gICAgIH0sXG4vLyAgICAgUmFuZ2U6IHtcbi8vICAgICAgICAgd2lubmVyczogWzEsM10sXG4vLyAgICAgICAgIHN0cmF0ZWdpZXM6IHN0cmF0LnNjb3JlZCxcbi8vICAgICAgICAgc3lzdGVtczogc3lzdGVtcy5zY29yZWQsXG4vLyAgICAgICAgIGJhbGxvdHM6IGJhbGxvdHMuc2NvcmVkXG4vLyAgICAgfSxcbi8vICAgICAnU2luZ2xlLVRyYW5zZmVyYWJsZSBWb3RlJzoge1xuLy8gICAgICAgICB3aW5uZXJzOiBbMSwzXSxcbi8vICAgICAgICAgc3RyYXRlZ2llczogc3RyYXQucmFua2VkLFxuLy8gICAgICAgICBiYWxsb3RzOiBiYWxsb3RzLnJhbmtlZCxcbi8vICAgICAgICAgc3lzdGVtczogc3lzdGVtcy5zaW5nbGVUcmFuc2ZlcmFibGVWb3RlXG4vLyAgICAgfSxcbi8vICAgICAnUHJvcG9ydGlvbmFsIFJhbmtlZCwgMTUtUGVyY2VudCBUaHJlc2hvbGQnOiB7XG4vLyAgICAgICAgIHdpbm5lcnM6IFszXSwvL1sxLDNdLFxuLy8gICAgICAgICBzdHJhdGVnaWVzOiBzdHJhdC5yYW5rZWQsXG4vLyAgICAgICAgIGJhbGxvdHM6IGJhbGxvdHMucmFua2VkLFxuLy8gICAgICAgICBzeXN0ZW1zOiBzeXN0ZW1zLnNpbmdsZVRyYW5zZmVyYWJsZVZvdGVcbi8vICAgICB9LFxuLy8gICAgICdQcm9wb3J0aW9uYWwgUmFuZ2VkJzoge1xuLy8gICAgICAgICB3aW5uZXJzOiBbMywgSW5maW5pdHldLC8vWzEsMywgSW5maW5pdHldLFxuLy8gICAgICAgICBzdHJhdGVnaWVzOiBzdHJhdC5zY29yZWQsXG4vLyAgICAgICAgIGJhbGxvdHM6IGJhbGxvdHMuc2NvcmVkLFxuLy8gICAgICAgICBzeXN0ZW1zOiB7XG4vLyAgICAgICAgICAgICAnc3BsaXQtd2VpZ2h0LCAwJSB0aHJlc2hvbGQnOiBzeXN0ZW1zLmRpcmVjdFJlcHJlc2VudGF0aXZlUmFuZ2VkWydzcGxpdC13ZWlnaHQsIDAlIHRocmVzaG9sZCddLFxuLy8gICAgICAgICAgICAgJ2hpZ2hlc3Qtd2VpZ2h0LCAyMCUgdGhyZXNob2xkJzogc3lzdGVtcy5kaXJlY3RSZXByZXNlbnRhdGl2ZVJhbmdlZFsnaGlnaGVzdC13ZWlnaHQsIDIwJSB0aHJlc2hvbGQnXSxcbi8vICAgICAgICAgICAgICdzcGxpdC13ZWlnaHQsIG1pbm9yaXR5LW1heCwgMjAlIHRocmVzaG9sZCc6IHN5c3RlbXMuZGlyZWN0UmVwcmVzZW50YXRpdmVSYW5nZWRbJ3NwbGl0LXdlaWdodCwgbWlub3JpdHktbWF4LCAyMCUgdGhyZXNob2xkJ10sXG4vLyAgICAgICAgICAgICAnc3BsaXQtd2VpZ2h0LCA8Yj5yZXdlaWdodGVkPC9iPic6IHN5c3RlbXMuZGlyZWN0UmVwcmVzZW50YXRpdmVSYW5nZWRbJ3NwbGl0LXdlaWdodCwgPGI+cmV3ZWlnaHRlZDwvYj4nXSxcbi8vICAgICAgICAgICAgICdlcXVhbC13ZWlnaHQsIDxiPnJld2VpZ2h0ZWQ8L2I+Jzogc3lzdGVtcy5kaXJlY3RSZXByZXNlbnRhdGl2ZVJhbmdlZFsnc3BsaXQtd2VpZ2h0LCA8Yj5yZXdlaWdodGVkPC9iPiddLFxuLy8gICAgICAgICB9XG4vLyAgICAgfSxcbi8vIH1cblxuZXhwb3J0cy50ZXN0ID0gZnVuY3Rpb24ocmVzdWx0c0Rpdiwgb3B0aW9ucywgdm90aW5nU3lzdGVtcykge1xuICAgIGlmKHZvdGluZ1N5c3RlbXMgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IEVycm9yKFwiTm8gdm90aW5nIHN5c3RlbXMgdG8gdGVzdFwiKVxuXG4gICAgdmFyIG51bWJlck9mU29jaWV0YWxPcHRpb25zID0gb3B0aW9ucy5pc3N1ZXMsXG4gICAgICAgIG51bWJlck9mQ2FuZGlkYXRlcyA9IG9wdGlvbnMuY2FuZGlkYXRlcyxcbiAgICAgICAgbnVtYmVyT2ZWb3RlcnMgPSBvcHRpb25zLnZvdGVycyxcbiAgICAgICAgaXRlcmF0aW9ucyA9IG9wdGlvbnMuaXRlcmF0aW9uc1xuXG4gICAgdmFyIGtub2JzT3V0cHV0ID0gJzxkaXY+U29jaWV0YWwgT3B0aW9uczogJytudW1iZXJPZlNvY2lldGFsT3B0aW9ucysnPC9kaXY+JytcbiAgICAgICAgICAgICAgICAgICAgICAnPGRpdj5DYW5kaWRhdGVzOiAnK251bWJlck9mQ2FuZGlkYXRlcysnPC9kaXY+JytcbiAgICAgICAgICAgICAgICAgICAgICAnPGRpdj5Wb3RlcnM6ICcrbnVtYmVyT2ZWb3RlcnMrJzwvZGl2PicrXG4gICAgICAgICAgICAgICAgICAgICAgJzxkaXY+SXRlcmF0aW9uczogJytpdGVyYXRpb25zKyc8L2Rpdj4nK1xuICAgICAgICAgICAgICAgICAgICAgICc8YnI+J1xuXG4gICAgdmFyIG49MSwgdG90YWxSZWdyZXRGcmFjdGlvblN1bVBlclN5c3RlbSA9IHt9LCB0b3RhbFdpbm5lcnNQZXJTeXN0ZW0gPSB7fVxuICAgIGZ1bmN0aW9uIGl0ZXJhdGlvbihjb21wbGV0ZSkge1xuICAgICAgICB2YXIgZWxlY3Rpb24gPSBFbGVjdGlvbihudW1iZXJPZlZvdGVycywgbnVtYmVyT2ZDYW5kaWRhdGVzLCBudW1iZXJPZlNvY2lldGFsT3B0aW9ucylcblxuICAgICAgICBmb3IodmFyIHN5c3RlbU5hbWUgaW4gdm90aW5nU3lzdGVtcykge1xuICAgICAgICAgICAgdmFyIHZvdGluZ1NldCA9IHZvdGluZ1N5c3RlbXNbc3lzdGVtTmFtZV1cblxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJSdW5uaW5nOiBcIiArIHN5c3RlbU5hbWUpO1xuXG4gICAgICAgICAgICB2YXIgY3VyQmFsbG90cyA9IHZvdGluZ1NldC5iYWxsb3RzXG4gICAgICAgICAgICBpZihjdXJCYWxsb3RzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjdXJCYWxsb3RzID0gYmFsbG90cy5ub29wXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvcih2YXIgc3RyYXRlZ3lOYW1lIGluIHZvdGluZ1NldC5zdHJhdGVnaWVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJhd1N0cmF0ZWd5ID0gdm90aW5nU2V0LnN0cmF0ZWdpZXNbc3RyYXRlZ3lOYW1lXVxuICAgICAgICAgICAgICAgIGZvcih2YXIgYmFsbG90TmFtZSBpbiBjdXJCYWxsb3RzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiYWxsb3QgPSBjdXJCYWxsb3RzW2JhbGxvdE5hbWVdXG4gICAgICAgICAgICAgICAgICAgIHZhciBiYWxsb3RTdHJhdGVneU5hbWUgPSBzdHJhdGVneU5hbWUrJyAnK2JhbGxvdE5hbWVcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0cmF0ZWd5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYmFsbG90KHJhd1N0cmF0ZWd5LmFwcGx5KHRoaXMsYXJndW1lbnRzKSlcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZvcih2YXIgYWxnb3JpdGhtTmFtZSBpbiB2b3RpbmdTZXQuc3lzdGVtcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdm90aW5nU2V0Lndpbm5lcnMuZm9yRWFjaChmdW5jdGlvbihtYXhXaW5uZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHdpbm5lcnMgPSBlbGVjdGlvbi5lbGVjdCh2b3RpbmdTZXQuc3lzdGVtc1thbGdvcml0aG1OYW1lXSwgc3RyYXRlZ3ksIGVsZWN0aW9uLnZvdGVycywgZWxlY3Rpb24uY2FuZGlkYXRlcywgbWF4V2lubmVycylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVncmV0RnJhY3Rpb24gPSBlbGVjdGlvbi5yZWdyZXRGcmFjdGlvbihlbGVjdGlvbi52b3RlcnMsIHdpbm5lcnMpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3lzdGVtU3RyYXRlZ3lOYW1lID0gZ2V0Vm90aW5nVHlwZU5hbWUoc3lzdGVtTmFtZSwgYmFsbG90U3RyYXRlZ3lOYW1lLCBhbGdvcml0aG1OYW1lLCBtYXhXaW5uZXJzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHRvdGFsUmVncmV0RnJhY3Rpb25TdW1QZXJTeXN0ZW1bc3lzdGVtU3RyYXRlZ3lOYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsUmVncmV0RnJhY3Rpb25TdW1QZXJTeXN0ZW1bc3lzdGVtU3RyYXRlZ3lOYW1lXSA9IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxXaW5uZXJzUGVyU3lzdGVtW3N5c3RlbVN0cmF0ZWd5TmFtZV0gPSAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxSZWdyZXRGcmFjdGlvblN1bVBlclN5c3RlbVtzeXN0ZW1TdHJhdGVneU5hbWVdICs9IHJlZ3JldEZyYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxXaW5uZXJzUGVyU3lzdGVtW3N5c3RlbVN0cmF0ZWd5TmFtZV0gKz0gd2lubmVycy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXN1bHRzRGl2LmlubmVySFRNTCA9IHJlc3VsdHNIdG1sKG4vaXRlcmF0aW9ucywgdHJ1ZSlcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmKG48aXRlcmF0aW9ucykge1xuICAgICAgICAgICAgICAgIGl0ZXJhdGlvbihjb21wbGV0ZSlcbiAgICAgICAgICAgICAgICBuKytcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29tcGxldGUoKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIHZhciByZXN1bHRzSHRtbCA9IGZ1bmN0aW9uKGNvbXBsZXRpb25GcmFjdGlvbiwgc29ydCkge1xuICAgICAgICB2YXIgY29udGVudCA9IGtub2JzT3V0cHV0KydDb21wbGV0aW9uOiAnK051bWJlcigxMDAqY29tcGxldGlvbkZyYWN0aW9uKS50b1ByZWNpc2lvbigzKSsnJTxicj4nK1xuICAgICAgICAgICAgICAgICAgICAgICc8ZGl2PjxiPlZvdGVyIFNhdGlzZmFjdGlvbiBBdmVyYWdlcyAoaW52ZXJzZSBvZiBCYXllc2lhbiBSZWdyZXQpOjwvYj48L2Rpdj4nK1xuICAgICAgICAgICAgICAgICAgICAgICc8dGFibGU+J1xuXG4gICAgICAgIE9iamVjdC5rZXlzKHRvdGFsUmVncmV0RnJhY3Rpb25TdW1QZXJTeXN0ZW0pLm1hcChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4ge25hbWU6bmFtZSwgdG90YWxSZWdyZXQ6dG90YWxSZWdyZXRGcmFjdGlvblN1bVBlclN5c3RlbVtuYW1lXX1cbiAgICAgICAgfSkuc29ydChmdW5jdGlvbihhLGIpIHtcbiAgICAgICAgICAgIGlmKHNvcnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYS50b3RhbFJlZ3JldCAtIGIudG90YWxSZWdyZXRcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkuZm9yRWFjaChmdW5jdGlvbih2b3RpbmdUeXBlKSB7XG4gICAgICAgICAgICB2YXIgc3lzdGVtU3RyYXRlZ3lOYW1lID0gdm90aW5nVHlwZS5uYW1lXG4gICAgICAgICAgICB2YXIgdG90YWxSZWdyZXQgPSB2b3RpbmdUeXBlLnRvdGFsUmVncmV0XG5cbiAgICAgICAgICAgIHZhciBhdmVyYWdlUmVncmV0RnJhY3Rpb24gPSB0b3RhbFJlZ3JldC9uXG4gICAgICAgICAgICB2YXIgYXZnV2lubmVycyA9ICh0b3RhbFdpbm5lcnNQZXJTeXN0ZW1bc3lzdGVtU3RyYXRlZ3lOYW1lXS9uKS50b1ByZWNpc2lvbigyKVxuXG4gICAgICAgICAgICB2YXIgZGlzcGxheUF2ZXJhZ2UgPSBOdW1iZXIoMTAwKigxLWF2ZXJhZ2VSZWdyZXRGcmFjdGlvbikpLnRvUHJlY2lzaW9uKDIpXG4gICAgICAgICAgICBjb250ZW50ICs9ICc8dHI+PHRkIHN0eWxlPVwidGV4dC1hbGlnbjpyaWdodDtcIj4nK3N5c3RlbVN0cmF0ZWd5TmFtZStcIjwvdGQ+PHRkPjxiPlwiK2Rpc3BsYXlBdmVyYWdlKyclPC9iPiB3aXRoIGF2ZyBvZiAnK2F2Z1dpbm5lcnMrJyB3aW5uZXJzPC90ZD48L3RyPidcbiAgICAgICAgfSlcblxuICAgICAgICBjb250ZW50Kz0gJzwvdGFibGU+J1xuICAgICAgICByZXR1cm4gY29udGVudFxuICAgIH1cblxuICAgIGl0ZXJhdGlvbihmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzdWx0c0Rpdi5pbm5lckhUTUwgPSByZXN1bHRzSHRtbCgxLCB0cnVlKVxuICAgIH0pXG59XG5cblxuLy8gVGhlIG5hbWUgb2YgYW4gZWxlY3Rpb24gcnVuIHdpdGggYSBwYXJ0aWN1bGFyIHN5c3RlbSBhbmQgc3RyYXRlZ3lcbmZ1bmN0aW9uIGdldFZvdGluZ1R5cGVOYW1lKHN5c3RlbU5hbWUsc3RyYXRlZ3lOYW1lLCBhbGdvcml0aG1OYW1lLCBtYXhXaW5uZXJzKSB7XG4gICAgaWYoc3RyYXRlZ3lOYW1lID09PSAnbm9uYW1lJykge1xuICAgICAgICByZXR1cm4gc3lzdGVtTmFtZVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAnPHNwYW4gc3R5bGU9XCJjb2xvcjpyZ2IoMCw1MCwxNTApXCI+JytzeXN0ZW1OYW1lKyc8L3NwYW4+ICcrYWxnb3JpdGhtTmFtZSsnICcrc3RyYXRlZ3lOYW1lKycgbWF4ICcrbWF4V2lubmVycysnIHdpbm5lcnMnXG4gICAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qIENvcHlyaWdodCAoYykgMjAxMyBCaWxseSBUZXRydWQgLSBGcmVlIHRvIHVzZSBmb3IgYW55IHB1cnBvc2U6IE1JVCBMaWNlbnNlKi9cclxuXHJcbnZhciBub29wID0gZnVuY3Rpb24oKSB7fVxyXG5cclxudmFyIHByb3RvdHlwZU5hbWU9J3Byb3RvdHlwZScsIHVuZGVmaW5lZCwgcHJvdG9VbmRlZmluZWQ9J3VuZGVmaW5lZCcsIGluaXQ9J2luaXQnLCBvd25Qcm9wZXJ0eT0oe30pLmhhc093blByb3BlcnR5OyAvLyBtaW5pZmlhYmxlIHZhcmlhYmxlc1xyXG5mdW5jdGlvbiBwcm90bygpIHtcclxuICAgIHZhciBhcmdzID0gYXJndW1lbnRzIC8vIG1pbmlmaWFibGUgdmFyaWFibGVzXHJcblxyXG4gICAgaWYoYXJncy5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSB7aW5pdDogbm9vcH1cclxuICAgICAgICB2YXIgcHJvdG90eXBlQnVpbGRlciA9IGFyZ3NbMF1cclxuXHJcbiAgICB9IGVsc2UgeyAvLyBsZW5ndGggPT0gMlxyXG4gICAgICAgIHZhciBwYXJlbnQgPSBhcmdzWzBdXHJcbiAgICAgICAgdmFyIHByb3RvdHlwZUJ1aWxkZXIgPSBhcmdzWzFdXHJcbiAgICB9XHJcblxyXG4gICAgLy8gc3BlY2lhbCBoYW5kbGluZyBmb3IgRXJyb3Igb2JqZWN0c1xyXG4gICAgdmFyIG5hbWVQb2ludGVyID0ge30gICAgLy8gbmFtZSB1c2VkIG9ubHkgZm9yIEVycm9yIE9iamVjdHNcclxuICAgIGlmKFtFcnJvciwgRXZhbEVycm9yLCBSYW5nZUVycm9yLCBSZWZlcmVuY2VFcnJvciwgU3ludGF4RXJyb3IsIFR5cGVFcnJvciwgVVJJRXJyb3JdLmluZGV4T2YocGFyZW50KSAhPT0gLTEpIHtcclxuICAgICAgICBwYXJlbnQgPSBub3JtYWxpemVFcnJvck9iamVjdChwYXJlbnQsIG5hbWVQb2ludGVyKVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHNldCB1cCB0aGUgcGFyZW50IGludG8gdGhlIHByb3RvdHlwZSBjaGFpbiBpZiBhIHBhcmVudCBpcyBwYXNzZWRcclxuICAgIHZhciBwYXJlbnRJc0Z1bmN0aW9uID0gdHlwZW9mKHBhcmVudCkgPT09IFwiZnVuY3Rpb25cIlxyXG4gICAgaWYocGFyZW50SXNGdW5jdGlvbikge1xyXG4gICAgICAgIHByb3RvdHlwZUJ1aWxkZXJbcHJvdG90eXBlTmFtZV0gPSBwYXJlbnRbcHJvdG90eXBlTmFtZV1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcHJvdG90eXBlQnVpbGRlcltwcm90b3R5cGVOYW1lXSA9IHBhcmVudFxyXG4gICAgfVxyXG5cclxuICAgIC8vIHRoZSBwcm90b3R5cGUgdGhhdCB3aWxsIGJlIHVzZWQgdG8gbWFrZSBpbnN0YW5jZXNcclxuICAgIHZhciBwcm90b3R5cGUgPSBuZXcgcHJvdG90eXBlQnVpbGRlcihwYXJlbnQpXHJcbiAgICBuYW1lUG9pbnRlci5uYW1lID0gcHJvdG90eXBlLm5hbWVcclxuXHJcbiAgICAvLyBpZiB0aGVyZSdzIG5vIGluaXQsIGFzc3VtZSBpdHMgaW5oZXJpdGluZyBhIG5vbi1wcm90byBjbGFzcywgc28gZGVmYXVsdCB0byBhcHBseWluZyB0aGUgc3VwZXJjbGFzcydzIGNvbnN0cnVjdG9yLlxyXG4gICAgaWYoIXByb3RvdHlwZVtpbml0XSAmJiBwYXJlbnRJc0Z1bmN0aW9uKSB7XHJcbiAgICAgICAgcHJvdG90eXBlW2luaXRdID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHBhcmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGNvbnN0cnVjdG9yIGZvciBlbXB0eSBvYmplY3Qgd2hpY2ggd2lsbCBiZSBwb3B1bGF0ZWQgdmlhIHRoZSBjb25zdHJ1Y3RvclxyXG4gICAgdmFyIEYgPSBmdW5jdGlvbigpIHt9XHJcbiAgICAgICAgRltwcm90b3R5cGVOYW1lXSA9IHByb3RvdHlwZSAgICAvLyBzZXQgdGhlIHByb3RvdHlwZSBmb3IgY3JlYXRlZCBpbnN0YW5jZXNcclxuXHJcbiAgICB2YXIgY29uc3RydWN0b3JOYW1lID0gcHJvdG90eXBlLm5hbWU/cHJvdG90eXBlLm5hbWU6JydcclxuICAgIGlmKHByb3RvdHlwZVtpbml0XSA9PT0gdW5kZWZpbmVkIHx8IHByb3RvdHlwZVtpbml0XSA9PT0gbm9vcCkge1xyXG4gICAgICAgIHZhciBQcm90b09iamVjdEZhY3RvcnkgPSBuZXcgRnVuY3Rpb24oJ0YnLFxyXG4gICAgICAgICAgICBcInJldHVybiBmdW5jdGlvbiBcIiArIGNvbnN0cnVjdG9yTmFtZSArIFwiKCl7XCIgK1xyXG4gICAgICAgICAgICAgICAgXCJyZXR1cm4gbmV3IEYoKVwiICtcclxuICAgICAgICAgICAgXCJ9XCJcclxuICAgICAgICApKEYpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIGR5bmFtaWNhbGx5IGNyZWF0aW5nIHRoaXMgZnVuY3Rpb24gY2F1c2UgdGhlcmUncyBubyBvdGhlciB3YXkgdG8gZHluYW1pY2FsbHkgbmFtZSBhIGZ1bmN0aW9uXHJcbiAgICAgICAgdmFyIFByb3RvT2JqZWN0RmFjdG9yeSA9IG5ldyBGdW5jdGlvbignRicsJ2knLCd1JywnbicsIC8vIHNoaXR0eSB2YXJpYWJsZXMgY2F1c2UgbWluaWZpZXJzIGFyZW4ndCBnb25uYSBtaW5pZnkgbXkgZnVuY3Rpb24gc3RyaW5nIGhlcmVcclxuICAgICAgICAgICAgXCJyZXR1cm4gZnVuY3Rpb24gXCIgKyBjb25zdHJ1Y3Rvck5hbWUgKyBcIigpeyBcIiArXHJcbiAgICAgICAgICAgICAgICBcInZhciB4PW5ldyBGKCkscj1pLmFwcGx5KHgsYXJndW1lbnRzKVxcblwiICsgICAgLy8gcG9wdWxhdGUgb2JqZWN0IHZpYSB0aGUgY29uc3RydWN0b3JcclxuICAgICAgICAgICAgICAgIFwiaWYocj09PW4pXFxuXCIgK1xyXG4gICAgICAgICAgICAgICAgICAgIFwicmV0dXJuIHhcXG5cIiArXHJcbiAgICAgICAgICAgICAgICBcImVsc2UgaWYocj09PXUpXFxuXCIgK1xyXG4gICAgICAgICAgICAgICAgICAgIFwicmV0dXJuIG5cXG5cIiArXHJcbiAgICAgICAgICAgICAgICBcImVsc2VcXG5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgXCJyZXR1cm4gclxcblwiICtcclxuICAgICAgICAgICAgXCJ9XCJcclxuICAgICAgICApKEYsIHByb3RvdHlwZVtpbml0XSwgcHJvdG9bcHJvdG9VbmRlZmluZWRdKSAvLyBub3RlIHRoYXQgbiBpcyB1bmRlZmluZWRcclxuICAgIH1cclxuXHJcbiAgICBwcm90b3R5cGUuY29uc3RydWN0b3IgPSBQcm90b09iamVjdEZhY3Rvcnk7ICAgIC8vIHNldCB0aGUgY29uc3RydWN0b3IgcHJvcGVydHkgb24gdGhlIHByb3RvdHlwZVxyXG5cclxuICAgIC8vIGFkZCBhbGwgdGhlIHByb3RvdHlwZSBwcm9wZXJ0aWVzIG9udG8gdGhlIHN0YXRpYyBjbGFzcyBhcyB3ZWxsIChzbyB5b3UgY2FuIGFjY2VzcyB0aGF0IGNsYXNzIHdoZW4geW91IHdhbnQgdG8gcmVmZXJlbmNlIHN1cGVyY2xhc3MgcHJvcGVydGllcylcclxuICAgIGZvcih2YXIgbiBpbiBwcm90b3R5cGUpIHtcclxuICAgICAgICBhZGRQcm9wZXJ0eShQcm90b09iamVjdEZhY3RvcnksIHByb3RvdHlwZSwgbilcclxuICAgIH1cclxuXHJcbiAgICAvLyBhZGQgcHJvcGVydGllcyBmcm9tIHBhcmVudCB0aGF0IGRvbid0IGV4aXN0IGluIHRoZSBzdGF0aWMgY2xhc3Mgb2JqZWN0IHlldFxyXG4gICAgZm9yKHZhciBuIGluIHBhcmVudCkge1xyXG4gICAgICAgIGlmKG93blByb3BlcnR5LmNhbGwocGFyZW50LCBuKSAmJiBQcm90b09iamVjdEZhY3Rvcnlbbl0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBhZGRQcm9wZXJ0eShQcm90b09iamVjdEZhY3RvcnksIHBhcmVudCwgbilcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgUHJvdG9PYmplY3RGYWN0b3J5LnBhcmVudCA9IHBhcmVudDsgICAgICAgICAgICAvLyBzcGVjaWFsIHBhcmVudCBwcm9wZXJ0eSBvbmx5IGF2YWlsYWJsZSBvbiB0aGUgcmV0dXJuZWQgcHJvdG8gY2xhc3NcclxuICAgIFByb3RvT2JqZWN0RmFjdG9yeVtwcm90b3R5cGVOYW1lXSA9IHByb3RvdHlwZSAgLy8gc2V0IHRoZSBwcm90b3R5cGUgb24gdGhlIG9iamVjdCBmYWN0b3J5XHJcblxyXG4gICAgcmV0dXJuIFByb3RvT2JqZWN0RmFjdG9yeTtcclxufVxyXG5cclxucHJvdG9bcHJvdG9VbmRlZmluZWRdID0ge30gLy8gYSBzcGVjaWFsIG1hcmtlciBmb3Igd2hlbiB5b3Ugd2FudCB0byByZXR1cm4gdW5kZWZpbmVkIGZyb20gYSBjb25zdHJ1Y3RvclxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBwcm90b1xyXG5cclxuZnVuY3Rpb24gbm9ybWFsaXplRXJyb3JPYmplY3QoRXJyb3JPYmplY3QsIG5hbWVQb2ludGVyKSB7XHJcbiAgICBmdW5jdGlvbiBOb3JtYWxpemVkRXJyb3IoKSB7XHJcbiAgICAgICAgdmFyIHRtcCA9IG5ldyBFcnJvck9iamVjdChhcmd1bWVudHNbMF0pXHJcbiAgICAgICAgdG1wLm5hbWUgPSBuYW1lUG9pbnRlci5uYW1lXHJcblxyXG4gICAgICAgIHRoaXMubWVzc2FnZSA9IHRtcC5tZXNzYWdlXHJcbiAgICAgICAgaWYoT2JqZWN0LmRlZmluZVByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgIC8qdGhpcy5zdGFjayA9ICovT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdzdGFjaycsIHsgLy8gZ2V0dGVyIGZvciBtb3JlIG9wdGltaXp5IGdvb2RuZXNzXHJcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0bXAuc3RhY2tcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUgLy8gc28geW91IGNhbiBjaGFuZ2UgaXQgaWYgeW91IHdhbnRcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnN0YWNrID0gdG1wLnN0YWNrXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBJbnRlcm1lZGlhdGVJbmhlcml0b3IgPSBmdW5jdGlvbigpIHt9XHJcbiAgICAgICAgSW50ZXJtZWRpYXRlSW5oZXJpdG9yLnByb3RvdHlwZSA9IEVycm9yT2JqZWN0LnByb3RvdHlwZVxyXG4gICAgTm9ybWFsaXplZEVycm9yLnByb3RvdHlwZSA9IG5ldyBJbnRlcm1lZGlhdGVJbmhlcml0b3IoKVxyXG5cclxuICAgIHJldHVybiBOb3JtYWxpemVkRXJyb3JcclxufVxyXG5cclxuZnVuY3Rpb24gYWRkUHJvcGVydHkoZmFjdG9yeU9iamVjdCwgcHJvdG90eXBlLCBwcm9wZXJ0eSkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB2YXIgaW5mbyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocHJvdG90eXBlLCBwcm9wZXJ0eSlcclxuICAgICAgICBpZihpbmZvLmdldCAhPT0gdW5kZWZpbmVkIHx8IGluZm8uZ2V0ICE9PSB1bmRlZmluZWQgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGZhY3RvcnlPYmplY3QsIHByb3BlcnR5LCBpbmZvKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGZhY3RvcnlPYmplY3RbcHJvcGVydHldID0gcHJvdG90eXBlW3Byb3BlcnR5XVxyXG4gICAgICAgIH1cclxuICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgIC8vIGRvIG5vdGhpbmcsIGlmIGEgcHJvcGVydHkgKGxpa2UgYG5hbWVgKSBjYW4ndCBiZSBzZXQsIGp1c3QgaWdub3JlIGl0XHJcbiAgICB9XHJcbn0iLCJcblxuLy8gcmFuZG9tIG51bWJlciBiZXR3ZWVuIDAgYW5kIDEgKGp1c3QgbGlrZSBNYXRoLnJhbmRvbSlcbmV4cG9ydHMucmFuZG9tID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJhbmRvbUludGVnZXIgPSBnZXRSYW5kb21JbnQoMCwyNTUpXG4gICAgcmV0dXJuIHJhbmRvbUludGVnZXIvMjU1XG59XG5cbmZ1bmN0aW9uIGdldFJhbmRvbUludChtaW4sIG1heCkge1xuICAgIC8vIENyZWF0ZSBieXRlIGFycmF5IGFuZCBmaWxsIHdpdGggMSByYW5kb20gbnVtYmVyXG4gICAgdmFyIGJ5dGVBcnJheSA9IG5ldyBVaW50OEFycmF5KDEpO1xuICAgIHdpbmRvdy5jcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKGJ5dGVBcnJheSk7XG5cbiAgICB2YXIgcmFuZ2UgPSBtYXggLSBtaW4gKyAxO1xuICAgIHZhciBtYXhfcmFuZ2UgPSAyNTY7XG4gICAgaWYgKGJ5dGVBcnJheVswXSA+PSBNYXRoLmZsb29yKG1heF9yYW5nZSAvIHJhbmdlKSAqIHJhbmdlKVxuICAgICAgICByZXR1cm4gZ2V0UmFuZG9tSW50KG1pbiwgbWF4KTtcbiAgICByZXR1cm4gbWluICsgKGJ5dGVBcnJheVswXSAlIHJhbmdlKTtcbn1cblxuLy8gUmV0dXJucyB0aGUgcmVzdWx0cyBvZiBhIHllcy9ubyB3ZWlnaHRlZCBtYWpvcml0eSB2b3RlIG9uIGVhY2ggc29jaWV0YWwgcHJlZmVyZW5jZSBhcyBhbiBhcnJheSB3aGVyZVxuLy8gZWFjaCBpbmRleCBpbmRpY2F0ZXMgdGhlIHNvY2lldGFsIG9wdGlvbiBhbmQgdGhlIHZhbHVlIGlzIGVpdGhlciB0cnVlIG9yIGZhbHNlXG4vLyBkZWNpZGVycyAtIEFuIGFycmF5IG9mIHdpbm5pbmcgY2FuZGlkYXRlcyBpbiB0aGUgc2FtZSBmb3JtIGFzIHRoaXMuZWxlY3QgcmV0dXJuc1xubW9kdWxlLmV4cG9ydHMuZmluZFNvY2lldGFsT3B0aW9uc091dGNvbWVzID0gZnVuY3Rpb24oZGVjaWRlcnMpIHtcbiAgICB2YXIgdm90ZVdlaWdodFRvdGFsID0gMFxuICAgIHZhciBzb2NpZXRhbE9wdGlvbnNWb3RlcyA9IFtdXG4gICAgZGVjaWRlcnMuZm9yRWFjaChmdW5jdGlvbihwZXJzb24pIHtcbiAgICAgICAgdm90ZVdlaWdodFRvdGFsICs9IHBlcnNvbi53ZWlnaHRcbiAgICAgICAgcGVyc29uLnByZWZlcmVuY2VzLmZvckVhY2goZnVuY3Rpb24ocHJlZmVyZW5jZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmKHNvY2lldGFsT3B0aW9uc1ZvdGVzW2luZGV4XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgc29jaWV0YWxPcHRpb25zVm90ZXNbaW5kZXhdID0gMFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZihwcmVmZXJlbmNlID4gMCkge1xuICAgICAgICAgICAgICAgIHNvY2lldGFsT3B0aW9uc1ZvdGVzW2luZGV4XSArPSBwZXJzb24ud2VpZ2h0XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSlcblxuICAgIHJldHVybiBzb2NpZXRhbE9wdGlvbnNWb3Rlcy5tYXAoZnVuY3Rpb24odm90ZXNGb3JPbmVTb2NpZXRhbE9wdGlvbikge1xuICAgICAgICByZXR1cm4gdm90ZXNGb3JPbmVTb2NpZXRhbE9wdGlvbi92b3RlV2VpZ2h0VG90YWwgPiAuNVxuICAgIH0pXG59XG5cbm1vZHVsZS5leHBvcnRzLnZvdGVyT3V0Y29tZVV0aWxpdHkgPSBmdW5jdGlvbih2b3Rlciwgb3V0Y29tZXMpIHtcbiAgICB2YXIgdG90YWxVdGlsaXR5ID0gIDBcbiAgICB2b3Rlci5mb3JFYWNoKGZ1bmN0aW9uKHV0aWxpdHksaW5kZXgpIHtcbiAgICAgICAgaWYob3V0Y29tZXNbaW5kZXhdKVxuICAgICAgICAgICAgdG90YWxVdGlsaXR5ICs9IHV0aWxpdHlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHRvdGFsVXRpbGl0eVxufSIsIlxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpXG5cbi8vIHZvdGVzIGFyZSBmbG9hdGluZyBwb2ludCBudW1iZXJzIGJldHdlZW4gMCBhbmQgMVxuZnVuY3Rpb24gcmFuZ2VTdHJhdGVneV9ob25lc3RFeGFjdCh2b3RlciwgYWdncmVnYXRlcykge1xuICAgIC8vIHRoZSBtYXhpbXVtIHV0aWxpdHkgdGhhdCB0aGUgYmVzdCBkaWN0YXRvci1jYW5kaWRhdGUgd291bGQgZ2l2ZSBmb3IgdGhpcyB2b3RlclxuICAgIHZhciBtYXhVdGlsaXR5ID0gTWF0aC5tYXguYXBwbHkobnVsbCwgYWdncmVnYXRlcy5jYW5kaWRhdGVEaWN0YXRvclV0aWxpdGllcylcbiAgICB2YXIgbWluVXRpbGl0eSA9IE1hdGgubWluLmFwcGx5KG51bGwsIGFnZ3JlZ2F0ZXMuY2FuZGlkYXRlRGljdGF0b3JVdGlsaXRpZXMpXG5cbiAgICByZXR1cm4gYWdncmVnYXRlcy5jYW5kaWRhdGVEaWN0YXRvclV0aWxpdGllcy5tYXAoZnVuY3Rpb24odXRpbGl0eSkge1xuICAgICAgICBpZihtYXhVdGlsaXR5ID09PSBtaW5VdGlsaXR5KSB7IC8vIHRoaXMgYnJhbmNoIHByZXZlbnRzIGEgZGl2aWRlIGJ5IDAgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiAuNVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHV0aWxpdHlGcmFjdGlvbiA9ICh1dGlsaXR5LW1pblV0aWxpdHkpLyhtYXhVdGlsaXR5LW1pblV0aWxpdHkpXG4gICAgICAgICAgICByZXR1cm4gdXRpbGl0eUZyYWN0aW9uXG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5mdW5jdGlvbiByYW5rZWRWb3RlX2hvbmVzdCh2b3RlciwgYWdncmVnYXRlcykge1xuICAgIHZhciBvcmRlciA9IGFnZ3JlZ2F0ZXMuY2FuZGlkYXRlRGljdGF0b3JVdGlsaXRpZXMubWFwKGZ1bmN0aW9uKGNhbmRpZGF0ZVV0aWxpdHksIGluZGV4KSB7XG4gICAgICAgIHJldHVybiB7dXRpbGl0eTogY2FuZGlkYXRlVXRpbGl0eSwgaW5kZXg6aW5kZXh9XG4gICAgfSkuc29ydChmdW5jdGlvbihhLGIpIHtcbiAgICAgICAgcmV0dXJuIGIudXRpbGl0eS1hLnV0aWxpdHkgLy8gaGlnaGVzdCB0byBsb3dlc3RcbiAgICB9KVxuXG4gICAgcmV0dXJuIG9yZGVyLm1hcChmdW5jdGlvbih4KSB7XG4gICAgICAgIHJldHVybiB4LmluZGV4XG4gICAgfSlcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICByYW5rZWQ6IHtcbiAgICAgICAgSG9uZXN0OiByYW5rZWRWb3RlX2hvbmVzdFxuICAgIH0sXG4gICAgc2NvcmVkOiB7XG4gICAgICAgIEhvbmVzdDogcmFuZ2VTdHJhdGVneV9ob25lc3RFeGFjdFxuICAgIH0sXG4gICAgbm9vcDoge1xuICAgICAgICAnJzpmdW5jdGlvbigpe31cbiAgICB9XG59IiwidmFyIHJhbmRvbSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLnJhbmRvbVxuXG5cbmZ1bmN0aW9uIHBsdXJhbGl0eUFsZyh2b3RlcywgY2FuZGlkYXRlcywgbWF4V2lubmVycykge1xuICAgIHZhciByZXN1bHRzID0gW11cbiAgICBmb3IodmFyIG49MDsgbjxjYW5kaWRhdGVzLmxlbmd0aDtuKyspIHtcbiAgICAgICAgcmVzdWx0c1tuXSA9IDBcbiAgICB9XG5cbiAgICB2b3Rlcy5mb3JFYWNoKGZ1bmN0aW9uKHZvdGUpIHtcbiAgICAgICAgcmVzdWx0c1t2b3RlWzBdXSsrXG4gICAgfSlcblxuICAgIHZhciBzb3J0ZWRUcmFuc2Zvcm1lZFJlc3VsdHMgPSByZXN1bHRzLm1hcChmdW5jdGlvbih2YWx1ZSxpbmRleCl7XG4gICAgICAgIHJldHVybiB7Y2FuZGlkYXRlOmluZGV4LHZvdGVzOnZhbHVlfVxuICAgIH0pLnNvcnQoZnVuY3Rpb24oYSxiKSB7XG4gICAgICAgIHJldHVybiBiLnZvdGVzIC0gYS52b3RlcyAvLyByZXZlcnNlIHNvcnRcbiAgICB9KVxuXG4gICAgcmV0dXJuIHNvcnRlZFRyYW5zZm9ybWVkUmVzdWx0cy5zbGljZSgwLG1heFdpbm5lcnMpLm1hcChmdW5jdGlvbih3aW5uZXIpIHtcbiAgICAgICAgcmV0dXJuIHtpbmRleDogd2lubmVyLmNhbmRpZGF0ZSwgd2VpZ2h0OjF9XG4gICAgfSlcbn1cblxuXG4vLyBjb3VudFR5cGUgY2FuIGVpdGhlciBiZSBcIm5vcm1hbFwiIG9yIFwibWF4TWlub3JpdHlcIlxuICAgIC8vIG5vcm1hbCBpcyB3aGVyZSB0aGUgd2lubmVycyBhcmUgdGhlIHggY2FuZGlkYXRlcyB3aXRoIHRoZSBncmVhdGVzdCB0b3RhbCBzY29yZVxuICAgIC8vIG1heE1pbm9yaXR5IGlzIHdoZXJlIGVhY2ggc3VjY2Vzc2l2ZSB3aW5uZXIgaXMgY2hvc2VuIGZyb20gb25seSB0aGUgdm90ZXMgb2YgdGhvc2Ugd2hvIGhhdmVuJ3QgY2hvc2VuIGEgd2lubmVyIGFzIHRoZWlyIHRvcCBjaG9pY2VcbiAgICAvLyByZXdlaWdodGVkIGlzIGZvciBhIHJld2VpZ2h0ZWQgcmFuZ2Ugdm90ZSBkZXNjcmliZWQgaGVyZTsgaHR0cDovL3d3dy5yYW5nZXZvdGluZy5vcmcvUlJWLmh0bWxcbi8vIHdpbm5lcldlaWdodFR5cGUgY2FuIGVpdGhlciBiZSBcImhpZ2hlc3RcIiBvciBcInNwbGl0XCJcbiAgICAvLyBcImhpZ2hlc3RcIiBtZWFucyB3aW5uZXIgdm90ZSB3ZWlnaHQgd2lsbCBiZSB0aGUgc3VtIG9mIHRoZSBudW1iZXIgb2Ygdm90ZXJzIHdobyBnYXZlIHRoYXQgd2lubmVyIHRoZSBoaWdoZXN0IHNjb3JlXG4gICAgLy8gXCJzcGxpdFwiIG1lYW5zIHdpbm5lciB2b3RlIHdlaWdodCBpcyB0aGUgc3VtIG9mIGFsbCB2b3Rlc1xuICAgIC8vIFwiZXF1YWxcIiBtZWFucyBlYWNoIHdpbm5lciBnZXRzIGFuIGVxdWFsIHZvdGUgd2VpZ2h0XG4vLyBtaW5UaHJlc2hvbGQgaXMgYSBudW1iZXIgZnJvbSAwIHRvIDEgcmVwcmVzZW50aW5nIHRoZSByYXRpbyBvZiBhdmVyYWdlIHNjb3JlIHRvIHRoZSBhdmVyYWdlIHNjb3JlIG9mIHRoZSBoaWdoZXN0IHNjb3JpbmcgY2FuZGlkYXRlXG4gICAgLy8gbm90ZSB0aGF0IHRoZSB2b3RlcyBhcmUgc2hpZnRlZCBzbyB0aGF0IHRoZXkncmUgYSByYW5nZSBmcm9tIDAgdG8gMiBmb3IgdGhlIHB1cnBvc2VzIG9mIGNhbGN1bGF0aW5nIHRoaXNcbmZ1bmN0aW9uIGRpcmVjdFJlcHJlc2VudGF0aW9uUmFuZ2UoY291bnRUeXBlLCB3aW5uZXJXZWlnaHRUeXBlLCBtaW5UaHJlc2hvbGQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24odm90ZXMsIGNhbmRpZGF0ZXMsIG1heFdpbm5lcnMpIHtcblxuICAgICAgICB2YXIgd2lubmVycyA9IHt9LCBkaXNxdWFsaWZpZWQgPSB7fVxuXG4gICAgICAgIHZhciBjb3VudGVkVm90ZXMgPSBjb3VudFZvdGVzKGNhbmRpZGF0ZXMsIHZvdGVzLCB3aW5uZXJzLCBkaXNxdWFsaWZpZWQpXG4gICAgICAgIHZhciBuZXh0V2lubmVyID0gZmluZE5leHRXaW5uZXIoY291bnRlZFZvdGVzKVxuICAgICAgICB2YXIgaGlnaGVzdEF2Z1Njb3JlID0gZ2V0QXZnU2NvcmUoY291bnRlZFZvdGVzW25leHRXaW5uZXJdKVxuXG4gICAgICAgIGNvdW50ZWRWb3Rlcy5mb3JFYWNoKGZ1bmN0aW9uKGluZm8sIGNhbmRpZGF0ZSkge1xuICAgICAgICAgICAgdmFyIGF2Z1Njb3JlID0gZ2V0QXZnU2NvcmUoaW5mbylcbiAgICAgICAgICAgIGlmKGF2Z1Njb3JlIDwgaGlnaGVzdEF2Z1Njb3JlKm1pblRocmVzaG9sZCkge1xuICAgICAgICAgICAgICAgIGRpc3F1YWxpZmllZFtjYW5kaWRhdGVdID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIHdpbm5lcnNbbmV4dFdpbm5lcl0gPSB0cnVlXG5cbiAgICAgICAgd2hpbGUoT2JqZWN0LmtleXMod2lubmVycykubGVuZ3RoIDwgbWF4V2lubmVycyAmJiBPYmplY3Qua2V5cyh3aW5uZXJzKS5sZW5ndGgrT2JqZWN0LmtleXMoZGlzcXVhbGlmaWVkKS5sZW5ndGggPCBjYW5kaWRhdGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIG5leHRXaW5uZXJDb3VudGVkVm90ZXMgPSBjb3VudFZvdGVzKGNhbmRpZGF0ZXMsIHZvdGVzLCB3aW5uZXJzLCBkaXNxdWFsaWZpZWQsIGNvdW50VHlwZSlcblxuICAgICAgICAgICAgdmFyIG5leHRXaW5uZXIgPSBmaW5kTmV4dFdpbm5lcihuZXh0V2lubmVyQ291bnRlZFZvdGVzKVxuICAgICAgICAgICAgd2lubmVyc1tuZXh0V2lubmVyXSA9IHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHdpbm5lcldlaWdodFR5cGUgPT09ICdoaWdoZXN0Jykge1xuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBbXVxuICAgICAgICAgICAgdmFyIHJlc3VsdHNNYXAgPSB7fSAvL21hcHMgYSB3aW5uZXIgdG8gYSByZXN1bHQgaW5kZXhcbiAgICAgICAgICAgIGZvcih2YXIgd2lubmVyIGluIHdpbm5lcnMpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzTWFwW3dpbm5lcl0gPSByZXN1bHRzLmxlbmd0aFxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7aW5kZXg6d2lubmVyLCB3ZWlnaHQ6MH0pXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZvdGVzLmZvckVhY2goZnVuY3Rpb24odm90ZSkge1xuICAgICAgICAgICAgICAgIHZhciBoaWdoZXN0V2lubmVycyA9IHt9LCBoaWdoZXN0V2lubmVyU2NvcmUgPSAtSW5maW5pdHlcbiAgICAgICAgICAgICAgICB2b3RlLmZvckVhY2goZnVuY3Rpb24oc2NvcmUsIGNhbmRpZGF0ZUluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKGNhbmRpZGF0ZUluZGV4IGluIHdpbm5lcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNjb3JlID4gaGlnaGVzdFdpbm5lclNjb3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGVzdFdpbm5lcnMgPSB7fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hlc3RXaW5uZXJzW2NhbmRpZGF0ZUluZGV4XSA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWdoZXN0V2lubmVyU2NvcmUgPSBzY29yZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKHNjb3JlID09PSBoaWdoZXN0V2lubmVyU2NvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWdoZXN0V2lubmVyc1tjYW5kaWRhdGVJbmRleF0gPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgdmFyIG51bWJlck9mSGlnaGVzdFdpbm5lcnMgPSBPYmplY3Qua2V5cyhoaWdoZXN0V2lubmVycykubGVuZ3RoXG4gICAgICAgICAgICAgICAgZm9yKHZhciB3aW5uZXIgaW4gaGlnaGVzdFdpbm5lcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1tyZXN1bHRzTWFwW3dpbm5lcl1dLndlaWdodCArPSAxL251bWJlck9mSGlnaGVzdFdpbm5lcnNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2UgaWYod2lubmVyV2VpZ2h0VHlwZSA9PT0gJ3NwbGl0Jykge1xuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBbXVxuICAgICAgICAgICAgZm9yKHZhciB3aW5uZXIgaW4gd2lubmVycykge1xuICAgICAgICAgICAgICAgIHZhciBhdmdTY29yZSA9IGNvdW50ZWRWb3Rlc1t3aW5uZXJdLnRvdGFsU2NvcmUvY291bnRlZFZvdGVzW3dpbm5lcl0udG90YWxOdW1iZXJcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goe2luZGV4Ondpbm5lciwgd2VpZ2h0OmF2Z1Njb3JlfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmKHdpbm5lcldlaWdodFR5cGUgPT09ICdlcXVhbCcpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHRzID0gW11cbiAgICAgICAgICAgIGZvcih2YXIgd2lubmVyIGluIHdpbm5lcnMpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goe2luZGV4Ondpbm5lciwgd2VpZ2h0OjF9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdHNcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRBdmdTY29yZShjYW5kaWRhdGVJbmZvKSB7XG4gICAgICAgIHJldHVybiBjYW5kaWRhdGVJbmZvLnRvdGFsU2NvcmUvY2FuZGlkYXRlSW5mby50b3RhbE51bWJlclxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbmROZXh0V2lubmVyKGNvdW50ZWRWb3Rlcykge1xuICAgICAgICB2YXIgbmV4dFdpbm5lciwgY3VyV2lubmVyU2NvcmUgPSAtSW5maW5pdHlcbiAgICAgICAgY291bnRlZFZvdGVzLmZvckVhY2goZnVuY3Rpb24oaW5mbywgY2FuZGlkYXRlKSB7XG4gICAgICAgICAgICBpZihpbmZvLnRvdGFsU2NvcmUgPiBjdXJXaW5uZXJTY29yZSkge1xuICAgICAgICAgICAgICAgIG5leHRXaW5uZXIgPSBjYW5kaWRhdGVcbiAgICAgICAgICAgICAgICBjdXJXaW5uZXJTY29yZSA9IGluZm8udG90YWxTY29yZVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiBuZXh0V2lubmVyXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY291bnRWb3RlcyhjYW5kaWRhdGVzLCB2b3Rlcywgd2lubmVycywgZGlzcXVhbGlmaWVkLCBjb3VudFR5cGUpIHtcbiAgICAgICAgaWYod2lubmVycyA9PT0gdW5kZWZpbmVkKSB3aW5uZXJzID0ge31cbiAgICAgICAgdmFyIGNvdW50ZWRWb3RlcyA9IGNhbmRpZGF0ZXMubWFwKGZ1bmN0aW9uKHAsYyl7XG4gICAgICAgICAgICBpZighKGMgaW4gd2lubmVycykgJiYgIShjIGluIGRpc3F1YWxpZmllZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge3RvdGFsU2NvcmU6MCwgdG90YWxOdW1iZXI6MH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHt0b3RhbFNjb3JlOi1JbmZpbml0eSwgdG90YWxOdW1iZXI6MH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgdm90ZXMuZm9yRWFjaChmdW5jdGlvbih2b3RlKSB7XG4gICAgICAgICAgICBpZihjb3VudFR5cGUgPT09ICdtYXhNaW5vcml0eScpIHtcbiAgICAgICAgICAgICAgICB2YXIgaGlnaGVzdENhbmRpZGF0ZXMgPSB7fSwgaGlnaGVzdFNjb3JlID0gLUluZmluaXR5XG4gICAgICAgICAgICAgICAgdm90ZS5mb3JFYWNoKGZ1bmN0aW9uKHNjb3JlLCBjYW5kaWRhdGVJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBpZihzY29yZSA+IGhpZ2hlc3RTY29yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGVzdENhbmRpZGF0ZXMgPSB7fVxuICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGVzdENhbmRpZGF0ZXNbY2FuZGlkYXRlSW5kZXhdID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGVzdFNjb3JlID0gc2NvcmVcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKHNjb3JlID09PSBoaWdoZXN0U2NvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hlc3RDYW5kaWRhdGVzW2NhbmRpZGF0ZUluZGV4XSA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICBmb3IodmFyIGMgaW4gaGlnaGVzdENhbmRpZGF0ZXMpIHsgIC8vIG9ubHkgY291bnQgdm90ZXMgZm9yIHBlb3BsZSB3aG8ncyBoaWdoZXN0IGNob2ljZSBpc24ndCBhIHdpbm5lclxuICAgICAgICAgICAgICAgICAgICBpZihjIGluIHdpbm5lcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjsgLy8gY29udGludWVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZihjb3VudFR5cGUgPT09ICdyZXdlaWdodGVkJykge1xuICAgICAgICAgICAgICAgIHZhciBzdW1TY29yZUZvcldpbm5lcnMgPSAwXG4gICAgICAgICAgICAgICAgdm90ZS5mb3JFYWNoKGZ1bmN0aW9uKHNjb3JlLCBjYW5kaWRhdGVJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBpZihjYW5kaWRhdGVJbmRleCBpbiB3aW5uZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdW1TY29yZUZvcldpbm5lcnMgKz0gc2NvcmVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICB2YXIgd2VpZ2h0ID0gMS8oMStzdW1TY29yZUZvcldpbm5lcnMvMilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdm90ZS5mb3JFYWNoKGZ1bmN0aW9uKHNjb3JlLCBjYW5kaWRhdGVJbmRleCkge1xuICAgICAgICAgICAgICAgIGlmKCEoY2FuZGlkYXRlSW5kZXggaW4gZGlzcXVhbGlmaWVkKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaGFzbnRDaG9zZW5BV2lubmVyID0gIShjYW5kaWRhdGVJbmRleCBpbiB3aW5uZXJzKVxuICAgICAgICAgICAgICAgICAgICBpZihjb3VudFR5cGUgPT09ICdyZXdlaWdodGVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRlZFZvdGVzW2NhbmRpZGF0ZUluZGV4XS50b3RhbFNjb3JlICs9IHNjb3JlKndlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRlZFZvdGVzW2NhbmRpZGF0ZUluZGV4XS50b3RhbE51bWJlciArK1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoY291bnRUeXBlICE9PSAnbWF4TWlub3JpdHknIHx8IGhhc250Q2hvc2VuQVdpbm5lcikgeyAgLy8gb25seSBjb3VudCB2b3RlcyBmb3IgbmV3IHBvdGVudGlhbCB3aW5uZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudGVkVm90ZXNbY2FuZGlkYXRlSW5kZXhdLnRvdGFsU2NvcmUgKz0gc2NvcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVJbmRleF0udG90YWxOdW1iZXIgKytcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICAgIHJldHVybiBjb3VudGVkVm90ZXNcbiAgICB9XG59XG5cbi8vIHRocmVzaG9sZCAtIGEgbnVtYmVyIGJldHdlZW4gMCBhbmQgMSBpbmNsdXNpdmVcbmZ1bmN0aW9uIGZyYWN0aW9uYWxSZXByZXNlbnRhdGl2ZVJhbmtlZFZvdGUodGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHZvdGVzLCBjYW5kaWRhdGVzLCBtYXhXaW5uZXJzKSB7XG4gICAgICAgIHZhciBtaW5pbXVtV2lubmluZ1ZvdGVzID0gdm90ZXMubGVuZ3RoKnRocmVzaG9sZFxuICAgICAgICB2YXIgb3JpZ2luYWxWb3RlcyA9IHZvdGVzXG5cbiAgICAgICAgdmFyIGN1cnJlbnRXaW5uZXJzID0ge30sIGNvdW50ZWRWb3RlcyA9IGNhbmRpZGF0ZXMubWFwKGZ1bmN0aW9uKCl7cmV0dXJuIDB9KVxuICAgICAgICB2b3Rlcy5mb3JFYWNoKGZ1bmN0aW9uKHZvdGUpIHtcbiAgICAgICAgICAgIHZhciBjYW5kaWRhdGVJbmRleCA9IHZvdGVbMF1cbiAgICAgICAgICAgIGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVJbmRleF0gKytcbiAgICAgICAgfSlcblxuICAgICAgICAvLyBzZWxlY3QgaW5pdGlhbCB3aW5uZXJzXG4gICAgICAgIGZvcih2YXIgY2FuZGlkYXRlSW5kZXggaW4gY291bnRlZFZvdGVzKSB7XG4gICAgICAgICAgICB2YXIgdm90ZXNGb3JUaGlzQ2FuZGlkYXRlID0gY291bnRlZFZvdGVzW2NhbmRpZGF0ZUluZGV4XVxuICAgICAgICAgICAgaWYodm90ZXNGb3JUaGlzQ2FuZGlkYXRlID49IG1pbmltdW1XaW5uaW5nVm90ZXMpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50V2lubmVyc1tjYW5kaWRhdGVJbmRleF0gPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZW1vdmUgdm90ZXMgb2YgdGhvc2Ugd2hvIGhhdmUgY2hvc2VuIGEgd2lubmVyXG4gICAgICAgIHZvdGVzID0gdm90ZXMuZmlsdGVyKGZ1bmN0aW9uKHZvdGUpIHtcbiAgICAgICAgICAgIHJldHVybiAhKHZvdGVbMF0gaW4gY3VycmVudFdpbm5lcnMpXG4gICAgICAgIH0pXG5cbiAgICAgICAgLy8gaXRlcmF0ZSB0aHJvdWdoIHByZWZlcmVuY2VzIHRvIGZpbmQgbW9yZSB3aW5uZXJzXG4gICAgICAgIGZvcih2YXIgY3VycmVudFByZWZlcmVuY2VJbmRleCA9IDE7IGN1cnJlbnRQcmVmZXJlbmNlSW5kZXg8Y2FuZGlkYXRlcy5sZW5ndGg7IGN1cnJlbnRQcmVmZXJlbmNlSW5kZXgrKykge1xuICAgICAgICAgICAgdm90ZXMuZm9yRWFjaChmdW5jdGlvbih2b3RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNhbmRpZGF0ZUluZGV4ID0gdm90ZVtjdXJyZW50UHJlZmVyZW5jZUluZGV4XVxuICAgICAgICAgICAgICAgIGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVJbmRleF0gKytcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIC8vIGlmIHRoZXJlIGFyZSBhbnkgd2lubmVycyBjb21iaW5pbmcgcHJlZmVyZW5jZXMgMCB0aHJvdWdoIG4sIGNob29zZSBiZXN0IHdpbm5lciB3aG8gaXNuJ3QgYWxyZWFkeSBhIHdpbm5lclxuICAgICAgICAgICAgdmFyIGxlYWRpbmdOb25XaW5uZXIsIGxlYWRpbmdOb25XaW5uZXJWb3RlcyA9IDBcbiAgICAgICAgICAgIGZvcih2YXIgY2FuZGlkYXRlSW5kZXggaW4gY291bnRlZFZvdGVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZvdGVzRm9yVGhpc0NhbmRpZGF0ZSA9IGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVJbmRleF1cbiAgICAgICAgICAgICAgICBpZih2b3Rlc0ZvclRoaXNDYW5kaWRhdGUgPj0gbWluaW11bVdpbm5pbmdWb3Rlcykge1xuICAgICAgICAgICAgICAgICAgICBpZighKGNhbmRpZGF0ZUluZGV4IGluIGN1cnJlbnRXaW5uZXJzKSAmJiB2b3Rlc0ZvclRoaXNDYW5kaWRhdGUgPiBsZWFkaW5nTm9uV2lubmVyVm90ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlYWRpbmdOb25XaW5uZXIgPSBjYW5kaWRhdGVJbmRleFxuICAgICAgICAgICAgICAgICAgICAgICAgbGVhZGluZ05vbldpbm5lclZvdGVzID0gdm90ZXNGb3JUaGlzQ2FuZGlkYXRlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKGxlYWRpbmdOb25XaW5uZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRXaW5uZXJzW2xlYWRpbmdOb25XaW5uZXJdID0gdHJ1ZVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyByZWRhY3Qgdm90ZXMgYnkgdm90ZXJzIHdobyBoYXZlIGNob3NlbiBhIHdpbm5lciBmcm9tIG5vbi13aW5uZXJzIHRoZXkgcHJldmlvdXNseSBjaG9zZVxuICAgICAgICAgICAgdm90ZXMuZm9yRWFjaChmdW5jdGlvbih2b3RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN1ckNhbmRpZGF0ZUluZGV4ID0gdm90ZVtjdXJyZW50UHJlZmVyZW5jZUluZGV4XVxuICAgICAgICAgICAgICAgIGlmKGN1ckNhbmRpZGF0ZUluZGV4IGluIGN1cnJlbnRXaW5uZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcih2YXIgbj0wOyBuPGN1cnJlbnRQcmVmZXJlbmNlSW5kZXg7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNhbmRpZGF0ZVByZWZlcmVuY2VJbmRleCA9IHZvdGVbbl1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVQcmVmZXJlbmNlSW5kZXhdIC0tXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAvLyByZW1vdmUgdm90ZXMgb2YgdGhvc2Ugd2hvIGhhdmUganVzdCBjaG9zZW4gYSB3aW5uZXJcbiAgICAgICAgICAgIHZvdGVzID0gdm90ZXMuZmlsdGVyKGZ1bmN0aW9uKHZvdGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gISh2b3RlW2N1cnJlbnRQcmVmZXJlbmNlSW5kZXhdIGluIGN1cnJlbnRXaW5uZXJzKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRoaXMgbmVlZHMgdG8gaGFwcGVuIGJlY2F1c2UgaXRzIHBvc3NpYmxlIGZvciBhIHZvdGUgdG8gYmUgY291bnRlZCBmb3IgYW4gZWFybGllciB3aW5uZXIsXG4gICAgICAgIC8vIHdoZW4gdGhlIHZvdGUncyBwcmVmZXJlbmNlIGlzIGZvciBhIHdpbm5lciB0aGF0IHdhcyBjaG9zZW4gaW4gYSBsYXRlciByb3VuZFxuICAgICAgICB2YXIgd2lubmVyc1JlY291bnQgPSBjYW5kaWRhdGVzLm1hcChmdW5jdGlvbigpe3JldHVybiAwfSlcbiAgICAgICAgb3JpZ2luYWxWb3Rlcy5mb3JFYWNoKGZ1bmN0aW9uKHZvdGUpIHtcbiAgICAgICAgICAgIGZvcih2YXIgbj0wO248dm90ZS5sZW5ndGg7bisrKSB7XG4gICAgICAgICAgICAgICAgaWYodm90ZVtuXSBpbiBjdXJyZW50V2lubmVycykge1xuICAgICAgICAgICAgICAgICAgICB3aW5uZXJzUmVjb3VudFt2b3RlW25dXSArK1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgdmFyIGZpbmFsV2lubmVycyA9IFtdXG4gICAgICAgIGZvcih2YXIgY2FuZGlkYXRlSW5kZXggaW4gY3VycmVudFdpbm5lcnMpIHtcbiAgICAgICAgICAgIHZhciB2b3Rlc0ZvclRoaXNDYW5kaWRhdGUgPSB3aW5uZXJzUmVjb3VudFtjYW5kaWRhdGVJbmRleF1cbiAgICAgICAgICAgIGZpbmFsV2lubmVycy5wdXNoKHtpbmRleDogY2FuZGlkYXRlSW5kZXgsIHdlaWdodDp2b3Rlc0ZvclRoaXNDYW5kaWRhdGUvb3JpZ2luYWxWb3Rlcy5sZW5ndGh9KVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpbmFsV2lubmVycy5zbGljZSgwLCBtYXhXaW5uZXJzKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gc2luZ2xlVHJhbnNmZXJyYWJsZVZvdGUodm90ZXMsIGNhbmRpZGF0ZXMsIG1heFdpbm5lcnMpIHtcblxuICAgIHZhciBzZWF0cyA9IG1heFdpbm5lcnNcbiAgICB2YXIgdm90ZVF1b3RhID0gMSt2b3Rlcy5sZW5ndGgvKHNlYXRzKzEpXG5cbiAgICB2YXIgbmV3Vm90ZXNNYXAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHZvdGVzTGlzdCA9IHt9XG4gICAgICAgIGNhbmRpZGF0ZXMuZm9yRWFjaChmdW5jdGlvbihjYW5kaWRhdGUsIGluZGV4KXtcbiAgICAgICAgICAgIHZvdGVzTGlzdFtpbmRleF0gPSB7Y3VycmVudFZvdGVzOiBbXSwgY3VycmVudENvdW50OjB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIHZvdGVzTGlzdFxuICAgIH1cblxuICAgIHZhciBjb3VudGVkVm90ZXMgPSBuZXdWb3Rlc01hcCgpLCBjdXJyZW50V2lubmVycyA9IHt9LCBlbGltaW5hdGVkQ2FuZGlkYXRlcyA9IHt9XG4gICAgdm90ZXMuZm9yRWFjaChmdW5jdGlvbih2b3RlKSB7XG4gICAgICAgIHZhciBjYW5kaWRhdGUgPSBjb3VudGVkVm90ZXNbdm90ZVswXV1cbiAgICAgICAgY2FuZGlkYXRlLmN1cnJlbnRWb3Rlcy5wdXNoKHt2b3RlOnZvdGUsIHdlaWdodDoxLCBjdXJyZW50UHJlZmVyZW5jZUluZGV4OjB9KVxuICAgICAgICBjYW5kaWRhdGUuY3VycmVudENvdW50ICsrXG4gICAgfSlcblxuICAgIHZhciB0cmFuc2ZlclZvdGVzID0gZnVuY3Rpb24odHJhbnNmZXJPcmlnaW4sIHRyYW5zZmVyRGVzdGluYXRpb24sIHJhdGlvVG9UcmFuc2Zlcikge1xuICAgICAgICB0cmFuc2Zlck9yaWdpbi5jdXJyZW50Vm90ZXMuZm9yRWFjaChmdW5jdGlvbih2b3RlSW5mbykge1xuICAgICAgICAgICAgdmFyIG5ld0NhbmRpZGF0ZVByZWZlcmVuY2UgPSB2b3RlSW5mby5jdXJyZW50UHJlZmVyZW5jZUluZGV4ICsxXG4gICAgICAgICAgICB3aGlsZSh0cnVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRDYW5kaWRhdGVQcmVmZXJlbmNlID0gdm90ZUluZm8udm90ZVtuZXdDYW5kaWRhdGVQcmVmZXJlbmNlXVxuICAgICAgICAgICAgICAgIGlmKG5leHRDYW5kaWRhdGVQcmVmZXJlbmNlIGluIGVsaW1pbmF0ZWRDYW5kaWRhdGVzIHx8IG5leHRDYW5kaWRhdGVQcmVmZXJlbmNlIGluIGN1cnJlbnRXaW5uZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld0NhbmRpZGF0ZVByZWZlcmVuY2UgKytcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGNhbmRpZGF0ZUluZGV4ID0gdm90ZUluZm8udm90ZVtuZXdDYW5kaWRhdGVQcmVmZXJlbmNlXVxuICAgICAgICAgICAgaWYoY2FuZGlkYXRlSW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRyYW5zZmVyRGVzdGluYXRpb25bY2FuZGlkYXRlSW5kZXhdLmN1cnJlbnRWb3Rlcy5wdXNoKHsgICAgICAgIC8vIHRyYW5zZmVyIHRoZSBleGNlc3NcbiAgICAgICAgICAgICAgICAgICAgdm90ZTp2b3RlSW5mby52b3RlLFxuICAgICAgICAgICAgICAgICAgICB3ZWlnaHQ6dm90ZUluZm8ud2VpZ2h0KnJhdGlvVG9UcmFuc2ZlcixcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFByZWZlcmVuY2VJbmRleDpuZXdDYW5kaWRhdGVQcmVmZXJlbmNlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB0cmFuc2ZlckRlc3RpbmF0aW9uW2NhbmRpZGF0ZUluZGV4XS5jdXJyZW50Q291bnQgKz0gdm90ZUluZm8ud2VpZ2h0KnJhdGlvVG9UcmFuc2ZlclxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL3RyYW5zZmVyT3JpZ2luLmN1cnJlbnRDb3VudCAtPSB2b3RlSW5mby53ZWlnaHQqcmF0aW9Ub1RyYW5zZmVyIC8vIGp1c3QgZm9yIHRlc3RpbmcgLy8gdG9kbzogY29tbWVudCB0aGlzIG91dFxuICAgICAgICAgICAgdm90ZUluZm8ud2VpZ2h0ICo9ICgxLXJhdGlvVG9UcmFuc2ZlcikgLy8ga2VlcCB0aGUgcmVtYWluZGVyXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgd2hpbGUodHJ1ZSkge1xuICAgICAgICB2YXIgdm90ZXNJblRyYW5mZXIgPSBuZXdWb3Rlc01hcCgpXG4gICAgICAgIHdoaWxlKHRydWUpIHtcbiAgICAgICAgICAgIHZhciBleGNlc3NGb3VuZCA9IGZhbHNlXG4gICAgICAgICAgICBmb3IodmFyIGNhbmRpZGF0ZUluZGV4IGluIGNvdW50ZWRWb3Rlcykge1xuICAgICAgICAgICAgICAgIHZhciB2b3RlcyA9IGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVJbmRleF0uY3VycmVudENvdW50XG4gICAgICAgICAgICAgICAgaWYodm90ZXMgPj0gdm90ZVF1b3RhIC0gLjAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRXaW5uZXJzW2NhbmRpZGF0ZUluZGV4XSA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgaWYodm90ZXMgPiB2b3RlUXVvdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4Y2Vzc0ZvdW5kID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4Y2Vzc1ZvdGVzID0gdm90ZXMgLSB2b3RlUXVvdGFcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBleGNlc3NSYXRpbyA9IGV4Y2Vzc1ZvdGVzL3ZvdGVzXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZmVyVm90ZXMoY291bnRlZFZvdGVzW2NhbmRpZGF0ZUluZGV4XSwgdm90ZXNJblRyYW5mZXIsIGV4Y2Vzc1JhdGlvKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXaGVuIHRlc3RpbmcsIGVuc3VyZSB0aGF0IGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVJbmRleF0uY3VycmVudENvdW50IGFscmVhZHkgaXMgZXF1YWwgdG8gdm90ZVF1b3RhIHdoZW4gdGVzdGluZyBsaW5lIEEgaXMgdW5jb21tZW50ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVJbmRleF0uY3VycmVudENvdW50ID0gdm90ZVF1b3RhXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKCFleGNlc3NGb3VuZCkge1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvcih2YXIgY2FuZGlkYXRlSW5kZXggaW4gdm90ZXNJblRyYW5mZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld1ZvdGVzID0gdm90ZXNJblRyYW5mZXJbY2FuZGlkYXRlSW5kZXhdXG4gICAgICAgICAgICAgICAgICAgIG5ld1ZvdGVzLmN1cnJlbnRWb3Rlcy5mb3JFYWNoKGZ1bmN0aW9uKHZvdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVJbmRleF0uY3VycmVudFZvdGVzLnB1c2godm90ZSlcbiAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICBpZihuZXdWb3Rlcy5jdXJyZW50Q291bnQgPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRlZFZvdGVzW2NhbmRpZGF0ZUluZGV4XS5jdXJyZW50Q291bnQgKz0gbmV3Vm90ZXMuY3VycmVudENvdW50XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdm90ZXNJblRyYW5mZXIgPSBuZXdWb3Rlc01hcCgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZihPYmplY3Qua2V5cyhjdXJyZW50V2lubmVycykubGVuZ3RoIDwgc2VhdHMpIHtcbiAgICAgICAgICAgIC8vIGZpbmQgY2FuZGlkYXRlIHdpdGggbGVhc3Qgdm90ZXNcbiAgICAgICAgICAgIHZhciBjYW5kaWRhdGVXaXRoTGVhc3RDb3VudD11bmRlZmluZWQsIGxvd2VzdENvdW50PXVuZGVmaW5lZFxuICAgICAgICAgICAgZm9yKHZhciBjYW5kaWRhdGVJbmRleCBpbiBjb3VudGVkVm90ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2FuZGlkYXRlID0gY291bnRlZFZvdGVzW2NhbmRpZGF0ZUluZGV4XVxuICAgICAgICAgICAgICAgIGlmKGxvd2VzdENvdW50ID09PSB1bmRlZmluZWQgfHwgY2FuZGlkYXRlLmN1cnJlbnRDb3VudCA8IGxvd2VzdENvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGxvd2VzdENvdW50ID0gY2FuZGlkYXRlLmN1cnJlbnRDb3VudFxuICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGVXaXRoTGVhc3RDb3VudCA9IGNhbmRpZGF0ZUluZGV4XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbGltaW5hdGVkQ2FuZGlkYXRlc1tjYW5kaWRhdGVXaXRoTGVhc3RDb3VudF0gPSB0cnVlXG5cbiAgICAgICAgICAgIC8vIHRyYW5zZmVyIHZvdGVzIGZyb20gdGhhdCBjYW5kaWRhdGVcbiAgICAgICAgICAgIHRyYW5zZmVyVm90ZXMoY291bnRlZFZvdGVzW2NhbmRpZGF0ZVdpdGhMZWFzdENvdW50XSwgY291bnRlZFZvdGVzLCAxKVxuXG4gICAgICAgICAgICBpZihPYmplY3Qua2V5cyhjb3VudGVkVm90ZXMpLmxlbmd0aCA9PT0gMSkgeyAvLyBpZiB0aGVyZSdzIG9ubHkgb25lIGNhbmRpZGF0ZSBsZWZ0LCBtYWtlIHRoZW0gYSB3aW5uZXIgZXZlbiB0aG8gdGhleSBkaWRuJ3QgcmVhY2ggdGhlIHF1b3RhXG4gICAgICAgICAgICAgICAgY3VycmVudFdpbm5lcnNbY2FuZGlkYXRlV2l0aExlYXN0Q291bnRdID0gdHJ1ZVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGVsaW1pbmF0ZSB0aGUgY2FuZGlkYXRlXG4gICAgICAgICAgICAgICAgZGVsZXRlIGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVXaXRoTGVhc3RDb3VudF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZmluYWxXaW5uZXJzID0gW11cbiAgICBmb3IodmFyIGNhbmRpZGF0ZUluZGV4IGluIGN1cnJlbnRXaW5uZXJzKSB7XG4gICAgICAgIGZpbmFsV2lubmVycy5wdXNoKHtpbmRleDogY2FuZGlkYXRlSW5kZXgsIHdlaWdodDoxfSlcbiAgICB9XG5cbiAgICByZXR1cm4gZmluYWxXaW5uZXJzXG59XG5cbi8vIEhvbmVzdGx5IHRoaXMgd2lsbCBvbmx5IHJldHVybiBtYXhXaW5uZXJzID0gMSBubyBtYXR0ZXIgd2hhdCByaWdodCBub3dcbmZ1bmN0aW9uIHBvd2VySW5zdGFudFJ1bm9mZih2b3RlcywgY2FuZGlkYXRlcywgbWF4V2lubmVycykge1xuXG4gICAgdmFyIHRvcFdpbm5lcnMgPSBzaW5nbGVUcmFuc2ZlcnJhYmxlVm90ZSh2b3RlcywgY2FuZGlkYXRlcywgTWF0aC5tYXgoNCwgbWF4V2lubmVycyArIDEpKTtcblxuICAgIGlmIChtYXhXaW5uZXJzID09IHRvcFdpbm5lcnMubGVuZ3RoKSByZXR1cm4gdG9wV2lubmVycztcblxuICAgIC8vIEZpbmQgQ29uZG9yY2V0IC8gd2VpZ2h0ZWQgd2lubmVyXG5cbiAgICAvLyBtYXAgb2YgcmVzdWx0IGNvdW50cyBmb3IgY2FuZGlkYXRlIHZzIGVhY2ggb2YgdGhlIG90aGVyc1xuICAgIHZhciBuZXdWb3Rlc01hcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdm90ZXNMaXN0ID0ge1xuICAgICAgICAgICAgW3RvcFdpbm5lcnNbMF0uaW5kZXhdOiB7W3RvcFdpbm5lcnNbMV0uaW5kZXhdOiAwLFt0b3BXaW5uZXJzWzJdLmluZGV4XTogMCB9LFxuICAgICAgICAgICAgW3RvcFdpbm5lcnNbMV0uaW5kZXhdOiB7W3RvcFdpbm5lcnNbMF0uaW5kZXhdOiAwLFt0b3BXaW5uZXJzWzJdLmluZGV4XTogMCB9LFxuICAgICAgICAgICAgW3RvcFdpbm5lcnNbMl0uaW5kZXhdOiB7W3RvcFdpbm5lcnNbMF0uaW5kZXhdOiAwLFt0b3BXaW5uZXJzWzFdLmluZGV4XTogMCB9LFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2b3Rlc0xpc3RcbiAgICB9XG5cbiAgICB2YXIgY291bnRlZFZvdGVzID0gbmV3Vm90ZXNNYXAoKSwgY3VycmVudFdpbm5lciA9IG51bGwsIHRvcENvdW50ID0gMDtcblxuICAgIGZvciAodmFyIGk9MDsgaTx0b3BXaW5uZXJzLmxlbmd0aCwgaSsrOykge1xuICAgICAgICB2YXIgaUluZGV4ID0gdG9wV2lubmVyc1tpXS5pbmRleDtcbiAgICAgICAgZm9yICh2YXIgaj0wOyBqPHRvcFdpbm5lcnMubGVuZ3RoLCBqKys7KSB7XG4gICAgICAgICAgICBpZiAoaSA9PSBqKSBjb250aW51ZTtcbiAgICAgICAgICAgIHZhciBqSW5kZXggPSB0b3BXaW5uZXJzW2pdLmluZGV4O1xuXG4gICAgICAgICAgICB2b3Rlcy5mb3JFYWNoKGZ1bmN0aW9uKHZvdGUpIHtcbiAgICAgICAgICAgICAgICAvLyBTZWUgd2hvIGlzIGVhcmxpZXIgaW4gdGhlIHZvdGUgc2VxdWVuY2VcbiAgICAgICAgICAgICAgICAvLyBEbyB3ZSB3YW50IHRvIHRlc3QgZm9yIC0xP1xuICAgICAgICAgICAgICAgIGlmICh2b3RlLmluZGV4T2YoaUluZGV4KSA8IHZvdGUuaW5kZXhPZihqSW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHZvdGVyIHJhbmtlZCBjYW5kaWRhdGUgaSBhaGVhZCBvZiBqXG4gICAgICAgICAgICAgICAgICAgIGlmKCsrY291bnRlZFZvdGVzW2lJbmRleF1bakluZGV4XSA+PSB0b3BDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICB0b3BDb3VudCA9IGNvdW50ZWRWb3Rlc1tpSW5kZXhdW2pJbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50V2lubmVyID0gaUluZGV4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdm90ZXIgcmFua2VkIGNhbmRpZGF0ZSBqIGFoZWFkIG9mIGlcbiAgICAgICAgICAgICAgICAgICAgaWYoKytjb3VudGVkVm90ZXNbakluZGV4XVtpSW5kZXhdID49IHRvcENvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b3BDb3VudCA9IGNvdW50ZWRWb3Rlc1tqSW5kZXhdW2lJbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50V2lubmVyID0gakluZGV4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIHJldHVybnMgdGhlIHdpbm5lciBpbmRleCBpZiB0aGVyZSBpcyBhIENvbmRvcmNldCB3aW5uZXIsIGVsc2UgbnVsbFxuICAgIGZ1bmN0aW9uIGZpbmRDb25kb3JjZXRXaW5uZXIodm90ZU1hcCkge1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHZvdGVNYXApO1xuXG4gICAgICAgIHZhciBjV2lubmVyID0gbnVsbDtcbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2b3RlTWFwKTtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPDM7IGkrKykge1xuICAgICAgICAgICAgaWYgKHZvdGVNYXBba2V5c1swXV1ba2V5c1sxXV0gPiB2b3RlTWFwW2tleXNbMV1dW2tleXNbMF1dICYmXG4gICAgICAgICAgICAgICAgdm90ZU1hcFtrZXlzWzBdXVtrZXlzWzJdXSA+IHZvdGVNYXBba2V5c1syXV1ba2V5c1swXV0pIHtcbiAgICAgICAgICAgICAgICBjV2lubmVyID0gW2tleV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrZXlzLnB1c2goa2V5cy5zaGlmdCgpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY1dpbm5lcjtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhjb3VudGVkVm90ZXMpO1xuXG4gICAgLy8gQ2hlY2sgZm9yIENvbmRvcmNldCB3aW5uZXJcbiAgICB2YXIgZmluYWxXaW5uZXIgPSBmaW5kQ29uZG9yY2V0V2lubmVyKGNvdW50ZWRWb3Rlcyk7XG5cbiAgICBjb25zb2xlLmxvZyhmaW5hbFdpbm5lcik7XG5cbiAgICAvLyBJZiBubyB3aW5uZXIgdXNlIHRoZSBoaWdoZXN0IGNvdW50KHMpXG4gICAgaWYgKCFmaW5hbFdpbm5lcikge1xuICAgICAgICBmaW5hbFdpbm5lciA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IFtpbmRleCwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKGNvdW50ZWRWb3RlcykpIHtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LnZhbHVlcyh2YWx1ZSkuaW5kZXhPZih0b3BDb3VudCkgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICBmaW5hbFdpbm5lci5wdXNoKGluZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgcmV0ID0gdG9wV2lubmVycy5maWx0ZXIoeCA9PiB7IHJldHVybiBmaW5hbFdpbm5lci5pbmRleE9mKHguaW5kZXgpID49IDAgfSk7XG5cbiAgICBjb25zb2xlLmxvZyhyZXQpO1xuXG4gICAgcmV0dXJuIHJldDtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICByYW5kb206IHtcbiAgICAgICAgJyc6ZnVuY3Rpb24odm90ZXMsIGNhbmRpZGF0ZXMsIG1heFdpbm5lcnMpIHtcbiAgICAgICAgICAgIGlmKGNhbmRpZGF0ZXMubGVuZ3RoIDwgbWF4V2lubmVycykgbWF4V2lubmVycyA9IGNhbmRpZGF0ZXMubGVuZ3RoXG5cbiAgICAgICAgICAgIHZhciB3aW5uZXJzID0gW11cbiAgICAgICAgICAgIGZvcih2YXIgbj0wOyBuPG1heFdpbm5lcnM7KSB7XG4gICAgICAgICAgICAgICAgdmFyIHdpbm5lciA9IE1hdGgucm91bmQocmFuZG9tKCkqKGNhbmRpZGF0ZXMubGVuZ3RoLTEpKVxuICAgICAgICAgICAgICAgIGlmKHdpbm5lcnMuaW5kZXhPZih3aW5uZXIpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICB3aW5uZXJzLnB1c2god2lubmVyKVxuICAgICAgICAgICAgICAgICAgICBuKytcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB3aW5uZXJzLm1hcChmdW5jdGlvbih3aW5uZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge2luZGV4OiB3aW5uZXIsIHdlaWdodDoxfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH0sXG4gICAgcmFuZG9tVm90ZXJzQ2hvaWNlOiB7XG4gICAgICAgICdzaW5nbGUgdm90ZXInOmZ1bmN0aW9uKHZvdGVzLCBjYW5kaWRhdGVzLCBtYXhXaW5uZXJzKSB7XG4gICAgICAgICAgICB2YXIgbHVja3lXaW5uZXJJbmRleCA9IE1hdGgucm91bmQocmFuZG9tKCkqKHZvdGVzLmxlbmd0aC0xKSlcbiAgICAgICAgICAgIHZhciBsdWNreVdpbm5lclZvdGUgPSB2b3Rlc1tsdWNreVdpbm5lckluZGV4XVxuXG4gICAgICAgICAgICByZXR1cm4gbHVja3lXaW5uZXJWb3RlLnNsaWNlKDAsbWF4V2lubmVycykubWFwKGZ1bmN0aW9uKHZvdGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge2luZGV4OiB2b3RlLCB3ZWlnaHQ6MX1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICAgICcxMCUgb2YgdGhlIHZvdGVycyc6IGZ1bmN0aW9uKHZvdGVzLCBjYW5kaWRhdGVzLCBtYXhXaW5uZXJzKSB7XG4gICAgICAgICAgICB2YXIgbHVja3lWb3RlcyA9IFtdXG4gICAgICAgICAgICB3aGlsZShsdWNreVZvdGVzLmxlbmd0aCA8IHZvdGVzLmxlbmd0aCouMSkge1xuICAgICAgICAgICAgICAgIHZhciBsdWNreVdpbm5lckluZGV4ID0gTWF0aC5yb3VuZChyYW5kb20oKSoodm90ZXMubGVuZ3RoLTEpKVxuICAgICAgICAgICAgICAgIGx1Y2t5Vm90ZXMucHVzaCh2b3Rlc1tsdWNreVdpbm5lckluZGV4XVswXSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHBsdXJhbGl0eUFsZyhsdWNreVZvdGVzLCBjYW5kaWRhdGVzLCBtYXhXaW5uZXJzKVxuICAgICAgICB9XG4gICAgfSxcbiAgICBwbHVyYWxpdHk6IHtcbiAgICAgICAgJyc6cGx1cmFsaXR5QWxnXG4gICAgfSxcbiAgICByYW5nZToge1xuICAgICAgICAnT25lIFdpbm5lcic6IGZ1bmN0aW9uKHZvdGVzLCBjYW5kaWRhdGVzKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0cyA9IFtdXG4gICAgICAgICAgICBmb3IodmFyIG49MDsgbjxjYW5kaWRhdGVzLmxlbmd0aDtuKyspIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzW25dID0gMFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2b3Rlcy5mb3JFYWNoKGZ1bmN0aW9uKHZvdGUpe1xuICAgICAgICAgICAgICAgIHZvdGUuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1tpbmRleF0gKz0gdmFsdWVcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgdmFyIHRyYW5zZm9ybWVkUmVzdWx0cyA9IHJlc3VsdHMubWFwKGZ1bmN0aW9uKHZhbHVlLGluZGV4KXtcbiAgICAgICAgICAgICAgICByZXR1cm4ge2NhbmRpZGF0ZTppbmRleCx2b3Rlczp2YWx1ZX1cbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIHRyYW5zZm9ybWVkUmVzdWx0cy5zb3J0KGZ1bmN0aW9uKGEsYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBiLnZvdGVzIC0gYS52b3RlcyAvLyByZXZlcnNlIHNvcnRcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIHZhciB3aW5uZXIgPSB0cmFuc2Zvcm1lZFJlc3VsdHNbMF0uY2FuZGlkYXRlXG4gICAgICAgICAgICByZXR1cm4gW3tpbmRleDogd2lubmVyLCB3ZWlnaHQ6MSwgcHJlZmVyZW5jZXM6Y2FuZGlkYXRlc1t3aW5uZXJdfV1cbiAgICAgICAgfSxcbiAgICAgICAgJ1RocmVlIFdpbm5lcnMnOiBmdW5jdGlvbih2b3RlcywgY2FuZGlkYXRlcykge1xuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBbXVxuICAgICAgICAgICAgZm9yKHZhciBuPTA7IG48Y2FuZGlkYXRlcy5sZW5ndGg7bisrKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0c1tuXSA9IDBcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdm90ZXMuZm9yRWFjaChmdW5jdGlvbih2b3RlKXtcbiAgICAgICAgICAgICAgICB2b3RlLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHNbaW5kZXhdICs9IHZhbHVlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIHZhciB0cmFuc2Zvcm1lZFJlc3VsdHMgPSByZXN1bHRzLm1hcChmdW5jdGlvbih2YWx1ZSxpbmRleCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtjYW5kaWRhdGU6aW5kZXgsdm90ZXM6dmFsdWV9XG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICB0cmFuc2Zvcm1lZFJlc3VsdHMuc29ydChmdW5jdGlvbihhLGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYi52b3RlcyAtIGEudm90ZXMgLy8gcmV2ZXJzZSBzb3J0IChtb3N0IHZvdGVzIGZvaXN0KVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgdmFyIHdpbm5lcnMgPSBbXSwgdG90YWxTY29yZSA9IDBcbiAgICAgICAgICAgIGZvcih2YXIgbj0wOyBuPDM7IG4rKykge1xuICAgICAgICAgICAgICAgIHZhciB3aW5uZXJJbmRleCA9IHRyYW5zZm9ybWVkUmVzdWx0c1tuXS5jYW5kaWRhdGVcbiAgICAgICAgICAgICAgICB2YXIgd2lubmVyID0gY2FuZGlkYXRlc1t3aW5uZXJJbmRleF1cbiAgICAgICAgICAgICAgICB3aW5uZXJzLnB1c2goe2luZGV4OiB3aW5uZXJJbmRleCwgcHJlZmVyZW5jZXM6d2lubmVyfSlcbiAgICAgICAgICAgICAgICB0b3RhbFNjb3JlKz0gdHJhbnNmb3JtZWRSZXN1bHRzW25dLnZvdGVzXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdpbm5lcnMuZm9yRWFjaChmdW5jdGlvbih3aW5uZXIsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgd2lubmVyLndlaWdodCA9IHRyYW5zZm9ybWVkUmVzdWx0c1tpbmRleF0udm90ZXMvdG90YWxTY29yZVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgcmV0dXJuIHdpbm5lcnNcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2luZ2xlVHJhbnNmZXJhYmxlVm90ZToge1xuICAgICAgICAnJzpzaW5nbGVUcmFuc2ZlcnJhYmxlVm90ZVxuICAgIH0sXG4gICAgcG93ZXJJbnN0YW50UnVub2ZmOiB7XG4gICAgICAgICcnOnBvd2VySW5zdGFudFJ1bm9mZlxuICAgIH0sXG4gICAgZGlyZWN0UmVwcmVzZW50YXRpdmVSYW5rZWQ6IHtcbiAgICAgICAgJzE1JSBUaHJlc2hvbGQnOiB7Jyc6ZnJhY3Rpb25hbFJlcHJlc2VudGF0aXZlUmFua2VkVm90ZSguMTUpfSxcbiAgICB9LFxuICAgIGRpcmVjdFJlcHJlc2VudGF0aXZlUmFuZ2VkOiB7XG4gICAgICAgICdzcGxpdC13ZWlnaHQsIDAlIHRocmVzaG9sZCc6IGRpcmVjdFJlcHJlc2VudGF0aW9uUmFuZ2UoJ25vcm1hbCcsICdzcGxpdCcsMCksXG4gICAgICAgICdoaWdoZXN0LXdlaWdodCwgMjAlIHRocmVzaG9sZCc6IGRpcmVjdFJlcHJlc2VudGF0aW9uUmFuZ2UoJ25vcm1hbCcsICdoaWdoZXN0JywgLjUpLFxuICAgICAgICAnc3BsaXQtd2VpZ2h0LCAyMCUgdGhyZXNob2xkJzogZGlyZWN0UmVwcmVzZW50YXRpb25SYW5nZSgnbm9ybWFsJywgJ3NwbGl0JywgLjkpLFxuICAgICAgICAnZXF1YWwtd2VpZ2h0LCAyMCUgdGhyZXNob2xkJzogZGlyZWN0UmVwcmVzZW50YXRpb25SYW5nZSgnbm9ybWFsJywgJ2VxdWFsJywgLjkpLFxuICAgICAgICAnaGlnaGVzdC13ZWlnaHQsIG1pbm9yaXR5LW1heCwgMjAlIHRocmVzaG9sZCc6IGRpcmVjdFJlcHJlc2VudGF0aW9uUmFuZ2UoJ21heE1pbm9yaXR5JywgJ2hpZ2hlc3QnLCAuOSksXG4gICAgICAgICdzcGxpdC13ZWlnaHQsIG1pbm9yaXR5LW1heCwgMjAlIHRocmVzaG9sZCc6IGRpcmVjdFJlcHJlc2VudGF0aW9uUmFuZ2UoJ21heE1pbm9yaXR5JywgJ3NwbGl0JywgLjkpLFxuICAgICAgICAnZXF1YWwtd2VpZ2h0LCBtaW5vcml0eS1tYXgsIDIwJSB0aHJlc2hvbGQnOiBkaXJlY3RSZXByZXNlbnRhdGlvblJhbmdlKCdtYXhNaW5vcml0eScsICdlcXVhbCcsIC45KSxcbiAgICAgICAgJ2hpZ2hlc3Qtd2VpZ2h0LCA8Yj5yZXdlaWdodGVkPC9iPic6IGRpcmVjdFJlcHJlc2VudGF0aW9uUmFuZ2UoJ3Jld2VpZ2h0ZWQnLCAnaGlnaGVzdCcsIDApLFxuICAgICAgICAnc3BsaXQtd2VpZ2h0LCA8Yj5yZXdlaWdodGVkPC9iPic6IGRpcmVjdFJlcHJlc2VudGF0aW9uUmFuZ2UoJ3Jld2VpZ2h0ZWQnLCAnc3BsaXQnLCAwKSxcbiAgICAgICAgJ2VxdWFsLXdlaWdodCwgPGI+cmV3ZWlnaHRlZDwvYj4nOiBkaXJlY3RSZXByZXNlbnRhdGlvblJhbmdlKCdyZXdlaWdodGVkJywgJ2VxdWFsJywgMCksXG4gICAgfVxufSIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdGlmKF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0pIHtcblx0XHRyZXR1cm4gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gbW9kdWxlIGV4cG9ydHMgbXVzdCBiZSByZXR1cm5lZCBmcm9tIHJ1bnRpbWUgc28gZW50cnkgaW5saW5pbmcgaXMgZGlzYWJsZWRcbi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xucmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oXCIuL2VsZWN0LmpzXCIpO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==
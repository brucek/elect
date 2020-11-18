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

        // console.log(votes);
        // console.log(candidates);

        var results = algorithm(votes, candidates, maxWinners);

        // console.log(votes);
        // console.log(results);

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
// exports.testSystems = {
//     'Power Instant Runoff': {
//         winners: [1,3],
//         strategies: strat.ranked,
//         ballots: ballots.ranked,
//         systems: systems.powerInstantRunoff
//     },
// }

exports.testSystems = {
    Random: {
        winners: [1,3],
        strategies: strat.noop,
        systems: systems.random
    },
    'Random Voters\' Choice': {
        winners: [1,3],
        strategies: strat.ranked,
        ballots: ballots.ranked,
        systems: systems.randomVotersChoice
    },
    Plurality: {
        winners: [1,3],
        strategies: strat.ranked,
        ballots: ballots.ranked,
        systems: systems.plurality
    },
    Range: {
        winners: [1,3],
        strategies: strat.scored,
        systems: systems.scored,
        ballots: ballots.scored
    },
    'Single-Transferable Vote': {
        winners: [1,3],
        strategies: strat.ranked,
        ballots: ballots.ranked,
        systems: systems.singleTransferableVote
    },
    'Power Instant Runoff': {
        winners: [1,3],
        strategies: strat.ranked,
        ballots: ballots.ranked,
        systems: systems.powerInstantRunoff
    },
    'Proportional Ranked, 15-Percent Threshold': {
        winners: [3],//[1,3],
        strategies: strat.ranked,
        ballots: ballots.ranked,
        systems: systems.singleTransferableVote
    },
    'Proportional Ranged': {
        winners: [3, Infinity],//[1,3, Infinity],
        strategies: strat.scored,
        ballots: ballots.scored,
        systems: {
            'split-weight, 0% threshold': systems.directRepresentativeRanged['split-weight, 0% threshold'],
            'highest-weight, 20% threshold': systems.directRepresentativeRanged['highest-weight, 20% threshold'],
            'split-weight, minority-max, 20% threshold': systems.directRepresentativeRanged['split-weight, minority-max, 20% threshold'],
            'split-weight, <b>reweighted</b>': systems.directRepresentativeRanged['split-weight, <b>reweighted</b>'],
            'equal-weight, <b>reweighted</b>': systems.directRepresentativeRanged['split-weight, <b>reweighted</b>'],
        }
    },
}

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

            // console.log("Running: " + systemName);

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

// Honestly this will only return maxWinners = 1 no matter what right now
function powerInstantRunoff(votes, candidates, maxWinners) {

    // var topWinners = singleTransferrableVote(votes, candidates, Math.max(4, maxWinners + 1));
    var topWinners = singleTransferrableVote(votes, candidates, 5);

    // console.log(topWinners);

    if (maxWinners == topWinners.length || topWinners.length <= 1) return topWinners;

    if (topWinners.length == 2) {
        topWinners[2] = {
            index: topWinners[0].index,
            weight: 1,
            preferences: topWinners[0].preferences
        };
    }

    // Just in case
    topWinners.slice(0, 3);

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

        // console.log(voteMap);

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

    // console.log(countedVotes);

    // Check for Condorcet winner
    var finalWinner = findCondorcetWinner(countedVotes);

    // console.log(finalWinner);

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

    // console.log(ret);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9lbGVjdC93ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24iLCJ3ZWJwYWNrOi8vZWxlY3QvLi9FbGVjdGlvbi5qcyIsIndlYnBhY2s6Ly9lbGVjdC8uL2FnZ3JlZ2F0ZUZucy5qcyIsIndlYnBhY2s6Ly9lbGVjdC8uL2JhbGxvdHMuanMiLCJ3ZWJwYWNrOi8vZWxlY3QvLi9lbGVjdC5qcyIsIndlYnBhY2s6Ly9lbGVjdC8uL25vZGVfbW9kdWxlcy9wcm90by9wcm90by5qcyIsIndlYnBhY2s6Ly9lbGVjdC8uL3V0aWxzLmpzIiwid2VicGFjazovL2VsZWN0Ly4vdm90aW5nU3RyYXRlZ2llcy5qcyIsIndlYnBhY2s6Ly9lbGVjdC8uL3ZvdGluZ1N5c3RlbXMuanMiLCJ3ZWJwYWNrOi8vZWxlY3Qvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vZWxlY3Qvd2VicGFjay9zdGFydHVwIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxPOzs7Ozs7Ozs7OztBQ1ZBLFlBQVksbUJBQU8sQ0FBQyw0Q0FBTzs7QUFFM0IsWUFBWSxtQkFBTyxDQUFDLDJCQUFTO0FBQzdCLG1CQUFtQixtQkFBTyxDQUFDLHlDQUFnQjtBQUMzQzs7QUFFQTtBQUNBOztBQUVBO0FBQ0Esb0JBQW9CLGlCQUFpQjtBQUNyQztBQUNBO0FBQ0Esb0JBQW9CLHFCQUFxQjtBQUN6QztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUzs7QUFFVDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FB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QUViO0FBQ0E7QUFDQSxhQUFhOztBQUViO0FBQ0Esd0JBQXdCLEtBQUs7QUFDN0I7QUFDQTtBQUNBLDhCQUE4Qix1Q0FBdUM7QUFDckU7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsYUFBYTs7QUFFYjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBLDBCQUEwQiwyQ0FBMkM7QUFDckUsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEM7Ozs7OztVQ2xtQkE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7OztVQ3JCQTtVQUNBO1VBQ0E7VUFDQSIsImZpbGUiOiJlbGVjdC51bWQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJlbGVjdFwiXSA9IGZhY3RvcnkoKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJlbGVjdFwiXSA9IGZhY3RvcnkoKTtcbn0pKHNlbGYsIGZ1bmN0aW9uKCkge1xucmV0dXJuICIsInZhciBwcm90byA9IHJlcXVpcmUoXCJwcm90b1wiKVxuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJylcbnZhciBhZ2dyZWdhdGVGbnMgPSByZXF1aXJlKCcuL2FnZ3JlZ2F0ZUZucycpXG52YXIgcmFuZG9tID0gdXRpbHMucmFuZG9tXG5cbnZhciBFbGVjdGlvbiA9IG1vZHVsZS5leHBvcnRzID0gcHJvdG8oZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pbml0ID0gZnVuY3Rpb24obnVtYmVyT2ZWb3RlcnMsIG51bWJlck9mQ2FuZGlkYXRlcywgbnVtYmVyT2ZTb2NpZXRhbE9wdGlvbnMpIHtcblxuICAgICAgICB2YXIgdm90ZXJzID0gW10sIGNhbmRpZGF0ZXMgPSBbXVxuICAgICAgICBmb3IodmFyIGo9MDtqPG51bWJlck9mVm90ZXJzO2orKykge1xuICAgICAgICAgICAgdm90ZXJzLnB1c2goZ2VuZXJhdGVQZXJzb24obnVtYmVyT2ZTb2NpZXRhbE9wdGlvbnMpKVxuICAgICAgICB9XG4gICAgICAgIGZvcih2YXIgaj0wO2o8bnVtYmVyT2ZDYW5kaWRhdGVzO2orKykge1xuICAgICAgICAgICAgY2FuZGlkYXRlcy5wdXNoKGdlbmVyYXRlUGVyc29uKG51bWJlck9mU29jaWV0YWxPcHRpb25zKSlcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBuZXRVdGlsaXRpZXMgPSBmaW5kTmV0VXRpbGl0aWVzKHZvdGVycylcbiAgICAgICAgdmFyIG9wdGltYWxPdXRjb21lcyA9IG5ldFV0aWxpdGllcy5tYXAoZnVuY3Rpb24ob3B0aW9uVXRpbGl0eSkge1xuICAgICAgICAgICAgcmV0dXJuIG9wdGlvblV0aWxpdHkgPiAwXG4gICAgICAgIH0pXG4gICAgICAgIHZhciBsZWFzdE9wdGltYWxPdXRjb21lcyA9IG9wdGltYWxPdXRjb21lcy5tYXAoZnVuY3Rpb24ob3V0Y29tZSkge1xuICAgICAgICAgICAgcmV0dXJuICFvdXRjb21lXG4gICAgICAgIH0pXG5cbiAgICAgICAgdGhpcy5tYXhVdGlsaXR5ID0gdG90YWxPdXRjb21lVXRpbGl0eSh2b3RlcnMsIG9wdGltYWxPdXRjb21lcylcbiAgICAgICAgdGhpcy5taW5VdGlsaXR5ID0gdG90YWxPdXRjb21lVXRpbGl0eSh2b3RlcnMsIGxlYXN0T3B0aW1hbE91dGNvbWVzKVxuICAgICAgICB0aGlzLm1heFJlZ3JldCA9IHRoaXMubWF4VXRpbGl0eSAtIHRoaXMubWluVXRpbGl0eVxuICAgICAgICB0aGlzLnZvdGVycyA9IHZvdGVyc1xuICAgICAgICB0aGlzLmNhbmRpZGF0ZXMgPSBjYW5kaWRhdGVzXG5cbiAgICAgICAgdGhpcy5hZ2dyZWdhdGVzID0ge31cbiAgICAgICAgZm9yKHZhciBrIGluIGFnZ3JlZ2F0ZUZucykge1xuICAgICAgICAgICAgdGhpcy5hZGRBZ2dyZWdhdGVGbihrLCBhZ2dyZWdhdGVGbnNba10pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyByZXR1cm5zIGFuIGFycmF5IG9mIHdpbm5pbmcgY2FuZGlkYXRlcyByZXByZXNlbnRlZCBieSBvYmplY3RzIHRoYXQgaGF2ZSB0aGUgcHJvcGVydGllczpcbiAgICAgICAgLy8gd2VpZ2h0IC0gVGhhdCB3aW5uZXIncyB2b3Rpbmcgd2VpZ2h0IGluIHRoZSBsZWdpc2xhdHVyZVxuICAgICAgICAvLyB1dGlsaXRpZXMgLSBUaGF0IHdpbm5lcidzIG9wdGlvbiB1dGlsaXRpZXMgKGluIHRoZSBzYW1lIGZvcm0gYXMgcmV0dXJuZWQgYnkgZ2VuZXJhdGVQZXJzb24pXG4gICAgLy8gYWxnb3JpdGhtKHZvdGVzLCBjYW5kaWRhdGVzKSAtIEEgZnVuY3Rpb24gdGhhdCBzaG91bGQgcmV0dXJuIHRoZSB3aW5uaW5nIGNhbmRpZGF0ZXMgaW4gdGhlIHNhbWUgZm9ybSBhcyB0aGlzLmVsZWN0IHJldHVybnNcbiAgICAvLyBzdHJhdGVneSh2b3RlciwgY2FuZGlkYXRlcykgLSBBIGZ1bmN0aW9uIHRoYXQgc2hvdWxkIHJldHVybiB0aGUgZ2l2ZW4gdm90ZXIncyB2b3RlIGluIHdoYXRldmVyIGZvcm0gdGhhdCBhbGdvcml0aG0gcmVxdWlyZXNcbiAgICB0aGlzLmVsZWN0ID0gZnVuY3Rpb24oYWxnb3JpdGhtLCBzdHJhdGVneSwgdm90ZXJzLCBjYW5kaWRhdGVzLCBtYXhXaW5uZXJzKSB7XG4gICAgICAgIHZhciB2b3RlcyA9IHZvdGVycy5tYXAoZnVuY3Rpb24odm90ZXIsIGluZGV4KSB7XG4gICAgICAgICAgICB2YXIgdm90ZXJBZ2dyZWdhdGVzID0ge31cbiAgICAgICAgICAgIGZvcih2YXIgayBpbiB0aGlzLmFnZ3JlZ2F0ZXMpIHtcbiAgICAgICAgICAgICAgICB2b3RlckFnZ3JlZ2F0ZXNba10gPSB0aGlzLmFnZ3JlZ2F0ZXNba11baW5kZXhdXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBzdHJhdGVneSh2b3Rlciwgdm90ZXJBZ2dyZWdhdGVzKVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8gY29uc29sZS5sb2codm90ZXMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhjYW5kaWRhdGVzKTtcblxuICAgICAgICB2YXIgcmVzdWx0cyA9IGFsZ29yaXRobSh2b3RlcywgY2FuZGlkYXRlcywgbWF4V2lubmVycyk7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2codm90ZXMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhyZXN1bHRzKTtcblxuICAgICAgICByZXN1bHRzLmZvckVhY2goZnVuY3Rpb24od2lubmVyKSB7XG4gICAgICAgICAgICB3aW5uZXIucHJlZmVyZW5jZXMgPSBjYW5kaWRhdGVzW3dpbm5lci5pbmRleF1cbiAgICAgICAgICAgIGlmKHdpbm5lci53ZWlnaHQgPCAwKSB0aHJvdyBuZXcgRXJyb3IoXCJXaW5uZXIgd2VpZ2h0IGNhbid0IGJlIGxlc3MgdGhhbiAwXCIpXG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdHNcbiAgICB9XG5cbiAgICB0aGlzLmFkZEFnZ3JlZ2F0ZUZuID0gZnVuY3Rpb24obmFtZSxmbikge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICAgICAgaWYobmFtZSBpbiB0aGlzLmFnZ3JlZ2F0ZXMpIHRocm93IG5ldyBFcnJvcihcIkFnZ3JlZ2F0ZSBmdW5jdGlvbiAnXCIrbmFtZStcIicgYWxyZWFkeSBleGlzdHNcIilcblxuICAgICAgICB2YXIgdmFsdWVzXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLmFnZ3JlZ2F0ZXMsIG5hbWUsIHtcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYodmFsdWVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzID0gZm4uY2FsbCh0aGlzLCB0aGF0LnZvdGVycyx0aGF0LmNhbmRpZGF0ZXMpIC8vIG1lbW9pemVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlc1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6dHJ1ZVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8vIHJldHVybnMgYSBudW1iZXIgZnJvbSAwIHRvIDEgaW5kaWNhdGluZyB3aGF0IHBlcmNlbnRhZ2Ugb2YgdGhlIG1heGltdW0gcG9zc2libGUgdm90ZXIgcmVncmV0IHRoZSBkZWNpZGVycyBjYXVzZVxuICAgIHRoaXMucmVncmV0RnJhY3Rpb24gPSBmdW5jdGlvbihwZW9wbGUsIGRlY2lkZXJzKSB7XG4gICAgICAgIHZhciBvdXRjb21lcyA9IHV0aWxzLmZpbmRTb2NpZXRhbE9wdGlvbnNPdXRjb21lcyhkZWNpZGVycylcbiAgICAgICAgdmFyIHRvdGFsVXRpbGl0eSA9IHRvdGFsT3V0Y29tZVV0aWxpdHkocGVvcGxlLCBvdXRjb21lcylcbiAgICAgICAgdmFyIHJlZ3JldCA9IHRoaXMubWF4VXRpbGl0eSAtIHRvdGFsVXRpbGl0eVxuXG4gICAgICAgIHJldHVybiByZWdyZXQvdGhpcy5tYXhSZWdyZXRcbiAgICB9XG5cbiAgICAvLyByZXR1cm5zIHRoZSB0b3RhbCB1dGlsaXR5IGNoYW5nZSBmb3IgdGhlIGdpdmVuIHBlb3BsZSBpZiB0aGUgZ2l2ZW4gb3V0Y29tZXMgaGFwcGVuZWRcbiAgICBmdW5jdGlvbiB0b3RhbE91dGNvbWVVdGlsaXR5KHBlb3BsZSwgb3V0Y29tZXMpIHtcbiAgICAgICAgdmFyIHV0aWxpdHkgPSAwXG4gICAgICAgIHBlb3BsZS5mb3JFYWNoKGZ1bmN0aW9uKHBlcnNvbikge1xuICAgICAgICAgICAgdXRpbGl0eSArPSB1dGlscy52b3Rlck91dGNvbWVVdGlsaXR5KHBlcnNvbiwgb3V0Y29tZXMpXG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIHV0aWxpdHlcbiAgICB9XG5cbiAgICAvLyByZXR1cm5zIGFuIGFycmF5IHdoZXJlIHRoZSBpbmRleCBpbmRpY2F0ZXMgYSBzb2NpZXRhbCBvcHRpb24gYW5kIHRoZSB2YWx1ZSBpbmRpY2F0ZXNcbiAgICAvLyB0aGUgbmV0IHV0aWxpdHkgZm9yIHRoYXQgb3B0aW9uIGZvciB0aGUgcGVvcGxlIHBhc3NlZCBpblxuICAgIGZ1bmN0aW9uIGZpbmROZXRVdGlsaXRpZXMocGVvcGxlKSB7XG4gICAgICAgIHZhciBuZXRVdGlsaXR5ID0gW11cbiAgICAgICAgcGVvcGxlLmZvckVhY2goZnVuY3Rpb24ocGVyc29uKSB7XG4gICAgICAgICAgICBwZXJzb24uZm9yRWFjaChmdW5jdGlvbihvcHRpb25VdGlsaXR5LCBpbmRleCkge1xuICAgICAgICAgICAgICAgIGlmKG5ldFV0aWxpdHlbaW5kZXhdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV0VXRpbGl0eVtpbmRleF0gPSAwXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbmV0VXRpbGl0eVtpbmRleF0gKz0gb3B0aW9uVXRpbGl0eVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcblxuICAgICAgICByZXR1cm4gbmV0VXRpbGl0eVxuICAgIH1cblxuICAgIC8vIFJldHVybnMgYW4gYXJyYXkgd2hlcmUgZWFjaCBlbGVtZW50IGlzIGEgbnVtYmVyIGZyb20gLTEgdG8gMSBpbmRpY2F0aW5nIHRoZSB1dGlsaXR5IHRoYXQgcGVyc29uIHdvdWxkIGdldFxuICAgIC8vIGZyb20gYSBnaXZlbiBzb2NpZXRhbCBvcHRpb24gKGlkZW50aWZpZWQgYnkgdGhlIGluZGV4KVxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlUGVyc29uKG51bWJlck9mU29jaWV0YWxPcHRpb25zLCBvcHRpb25Qb3B1bGFyaXR5TW9kaWZpZXJzKSB7XG4gICAgICAgIHZhciB2b3RlciA9IFtdXG4gICAgICAgIGZvcih2YXIgbj0wO248bnVtYmVyT2ZTb2NpZXRhbE9wdGlvbnM7bisrKSB7XG4gICAgICAgICAgICBpZihvcHRpb25Qb3B1bGFyaXR5TW9kaWZpZXJzKSB7XG4gICAgICAgICAgICAgICAgbW9kaWZpZXIgPSBvcHRpb25Qb3B1bGFyaXR5TW9kaWZpZXJzW25dXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1vZGlmaWVyID0gMVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2b3RlcltuXSA9IDIqcmFuZG9tKCkqbW9kaWZpZXItMVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZvdGVyXG4gICAgfVxufSlcbiIsIlxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNhbmRpZGF0ZURpY3RhdG9yVXRpbGl0aWVzOiBmdW5jdGlvbih2b3RlcnMsIGNhbmRpZGF0ZXMpIHtcbiAgICAgICAgdmFyIGNhbmRpZGF0ZU91dGNvbWVzID0gY2FuZGlkYXRlcy5tYXAoZnVuY3Rpb24oY2FuZGlkYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gIHV0aWxzLmZpbmRTb2NpZXRhbE9wdGlvbnNPdXRjb21lcyhbe3dlaWdodDoxLCBwcmVmZXJlbmNlczpjYW5kaWRhdGV9XSlcbiAgICAgICAgfSlcbiAgICAgICAgLy8gdGhlIHV0aWxpdHkgZWFjaCB2b3RlciB3b3VsZCBnZXQgaWYgZWFjaCBjYW5kaWRhdGUgd2VyZSBlbGVjdGVkIGRpY3RhdG9yXG4gICAgICAgIHJldHVybiB2b3RlcnMubWFwKGZ1bmN0aW9uKHZvdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FuZGlkYXRlT3V0Y29tZXMubWFwKGZ1bmN0aW9uKG91dGNvbWVzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICB1dGlscy52b3Rlck91dGNvbWVVdGlsaXR5KHZvdGVyLCBvdXRjb21lcylcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfVxufSIsInZhciBub29wID0gZnVuY3Rpb24odm90ZSl7cmV0dXJuIHZvdGV9XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG5vb3A6IHsnJzpub29wfSxcbiAgICByYW5rZWQ6IHtcbiAgICAgICAgXCJyYXdcIjpub29wLFxuICAgICAgICBcIk1heCAzXCI6IGZ1bmN0aW9uKHZvdGUpIHtcbiAgICAgICAgICAgIHJldHVybiB2b3RlLnNsaWNlKDAsMylcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2NvcmVkOiB7XG4gICAgICAgIFwicmF3XCI6bm9vcCxcbiAgICAgICAgXCJOZWFyZXN0IDEtNVwiOiBmdW5jdGlvbih2b3RlKSB7XG4gICAgICAgICAgICByZXR1cm4gdm90ZS5tYXAoZnVuY3Rpb24oY2FuZGlkYXRlU2NvcmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCg1KmNhbmRpZGF0ZVNjb3JlKS81XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufSIsInZhciBFbGVjdGlvbiA9IGV4cG9ydHMuRWxlY3Rpb24gPSByZXF1aXJlKFwiLi9FbGVjdGlvblwiKVxuXG52YXIgc3lzdGVtcyA9IGV4cG9ydHMuc3lzdGVtcyA9IHJlcXVpcmUoJy4vdm90aW5nU3lzdGVtcycpXG52YXIgc3RyYXQgPSBleHBvcnRzLnN0cmF0ZWdpZXMgPSByZXF1aXJlKCcuL3ZvdGluZ1N0cmF0ZWdpZXMnKVxudmFyIGJhbGxvdHMgPSBleHBvcnRzLmJhbGxvdHMgPSByZXF1aXJlKCcuL2JhbGxvdHMnKVxuXG5cbi8vIEZvciBlYWNoIHN5c3RlbTpcbi8vIGFsZ29yaXRobVxuICAgIC8vIHRha2VzIGluIGFuIGFycmF5IG9mIHZvdGVzIHdoZXJlIGVhY2ggdm90ZSBpcyB0aGUgb3V0cHV0IG9mIGEgZ2l2ZW4gYHN0cmF0ZWd5YCBmb3IgdGhlIHN5c3RlbVxuICAgIC8vIHJldHVybnMgYW4gb2JqZWN0IHdoZXJlIGVhY2gga2V5IGlzIGEgd2lubmVyLCBhbmQgZWFjaCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCB0aGUgcHJvcGVydGllczpcbiAgICAgICAgLy8gd2VpZ2h0IC0gdGhlIHdpbm5lcidzIHZvdGUgd2VpZ2h0XG4gICAgICAgIC8vIHByZWZlcmVuY2VzIC0gdGhlIHdpbm5lcidzIHZvdGluZyBwcmVmZXJlbmNlcyBmb3IgZWFjaCBzb2NpZXRhbCBvcHRpb25cbi8vIGVhY2ggc3RyYXRlZ3k6XG4gICAgLy8gcmV0dXJucyBhIFwidm90ZVwiLCBhIHNldCBvZiBkYXRhIHVzZWQgYnkgdm90aW5nU3lzdGVtIHRvIGRldGVybWluZSB3aW5uZXJzXG4vLyBleHBvcnRzLnRlc3RTeXN0ZW1zID0ge1xuLy8gICAgICdQb3dlciBJbnN0YW50IFJ1bm9mZic6IHtcbi8vICAgICAgICAgd2lubmVyczogWzEsM10sXG4vLyAgICAgICAgIHN0cmF0ZWdpZXM6IHN0cmF0LnJhbmtlZCxcbi8vICAgICAgICAgYmFsbG90czogYmFsbG90cy5yYW5rZWQsXG4vLyAgICAgICAgIHN5c3RlbXM6IHN5c3RlbXMucG93ZXJJbnN0YW50UnVub2ZmXG4vLyAgICAgfSxcbi8vIH1cblxuZXhwb3J0cy50ZXN0U3lzdGVtcyA9IHtcbiAgICBSYW5kb206IHtcbiAgICAgICAgd2lubmVyczogWzEsM10sXG4gICAgICAgIHN0cmF0ZWdpZXM6IHN0cmF0Lm5vb3AsXG4gICAgICAgIHN5c3RlbXM6IHN5c3RlbXMucmFuZG9tXG4gICAgfSxcbiAgICAnUmFuZG9tIFZvdGVyc1xcJyBDaG9pY2UnOiB7XG4gICAgICAgIHdpbm5lcnM6IFsxLDNdLFxuICAgICAgICBzdHJhdGVnaWVzOiBzdHJhdC5yYW5rZWQsXG4gICAgICAgIGJhbGxvdHM6IGJhbGxvdHMucmFua2VkLFxuICAgICAgICBzeXN0ZW1zOiBzeXN0ZW1zLnJhbmRvbVZvdGVyc0Nob2ljZVxuICAgIH0sXG4gICAgUGx1cmFsaXR5OiB7XG4gICAgICAgIHdpbm5lcnM6IFsxLDNdLFxuICAgICAgICBzdHJhdGVnaWVzOiBzdHJhdC5yYW5rZWQsXG4gICAgICAgIGJhbGxvdHM6IGJhbGxvdHMucmFua2VkLFxuICAgICAgICBzeXN0ZW1zOiBzeXN0ZW1zLnBsdXJhbGl0eVxuICAgIH0sXG4gICAgUmFuZ2U6IHtcbiAgICAgICAgd2lubmVyczogWzEsM10sXG4gICAgICAgIHN0cmF0ZWdpZXM6IHN0cmF0LnNjb3JlZCxcbiAgICAgICAgc3lzdGVtczogc3lzdGVtcy5zY29yZWQsXG4gICAgICAgIGJhbGxvdHM6IGJhbGxvdHMuc2NvcmVkXG4gICAgfSxcbiAgICAnU2luZ2xlLVRyYW5zZmVyYWJsZSBWb3RlJzoge1xuICAgICAgICB3aW5uZXJzOiBbMSwzXSxcbiAgICAgICAgc3RyYXRlZ2llczogc3RyYXQucmFua2VkLFxuICAgICAgICBiYWxsb3RzOiBiYWxsb3RzLnJhbmtlZCxcbiAgICAgICAgc3lzdGVtczogc3lzdGVtcy5zaW5nbGVUcmFuc2ZlcmFibGVWb3RlXG4gICAgfSxcbiAgICAnUG93ZXIgSW5zdGFudCBSdW5vZmYnOiB7XG4gICAgICAgIHdpbm5lcnM6IFsxLDNdLFxuICAgICAgICBzdHJhdGVnaWVzOiBzdHJhdC5yYW5rZWQsXG4gICAgICAgIGJhbGxvdHM6IGJhbGxvdHMucmFua2VkLFxuICAgICAgICBzeXN0ZW1zOiBzeXN0ZW1zLnBvd2VySW5zdGFudFJ1bm9mZlxuICAgIH0sXG4gICAgJ1Byb3BvcnRpb25hbCBSYW5rZWQsIDE1LVBlcmNlbnQgVGhyZXNob2xkJzoge1xuICAgICAgICB3aW5uZXJzOiBbM10sLy9bMSwzXSxcbiAgICAgICAgc3RyYXRlZ2llczogc3RyYXQucmFua2VkLFxuICAgICAgICBiYWxsb3RzOiBiYWxsb3RzLnJhbmtlZCxcbiAgICAgICAgc3lzdGVtczogc3lzdGVtcy5zaW5nbGVUcmFuc2ZlcmFibGVWb3RlXG4gICAgfSxcbiAgICAnUHJvcG9ydGlvbmFsIFJhbmdlZCc6IHtcbiAgICAgICAgd2lubmVyczogWzMsIEluZmluaXR5XSwvL1sxLDMsIEluZmluaXR5XSxcbiAgICAgICAgc3RyYXRlZ2llczogc3RyYXQuc2NvcmVkLFxuICAgICAgICBiYWxsb3RzOiBiYWxsb3RzLnNjb3JlZCxcbiAgICAgICAgc3lzdGVtczoge1xuICAgICAgICAgICAgJ3NwbGl0LXdlaWdodCwgMCUgdGhyZXNob2xkJzogc3lzdGVtcy5kaXJlY3RSZXByZXNlbnRhdGl2ZVJhbmdlZFsnc3BsaXQtd2VpZ2h0LCAwJSB0aHJlc2hvbGQnXSxcbiAgICAgICAgICAgICdoaWdoZXN0LXdlaWdodCwgMjAlIHRocmVzaG9sZCc6IHN5c3RlbXMuZGlyZWN0UmVwcmVzZW50YXRpdmVSYW5nZWRbJ2hpZ2hlc3Qtd2VpZ2h0LCAyMCUgdGhyZXNob2xkJ10sXG4gICAgICAgICAgICAnc3BsaXQtd2VpZ2h0LCBtaW5vcml0eS1tYXgsIDIwJSB0aHJlc2hvbGQnOiBzeXN0ZW1zLmRpcmVjdFJlcHJlc2VudGF0aXZlUmFuZ2VkWydzcGxpdC13ZWlnaHQsIG1pbm9yaXR5LW1heCwgMjAlIHRocmVzaG9sZCddLFxuICAgICAgICAgICAgJ3NwbGl0LXdlaWdodCwgPGI+cmV3ZWlnaHRlZDwvYj4nOiBzeXN0ZW1zLmRpcmVjdFJlcHJlc2VudGF0aXZlUmFuZ2VkWydzcGxpdC13ZWlnaHQsIDxiPnJld2VpZ2h0ZWQ8L2I+J10sXG4gICAgICAgICAgICAnZXF1YWwtd2VpZ2h0LCA8Yj5yZXdlaWdodGVkPC9iPic6IHN5c3RlbXMuZGlyZWN0UmVwcmVzZW50YXRpdmVSYW5nZWRbJ3NwbGl0LXdlaWdodCwgPGI+cmV3ZWlnaHRlZDwvYj4nXSxcbiAgICAgICAgfVxuICAgIH0sXG59XG5cbmV4cG9ydHMudGVzdCA9IGZ1bmN0aW9uKHJlc3VsdHNEaXYsIG9wdGlvbnMsIHZvdGluZ1N5c3RlbXMpIHtcbiAgICBpZih2b3RpbmdTeXN0ZW1zID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBFcnJvcihcIk5vIHZvdGluZyBzeXN0ZW1zIHRvIHRlc3RcIilcblxuICAgIHZhciBudW1iZXJPZlNvY2lldGFsT3B0aW9ucyA9IG9wdGlvbnMuaXNzdWVzLFxuICAgICAgICBudW1iZXJPZkNhbmRpZGF0ZXMgPSBvcHRpb25zLmNhbmRpZGF0ZXMsXG4gICAgICAgIG51bWJlck9mVm90ZXJzID0gb3B0aW9ucy52b3RlcnMsXG4gICAgICAgIGl0ZXJhdGlvbnMgPSBvcHRpb25zLml0ZXJhdGlvbnNcblxuICAgIHZhciBrbm9ic091dHB1dCA9ICc8ZGl2PlNvY2lldGFsIE9wdGlvbnM6ICcrbnVtYmVyT2ZTb2NpZXRhbE9wdGlvbnMrJzwvZGl2PicrXG4gICAgICAgICAgICAgICAgICAgICAgJzxkaXY+Q2FuZGlkYXRlczogJytudW1iZXJPZkNhbmRpZGF0ZXMrJzwvZGl2PicrXG4gICAgICAgICAgICAgICAgICAgICAgJzxkaXY+Vm90ZXJzOiAnK251bWJlck9mVm90ZXJzKyc8L2Rpdj4nK1xuICAgICAgICAgICAgICAgICAgICAgICc8ZGl2Pkl0ZXJhdGlvbnM6ICcraXRlcmF0aW9ucysnPC9kaXY+JytcbiAgICAgICAgICAgICAgICAgICAgICAnPGJyPidcblxuICAgIHZhciBuPTEsIHRvdGFsUmVncmV0RnJhY3Rpb25TdW1QZXJTeXN0ZW0gPSB7fSwgdG90YWxXaW5uZXJzUGVyU3lzdGVtID0ge31cbiAgICBmdW5jdGlvbiBpdGVyYXRpb24oY29tcGxldGUpIHtcbiAgICAgICAgdmFyIGVsZWN0aW9uID0gRWxlY3Rpb24obnVtYmVyT2ZWb3RlcnMsIG51bWJlck9mQ2FuZGlkYXRlcywgbnVtYmVyT2ZTb2NpZXRhbE9wdGlvbnMpXG5cbiAgICAgICAgZm9yKHZhciBzeXN0ZW1OYW1lIGluIHZvdGluZ1N5c3RlbXMpIHtcbiAgICAgICAgICAgIHZhciB2b3RpbmdTZXQgPSB2b3RpbmdTeXN0ZW1zW3N5c3RlbU5hbWVdXG5cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiUnVubmluZzogXCIgKyBzeXN0ZW1OYW1lKTtcblxuICAgICAgICAgICAgdmFyIGN1ckJhbGxvdHMgPSB2b3RpbmdTZXQuYmFsbG90c1xuICAgICAgICAgICAgaWYoY3VyQmFsbG90cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgY3VyQmFsbG90cyA9IGJhbGxvdHMubm9vcFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IodmFyIHN0cmF0ZWd5TmFtZSBpbiB2b3RpbmdTZXQuc3RyYXRlZ2llcykge1xuICAgICAgICAgICAgICAgIHZhciByYXdTdHJhdGVneSA9IHZvdGluZ1NldC5zdHJhdGVnaWVzW3N0cmF0ZWd5TmFtZV1cbiAgICAgICAgICAgICAgICBmb3IodmFyIGJhbGxvdE5hbWUgaW4gY3VyQmFsbG90cykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYmFsbG90ID0gY3VyQmFsbG90c1tiYWxsb3ROYW1lXVxuICAgICAgICAgICAgICAgICAgICB2YXIgYmFsbG90U3RyYXRlZ3lOYW1lID0gc3RyYXRlZ3lOYW1lKycgJytiYWxsb3ROYW1lXG4gICAgICAgICAgICAgICAgICAgIHZhciBzdHJhdGVneSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJhbGxvdChyYXdTdHJhdGVneS5hcHBseSh0aGlzLGFyZ3VtZW50cykpXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBmb3IodmFyIGFsZ29yaXRobU5hbWUgaW4gdm90aW5nU2V0LnN5c3RlbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZvdGluZ1NldC53aW5uZXJzLmZvckVhY2goZnVuY3Rpb24obWF4V2lubmVycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB3aW5uZXJzID0gZWxlY3Rpb24uZWxlY3Qodm90aW5nU2V0LnN5c3RlbXNbYWxnb3JpdGhtTmFtZV0sIHN0cmF0ZWd5LCBlbGVjdGlvbi52b3RlcnMsIGVsZWN0aW9uLmNhbmRpZGF0ZXMsIG1heFdpbm5lcnMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlZ3JldEZyYWN0aW9uID0gZWxlY3Rpb24ucmVncmV0RnJhY3Rpb24oZWxlY3Rpb24udm90ZXJzLCB3aW5uZXJzKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN5c3RlbVN0cmF0ZWd5TmFtZSA9IGdldFZvdGluZ1R5cGVOYW1lKHN5c3RlbU5hbWUsIGJhbGxvdFN0cmF0ZWd5TmFtZSwgYWxnb3JpdGhtTmFtZSwgbWF4V2lubmVycylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZih0b3RhbFJlZ3JldEZyYWN0aW9uU3VtUGVyU3lzdGVtW3N5c3RlbVN0cmF0ZWd5TmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3RhbFJlZ3JldEZyYWN0aW9uU3VtUGVyU3lzdGVtW3N5c3RlbVN0cmF0ZWd5TmFtZV0gPSAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsV2lubmVyc1BlclN5c3RlbVtzeXN0ZW1TdHJhdGVneU5hbWVdID0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsUmVncmV0RnJhY3Rpb25TdW1QZXJTeXN0ZW1bc3lzdGVtU3RyYXRlZ3lOYW1lXSArPSByZWdyZXRGcmFjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsV2lubmVyc1BlclN5c3RlbVtzeXN0ZW1TdHJhdGVneU5hbWVdICs9IHdpbm5lcnMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0c0Rpdi5pbm5lckhUTUwgPSByZXN1bHRzSHRtbChuL2l0ZXJhdGlvbnMsIHRydWUpXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZihuPGl0ZXJhdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBpdGVyYXRpb24oY29tcGxldGUpXG4gICAgICAgICAgICAgICAgbisrXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbXBsZXRlKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICB2YXIgcmVzdWx0c0h0bWwgPSBmdW5jdGlvbihjb21wbGV0aW9uRnJhY3Rpb24sIHNvcnQpIHtcbiAgICAgICAgdmFyIGNvbnRlbnQgPSBrbm9ic091dHB1dCsnQ29tcGxldGlvbjogJytOdW1iZXIoMTAwKmNvbXBsZXRpb25GcmFjdGlvbikudG9QcmVjaXNpb24oMykrJyU8YnI+JytcbiAgICAgICAgICAgICAgICAgICAgICAnPGRpdj48Yj5Wb3RlciBTYXRpc2ZhY3Rpb24gQXZlcmFnZXMgKGludmVyc2Ugb2YgQmF5ZXNpYW4gUmVncmV0KTo8L2I+PC9kaXY+JytcbiAgICAgICAgICAgICAgICAgICAgICAnPHRhYmxlPidcblxuICAgICAgICBPYmplY3Qua2V5cyh0b3RhbFJlZ3JldEZyYWN0aW9uU3VtUGVyU3lzdGVtKS5tYXAoZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtuYW1lOm5hbWUsIHRvdGFsUmVncmV0OnRvdGFsUmVncmV0RnJhY3Rpb25TdW1QZXJTeXN0ZW1bbmFtZV19XG4gICAgICAgIH0pLnNvcnQoZnVuY3Rpb24oYSxiKSB7XG4gICAgICAgICAgICBpZihzb3J0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGEudG90YWxSZWdyZXQgLSBiLnRvdGFsUmVncmV0XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLmZvckVhY2goZnVuY3Rpb24odm90aW5nVHlwZSkge1xuICAgICAgICAgICAgdmFyIHN5c3RlbVN0cmF0ZWd5TmFtZSA9IHZvdGluZ1R5cGUubmFtZVxuICAgICAgICAgICAgdmFyIHRvdGFsUmVncmV0ID0gdm90aW5nVHlwZS50b3RhbFJlZ3JldFxuXG4gICAgICAgICAgICB2YXIgYXZlcmFnZVJlZ3JldEZyYWN0aW9uID0gdG90YWxSZWdyZXQvblxuICAgICAgICAgICAgdmFyIGF2Z1dpbm5lcnMgPSAodG90YWxXaW5uZXJzUGVyU3lzdGVtW3N5c3RlbVN0cmF0ZWd5TmFtZV0vbikudG9QcmVjaXNpb24oMilcblxuICAgICAgICAgICAgdmFyIGRpc3BsYXlBdmVyYWdlID0gTnVtYmVyKDEwMCooMS1hdmVyYWdlUmVncmV0RnJhY3Rpb24pKS50b1ByZWNpc2lvbigyKVxuICAgICAgICAgICAgY29udGVudCArPSAnPHRyPjx0ZCBzdHlsZT1cInRleHQtYWxpZ246cmlnaHQ7XCI+JytzeXN0ZW1TdHJhdGVneU5hbWUrXCI8L3RkPjx0ZD48Yj5cIitkaXNwbGF5QXZlcmFnZSsnJTwvYj4gd2l0aCBhdmcgb2YgJythdmdXaW5uZXJzKycgd2lubmVyczwvdGQ+PC90cj4nXG4gICAgICAgIH0pXG5cbiAgICAgICAgY29udGVudCs9ICc8L3RhYmxlPidcbiAgICAgICAgcmV0dXJuIGNvbnRlbnRcbiAgICB9XG5cbiAgICBpdGVyYXRpb24oZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc3VsdHNEaXYuaW5uZXJIVE1MID0gcmVzdWx0c0h0bWwoMSwgdHJ1ZSlcbiAgICB9KVxufVxuXG5cbi8vIFRoZSBuYW1lIG9mIGFuIGVsZWN0aW9uIHJ1biB3aXRoIGEgcGFydGljdWxhciBzeXN0ZW0gYW5kIHN0cmF0ZWd5XG5mdW5jdGlvbiBnZXRWb3RpbmdUeXBlTmFtZShzeXN0ZW1OYW1lLHN0cmF0ZWd5TmFtZSwgYWxnb3JpdGhtTmFtZSwgbWF4V2lubmVycykge1xuICAgIGlmKHN0cmF0ZWd5TmFtZSA9PT0gJ25vbmFtZScpIHtcbiAgICAgICAgcmV0dXJuIHN5c3RlbU5hbWVcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJzxzcGFuIHN0eWxlPVwiY29sb3I6cmdiKDAsNTAsMTUwKVwiPicrc3lzdGVtTmFtZSsnPC9zcGFuPiAnK2FsZ29yaXRobU5hbWUrJyAnK3N0cmF0ZWd5TmFtZSsnIG1heCAnK21heFdpbm5lcnMrJyB3aW5uZXJzJ1xuICAgIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiO1xyXG4vKiBDb3B5cmlnaHQgKGMpIDIwMTMgQmlsbHkgVGV0cnVkIC0gRnJlZSB0byB1c2UgZm9yIGFueSBwdXJwb3NlOiBNSVQgTGljZW5zZSovXHJcblxyXG52YXIgbm9vcCA9IGZ1bmN0aW9uKCkge31cclxuXHJcbnZhciBwcm90b3R5cGVOYW1lPSdwcm90b3R5cGUnLCB1bmRlZmluZWQsIHByb3RvVW5kZWZpbmVkPSd1bmRlZmluZWQnLCBpbml0PSdpbml0Jywgb3duUHJvcGVydHk9KHt9KS5oYXNPd25Qcm9wZXJ0eTsgLy8gbWluaWZpYWJsZSB2YXJpYWJsZXNcclxuZnVuY3Rpb24gcHJvdG8oKSB7XHJcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyAvLyBtaW5pZmlhYmxlIHZhcmlhYmxlc1xyXG5cclxuICAgIGlmKGFyZ3MubGVuZ3RoID09IDEpIHtcclxuICAgICAgICB2YXIgcGFyZW50ID0ge2luaXQ6IG5vb3B9XHJcbiAgICAgICAgdmFyIHByb3RvdHlwZUJ1aWxkZXIgPSBhcmdzWzBdXHJcblxyXG4gICAgfSBlbHNlIHsgLy8gbGVuZ3RoID09IDJcclxuICAgICAgICB2YXIgcGFyZW50ID0gYXJnc1swXVxyXG4gICAgICAgIHZhciBwcm90b3R5cGVCdWlsZGVyID0gYXJnc1sxXVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHNwZWNpYWwgaGFuZGxpbmcgZm9yIEVycm9yIG9iamVjdHNcclxuICAgIHZhciBuYW1lUG9pbnRlciA9IHt9ICAgIC8vIG5hbWUgdXNlZCBvbmx5IGZvciBFcnJvciBPYmplY3RzXHJcbiAgICBpZihbRXJyb3IsIEV2YWxFcnJvciwgUmFuZ2VFcnJvciwgUmVmZXJlbmNlRXJyb3IsIFN5bnRheEVycm9yLCBUeXBlRXJyb3IsIFVSSUVycm9yXS5pbmRleE9mKHBhcmVudCkgIT09IC0xKSB7XHJcbiAgICAgICAgcGFyZW50ID0gbm9ybWFsaXplRXJyb3JPYmplY3QocGFyZW50LCBuYW1lUG9pbnRlcilcclxuICAgIH1cclxuXHJcbiAgICAvLyBzZXQgdXAgdGhlIHBhcmVudCBpbnRvIHRoZSBwcm90b3R5cGUgY2hhaW4gaWYgYSBwYXJlbnQgaXMgcGFzc2VkXHJcbiAgICB2YXIgcGFyZW50SXNGdW5jdGlvbiA9IHR5cGVvZihwYXJlbnQpID09PSBcImZ1bmN0aW9uXCJcclxuICAgIGlmKHBhcmVudElzRnVuY3Rpb24pIHtcclxuICAgICAgICBwcm90b3R5cGVCdWlsZGVyW3Byb3RvdHlwZU5hbWVdID0gcGFyZW50W3Byb3RvdHlwZU5hbWVdXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHByb3RvdHlwZUJ1aWxkZXJbcHJvdG90eXBlTmFtZV0gPSBwYXJlbnRcclxuICAgIH1cclxuXHJcbiAgICAvLyB0aGUgcHJvdG90eXBlIHRoYXQgd2lsbCBiZSB1c2VkIHRvIG1ha2UgaW5zdGFuY2VzXHJcbiAgICB2YXIgcHJvdG90eXBlID0gbmV3IHByb3RvdHlwZUJ1aWxkZXIocGFyZW50KVxyXG4gICAgbmFtZVBvaW50ZXIubmFtZSA9IHByb3RvdHlwZS5uYW1lXHJcblxyXG4gICAgLy8gaWYgdGhlcmUncyBubyBpbml0LCBhc3N1bWUgaXRzIGluaGVyaXRpbmcgYSBub24tcHJvdG8gY2xhc3MsIHNvIGRlZmF1bHQgdG8gYXBwbHlpbmcgdGhlIHN1cGVyY2xhc3MncyBjb25zdHJ1Y3Rvci5cclxuICAgIGlmKCFwcm90b3R5cGVbaW5pdF0gJiYgcGFyZW50SXNGdW5jdGlvbikge1xyXG4gICAgICAgIHByb3RvdHlwZVtpbml0XSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBwYXJlbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBjb25zdHJ1Y3RvciBmb3IgZW1wdHkgb2JqZWN0IHdoaWNoIHdpbGwgYmUgcG9wdWxhdGVkIHZpYSB0aGUgY29uc3RydWN0b3JcclxuICAgIHZhciBGID0gZnVuY3Rpb24oKSB7fVxyXG4gICAgICAgIEZbcHJvdG90eXBlTmFtZV0gPSBwcm90b3R5cGUgICAgLy8gc2V0IHRoZSBwcm90b3R5cGUgZm9yIGNyZWF0ZWQgaW5zdGFuY2VzXHJcblxyXG4gICAgdmFyIGNvbnN0cnVjdG9yTmFtZSA9IHByb3RvdHlwZS5uYW1lP3Byb3RvdHlwZS5uYW1lOicnXHJcbiAgICBpZihwcm90b3R5cGVbaW5pdF0gPT09IHVuZGVmaW5lZCB8fCBwcm90b3R5cGVbaW5pdF0gPT09IG5vb3ApIHtcclxuICAgICAgICB2YXIgUHJvdG9PYmplY3RGYWN0b3J5ID0gbmV3IEZ1bmN0aW9uKCdGJyxcclxuICAgICAgICAgICAgXCJyZXR1cm4gZnVuY3Rpb24gXCIgKyBjb25zdHJ1Y3Rvck5hbWUgKyBcIigpe1wiICtcclxuICAgICAgICAgICAgICAgIFwicmV0dXJuIG5ldyBGKClcIiArXHJcbiAgICAgICAgICAgIFwifVwiXHJcbiAgICAgICAgKShGKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBkeW5hbWljYWxseSBjcmVhdGluZyB0aGlzIGZ1bmN0aW9uIGNhdXNlIHRoZXJlJ3Mgbm8gb3RoZXIgd2F5IHRvIGR5bmFtaWNhbGx5IG5hbWUgYSBmdW5jdGlvblxyXG4gICAgICAgIHZhciBQcm90b09iamVjdEZhY3RvcnkgPSBuZXcgRnVuY3Rpb24oJ0YnLCdpJywndScsJ24nLCAvLyBzaGl0dHkgdmFyaWFibGVzIGNhdXNlIG1pbmlmaWVycyBhcmVuJ3QgZ29ubmEgbWluaWZ5IG15IGZ1bmN0aW9uIHN0cmluZyBoZXJlXHJcbiAgICAgICAgICAgIFwicmV0dXJuIGZ1bmN0aW9uIFwiICsgY29uc3RydWN0b3JOYW1lICsgXCIoKXsgXCIgK1xyXG4gICAgICAgICAgICAgICAgXCJ2YXIgeD1uZXcgRigpLHI9aS5hcHBseSh4LGFyZ3VtZW50cylcXG5cIiArICAgIC8vIHBvcHVsYXRlIG9iamVjdCB2aWEgdGhlIGNvbnN0cnVjdG9yXHJcbiAgICAgICAgICAgICAgICBcImlmKHI9PT1uKVxcblwiICtcclxuICAgICAgICAgICAgICAgICAgICBcInJldHVybiB4XFxuXCIgK1xyXG4gICAgICAgICAgICAgICAgXCJlbHNlIGlmKHI9PT11KVxcblwiICtcclxuICAgICAgICAgICAgICAgICAgICBcInJldHVybiBuXFxuXCIgK1xyXG4gICAgICAgICAgICAgICAgXCJlbHNlXFxuXCIgK1xyXG4gICAgICAgICAgICAgICAgICAgIFwicmV0dXJuIHJcXG5cIiArXHJcbiAgICAgICAgICAgIFwifVwiXHJcbiAgICAgICAgKShGLCBwcm90b3R5cGVbaW5pdF0sIHByb3RvW3Byb3RvVW5kZWZpbmVkXSkgLy8gbm90ZSB0aGF0IG4gaXMgdW5kZWZpbmVkXHJcbiAgICB9XHJcblxyXG4gICAgcHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUHJvdG9PYmplY3RGYWN0b3J5OyAgICAvLyBzZXQgdGhlIGNvbnN0cnVjdG9yIHByb3BlcnR5IG9uIHRoZSBwcm90b3R5cGVcclxuXHJcbiAgICAvLyBhZGQgYWxsIHRoZSBwcm90b3R5cGUgcHJvcGVydGllcyBvbnRvIHRoZSBzdGF0aWMgY2xhc3MgYXMgd2VsbCAoc28geW91IGNhbiBhY2Nlc3MgdGhhdCBjbGFzcyB3aGVuIHlvdSB3YW50IHRvIHJlZmVyZW5jZSBzdXBlcmNsYXNzIHByb3BlcnRpZXMpXHJcbiAgICBmb3IodmFyIG4gaW4gcHJvdG90eXBlKSB7XHJcbiAgICAgICAgYWRkUHJvcGVydHkoUHJvdG9PYmplY3RGYWN0b3J5LCBwcm90b3R5cGUsIG4pXHJcbiAgICB9XHJcblxyXG4gICAgLy8gYWRkIHByb3BlcnRpZXMgZnJvbSBwYXJlbnQgdGhhdCBkb24ndCBleGlzdCBpbiB0aGUgc3RhdGljIGNsYXNzIG9iamVjdCB5ZXRcclxuICAgIGZvcih2YXIgbiBpbiBwYXJlbnQpIHtcclxuICAgICAgICBpZihvd25Qcm9wZXJ0eS5jYWxsKHBhcmVudCwgbikgJiYgUHJvdG9PYmplY3RGYWN0b3J5W25dID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgYWRkUHJvcGVydHkoUHJvdG9PYmplY3RGYWN0b3J5LCBwYXJlbnQsIG4pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIFByb3RvT2JqZWN0RmFjdG9yeS5wYXJlbnQgPSBwYXJlbnQ7ICAgICAgICAgICAgLy8gc3BlY2lhbCBwYXJlbnQgcHJvcGVydHkgb25seSBhdmFpbGFibGUgb24gdGhlIHJldHVybmVkIHByb3RvIGNsYXNzXHJcbiAgICBQcm90b09iamVjdEZhY3RvcnlbcHJvdG90eXBlTmFtZV0gPSBwcm90b3R5cGUgIC8vIHNldCB0aGUgcHJvdG90eXBlIG9uIHRoZSBvYmplY3QgZmFjdG9yeVxyXG5cclxuICAgIHJldHVybiBQcm90b09iamVjdEZhY3Rvcnk7XHJcbn1cclxuXHJcbnByb3RvW3Byb3RvVW5kZWZpbmVkXSA9IHt9IC8vIGEgc3BlY2lhbCBtYXJrZXIgZm9yIHdoZW4geW91IHdhbnQgdG8gcmV0dXJuIHVuZGVmaW5lZCBmcm9tIGEgY29uc3RydWN0b3JcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gcHJvdG9cclxuXHJcbmZ1bmN0aW9uIG5vcm1hbGl6ZUVycm9yT2JqZWN0KEVycm9yT2JqZWN0LCBuYW1lUG9pbnRlcikge1xyXG4gICAgZnVuY3Rpb24gTm9ybWFsaXplZEVycm9yKCkge1xyXG4gICAgICAgIHZhciB0bXAgPSBuZXcgRXJyb3JPYmplY3QoYXJndW1lbnRzWzBdKVxyXG4gICAgICAgIHRtcC5uYW1lID0gbmFtZVBvaW50ZXIubmFtZVxyXG5cclxuICAgICAgICB0aGlzLm1lc3NhZ2UgPSB0bXAubWVzc2FnZVxyXG4gICAgICAgIGlmKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICAvKnRoaXMuc3RhY2sgPSAqL09iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnc3RhY2snLCB7IC8vIGdldHRlciBmb3IgbW9yZSBvcHRpbWl6eSBnb29kbmVzc1xyXG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdG1wLnN0YWNrXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlIC8vIHNvIHlvdSBjYW4gY2hhbmdlIGl0IGlmIHlvdSB3YW50XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zdGFjayA9IHRtcC5zdGFja1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICB2YXIgSW50ZXJtZWRpYXRlSW5oZXJpdG9yID0gZnVuY3Rpb24oKSB7fVxyXG4gICAgICAgIEludGVybWVkaWF0ZUluaGVyaXRvci5wcm90b3R5cGUgPSBFcnJvck9iamVjdC5wcm90b3R5cGVcclxuICAgIE5vcm1hbGl6ZWRFcnJvci5wcm90b3R5cGUgPSBuZXcgSW50ZXJtZWRpYXRlSW5oZXJpdG9yKClcclxuXHJcbiAgICByZXR1cm4gTm9ybWFsaXplZEVycm9yXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFkZFByb3BlcnR5KGZhY3RvcnlPYmplY3QsIHByb3RvdHlwZSwgcHJvcGVydHkpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgdmFyIGluZm8gPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHByb3RvdHlwZSwgcHJvcGVydHkpXHJcbiAgICAgICAgaWYoaW5mby5nZXQgIT09IHVuZGVmaW5lZCB8fCBpbmZvLmdldCAhPT0gdW5kZWZpbmVkICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShmYWN0b3J5T2JqZWN0LCBwcm9wZXJ0eSwgaW5mbylcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBmYWN0b3J5T2JqZWN0W3Byb3BlcnR5XSA9IHByb3RvdHlwZVtwcm9wZXJ0eV1cclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAvLyBkbyBub3RoaW5nLCBpZiBhIHByb3BlcnR5IChsaWtlIGBuYW1lYCkgY2FuJ3QgYmUgc2V0LCBqdXN0IGlnbm9yZSBpdFxyXG4gICAgfVxyXG59IiwiXG5cbi8vIHJhbmRvbSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxIChqdXN0IGxpa2UgTWF0aC5yYW5kb20pXG5leHBvcnRzLnJhbmRvbSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciByYW5kb21JbnRlZ2VyID0gZ2V0UmFuZG9tSW50KDAsMjU1KVxuICAgIHJldHVybiByYW5kb21JbnRlZ2VyLzI1NVxufVxuXG5mdW5jdGlvbiBnZXRSYW5kb21JbnQobWluLCBtYXgpIHtcbiAgICAvLyBDcmVhdGUgYnl0ZSBhcnJheSBhbmQgZmlsbCB3aXRoIDEgcmFuZG9tIG51bWJlclxuICAgIHZhciBieXRlQXJyYXkgPSBuZXcgVWludDhBcnJheSgxKTtcbiAgICB3aW5kb3cuY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhieXRlQXJyYXkpO1xuXG4gICAgdmFyIHJhbmdlID0gbWF4IC0gbWluICsgMTtcbiAgICB2YXIgbWF4X3JhbmdlID0gMjU2O1xuICAgIGlmIChieXRlQXJyYXlbMF0gPj0gTWF0aC5mbG9vcihtYXhfcmFuZ2UgLyByYW5nZSkgKiByYW5nZSlcbiAgICAgICAgcmV0dXJuIGdldFJhbmRvbUludChtaW4sIG1heCk7XG4gICAgcmV0dXJuIG1pbiArIChieXRlQXJyYXlbMF0gJSByYW5nZSk7XG59XG5cbi8vIFJldHVybnMgdGhlIHJlc3VsdHMgb2YgYSB5ZXMvbm8gd2VpZ2h0ZWQgbWFqb3JpdHkgdm90ZSBvbiBlYWNoIHNvY2lldGFsIHByZWZlcmVuY2UgYXMgYW4gYXJyYXkgd2hlcmVcbi8vIGVhY2ggaW5kZXggaW5kaWNhdGVzIHRoZSBzb2NpZXRhbCBvcHRpb24gYW5kIHRoZSB2YWx1ZSBpcyBlaXRoZXIgdHJ1ZSBvciBmYWxzZVxuLy8gZGVjaWRlcnMgLSBBbiBhcnJheSBvZiB3aW5uaW5nIGNhbmRpZGF0ZXMgaW4gdGhlIHNhbWUgZm9ybSBhcyB0aGlzLmVsZWN0IHJldHVybnNcbm1vZHVsZS5leHBvcnRzLmZpbmRTb2NpZXRhbE9wdGlvbnNPdXRjb21lcyA9IGZ1bmN0aW9uKGRlY2lkZXJzKSB7XG4gICAgdmFyIHZvdGVXZWlnaHRUb3RhbCA9IDBcbiAgICB2YXIgc29jaWV0YWxPcHRpb25zVm90ZXMgPSBbXVxuICAgIGRlY2lkZXJzLmZvckVhY2goZnVuY3Rpb24ocGVyc29uKSB7XG4gICAgICAgIHZvdGVXZWlnaHRUb3RhbCArPSBwZXJzb24ud2VpZ2h0XG4gICAgICAgIHBlcnNvbi5wcmVmZXJlbmNlcy5mb3JFYWNoKGZ1bmN0aW9uKHByZWZlcmVuY2UsIGluZGV4KSB7XG4gICAgICAgICAgICBpZihzb2NpZXRhbE9wdGlvbnNWb3Rlc1tpbmRleF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHNvY2lldGFsT3B0aW9uc1ZvdGVzW2luZGV4XSA9IDBcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYocHJlZmVyZW5jZSA+IDApIHtcbiAgICAgICAgICAgICAgICBzb2NpZXRhbE9wdGlvbnNWb3Rlc1tpbmRleF0gKz0gcGVyc29uLndlaWdodFxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0pXG5cbiAgICByZXR1cm4gc29jaWV0YWxPcHRpb25zVm90ZXMubWFwKGZ1bmN0aW9uKHZvdGVzRm9yT25lU29jaWV0YWxPcHRpb24pIHtcbiAgICAgICAgcmV0dXJuIHZvdGVzRm9yT25lU29jaWV0YWxPcHRpb24vdm90ZVdlaWdodFRvdGFsID4gLjVcbiAgICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cy52b3Rlck91dGNvbWVVdGlsaXR5ID0gZnVuY3Rpb24odm90ZXIsIG91dGNvbWVzKSB7XG4gICAgdmFyIHRvdGFsVXRpbGl0eSA9ICAwXG4gICAgdm90ZXIuZm9yRWFjaChmdW5jdGlvbih1dGlsaXR5LGluZGV4KSB7XG4gICAgICAgIGlmKG91dGNvbWVzW2luZGV4XSlcbiAgICAgICAgICAgIHRvdGFsVXRpbGl0eSArPSB1dGlsaXR5XG4gICAgfSlcblxuICAgIHJldHVybiB0b3RhbFV0aWxpdHlcbn0iLCJcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKVxuXG4vLyB2b3RlcyBhcmUgZmxvYXRpbmcgcG9pbnQgbnVtYmVycyBiZXR3ZWVuIDAgYW5kIDFcbmZ1bmN0aW9uIHJhbmdlU3RyYXRlZ3lfaG9uZXN0RXhhY3Qodm90ZXIsIGFnZ3JlZ2F0ZXMpIHtcbiAgICAvLyB0aGUgbWF4aW11bSB1dGlsaXR5IHRoYXQgdGhlIGJlc3QgZGljdGF0b3ItY2FuZGlkYXRlIHdvdWxkIGdpdmUgZm9yIHRoaXMgdm90ZXJcbiAgICB2YXIgbWF4VXRpbGl0eSA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGFnZ3JlZ2F0ZXMuY2FuZGlkYXRlRGljdGF0b3JVdGlsaXRpZXMpXG4gICAgdmFyIG1pblV0aWxpdHkgPSBNYXRoLm1pbi5hcHBseShudWxsLCBhZ2dyZWdhdGVzLmNhbmRpZGF0ZURpY3RhdG9yVXRpbGl0aWVzKVxuXG4gICAgcmV0dXJuIGFnZ3JlZ2F0ZXMuY2FuZGlkYXRlRGljdGF0b3JVdGlsaXRpZXMubWFwKGZ1bmN0aW9uKHV0aWxpdHkpIHtcbiAgICAgICAgaWYobWF4VXRpbGl0eSA9PT0gbWluVXRpbGl0eSkgeyAvLyB0aGlzIGJyYW5jaCBwcmV2ZW50cyBhIGRpdmlkZSBieSAwIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gLjVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB1dGlsaXR5RnJhY3Rpb24gPSAodXRpbGl0eS1taW5VdGlsaXR5KS8obWF4VXRpbGl0eS1taW5VdGlsaXR5KVxuICAgICAgICAgICAgcmV0dXJuIHV0aWxpdHlGcmFjdGlvblxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gcmFua2VkVm90ZV9ob25lc3Qodm90ZXIsIGFnZ3JlZ2F0ZXMpIHtcbiAgICB2YXIgb3JkZXIgPSBhZ2dyZWdhdGVzLmNhbmRpZGF0ZURpY3RhdG9yVXRpbGl0aWVzLm1hcChmdW5jdGlvbihjYW5kaWRhdGVVdGlsaXR5LCBpbmRleCkge1xuICAgICAgICByZXR1cm4ge3V0aWxpdHk6IGNhbmRpZGF0ZVV0aWxpdHksIGluZGV4OmluZGV4fVxuICAgIH0pLnNvcnQoZnVuY3Rpb24oYSxiKSB7XG4gICAgICAgIHJldHVybiBiLnV0aWxpdHktYS51dGlsaXR5IC8vIGhpZ2hlc3QgdG8gbG93ZXN0XG4gICAgfSlcblxuICAgIHJldHVybiBvcmRlci5tYXAoZnVuY3Rpb24oeCkge1xuICAgICAgICByZXR1cm4geC5pbmRleFxuICAgIH0pXG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcmFua2VkOiB7XG4gICAgICAgIEhvbmVzdDogcmFua2VkVm90ZV9ob25lc3RcbiAgICB9LFxuICAgIHNjb3JlZDoge1xuICAgICAgICBIb25lc3Q6IHJhbmdlU3RyYXRlZ3lfaG9uZXN0RXhhY3RcbiAgICB9LFxuICAgIG5vb3A6IHtcbiAgICAgICAgJyc6ZnVuY3Rpb24oKXt9XG4gICAgfVxufSIsInZhciByYW5kb20gPSByZXF1aXJlKFwiLi91dGlsc1wiKS5yYW5kb21cblxuXG5mdW5jdGlvbiBwbHVyYWxpdHlBbGcodm90ZXMsIGNhbmRpZGF0ZXMsIG1heFdpbm5lcnMpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdXG4gICAgZm9yKHZhciBuPTA7IG48Y2FuZGlkYXRlcy5sZW5ndGg7bisrKSB7XG4gICAgICAgIHJlc3VsdHNbbl0gPSAwXG4gICAgfVxuXG4gICAgdm90ZXMuZm9yRWFjaChmdW5jdGlvbih2b3RlKSB7XG4gICAgICAgIHJlc3VsdHNbdm90ZVswXV0rK1xuICAgIH0pXG5cbiAgICB2YXIgc29ydGVkVHJhbnNmb3JtZWRSZXN1bHRzID0gcmVzdWx0cy5tYXAoZnVuY3Rpb24odmFsdWUsaW5kZXgpe1xuICAgICAgICByZXR1cm4ge2NhbmRpZGF0ZTppbmRleCx2b3Rlczp2YWx1ZX1cbiAgICB9KS5zb3J0KGZ1bmN0aW9uKGEsYikge1xuICAgICAgICByZXR1cm4gYi52b3RlcyAtIGEudm90ZXMgLy8gcmV2ZXJzZSBzb3J0XG4gICAgfSlcblxuICAgIHJldHVybiBzb3J0ZWRUcmFuc2Zvcm1lZFJlc3VsdHMuc2xpY2UoMCxtYXhXaW5uZXJzKS5tYXAoZnVuY3Rpb24od2lubmVyKSB7XG4gICAgICAgIHJldHVybiB7aW5kZXg6IHdpbm5lci5jYW5kaWRhdGUsIHdlaWdodDoxfVxuICAgIH0pXG59XG5cblxuLy8gY291bnRUeXBlIGNhbiBlaXRoZXIgYmUgXCJub3JtYWxcIiBvciBcIm1heE1pbm9yaXR5XCJcbiAgICAvLyBub3JtYWwgaXMgd2hlcmUgdGhlIHdpbm5lcnMgYXJlIHRoZSB4IGNhbmRpZGF0ZXMgd2l0aCB0aGUgZ3JlYXRlc3QgdG90YWwgc2NvcmVcbiAgICAvLyBtYXhNaW5vcml0eSBpcyB3aGVyZSBlYWNoIHN1Y2Nlc3NpdmUgd2lubmVyIGlzIGNob3NlbiBmcm9tIG9ubHkgdGhlIHZvdGVzIG9mIHRob3NlIHdobyBoYXZlbid0IGNob3NlbiBhIHdpbm5lciBhcyB0aGVpciB0b3AgY2hvaWNlXG4gICAgLy8gcmV3ZWlnaHRlZCBpcyBmb3IgYSByZXdlaWdodGVkIHJhbmdlIHZvdGUgZGVzY3JpYmVkIGhlcmU7IGh0dHA6Ly93d3cucmFuZ2V2b3Rpbmcub3JnL1JSVi5odG1sXG4vLyB3aW5uZXJXZWlnaHRUeXBlIGNhbiBlaXRoZXIgYmUgXCJoaWdoZXN0XCIgb3IgXCJzcGxpdFwiXG4gICAgLy8gXCJoaWdoZXN0XCIgbWVhbnMgd2lubmVyIHZvdGUgd2VpZ2h0IHdpbGwgYmUgdGhlIHN1bSBvZiB0aGUgbnVtYmVyIG9mIHZvdGVycyB3aG8gZ2F2ZSB0aGF0IHdpbm5lciB0aGUgaGlnaGVzdCBzY29yZVxuICAgIC8vIFwic3BsaXRcIiBtZWFucyB3aW5uZXIgdm90ZSB3ZWlnaHQgaXMgdGhlIHN1bSBvZiBhbGwgdm90ZXNcbiAgICAvLyBcImVxdWFsXCIgbWVhbnMgZWFjaCB3aW5uZXIgZ2V0cyBhbiBlcXVhbCB2b3RlIHdlaWdodFxuLy8gbWluVGhyZXNob2xkIGlzIGEgbnVtYmVyIGZyb20gMCB0byAxIHJlcHJlc2VudGluZyB0aGUgcmF0aW8gb2YgYXZlcmFnZSBzY29yZSB0byB0aGUgYXZlcmFnZSBzY29yZSBvZiB0aGUgaGlnaGVzdCBzY29yaW5nIGNhbmRpZGF0ZVxuICAgIC8vIG5vdGUgdGhhdCB0aGUgdm90ZXMgYXJlIHNoaWZ0ZWQgc28gdGhhdCB0aGV5J3JlIGEgcmFuZ2UgZnJvbSAwIHRvIDIgZm9yIHRoZSBwdXJwb3NlcyBvZiBjYWxjdWxhdGluZyB0aGlzXG5mdW5jdGlvbiBkaXJlY3RSZXByZXNlbnRhdGlvblJhbmdlKGNvdW50VHlwZSwgd2lubmVyV2VpZ2h0VHlwZSwgbWluVGhyZXNob2xkKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHZvdGVzLCBjYW5kaWRhdGVzLCBtYXhXaW5uZXJzKSB7XG5cbiAgICAgICAgdmFyIHdpbm5lcnMgPSB7fSwgZGlzcXVhbGlmaWVkID0ge31cblxuICAgICAgICB2YXIgY291bnRlZFZvdGVzID0gY291bnRWb3RlcyhjYW5kaWRhdGVzLCB2b3Rlcywgd2lubmVycywgZGlzcXVhbGlmaWVkKVxuICAgICAgICB2YXIgbmV4dFdpbm5lciA9IGZpbmROZXh0V2lubmVyKGNvdW50ZWRWb3RlcylcbiAgICAgICAgdmFyIGhpZ2hlc3RBdmdTY29yZSA9IGdldEF2Z1Njb3JlKGNvdW50ZWRWb3Rlc1tuZXh0V2lubmVyXSlcblxuICAgICAgICBjb3VudGVkVm90ZXMuZm9yRWFjaChmdW5jdGlvbihpbmZvLCBjYW5kaWRhdGUpIHtcbiAgICAgICAgICAgIHZhciBhdmdTY29yZSA9IGdldEF2Z1Njb3JlKGluZm8pXG4gICAgICAgICAgICBpZihhdmdTY29yZSA8IGhpZ2hlc3RBdmdTY29yZSptaW5UaHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICBkaXNxdWFsaWZpZWRbY2FuZGlkYXRlXSA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICB3aW5uZXJzW25leHRXaW5uZXJdID0gdHJ1ZVxuXG4gICAgICAgIHdoaWxlKE9iamVjdC5rZXlzKHdpbm5lcnMpLmxlbmd0aCA8IG1heFdpbm5lcnMgJiYgT2JqZWN0LmtleXMod2lubmVycykubGVuZ3RoK09iamVjdC5rZXlzKGRpc3F1YWxpZmllZCkubGVuZ3RoIDwgY2FuZGlkYXRlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBuZXh0V2lubmVyQ291bnRlZFZvdGVzID0gY291bnRWb3RlcyhjYW5kaWRhdGVzLCB2b3Rlcywgd2lubmVycywgZGlzcXVhbGlmaWVkLCBjb3VudFR5cGUpXG5cbiAgICAgICAgICAgIHZhciBuZXh0V2lubmVyID0gZmluZE5leHRXaW5uZXIobmV4dFdpbm5lckNvdW50ZWRWb3RlcylcbiAgICAgICAgICAgIHdpbm5lcnNbbmV4dFdpbm5lcl0gPSB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICBpZih3aW5uZXJXZWlnaHRUeXBlID09PSAnaGlnaGVzdCcpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHRzID0gW11cbiAgICAgICAgICAgIHZhciByZXN1bHRzTWFwID0ge30gLy9tYXBzIGEgd2lubmVyIHRvIGEgcmVzdWx0IGluZGV4XG4gICAgICAgICAgICBmb3IodmFyIHdpbm5lciBpbiB3aW5uZXJzKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0c01hcFt3aW5uZXJdID0gcmVzdWx0cy5sZW5ndGhcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goe2luZGV4Ondpbm5lciwgd2VpZ2h0OjB9KVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2b3Rlcy5mb3JFYWNoKGZ1bmN0aW9uKHZvdGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgaGlnaGVzdFdpbm5lcnMgPSB7fSwgaGlnaGVzdFdpbm5lclNjb3JlID0gLUluZmluaXR5XG4gICAgICAgICAgICAgICAgdm90ZS5mb3JFYWNoKGZ1bmN0aW9uKHNjb3JlLCBjYW5kaWRhdGVJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBpZihjYW5kaWRhdGVJbmRleCBpbiB3aW5uZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzY29yZSA+IGhpZ2hlc3RXaW5uZXJTY29yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hlc3RXaW5uZXJzID0ge31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWdoZXN0V2lubmVyc1tjYW5kaWRhdGVJbmRleF0gPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGVzdFdpbm5lclNjb3JlID0gc2NvcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZihzY29yZSA9PT0gaGlnaGVzdFdpbm5lclNjb3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGVzdFdpbm5lcnNbY2FuZGlkYXRlSW5kZXhdID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIHZhciBudW1iZXJPZkhpZ2hlc3RXaW5uZXJzID0gT2JqZWN0LmtleXMoaGlnaGVzdFdpbm5lcnMpLmxlbmd0aFxuICAgICAgICAgICAgICAgIGZvcih2YXIgd2lubmVyIGluIGhpZ2hlc3RXaW5uZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHNbcmVzdWx0c01hcFt3aW5uZXJdXS53ZWlnaHQgKz0gMS9udW1iZXJPZkhpZ2hlc3RXaW5uZXJzXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIGlmKHdpbm5lcldlaWdodFR5cGUgPT09ICdzcGxpdCcpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHRzID0gW11cbiAgICAgICAgICAgIGZvcih2YXIgd2lubmVyIGluIHdpbm5lcnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXZnU2NvcmUgPSBjb3VudGVkVm90ZXNbd2lubmVyXS50b3RhbFNjb3JlL2NvdW50ZWRWb3Rlc1t3aW5uZXJdLnRvdGFsTnVtYmVyXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHtpbmRleDp3aW5uZXIsIHdlaWdodDphdmdTY29yZX0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZih3aW5uZXJXZWlnaHRUeXBlID09PSAnZXF1YWwnKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0cyA9IFtdXG4gICAgICAgICAgICBmb3IodmFyIHdpbm5lciBpbiB3aW5uZXJzKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHtpbmRleDp3aW5uZXIsIHdlaWdodDoxfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHRzXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0QXZnU2NvcmUoY2FuZGlkYXRlSW5mbykge1xuICAgICAgICByZXR1cm4gY2FuZGlkYXRlSW5mby50b3RhbFNjb3JlL2NhbmRpZGF0ZUluZm8udG90YWxOdW1iZXJcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaW5kTmV4dFdpbm5lcihjb3VudGVkVm90ZXMpIHtcbiAgICAgICAgdmFyIG5leHRXaW5uZXIsIGN1cldpbm5lclNjb3JlID0gLUluZmluaXR5XG4gICAgICAgIGNvdW50ZWRWb3Rlcy5mb3JFYWNoKGZ1bmN0aW9uKGluZm8sIGNhbmRpZGF0ZSkge1xuICAgICAgICAgICAgaWYoaW5mby50b3RhbFNjb3JlID4gY3VyV2lubmVyU2NvcmUpIHtcbiAgICAgICAgICAgICAgICBuZXh0V2lubmVyID0gY2FuZGlkYXRlXG4gICAgICAgICAgICAgICAgY3VyV2lubmVyU2NvcmUgPSBpbmZvLnRvdGFsU2NvcmVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICByZXR1cm4gbmV4dFdpbm5lclxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvdW50Vm90ZXMoY2FuZGlkYXRlcywgdm90ZXMsIHdpbm5lcnMsIGRpc3F1YWxpZmllZCwgY291bnRUeXBlKSB7XG4gICAgICAgIGlmKHdpbm5lcnMgPT09IHVuZGVmaW5lZCkgd2lubmVycyA9IHt9XG4gICAgICAgIHZhciBjb3VudGVkVm90ZXMgPSBjYW5kaWRhdGVzLm1hcChmdW5jdGlvbihwLGMpe1xuICAgICAgICAgICAgaWYoIShjIGluIHdpbm5lcnMpICYmICEoYyBpbiBkaXNxdWFsaWZpZWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHt0b3RhbFNjb3JlOjAsIHRvdGFsTnVtYmVyOjB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB7dG90YWxTY29yZTotSW5maW5pdHksIHRvdGFsTnVtYmVyOjB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIHZvdGVzLmZvckVhY2goZnVuY3Rpb24odm90ZSkge1xuICAgICAgICAgICAgaWYoY291bnRUeXBlID09PSAnbWF4TWlub3JpdHknKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhpZ2hlc3RDYW5kaWRhdGVzID0ge30sIGhpZ2hlc3RTY29yZSA9IC1JbmZpbml0eVxuICAgICAgICAgICAgICAgIHZvdGUuZm9yRWFjaChmdW5jdGlvbihzY29yZSwgY2FuZGlkYXRlSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYoc2NvcmUgPiBoaWdoZXN0U2NvcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hlc3RDYW5kaWRhdGVzID0ge31cbiAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hlc3RDYW5kaWRhdGVzW2NhbmRpZGF0ZUluZGV4XSA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hlc3RTY29yZSA9IHNjb3JlXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZihzY29yZSA9PT0gaGlnaGVzdFNjb3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoaWdoZXN0Q2FuZGlkYXRlc1tjYW5kaWRhdGVJbmRleF0gPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgZm9yKHZhciBjIGluIGhpZ2hlc3RDYW5kaWRhdGVzKSB7ICAvLyBvbmx5IGNvdW50IHZvdGVzIGZvciBwZW9wbGUgd2hvJ3MgaGlnaGVzdCBjaG9pY2UgaXNuJ3QgYSB3aW5uZXJcbiAgICAgICAgICAgICAgICAgICAgaWYoYyBpbiB3aW5uZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47IC8vIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYoY291bnRUeXBlID09PSAncmV3ZWlnaHRlZCcpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3VtU2NvcmVGb3JXaW5uZXJzID0gMFxuICAgICAgICAgICAgICAgIHZvdGUuZm9yRWFjaChmdW5jdGlvbihzY29yZSwgY2FuZGlkYXRlSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYoY2FuZGlkYXRlSW5kZXggaW4gd2lubmVycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VtU2NvcmVGb3JXaW5uZXJzICs9IHNjb3JlXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgdmFyIHdlaWdodCA9IDEvKDErc3VtU2NvcmVGb3JXaW5uZXJzLzIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZvdGUuZm9yRWFjaChmdW5jdGlvbihzY29yZSwgY2FuZGlkYXRlSW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpZighKGNhbmRpZGF0ZUluZGV4IGluIGRpc3F1YWxpZmllZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhhc250Q2hvc2VuQVdpbm5lciA9ICEoY2FuZGlkYXRlSW5kZXggaW4gd2lubmVycylcbiAgICAgICAgICAgICAgICAgICAgaWYoY291bnRUeXBlID09PSAncmV3ZWlnaHRlZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVJbmRleF0udG90YWxTY29yZSArPSBzY29yZSp3ZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVJbmRleF0udG90YWxOdW1iZXIgKytcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKGNvdW50VHlwZSAhPT0gJ21heE1pbm9yaXR5JyB8fCBoYXNudENob3NlbkFXaW5uZXIpIHsgIC8vIG9ubHkgY291bnQgdm90ZXMgZm9yIG5ldyBwb3RlbnRpYWwgd2lubmVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRlZFZvdGVzW2NhbmRpZGF0ZUluZGV4XS50b3RhbFNjb3JlICs9IHNjb3JlXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudGVkVm90ZXNbY2FuZGlkYXRlSW5kZXhdLnRvdGFsTnVtYmVyICsrXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgICByZXR1cm4gY291bnRlZFZvdGVzXG4gICAgfVxufVxuXG4vLyB0aHJlc2hvbGQgLSBhIG51bWJlciBiZXR3ZWVuIDAgYW5kIDEgaW5jbHVzaXZlXG5mdW5jdGlvbiBmcmFjdGlvbmFsUmVwcmVzZW50YXRpdmVSYW5rZWRWb3RlKHRocmVzaG9sZCkge1xuICAgIHJldHVybiBmdW5jdGlvbih2b3RlcywgY2FuZGlkYXRlcywgbWF4V2lubmVycykge1xuICAgICAgICB2YXIgbWluaW11bVdpbm5pbmdWb3RlcyA9IHZvdGVzLmxlbmd0aCp0aHJlc2hvbGRcbiAgICAgICAgdmFyIG9yaWdpbmFsVm90ZXMgPSB2b3Rlc1xuXG4gICAgICAgIHZhciBjdXJyZW50V2lubmVycyA9IHt9LCBjb3VudGVkVm90ZXMgPSBjYW5kaWRhdGVzLm1hcChmdW5jdGlvbigpe3JldHVybiAwfSlcbiAgICAgICAgdm90ZXMuZm9yRWFjaChmdW5jdGlvbih2b3RlKSB7XG4gICAgICAgICAgICB2YXIgY2FuZGlkYXRlSW5kZXggPSB2b3RlWzBdXG4gICAgICAgICAgICBjb3VudGVkVm90ZXNbY2FuZGlkYXRlSW5kZXhdICsrXG4gICAgICAgIH0pXG5cbiAgICAgICAgLy8gc2VsZWN0IGluaXRpYWwgd2lubmVyc1xuICAgICAgICBmb3IodmFyIGNhbmRpZGF0ZUluZGV4IGluIGNvdW50ZWRWb3Rlcykge1xuICAgICAgICAgICAgdmFyIHZvdGVzRm9yVGhpc0NhbmRpZGF0ZSA9IGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVJbmRleF1cbiAgICAgICAgICAgIGlmKHZvdGVzRm9yVGhpc0NhbmRpZGF0ZSA+PSBtaW5pbXVtV2lubmluZ1ZvdGVzKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFdpbm5lcnNbY2FuZGlkYXRlSW5kZXhdID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVtb3ZlIHZvdGVzIG9mIHRob3NlIHdobyBoYXZlIGNob3NlbiBhIHdpbm5lclxuICAgICAgICB2b3RlcyA9IHZvdGVzLmZpbHRlcihmdW5jdGlvbih2b3RlKSB7XG4gICAgICAgICAgICByZXR1cm4gISh2b3RlWzBdIGluIGN1cnJlbnRXaW5uZXJzKVxuICAgICAgICB9KVxuXG4gICAgICAgIC8vIGl0ZXJhdGUgdGhyb3VnaCBwcmVmZXJlbmNlcyB0byBmaW5kIG1vcmUgd2lubmVyc1xuICAgICAgICBmb3IodmFyIGN1cnJlbnRQcmVmZXJlbmNlSW5kZXggPSAxOyBjdXJyZW50UHJlZmVyZW5jZUluZGV4PGNhbmRpZGF0ZXMubGVuZ3RoOyBjdXJyZW50UHJlZmVyZW5jZUluZGV4KyspIHtcbiAgICAgICAgICAgIHZvdGVzLmZvckVhY2goZnVuY3Rpb24odm90ZSkge1xuICAgICAgICAgICAgICAgIHZhciBjYW5kaWRhdGVJbmRleCA9IHZvdGVbY3VycmVudFByZWZlcmVuY2VJbmRleF1cbiAgICAgICAgICAgICAgICBjb3VudGVkVm90ZXNbY2FuZGlkYXRlSW5kZXhdICsrXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAvLyBpZiB0aGVyZSBhcmUgYW55IHdpbm5lcnMgY29tYmluaW5nIHByZWZlcmVuY2VzIDAgdGhyb3VnaCBuLCBjaG9vc2UgYmVzdCB3aW5uZXIgd2hvIGlzbid0IGFscmVhZHkgYSB3aW5uZXJcbiAgICAgICAgICAgIHZhciBsZWFkaW5nTm9uV2lubmVyLCBsZWFkaW5nTm9uV2lubmVyVm90ZXMgPSAwXG4gICAgICAgICAgICBmb3IodmFyIGNhbmRpZGF0ZUluZGV4IGluIGNvdW50ZWRWb3Rlcykge1xuICAgICAgICAgICAgICAgIHZhciB2b3Rlc0ZvclRoaXNDYW5kaWRhdGUgPSBjb3VudGVkVm90ZXNbY2FuZGlkYXRlSW5kZXhdXG4gICAgICAgICAgICAgICAgaWYodm90ZXNGb3JUaGlzQ2FuZGlkYXRlID49IG1pbmltdW1XaW5uaW5nVm90ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYoIShjYW5kaWRhdGVJbmRleCBpbiBjdXJyZW50V2lubmVycykgJiYgdm90ZXNGb3JUaGlzQ2FuZGlkYXRlID4gbGVhZGluZ05vbldpbm5lclZvdGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZWFkaW5nTm9uV2lubmVyID0gY2FuZGlkYXRlSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlYWRpbmdOb25XaW5uZXJWb3RlcyA9IHZvdGVzRm9yVGhpc0NhbmRpZGF0ZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZihsZWFkaW5nTm9uV2lubmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50V2lubmVyc1tsZWFkaW5nTm9uV2lubmVyXSA9IHRydWVcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcmVkYWN0IHZvdGVzIGJ5IHZvdGVycyB3aG8gaGF2ZSBjaG9zZW4gYSB3aW5uZXIgZnJvbSBub24td2lubmVycyB0aGV5IHByZXZpb3VzbHkgY2hvc2VcbiAgICAgICAgICAgIHZvdGVzLmZvckVhY2goZnVuY3Rpb24odm90ZSkge1xuICAgICAgICAgICAgICAgIHZhciBjdXJDYW5kaWRhdGVJbmRleCA9IHZvdGVbY3VycmVudFByZWZlcmVuY2VJbmRleF1cbiAgICAgICAgICAgICAgICBpZihjdXJDYW5kaWRhdGVJbmRleCBpbiBjdXJyZW50V2lubmVycykge1xuICAgICAgICAgICAgICAgICAgICBmb3IodmFyIG49MDsgbjxjdXJyZW50UHJlZmVyZW5jZUluZGV4OyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjYW5kaWRhdGVQcmVmZXJlbmNlSW5kZXggPSB2b3RlW25dXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudGVkVm90ZXNbY2FuZGlkYXRlUHJlZmVyZW5jZUluZGV4XSAtLVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgLy8gcmVtb3ZlIHZvdGVzIG9mIHRob3NlIHdobyBoYXZlIGp1c3QgY2hvc2VuIGEgd2lubmVyXG4gICAgICAgICAgICB2b3RlcyA9IHZvdGVzLmZpbHRlcihmdW5jdGlvbih2b3RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICEodm90ZVtjdXJyZW50UHJlZmVyZW5jZUluZGV4XSBpbiBjdXJyZW50V2lubmVycylcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGlzIG5lZWRzIHRvIGhhcHBlbiBiZWNhdXNlIGl0cyBwb3NzaWJsZSBmb3IgYSB2b3RlIHRvIGJlIGNvdW50ZWQgZm9yIGFuIGVhcmxpZXIgd2lubmVyLFxuICAgICAgICAvLyB3aGVuIHRoZSB2b3RlJ3MgcHJlZmVyZW5jZSBpcyBmb3IgYSB3aW5uZXIgdGhhdCB3YXMgY2hvc2VuIGluIGEgbGF0ZXIgcm91bmRcbiAgICAgICAgdmFyIHdpbm5lcnNSZWNvdW50ID0gY2FuZGlkYXRlcy5tYXAoZnVuY3Rpb24oKXtyZXR1cm4gMH0pXG4gICAgICAgIG9yaWdpbmFsVm90ZXMuZm9yRWFjaChmdW5jdGlvbih2b3RlKSB7XG4gICAgICAgICAgICBmb3IodmFyIG49MDtuPHZvdGUubGVuZ3RoO24rKykge1xuICAgICAgICAgICAgICAgIGlmKHZvdGVbbl0gaW4gY3VycmVudFdpbm5lcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgd2lubmVyc1JlY291bnRbdm90ZVtuXV0gKytcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIHZhciBmaW5hbFdpbm5lcnMgPSBbXVxuICAgICAgICBmb3IodmFyIGNhbmRpZGF0ZUluZGV4IGluIGN1cnJlbnRXaW5uZXJzKSB7XG4gICAgICAgICAgICB2YXIgdm90ZXNGb3JUaGlzQ2FuZGlkYXRlID0gd2lubmVyc1JlY291bnRbY2FuZGlkYXRlSW5kZXhdXG4gICAgICAgICAgICBmaW5hbFdpbm5lcnMucHVzaCh7aW5kZXg6IGNhbmRpZGF0ZUluZGV4LCB3ZWlnaHQ6dm90ZXNGb3JUaGlzQ2FuZGlkYXRlL29yaWdpbmFsVm90ZXMubGVuZ3RofSlcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmaW5hbFdpbm5lcnMuc2xpY2UoMCwgbWF4V2lubmVycylcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNpbmdsZVRyYW5zZmVycmFibGVWb3RlKHZvdGVzLCBjYW5kaWRhdGVzLCBtYXhXaW5uZXJzKSB7XG5cbiAgICB2YXIgc2VhdHMgPSBtYXhXaW5uZXJzXG4gICAgdmFyIHZvdGVRdW90YSA9IDErdm90ZXMubGVuZ3RoLyhzZWF0cysxKVxuXG4gICAgdmFyIG5ld1ZvdGVzTWFwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB2b3Rlc0xpc3QgPSB7fVxuICAgICAgICBjYW5kaWRhdGVzLmZvckVhY2goZnVuY3Rpb24oY2FuZGlkYXRlLCBpbmRleCl7XG4gICAgICAgICAgICB2b3Rlc0xpc3RbaW5kZXhdID0ge2N1cnJlbnRWb3RlczogW10sIGN1cnJlbnRDb3VudDowfVxuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiB2b3Rlc0xpc3RcbiAgICB9XG5cbiAgICB2YXIgY291bnRlZFZvdGVzID0gbmV3Vm90ZXNNYXAoKSwgY3VycmVudFdpbm5lcnMgPSB7fSwgZWxpbWluYXRlZENhbmRpZGF0ZXMgPSB7fVxuICAgIHZvdGVzLmZvckVhY2goZnVuY3Rpb24odm90ZSkge1xuICAgICAgICB2YXIgY2FuZGlkYXRlID0gY291bnRlZFZvdGVzW3ZvdGVbMF1dXG4gICAgICAgIGNhbmRpZGF0ZS5jdXJyZW50Vm90ZXMucHVzaCh7dm90ZTp2b3RlLCB3ZWlnaHQ6MSwgY3VycmVudFByZWZlcmVuY2VJbmRleDowfSlcbiAgICAgICAgY2FuZGlkYXRlLmN1cnJlbnRDb3VudCArK1xuICAgIH0pXG5cbiAgICB2YXIgdHJhbnNmZXJWb3RlcyA9IGZ1bmN0aW9uKHRyYW5zZmVyT3JpZ2luLCB0cmFuc2ZlckRlc3RpbmF0aW9uLCByYXRpb1RvVHJhbnNmZXIpIHtcbiAgICAgICAgdHJhbnNmZXJPcmlnaW4uY3VycmVudFZvdGVzLmZvckVhY2goZnVuY3Rpb24odm90ZUluZm8pIHtcbiAgICAgICAgICAgIHZhciBuZXdDYW5kaWRhdGVQcmVmZXJlbmNlID0gdm90ZUluZm8uY3VycmVudFByZWZlcmVuY2VJbmRleCArMVxuICAgICAgICAgICAgd2hpbGUodHJ1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0Q2FuZGlkYXRlUHJlZmVyZW5jZSA9IHZvdGVJbmZvLnZvdGVbbmV3Q2FuZGlkYXRlUHJlZmVyZW5jZV1cbiAgICAgICAgICAgICAgICBpZihuZXh0Q2FuZGlkYXRlUHJlZmVyZW5jZSBpbiBlbGltaW5hdGVkQ2FuZGlkYXRlcyB8fCBuZXh0Q2FuZGlkYXRlUHJlZmVyZW5jZSBpbiBjdXJyZW50V2lubmVycykge1xuICAgICAgICAgICAgICAgICAgICBuZXdDYW5kaWRhdGVQcmVmZXJlbmNlICsrXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBjYW5kaWRhdGVJbmRleCA9IHZvdGVJbmZvLnZvdGVbbmV3Q2FuZGlkYXRlUHJlZmVyZW5jZV1cbiAgICAgICAgICAgIGlmKGNhbmRpZGF0ZUluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0cmFuc2ZlckRlc3RpbmF0aW9uW2NhbmRpZGF0ZUluZGV4XS5jdXJyZW50Vm90ZXMucHVzaCh7ICAgICAgICAvLyB0cmFuc2ZlciB0aGUgZXhjZXNzXG4gICAgICAgICAgICAgICAgICAgIHZvdGU6dm90ZUluZm8udm90ZSxcbiAgICAgICAgICAgICAgICAgICAgd2VpZ2h0OnZvdGVJbmZvLndlaWdodCpyYXRpb1RvVHJhbnNmZXIsXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRQcmVmZXJlbmNlSW5kZXg6bmV3Q2FuZGlkYXRlUHJlZmVyZW5jZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgdHJhbnNmZXJEZXN0aW5hdGlvbltjYW5kaWRhdGVJbmRleF0uY3VycmVudENvdW50ICs9IHZvdGVJbmZvLndlaWdodCpyYXRpb1RvVHJhbnNmZXJcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy90cmFuc2Zlck9yaWdpbi5jdXJyZW50Q291bnQgLT0gdm90ZUluZm8ud2VpZ2h0KnJhdGlvVG9UcmFuc2ZlciAvLyBqdXN0IGZvciB0ZXN0aW5nIC8vIHRvZG86IGNvbW1lbnQgdGhpcyBvdXRcbiAgICAgICAgICAgIHZvdGVJbmZvLndlaWdodCAqPSAoMS1yYXRpb1RvVHJhbnNmZXIpIC8vIGtlZXAgdGhlIHJlbWFpbmRlclxuICAgICAgICB9KVxuICAgIH1cblxuICAgIHdoaWxlKHRydWUpIHtcbiAgICAgICAgdmFyIHZvdGVzSW5UcmFuZmVyID0gbmV3Vm90ZXNNYXAoKVxuICAgICAgICB3aGlsZSh0cnVlKSB7XG4gICAgICAgICAgICB2YXIgZXhjZXNzRm91bmQgPSBmYWxzZVxuICAgICAgICAgICAgZm9yKHZhciBjYW5kaWRhdGVJbmRleCBpbiBjb3VudGVkVm90ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgdm90ZXMgPSBjb3VudGVkVm90ZXNbY2FuZGlkYXRlSW5kZXhdLmN1cnJlbnRDb3VudFxuICAgICAgICAgICAgICAgIGlmKHZvdGVzID49IHZvdGVRdW90YSAtIC4wMSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50V2lubmVyc1tjYW5kaWRhdGVJbmRleF0gPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGlmKHZvdGVzID4gdm90ZVF1b3RhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBleGNlc3NGb3VuZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBleGNlc3NWb3RlcyA9IHZvdGVzIC0gdm90ZVF1b3RhXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXhjZXNzUmF0aW8gPSBleGNlc3NWb3Rlcy92b3Rlc1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2ZlclZvdGVzKGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVJbmRleF0sIHZvdGVzSW5UcmFuZmVyLCBleGNlc3NSYXRpbylcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2hlbiB0ZXN0aW5nLCBlbnN1cmUgdGhhdCBjb3VudGVkVm90ZXNbY2FuZGlkYXRlSW5kZXhdLmN1cnJlbnRDb3VudCBhbHJlYWR5IGlzIGVxdWFsIHRvIHZvdGVRdW90YSB3aGVuIHRlc3RpbmcgbGluZSBBIGlzIHVuY29tbWVudGVkXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudGVkVm90ZXNbY2FuZGlkYXRlSW5kZXhdLmN1cnJlbnRDb3VudCA9IHZvdGVRdW90YVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZighZXhjZXNzRm91bmQpIHtcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IodmFyIGNhbmRpZGF0ZUluZGV4IGluIHZvdGVzSW5UcmFuZmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdWb3RlcyA9IHZvdGVzSW5UcmFuZmVyW2NhbmRpZGF0ZUluZGV4XVxuICAgICAgICAgICAgICAgICAgICBuZXdWb3Rlcy5jdXJyZW50Vm90ZXMuZm9yRWFjaChmdW5jdGlvbih2b3RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudGVkVm90ZXNbY2FuZGlkYXRlSW5kZXhdLmN1cnJlbnRWb3Rlcy5wdXNoKHZvdGUpXG4gICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgaWYobmV3Vm90ZXMuY3VycmVudENvdW50ID4gMClcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVJbmRleF0uY3VycmVudENvdW50ICs9IG5ld1ZvdGVzLmN1cnJlbnRDb3VudFxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZvdGVzSW5UcmFuZmVyID0gbmV3Vm90ZXNNYXAoKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYoT2JqZWN0LmtleXMoY3VycmVudFdpbm5lcnMpLmxlbmd0aCA8IHNlYXRzKSB7XG4gICAgICAgICAgICAvLyBmaW5kIGNhbmRpZGF0ZSB3aXRoIGxlYXN0IHZvdGVzXG4gICAgICAgICAgICB2YXIgY2FuZGlkYXRlV2l0aExlYXN0Q291bnQ9dW5kZWZpbmVkLCBsb3dlc3RDb3VudD11bmRlZmluZWRcbiAgICAgICAgICAgIGZvcih2YXIgY2FuZGlkYXRlSW5kZXggaW4gY291bnRlZFZvdGVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNhbmRpZGF0ZSA9IGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVJbmRleF1cbiAgICAgICAgICAgICAgICBpZihsb3dlc3RDb3VudCA9PT0gdW5kZWZpbmVkIHx8IGNhbmRpZGF0ZS5jdXJyZW50Q291bnQgPCBsb3dlc3RDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICBsb3dlc3RDb3VudCA9IGNhbmRpZGF0ZS5jdXJyZW50Q291bnRcbiAgICAgICAgICAgICAgICAgICAgY2FuZGlkYXRlV2l0aExlYXN0Q291bnQgPSBjYW5kaWRhdGVJbmRleFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxpbWluYXRlZENhbmRpZGF0ZXNbY2FuZGlkYXRlV2l0aExlYXN0Q291bnRdID0gdHJ1ZVxuXG4gICAgICAgICAgICAvLyB0cmFuc2ZlciB2b3RlcyBmcm9tIHRoYXQgY2FuZGlkYXRlXG4gICAgICAgICAgICB0cmFuc2ZlclZvdGVzKGNvdW50ZWRWb3Rlc1tjYW5kaWRhdGVXaXRoTGVhc3RDb3VudF0sIGNvdW50ZWRWb3RlcywgMSlcblxuICAgICAgICAgICAgaWYoT2JqZWN0LmtleXMoY291bnRlZFZvdGVzKS5sZW5ndGggPT09IDEpIHsgLy8gaWYgdGhlcmUncyBvbmx5IG9uZSBjYW5kaWRhdGUgbGVmdCwgbWFrZSB0aGVtIGEgd2lubmVyIGV2ZW4gdGhvIHRoZXkgZGlkbid0IHJlYWNoIHRoZSBxdW90YVxuICAgICAgICAgICAgICAgIGN1cnJlbnRXaW5uZXJzW2NhbmRpZGF0ZVdpdGhMZWFzdENvdW50XSA9IHRydWVcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBlbGltaW5hdGUgdGhlIGNhbmRpZGF0ZVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBjb3VudGVkVm90ZXNbY2FuZGlkYXRlV2l0aExlYXN0Q291bnRdXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGZpbmFsV2lubmVycyA9IFtdXG4gICAgZm9yKHZhciBjYW5kaWRhdGVJbmRleCBpbiBjdXJyZW50V2lubmVycykge1xuICAgICAgICBmaW5hbFdpbm5lcnMucHVzaCh7aW5kZXg6IGNhbmRpZGF0ZUluZGV4LCB3ZWlnaHQ6MX0pXG4gICAgfVxuXG4gICAgcmV0dXJuIGZpbmFsV2lubmVyc1xufVxuXG4vLyBIb25lc3RseSB0aGlzIHdpbGwgb25seSByZXR1cm4gbWF4V2lubmVycyA9IDEgbm8gbWF0dGVyIHdoYXQgcmlnaHQgbm93XG5mdW5jdGlvbiBwb3dlckluc3RhbnRSdW5vZmYodm90ZXMsIGNhbmRpZGF0ZXMsIG1heFdpbm5lcnMpIHtcblxuICAgIC8vIHZhciB0b3BXaW5uZXJzID0gc2luZ2xlVHJhbnNmZXJyYWJsZVZvdGUodm90ZXMsIGNhbmRpZGF0ZXMsIE1hdGgubWF4KDQsIG1heFdpbm5lcnMgKyAxKSk7XG4gICAgdmFyIHRvcFdpbm5lcnMgPSBzaW5nbGVUcmFuc2ZlcnJhYmxlVm90ZSh2b3RlcywgY2FuZGlkYXRlcywgNSk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyh0b3BXaW5uZXJzKTtcblxuICAgIGlmIChtYXhXaW5uZXJzID09IHRvcFdpbm5lcnMubGVuZ3RoIHx8IHRvcFdpbm5lcnMubGVuZ3RoIDw9IDEpIHJldHVybiB0b3BXaW5uZXJzO1xuXG4gICAgaWYgKHRvcFdpbm5lcnMubGVuZ3RoID09IDIpIHtcbiAgICAgICAgdG9wV2lubmVyc1syXSA9IHtcbiAgICAgICAgICAgIGluZGV4OiB0b3BXaW5uZXJzWzBdLmluZGV4LFxuICAgICAgICAgICAgd2VpZ2h0OiAxLFxuICAgICAgICAgICAgcHJlZmVyZW5jZXM6IHRvcFdpbm5lcnNbMF0ucHJlZmVyZW5jZXNcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBKdXN0IGluIGNhc2VcbiAgICB0b3BXaW5uZXJzLnNsaWNlKDAsIDMpO1xuXG4gICAgLy8gRmluZCBDb25kb3JjZXQgLyB3ZWlnaHRlZCB3aW5uZXJcblxuICAgIC8vIG1hcCBvZiByZXN1bHQgY291bnRzIGZvciBjYW5kaWRhdGUgdnMgZWFjaCBvZiB0aGUgb3RoZXJzXG4gICAgdmFyIG5ld1ZvdGVzTWFwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB2b3Rlc0xpc3QgPSB7XG4gICAgICAgICAgICBbdG9wV2lubmVyc1swXS5pbmRleF06IHtbdG9wV2lubmVyc1sxXS5pbmRleF06IDAsW3RvcFdpbm5lcnNbMl0uaW5kZXhdOiAwIH0sXG4gICAgICAgICAgICBbdG9wV2lubmVyc1sxXS5pbmRleF06IHtbdG9wV2lubmVyc1swXS5pbmRleF06IDAsW3RvcFdpbm5lcnNbMl0uaW5kZXhdOiAwIH0sXG4gICAgICAgICAgICBbdG9wV2lubmVyc1syXS5pbmRleF06IHtbdG9wV2lubmVyc1swXS5pbmRleF06IDAsW3RvcFdpbm5lcnNbMV0uaW5kZXhdOiAwIH0sXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZvdGVzTGlzdFxuICAgIH1cblxuICAgIHZhciBjb3VudGVkVm90ZXMgPSBuZXdWb3Rlc01hcCgpLCBjdXJyZW50V2lubmVyID0gbnVsbCwgdG9wQ291bnQgPSAwO1xuXG4gICAgZm9yICh2YXIgaT0wOyBpPHRvcFdpbm5lcnMubGVuZ3RoLCBpKys7KSB7XG4gICAgICAgIHZhciBpSW5kZXggPSB0b3BXaW5uZXJzW2ldLmluZGV4O1xuICAgICAgICBmb3IgKHZhciBqPTA7IGo8dG9wV2lubmVycy5sZW5ndGgsIGorKzspIHtcbiAgICAgICAgICAgIGlmIChpID09IGopIGNvbnRpbnVlO1xuICAgICAgICAgICAgdmFyIGpJbmRleCA9IHRvcFdpbm5lcnNbal0uaW5kZXg7XG5cbiAgICAgICAgICAgIHZvdGVzLmZvckVhY2goZnVuY3Rpb24odm90ZSkge1xuICAgICAgICAgICAgICAgIC8vIFNlZSB3aG8gaXMgZWFybGllciBpbiB0aGUgdm90ZSBzZXF1ZW5jZVxuICAgICAgICAgICAgICAgIC8vIERvIHdlIHdhbnQgdG8gdGVzdCBmb3IgLTE/XG4gICAgICAgICAgICAgICAgaWYgKHZvdGUuaW5kZXhPZihpSW5kZXgpIDwgdm90ZS5pbmRleE9mKGpJbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdm90ZXIgcmFua2VkIGNhbmRpZGF0ZSBpIGFoZWFkIG9mIGpcbiAgICAgICAgICAgICAgICAgICAgaWYoKytjb3VudGVkVm90ZXNbaUluZGV4XVtqSW5kZXhdID49IHRvcENvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgIHRvcENvdW50ID0gY291bnRlZFZvdGVzW2lJbmRleF1bakluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRXaW5uZXIgPSBpSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyB2b3RlciByYW5rZWQgY2FuZGlkYXRlIGogYWhlYWQgb2YgaVxuICAgICAgICAgICAgICAgICAgICBpZigrK2NvdW50ZWRWb3Rlc1tqSW5kZXhdW2lJbmRleF0gPj0gdG9wQ291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcENvdW50ID0gY291bnRlZFZvdGVzW2pJbmRleF1baUluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRXaW5uZXIgPSBqSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gcmV0dXJucyB0aGUgd2lubmVyIGluZGV4IGlmIHRoZXJlIGlzIGEgQ29uZG9yY2V0IHdpbm5lciwgZWxzZSBudWxsXG4gICAgZnVuY3Rpb24gZmluZENvbmRvcmNldFdpbm5lcih2b3RlTWFwKSB7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2codm90ZU1hcCk7XG5cbiAgICAgICAgdmFyIGNXaW5uZXIgPSBudWxsO1xuICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZvdGVNYXApO1xuICAgICAgICBmb3IgKHZhciBpPTA7IGk8MzsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodm90ZU1hcFtrZXlzWzBdXVtrZXlzWzFdXSA+IHZvdGVNYXBba2V5c1sxXV1ba2V5c1swXV0gJiZcbiAgICAgICAgICAgICAgICB2b3RlTWFwW2tleXNbMF1dW2tleXNbMl1dID4gdm90ZU1hcFtrZXlzWzJdXVtrZXlzWzBdXSkge1xuICAgICAgICAgICAgICAgIGNXaW5uZXIgPSBba2V5XTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGtleXMucHVzaChrZXlzLnNoaWZ0KCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjV2lubmVyO1xuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKGNvdW50ZWRWb3Rlcyk7XG5cbiAgICAvLyBDaGVjayBmb3IgQ29uZG9yY2V0IHdpbm5lclxuICAgIHZhciBmaW5hbFdpbm5lciA9IGZpbmRDb25kb3JjZXRXaW5uZXIoY291bnRlZFZvdGVzKTtcblxuICAgIC8vIGNvbnNvbGUubG9nKGZpbmFsV2lubmVyKTtcblxuICAgIC8vIElmIG5vIHdpbm5lciB1c2UgdGhlIGhpZ2hlc3QgY291bnQocylcbiAgICBpZiAoIWZpbmFsV2lubmVyKSB7XG4gICAgICAgIGZpbmFsV2lubmVyID0gW107XG4gICAgICAgIGZvciAoY29uc3QgW2luZGV4LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoY291bnRlZFZvdGVzKSkge1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmIChPYmplY3QudmFsdWVzKHZhbHVlKS5pbmRleE9mKHRvcENvdW50KSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbmFsV2lubmVyLnB1c2goaW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciByZXQgPSB0b3BXaW5uZXJzLmZpbHRlcih4ID0+IHsgcmV0dXJuIGZpbmFsV2lubmVyLmluZGV4T2YoeC5pbmRleCkgPj0gMCB9KTtcblxuICAgIC8vIGNvbnNvbGUubG9nKHJldCk7XG5cbiAgICByZXR1cm4gcmV0O1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHJhbmRvbToge1xuICAgICAgICAnJzpmdW5jdGlvbih2b3RlcywgY2FuZGlkYXRlcywgbWF4V2lubmVycykge1xuICAgICAgICAgICAgaWYoY2FuZGlkYXRlcy5sZW5ndGggPCBtYXhXaW5uZXJzKSBtYXhXaW5uZXJzID0gY2FuZGlkYXRlcy5sZW5ndGhcblxuICAgICAgICAgICAgdmFyIHdpbm5lcnMgPSBbXVxuICAgICAgICAgICAgZm9yKHZhciBuPTA7IG48bWF4V2lubmVyczspIHtcbiAgICAgICAgICAgICAgICB2YXIgd2lubmVyID0gTWF0aC5yb3VuZChyYW5kb20oKSooY2FuZGlkYXRlcy5sZW5ndGgtMSkpXG4gICAgICAgICAgICAgICAgaWYod2lubmVycy5pbmRleE9mKHdpbm5lcikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbm5lcnMucHVzaCh3aW5uZXIpXG4gICAgICAgICAgICAgICAgICAgIG4rK1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHdpbm5lcnMubWFwKGZ1bmN0aW9uKHdpbm5lcikge1xuICAgICAgICAgICAgICAgIHJldHVybiB7aW5kZXg6IHdpbm5lciwgd2VpZ2h0OjF9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfSxcbiAgICByYW5kb21Wb3RlcnNDaG9pY2U6IHtcbiAgICAgICAgJ3NpbmdsZSB2b3Rlcic6ZnVuY3Rpb24odm90ZXMsIGNhbmRpZGF0ZXMsIG1heFdpbm5lcnMpIHtcbiAgICAgICAgICAgIHZhciBsdWNreVdpbm5lckluZGV4ID0gTWF0aC5yb3VuZChyYW5kb20oKSoodm90ZXMubGVuZ3RoLTEpKVxuICAgICAgICAgICAgdmFyIGx1Y2t5V2lubmVyVm90ZSA9IHZvdGVzW2x1Y2t5V2lubmVySW5kZXhdXG5cbiAgICAgICAgICAgIHJldHVybiBsdWNreVdpbm5lclZvdGUuc2xpY2UoMCxtYXhXaW5uZXJzKS5tYXAoZnVuY3Rpb24odm90ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7aW5kZXg6IHZvdGUsIHdlaWdodDoxfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgJzEwJSBvZiB0aGUgdm90ZXJzJzogZnVuY3Rpb24odm90ZXMsIGNhbmRpZGF0ZXMsIG1heFdpbm5lcnMpIHtcbiAgICAgICAgICAgIHZhciBsdWNreVZvdGVzID0gW11cbiAgICAgICAgICAgIHdoaWxlKGx1Y2t5Vm90ZXMubGVuZ3RoIDwgdm90ZXMubGVuZ3RoKi4xKSB7XG4gICAgICAgICAgICAgICAgdmFyIGx1Y2t5V2lubmVySW5kZXggPSBNYXRoLnJvdW5kKHJhbmRvbSgpKih2b3Rlcy5sZW5ndGgtMSkpXG4gICAgICAgICAgICAgICAgbHVja3lWb3Rlcy5wdXNoKHZvdGVzW2x1Y2t5V2lubmVySW5kZXhdWzBdKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcGx1cmFsaXR5QWxnKGx1Y2t5Vm90ZXMsIGNhbmRpZGF0ZXMsIG1heFdpbm5lcnMpXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHBsdXJhbGl0eToge1xuICAgICAgICAnJzpwbHVyYWxpdHlBbGdcbiAgICB9LFxuICAgIHJhbmdlOiB7XG4gICAgICAgICdPbmUgV2lubmVyJzogZnVuY3Rpb24odm90ZXMsIGNhbmRpZGF0ZXMpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHRzID0gW11cbiAgICAgICAgICAgIGZvcih2YXIgbj0wOyBuPGNhbmRpZGF0ZXMubGVuZ3RoO24rKykge1xuICAgICAgICAgICAgICAgIHJlc3VsdHNbbl0gPSAwXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZvdGVzLmZvckVhY2goZnVuY3Rpb24odm90ZSl7XG4gICAgICAgICAgICAgICAgdm90ZS5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzW2luZGV4XSArPSB2YWx1ZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICB2YXIgdHJhbnNmb3JtZWRSZXN1bHRzID0gcmVzdWx0cy5tYXAoZnVuY3Rpb24odmFsdWUsaW5kZXgpe1xuICAgICAgICAgICAgICAgIHJldHVybiB7Y2FuZGlkYXRlOmluZGV4LHZvdGVzOnZhbHVlfVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgdHJhbnNmb3JtZWRSZXN1bHRzLnNvcnQoZnVuY3Rpb24oYSxiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGIudm90ZXMgLSBhLnZvdGVzIC8vIHJldmVyc2Ugc29ydFxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgdmFyIHdpbm5lciA9IHRyYW5zZm9ybWVkUmVzdWx0c1swXS5jYW5kaWRhdGVcbiAgICAgICAgICAgIHJldHVybiBbe2luZGV4OiB3aW5uZXIsIHdlaWdodDoxLCBwcmVmZXJlbmNlczpjYW5kaWRhdGVzW3dpbm5lcl19XVxuICAgICAgICB9LFxuICAgICAgICAnVGhyZWUgV2lubmVycyc6IGZ1bmN0aW9uKHZvdGVzLCBjYW5kaWRhdGVzKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0cyA9IFtdXG4gICAgICAgICAgICBmb3IodmFyIG49MDsgbjxjYW5kaWRhdGVzLmxlbmd0aDtuKyspIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzW25dID0gMFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2b3Rlcy5mb3JFYWNoKGZ1bmN0aW9uKHZvdGUpe1xuICAgICAgICAgICAgICAgIHZvdGUuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1tpbmRleF0gKz0gdmFsdWVcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgdmFyIHRyYW5zZm9ybWVkUmVzdWx0cyA9IHJlc3VsdHMubWFwKGZ1bmN0aW9uKHZhbHVlLGluZGV4KXtcbiAgICAgICAgICAgICAgICByZXR1cm4ge2NhbmRpZGF0ZTppbmRleCx2b3Rlczp2YWx1ZX1cbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIHRyYW5zZm9ybWVkUmVzdWx0cy5zb3J0KGZ1bmN0aW9uKGEsYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBiLnZvdGVzIC0gYS52b3RlcyAvLyByZXZlcnNlIHNvcnQgKG1vc3Qgdm90ZXMgZm9pc3QpXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICB2YXIgd2lubmVycyA9IFtdLCB0b3RhbFNjb3JlID0gMFxuICAgICAgICAgICAgZm9yKHZhciBuPTA7IG48MzsgbisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHdpbm5lckluZGV4ID0gdHJhbnNmb3JtZWRSZXN1bHRzW25dLmNhbmRpZGF0ZVxuICAgICAgICAgICAgICAgIHZhciB3aW5uZXIgPSBjYW5kaWRhdGVzW3dpbm5lckluZGV4XVxuICAgICAgICAgICAgICAgIHdpbm5lcnMucHVzaCh7aW5kZXg6IHdpbm5lckluZGV4LCBwcmVmZXJlbmNlczp3aW5uZXJ9KVxuICAgICAgICAgICAgICAgIHRvdGFsU2NvcmUrPSB0cmFuc2Zvcm1lZFJlc3VsdHNbbl0udm90ZXNcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgd2lubmVycy5mb3JFYWNoKGZ1bmN0aW9uKHdpbm5lciwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICB3aW5uZXIud2VpZ2h0ID0gdHJhbnNmb3JtZWRSZXN1bHRzW2luZGV4XS52b3Rlcy90b3RhbFNjb3JlXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICByZXR1cm4gd2lubmVyc1xuICAgICAgICB9XG4gICAgfSxcbiAgICBzaW5nbGVUcmFuc2ZlcmFibGVWb3RlOiB7XG4gICAgICAgICcnOnNpbmdsZVRyYW5zZmVycmFibGVWb3RlXG4gICAgfSxcbiAgICBwb3dlckluc3RhbnRSdW5vZmY6IHtcbiAgICAgICAgJyc6cG93ZXJJbnN0YW50UnVub2ZmXG4gICAgfSxcbiAgICBkaXJlY3RSZXByZXNlbnRhdGl2ZVJhbmtlZDoge1xuICAgICAgICAnMTUlIFRocmVzaG9sZCc6IHsnJzpmcmFjdGlvbmFsUmVwcmVzZW50YXRpdmVSYW5rZWRWb3RlKC4xNSl9LFxuICAgIH0sXG4gICAgZGlyZWN0UmVwcmVzZW50YXRpdmVSYW5nZWQ6IHtcbiAgICAgICAgJ3NwbGl0LXdlaWdodCwgMCUgdGhyZXNob2xkJzogZGlyZWN0UmVwcmVzZW50YXRpb25SYW5nZSgnbm9ybWFsJywgJ3NwbGl0JywwKSxcbiAgICAgICAgJ2hpZ2hlc3Qtd2VpZ2h0LCAyMCUgdGhyZXNob2xkJzogZGlyZWN0UmVwcmVzZW50YXRpb25SYW5nZSgnbm9ybWFsJywgJ2hpZ2hlc3QnLCAuNSksXG4gICAgICAgICdzcGxpdC13ZWlnaHQsIDIwJSB0aHJlc2hvbGQnOiBkaXJlY3RSZXByZXNlbnRhdGlvblJhbmdlKCdub3JtYWwnLCAnc3BsaXQnLCAuOSksXG4gICAgICAgICdlcXVhbC13ZWlnaHQsIDIwJSB0aHJlc2hvbGQnOiBkaXJlY3RSZXByZXNlbnRhdGlvblJhbmdlKCdub3JtYWwnLCAnZXF1YWwnLCAuOSksXG4gICAgICAgICdoaWdoZXN0LXdlaWdodCwgbWlub3JpdHktbWF4LCAyMCUgdGhyZXNob2xkJzogZGlyZWN0UmVwcmVzZW50YXRpb25SYW5nZSgnbWF4TWlub3JpdHknLCAnaGlnaGVzdCcsIC45KSxcbiAgICAgICAgJ3NwbGl0LXdlaWdodCwgbWlub3JpdHktbWF4LCAyMCUgdGhyZXNob2xkJzogZGlyZWN0UmVwcmVzZW50YXRpb25SYW5nZSgnbWF4TWlub3JpdHknLCAnc3BsaXQnLCAuOSksXG4gICAgICAgICdlcXVhbC13ZWlnaHQsIG1pbm9yaXR5LW1heCwgMjAlIHRocmVzaG9sZCc6IGRpcmVjdFJlcHJlc2VudGF0aW9uUmFuZ2UoJ21heE1pbm9yaXR5JywgJ2VxdWFsJywgLjkpLFxuICAgICAgICAnaGlnaGVzdC13ZWlnaHQsIDxiPnJld2VpZ2h0ZWQ8L2I+JzogZGlyZWN0UmVwcmVzZW50YXRpb25SYW5nZSgncmV3ZWlnaHRlZCcsICdoaWdoZXN0JywgMCksXG4gICAgICAgICdzcGxpdC13ZWlnaHQsIDxiPnJld2VpZ2h0ZWQ8L2I+JzogZGlyZWN0UmVwcmVzZW50YXRpb25SYW5nZSgncmV3ZWlnaHRlZCcsICdzcGxpdCcsIDApLFxuICAgICAgICAnZXF1YWwtd2VpZ2h0LCA8Yj5yZXdlaWdodGVkPC9iPic6IGRpcmVjdFJlcHJlc2VudGF0aW9uUmFuZ2UoJ3Jld2VpZ2h0ZWQnLCAnZXF1YWwnLCAwKSxcbiAgICB9XG59IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0aWYoX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSkge1xuXHRcdHJldHVybiBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBtb2R1bGUgZXhwb3J0cyBtdXN0IGJlIHJldHVybmVkIGZyb20gcnVudGltZSBzbyBlbnRyeSBpbmxpbmluZyBpcyBkaXNhYmxlZFxuLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG5yZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vZWxlY3QuanNcIik7XG4iXSwic291cmNlUm9vdCI6IiJ9
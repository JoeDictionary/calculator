(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"C:\\Users\\Filip\\Desktop\\Programming\\calculator\\dist\\grammar.js":[function(require,module,exports){
// Generated automatically by nearley, version 2.19.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "input", "symbols": ["expression"], "postprocess": data => eval(data[0])},
    {"name": "expression", "symbols": ["expression", "operator", "number"], "postprocess": data => data.join("")},
    {"name": "expression", "symbols": ["number"], "postprocess": id},
    {"name": "operator$string$1", "symbols": [{"literal":"\\"}, {"literal":"t"}, {"literal":"i"}, {"literal":"m"}, {"literal":"e"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "operator", "symbols": ["operator$string$1"], "postprocess": _ => "*"},
    {"name": "operator$string$2", "symbols": [{"literal":"\\"}, {"literal":"d"}, {"literal":"i"}, {"literal":"v"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "operator", "symbols": ["operator$string$2"], "postprocess": _ => "/"},
    {"name": "operator", "symbols": [{"literal":"+"}], "postprocess": id},
    {"name": "operator", "symbols": [{"literal":"-"}], "postprocess": id},
    {"name": "number", "symbols": ["digits"], "postprocess": id},
    {"name": "number", "symbols": ["digits", {"literal":"."}, "digits"], "postprocess": data => data.join("")},
    {"name": "digits$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "digits$ebnf$1", "symbols": ["digits$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "digits", "symbols": ["digits$ebnf$1"], "postprocess": data => data[0].join("")}
]
  , ParserStart: "input"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();

},{}],"C:\\Users\\Filip\\Desktop\\Programming\\calculator\\dist\\main.js":[function(require,module,exports){
const nearley = require("nearley");
const grammar = require("./grammar.js");
console.log("h");

const MQ = MathQuill.getInterface(2);

const calculator = document.querySelector(".calculator");
const keys = calculator.querySelector(".calculator_keys");
const display = document.querySelector(".calculator_display");
const mathDisplay = document.querySelector("#mathDisplay");

const mathField = MQ.MathField(mathDisplay, {
  spaceBehavesLikeTab: true,
  sumStartsWithNEquals: true,
  supSubsRequireOperand: true,
  autoCommands: "pi sum",
  // maxDepth: 10,
  // autoOperatorNames: "sin cos"
  handlers: {
    enter: () => console.log(mathField.latex())
  }
});

mathField.focus();

// Parse function for equals-key
function parse(str) {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  try {
    parser.feed(str);
    return parser.results;
  } catch (e) {
    return "Syntax Error";
  }
}

keys.addEventListener("click", event => {
  const key = event.target;
  const action = key.dataset.action;

  if (key.matches("button")) {
    if (!action) {
      mathField.write(key.textContent)
      console.log(mathField.latex());
    } else {
      if (action != "clear" && action != "calculate") {
        mathField.write(action)
        console.log(mathField.latex());
      }
      else{
        if (action === "clear") {
          mathField.latex("")
        }
        if (action === "calculate") {
          mathField.latex(parse(mathField.latex()));
        }
      }
    }
  }
});

},{"./grammar.js":"C:\\Users\\Filip\\Desktop\\Programming\\calculator\\dist\\grammar.js","nearley":"C:\\Users\\Filip\\Desktop\\Programming\\calculator\\node_modules\\nearley\\lib\\nearley.js"}],"C:\\Users\\Filip\\Desktop\\Programming\\calculator\\node_modules\\nearley\\lib\\nearley.js":[function(require,module,exports){
(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.nearley = factory();
    }
}(this, function() {

    function Rule(name, symbols, postprocess) {
        this.id = ++Rule.highestId;
        this.name = name;
        this.symbols = symbols;        // a list of literal | regex class | nonterminal
        this.postprocess = postprocess;
        return this;
    }
    Rule.highestId = 0;

    Rule.prototype.toString = function(withCursorAt) {
        function stringifySymbolSequence (e) {
            return e.literal ? JSON.stringify(e.literal) :
                   e.type ? '%' + e.type : e.toString();
        }
        var symbolSequence = (typeof withCursorAt === "undefined")
                             ? this.symbols.map(stringifySymbolSequence).join(' ')
                             : (   this.symbols.slice(0, withCursorAt).map(stringifySymbolSequence).join(' ')
                                 + " ● "
                                 + this.symbols.slice(withCursorAt).map(stringifySymbolSequence).join(' ')     );
        return this.name + " → " + symbolSequence;
    }


    // a State is a rule at a position from a given starting point in the input stream (reference)
    function State(rule, dot, reference, wantedBy) {
        this.rule = rule;
        this.dot = dot;
        this.reference = reference;
        this.data = [];
        this.wantedBy = wantedBy;
        this.isComplete = this.dot === rule.symbols.length;
    }

    State.prototype.toString = function() {
        return "{" + this.rule.toString(this.dot) + "}, from: " + (this.reference || 0);
    };

    State.prototype.nextState = function(child) {
        var state = new State(this.rule, this.dot + 1, this.reference, this.wantedBy);
        state.left = this;
        state.right = child;
        if (state.isComplete) {
            state.data = state.build();
        }
        return state;
    };

    State.prototype.build = function() {
        var children = [];
        var node = this;
        do {
            children.push(node.right.data);
            node = node.left;
        } while (node.left);
        children.reverse();
        return children;
    };

    State.prototype.finish = function() {
        if (this.rule.postprocess) {
            this.data = this.rule.postprocess(this.data, this.reference, Parser.fail);
        }
    };


    function Column(grammar, index) {
        this.grammar = grammar;
        this.index = index;
        this.states = [];
        this.wants = {}; // states indexed by the non-terminal they expect
        this.scannable = []; // list of states that expect a token
        this.completed = {}; // states that are nullable
    }


    Column.prototype.process = function(nextColumn) {
        var states = this.states;
        var wants = this.wants;
        var completed = this.completed;

        for (var w = 0; w < states.length; w++) { // nb. we push() during iteration
            var state = states[w];

            if (state.isComplete) {
                state.finish();
                if (state.data !== Parser.fail) {
                    // complete
                    var wantedBy = state.wantedBy;
                    for (var i = wantedBy.length; i--; ) { // this line is hot
                        var left = wantedBy[i];
                        this.complete(left, state);
                    }

                    // special-case nullables
                    if (state.reference === this.index) {
                        // make sure future predictors of this rule get completed.
                        var exp = state.rule.name;
                        (this.completed[exp] = this.completed[exp] || []).push(state);
                    }
                }

            } else {
                // queue scannable states
                var exp = state.rule.symbols[state.dot];
                if (typeof exp !== 'string') {
                    this.scannable.push(state);
                    continue;
                }

                // predict
                if (wants[exp]) {
                    wants[exp].push(state);

                    if (completed.hasOwnProperty(exp)) {
                        var nulls = completed[exp];
                        for (var i = 0; i < nulls.length; i++) {
                            var right = nulls[i];
                            this.complete(state, right);
                        }
                    }
                } else {
                    wants[exp] = [state];
                    this.predict(exp);
                }
            }
        }
    }

    Column.prototype.predict = function(exp) {
        var rules = this.grammar.byName[exp] || [];

        for (var i = 0; i < rules.length; i++) {
            var r = rules[i];
            var wantedBy = this.wants[exp];
            var s = new State(r, 0, this.index, wantedBy);
            this.states.push(s);
        }
    }

    Column.prototype.complete = function(left, right) {
        var copy = left.nextState(right);
        this.states.push(copy);
    }


    function Grammar(rules, start) {
        this.rules = rules;
        this.start = start || this.rules[0].name;
        var byName = this.byName = {};
        this.rules.forEach(function(rule) {
            if (!byName.hasOwnProperty(rule.name)) {
                byName[rule.name] = [];
            }
            byName[rule.name].push(rule);
        });
    }

    // So we can allow passing (rules, start) directly to Parser for backwards compatibility
    Grammar.fromCompiled = function(rules, start) {
        var lexer = rules.Lexer;
        if (rules.ParserStart) {
          start = rules.ParserStart;
          rules = rules.ParserRules;
        }
        var rules = rules.map(function (r) { return (new Rule(r.name, r.symbols, r.postprocess)); });
        var g = new Grammar(rules, start);
        g.lexer = lexer; // nb. storing lexer on Grammar is iffy, but unavoidable
        return g;
    }


    function StreamLexer() {
      this.reset("");
    }

    StreamLexer.prototype.reset = function(data, state) {
        this.buffer = data;
        this.index = 0;
        this.line = state ? state.line : 1;
        this.lastLineBreak = state ? -state.col : 0;
    }

    StreamLexer.prototype.next = function() {
        if (this.index < this.buffer.length) {
            var ch = this.buffer[this.index++];
            if (ch === '\n') {
              this.line += 1;
              this.lastLineBreak = this.index;
            }
            return {value: ch};
        }
    }

    StreamLexer.prototype.save = function() {
      return {
        line: this.line,
        col: this.index - this.lastLineBreak,
      }
    }

    StreamLexer.prototype.formatError = function(token, message) {
        // nb. this gets called after consuming the offending token,
        // so the culprit is index-1
        var buffer = this.buffer;
        if (typeof buffer === 'string') {
            var nextLineBreak = buffer.indexOf('\n', this.index);
            if (nextLineBreak === -1) nextLineBreak = buffer.length;
            var line = buffer.substring(this.lastLineBreak, nextLineBreak)
            var col = this.index - this.lastLineBreak;
            message += " at line " + this.line + " col " + col + ":\n\n";
            message += "  " + line + "\n"
            message += "  " + Array(col).join(" ") + "^"
            return message;
        } else {
            return message + " at index " + (this.index - 1);
        }
    }


    function Parser(rules, start, options) {
        if (rules instanceof Grammar) {
            var grammar = rules;
            var options = start;
        } else {
            var grammar = Grammar.fromCompiled(rules, start);
        }
        this.grammar = grammar;

        // Read options
        this.options = {
            keepHistory: false,
            lexer: grammar.lexer || new StreamLexer,
        };
        for (var key in (options || {})) {
            this.options[key] = options[key];
        }

        // Setup lexer
        this.lexer = this.options.lexer;
        this.lexerState = undefined;

        // Setup a table
        var column = new Column(grammar, 0);
        var table = this.table = [column];

        // I could be expecting anything.
        column.wants[grammar.start] = [];
        column.predict(grammar.start);
        // TODO what if start rule is nullable?
        column.process();
        this.current = 0; // token index
    }

    // create a reserved token for indicating a parse fail
    Parser.fail = {};

    Parser.prototype.feed = function(chunk) {
        var lexer = this.lexer;
        lexer.reset(chunk, this.lexerState);

        var token;
        while (token = lexer.next()) {
            // We add new states to table[current+1]
            var column = this.table[this.current];

            // GC unused states
            if (!this.options.keepHistory) {
                delete this.table[this.current - 1];
            }

            var n = this.current + 1;
            var nextColumn = new Column(this.grammar, n);
            this.table.push(nextColumn);

            // Advance all tokens that expect the symbol
            var literal = token.text !== undefined ? token.text : token.value;
            var value = lexer.constructor === StreamLexer ? token.value : token;
            var scannable = column.scannable;
            for (var w = scannable.length; w--; ) {
                var state = scannable[w];
                var expect = state.rule.symbols[state.dot];
                // Try to consume the token
                // either regex or literal
                if (expect.test ? expect.test(value) :
                    expect.type ? expect.type === token.type
                                : expect.literal === literal) {
                    // Add it
                    var next = state.nextState({data: value, token: token, isToken: true, reference: n - 1});
                    nextColumn.states.push(next);
                }
            }

            // Next, for each of the rules, we either
            // (a) complete it, and try to see if the reference row expected that
            //     rule
            // (b) predict the next nonterminal it expects by adding that
            //     nonterminal's start state
            // To prevent duplication, we also keep track of rules we have already
            // added

            nextColumn.process();

            // If needed, throw an error:
            if (nextColumn.states.length === 0) {
                // No states at all! This is not good.
                var err = new Error(this.reportError(token));
                err.offset = this.current;
                err.token = token;
                throw err;
            }

            // maybe save lexer state
            if (this.options.keepHistory) {
              column.lexerState = lexer.save()
            }

            this.current++;
        }
        if (column) {
          this.lexerState = lexer.save()
        }

        // Incrementally keep track of results
        this.results = this.finish();

        // Allow chaining, for whatever it's worth
        return this;
    };

    Parser.prototype.reportError = function(token) {
        var lines = [];
        var tokenDisplay = (token.type ? token.type + " token: " : "") + JSON.stringify(token.value !== undefined ? token.value : token);
        lines.push(this.lexer.formatError(token, "Syntax error"));
        lines.push('Unexpected ' + tokenDisplay + '. Instead, I was expecting to see one of the following:\n');
        var lastColumnIndex = this.table.length - 2;
        var lastColumn = this.table[lastColumnIndex];
        var expectantStates = lastColumn.states
            .filter(function(state) {
                var nextSymbol = state.rule.symbols[state.dot];
                return nextSymbol && typeof nextSymbol !== "string";
            });
        
        // Display a "state stack" for each expectant state
        // - which shows you how this state came to be, step by step. 
        // If there is more than one derivation, we only display the first one.
        var stateStacks = expectantStates
            .map(function(state) {
                var stacks = this.buildStateStacks(state, []);
                return stacks[0];
            }, this);
        // Display each state that is expecting a terminal symbol next.
        stateStacks.forEach(function(stateStack) {
            var state = stateStack[0];
            var nextSymbol = state.rule.symbols[state.dot];
            var symbolDisplay = this.getSymbolDisplay(nextSymbol);
            lines.push('A ' + symbolDisplay + ' based on:');
            this.displayStateStack(stateStack, lines);
        }, this);
            
        lines.push("");
        return lines.join("\n");
    };

    Parser.prototype.displayStateStack = function(stateStack, lines) {
        var lastDisplay;
        var sameDisplayCount = 0;
        for (var j = 0; j < stateStack.length; j++) {
            var state = stateStack[j];
            var display = state.rule.toString(state.dot);
            if (display === lastDisplay) {
                sameDisplayCount++;
            } else {
                if (sameDisplayCount > 0) {
                    lines.push('    ⬆ ︎' + sameDisplayCount + ' more lines identical to this');
                }
                sameDisplayCount = 0;
                lines.push('    ' + display);
            }
            lastDisplay = display;
        }
    };

    Parser.prototype.getSymbolDisplay = function(symbol) {
        var type = typeof symbol;
        if (type === "string") {
            return symbol;
        } else if (type === "object" && symbol.literal) {
            return JSON.stringify(symbol.literal);
        } else if (type === "object" && symbol instanceof RegExp) {
            return 'character matching ' + symbol;
        } else if (type === "object" && symbol.type) {
            return symbol.type + ' token';
        } else {
            throw new Error('Unknown symbol type: ' + symbol);
        }
    };

    /*
    Builds a number of "state stacks". You can think of a state stack as the call stack
    of the recursive-descent parser which the Nearley parse algorithm simulates.
    A state stack is represented as an array of state objects. Within a 
    state stack, the first item of the array will be the starting
    state, with each successive item in the array going further back into history.
    
    This function needs to be given a starting state and an empty array representing
    the visited states, and it returns an array of state stacks. 
    
    */
    Parser.prototype.buildStateStacks = function(state, visited) {
        if (visited.indexOf(state) !== -1) {
            // Found cycle, return empty array (meaning no stacks)
            // to eliminate this path from the results, because
            // we don't know how to display it meaningfully
            return [];
        }
        if (state.wantedBy.length === 0) {
            return [[state]];
        }
        var that = this;

        return state.wantedBy.reduce(function(stacks, prevState) {
            return stacks.concat(that.buildStateStacks(
                prevState,
                [state].concat(visited))
                .map(function(stack) {
                    return [state].concat(stack);
                }));
        }, []);
    };

    Parser.prototype.save = function() {
        var column = this.table[this.current];
        column.lexerState = this.lexerState;
        return column;
    };

    Parser.prototype.restore = function(column) {
        var index = column.index;
        this.current = index;
        this.table[index] = column;
        this.table.splice(index + 1);
        this.lexerState = column.lexerState;

        // Incrementally keep track of results
        this.results = this.finish();
    };

    // nb. deprecated: use save/restore instead!
    Parser.prototype.rewind = function(index) {
        if (!this.options.keepHistory) {
            throw new Error('set option `keepHistory` to enable rewinding')
        }
        // nb. recall column (table) indicies fall between token indicies.
        //        col 0   --   token 0   --   col 1
        this.restore(this.table[index]);
    };

    Parser.prototype.finish = function() {
        // Return the possible parsings
        var considerations = [];
        var start = this.grammar.start;
        var column = this.table[this.table.length - 1]
        column.states.forEach(function (t) {
            if (t.rule.name === start
                    && t.dot === t.rule.symbols.length
                    && t.reference === 0
                    && t.data !== Parser.fail) {
                considerations.push(t);
            }
        });
        return considerations.map(function(c) {return c.data; });
    };

    return {
        Parser: Parser,
        Grammar: Grammar,
        Rule: Rule,
    };

}));

},{}]},{},["C:\\Users\\Filip\\Desktop\\Programming\\calculator\\dist\\main.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJncmFtbWFyLmpzIiwibWFpbi5qcyIsIi4uL25vZGVfbW9kdWxlcy9uZWFybGV5L2xpYi9uZWFybGV5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvLyBHZW5lcmF0ZWQgYXV0b21hdGljYWxseSBieSBuZWFybGV5LCB2ZXJzaW9uIDIuMTkuMFxuLy8gaHR0cDovL2dpdGh1Yi5jb20vSGFyZG1hdGgxMjMvbmVhcmxleVxuKGZ1bmN0aW9uICgpIHtcbmZ1bmN0aW9uIGlkKHgpIHsgcmV0dXJuIHhbMF07IH1cbnZhciBncmFtbWFyID0ge1xuICAgIExleGVyOiB1bmRlZmluZWQsXG4gICAgUGFyc2VyUnVsZXM6IFtcbiAgICB7XCJuYW1lXCI6IFwiaW5wdXRcIiwgXCJzeW1ib2xzXCI6IFtcImV4cHJlc3Npb25cIl0sIFwicG9zdHByb2Nlc3NcIjogZGF0YSA9PiBldmFsKGRhdGFbMF0pfSxcbiAgICB7XCJuYW1lXCI6IFwiZXhwcmVzc2lvblwiLCBcInN5bWJvbHNcIjogW1wiZXhwcmVzc2lvblwiLCBcIm9wZXJhdG9yXCIsIFwibnVtYmVyXCJdLCBcInBvc3Rwcm9jZXNzXCI6IGRhdGEgPT4gZGF0YS5qb2luKFwiXCIpfSxcbiAgICB7XCJuYW1lXCI6IFwiZXhwcmVzc2lvblwiLCBcInN5bWJvbHNcIjogW1wibnVtYmVyXCJdLCBcInBvc3Rwcm9jZXNzXCI6IGlkfSxcbiAgICB7XCJuYW1lXCI6IFwib3BlcmF0b3Ikc3RyaW5nJDFcIiwgXCJzeW1ib2xzXCI6IFt7XCJsaXRlcmFsXCI6XCJcXFxcXCJ9LCB7XCJsaXRlcmFsXCI6XCJ0XCJ9LCB7XCJsaXRlcmFsXCI6XCJpXCJ9LCB7XCJsaXRlcmFsXCI6XCJtXCJ9LCB7XCJsaXRlcmFsXCI6XCJlXCJ9LCB7XCJsaXRlcmFsXCI6XCJzXCJ9XSwgXCJwb3N0cHJvY2Vzc1wiOiBmdW5jdGlvbiBqb2luZXIoZCkge3JldHVybiBkLmpvaW4oJycpO319LFxuICAgIHtcIm5hbWVcIjogXCJvcGVyYXRvclwiLCBcInN5bWJvbHNcIjogW1wib3BlcmF0b3Ikc3RyaW5nJDFcIl0sIFwicG9zdHByb2Nlc3NcIjogXyA9PiBcIipcIn0sXG4gICAge1wibmFtZVwiOiBcIm9wZXJhdG9yJHN0cmluZyQyXCIsIFwic3ltYm9sc1wiOiBbe1wibGl0ZXJhbFwiOlwiXFxcXFwifSwge1wibGl0ZXJhbFwiOlwiZFwifSwge1wibGl0ZXJhbFwiOlwiaVwifSwge1wibGl0ZXJhbFwiOlwidlwifV0sIFwicG9zdHByb2Nlc3NcIjogZnVuY3Rpb24gam9pbmVyKGQpIHtyZXR1cm4gZC5qb2luKCcnKTt9fSxcbiAgICB7XCJuYW1lXCI6IFwib3BlcmF0b3JcIiwgXCJzeW1ib2xzXCI6IFtcIm9wZXJhdG9yJHN0cmluZyQyXCJdLCBcInBvc3Rwcm9jZXNzXCI6IF8gPT4gXCIvXCJ9LFxuICAgIHtcIm5hbWVcIjogXCJvcGVyYXRvclwiLCBcInN5bWJvbHNcIjogW3tcImxpdGVyYWxcIjpcIitcIn1dLCBcInBvc3Rwcm9jZXNzXCI6IGlkfSxcbiAgICB7XCJuYW1lXCI6IFwib3BlcmF0b3JcIiwgXCJzeW1ib2xzXCI6IFt7XCJsaXRlcmFsXCI6XCItXCJ9XSwgXCJwb3N0cHJvY2Vzc1wiOiBpZH0sXG4gICAge1wibmFtZVwiOiBcIm51bWJlclwiLCBcInN5bWJvbHNcIjogW1wiZGlnaXRzXCJdLCBcInBvc3Rwcm9jZXNzXCI6IGlkfSxcbiAgICB7XCJuYW1lXCI6IFwibnVtYmVyXCIsIFwic3ltYm9sc1wiOiBbXCJkaWdpdHNcIiwge1wibGl0ZXJhbFwiOlwiLlwifSwgXCJkaWdpdHNcIl0sIFwicG9zdHByb2Nlc3NcIjogZGF0YSA9PiBkYXRhLmpvaW4oXCJcIil9LFxuICAgIHtcIm5hbWVcIjogXCJkaWdpdHMkZWJuZiQxXCIsIFwic3ltYm9sc1wiOiBbL1swLTldL119LFxuICAgIHtcIm5hbWVcIjogXCJkaWdpdHMkZWJuZiQxXCIsIFwic3ltYm9sc1wiOiBbXCJkaWdpdHMkZWJuZiQxXCIsIC9bMC05XS9dLCBcInBvc3Rwcm9jZXNzXCI6IGZ1bmN0aW9uIGFycnB1c2goZCkge3JldHVybiBkWzBdLmNvbmNhdChbZFsxXV0pO319LFxuICAgIHtcIm5hbWVcIjogXCJkaWdpdHNcIiwgXCJzeW1ib2xzXCI6IFtcImRpZ2l0cyRlYm5mJDFcIl0sIFwicG9zdHByb2Nlc3NcIjogZGF0YSA9PiBkYXRhWzBdLmpvaW4oXCJcIil9XG5dXG4gICwgUGFyc2VyU3RhcnQ6IFwiaW5wdXRcIlxufVxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgbW9kdWxlLmV4cG9ydHMgPSBncmFtbWFyO1xufSBlbHNlIHtcbiAgIHdpbmRvdy5ncmFtbWFyID0gZ3JhbW1hcjtcbn1cbn0pKCk7XG4iLCJjb25zdCBuZWFybGV5ID0gcmVxdWlyZShcIm5lYXJsZXlcIik7XHJcbmNvbnN0IGdyYW1tYXIgPSByZXF1aXJlKFwiLi9ncmFtbWFyLmpzXCIpO1xyXG5jb25zb2xlLmxvZyhcImhcIik7XHJcblxyXG5jb25zdCBNUSA9IE1hdGhRdWlsbC5nZXRJbnRlcmZhY2UoMik7XHJcblxyXG5jb25zdCBjYWxjdWxhdG9yID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5jYWxjdWxhdG9yXCIpO1xyXG5jb25zdCBrZXlzID0gY2FsY3VsYXRvci5xdWVyeVNlbGVjdG9yKFwiLmNhbGN1bGF0b3Jfa2V5c1wiKTtcclxuY29uc3QgZGlzcGxheSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuY2FsY3VsYXRvcl9kaXNwbGF5XCIpO1xyXG5jb25zdCBtYXRoRGlzcGxheSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbWF0aERpc3BsYXlcIik7XHJcblxyXG5jb25zdCBtYXRoRmllbGQgPSBNUS5NYXRoRmllbGQobWF0aERpc3BsYXksIHtcclxuICBzcGFjZUJlaGF2ZXNMaWtlVGFiOiB0cnVlLFxyXG4gIHN1bVN0YXJ0c1dpdGhORXF1YWxzOiB0cnVlLFxyXG4gIHN1cFN1YnNSZXF1aXJlT3BlcmFuZDogdHJ1ZSxcclxuICBhdXRvQ29tbWFuZHM6IFwicGkgc3VtXCIsXHJcbiAgLy8gbWF4RGVwdGg6IDEwLFxyXG4gIC8vIGF1dG9PcGVyYXRvck5hbWVzOiBcInNpbiBjb3NcIlxyXG4gIGhhbmRsZXJzOiB7XHJcbiAgICBlbnRlcjogKCkgPT4gY29uc29sZS5sb2cobWF0aEZpZWxkLmxhdGV4KCkpXHJcbiAgfVxyXG59KTtcclxuXHJcbm1hdGhGaWVsZC5mb2N1cygpO1xyXG5cclxuLy8gUGFyc2UgZnVuY3Rpb24gZm9yIGVxdWFscy1rZXlcclxuZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XHJcbiAgY29uc3QgcGFyc2VyID0gbmV3IG5lYXJsZXkuUGFyc2VyKG5lYXJsZXkuR3JhbW1hci5mcm9tQ29tcGlsZWQoZ3JhbW1hcikpO1xyXG4gIHRyeSB7XHJcbiAgICBwYXJzZXIuZmVlZChzdHIpO1xyXG4gICAgcmV0dXJuIHBhcnNlci5yZXN1bHRzO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJldHVybiBcIlN5bnRheCBFcnJvclwiO1xyXG4gIH1cclxufVxyXG5cclxua2V5cy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZXZlbnQgPT4ge1xyXG4gIGNvbnN0IGtleSA9IGV2ZW50LnRhcmdldDtcclxuICBjb25zdCBhY3Rpb24gPSBrZXkuZGF0YXNldC5hY3Rpb247XHJcblxyXG4gIGlmIChrZXkubWF0Y2hlcyhcImJ1dHRvblwiKSkge1xyXG4gICAgaWYgKCFhY3Rpb24pIHtcclxuICAgICAgbWF0aEZpZWxkLndyaXRlKGtleS50ZXh0Q29udGVudClcclxuICAgICAgY29uc29sZS5sb2cobWF0aEZpZWxkLmxhdGV4KCkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKGFjdGlvbiAhPSBcImNsZWFyXCIgJiYgYWN0aW9uICE9IFwiY2FsY3VsYXRlXCIpIHtcclxuICAgICAgICBtYXRoRmllbGQud3JpdGUoYWN0aW9uKVxyXG4gICAgICAgIGNvbnNvbGUubG9nKG1hdGhGaWVsZC5sYXRleCgpKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNle1xyXG4gICAgICAgIGlmIChhY3Rpb24gPT09IFwiY2xlYXJcIikge1xyXG4gICAgICAgICAgbWF0aEZpZWxkLmxhdGV4KFwiXCIpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChhY3Rpb24gPT09IFwiY2FsY3VsYXRlXCIpIHtcclxuICAgICAgICAgIG1hdGhGaWVsZC5sYXRleChwYXJzZShtYXRoRmllbGQubGF0ZXgoKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSk7XHJcbiIsIihmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3QubmVhcmxleSA9IGZhY3RvcnkoKTtcbiAgICB9XG59KHRoaXMsIGZ1bmN0aW9uKCkge1xuXG4gICAgZnVuY3Rpb24gUnVsZShuYW1lLCBzeW1ib2xzLCBwb3N0cHJvY2Vzcykge1xuICAgICAgICB0aGlzLmlkID0gKytSdWxlLmhpZ2hlc3RJZDtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5zeW1ib2xzID0gc3ltYm9sczsgICAgICAgIC8vIGEgbGlzdCBvZiBsaXRlcmFsIHwgcmVnZXggY2xhc3MgfCBub250ZXJtaW5hbFxuICAgICAgICB0aGlzLnBvc3Rwcm9jZXNzID0gcG9zdHByb2Nlc3M7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBSdWxlLmhpZ2hlc3RJZCA9IDA7XG5cbiAgICBSdWxlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKHdpdGhDdXJzb3JBdCkge1xuICAgICAgICBmdW5jdGlvbiBzdHJpbmdpZnlTeW1ib2xTZXF1ZW5jZSAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIGUubGl0ZXJhbCA/IEpTT04uc3RyaW5naWZ5KGUubGl0ZXJhbCkgOlxuICAgICAgICAgICAgICAgICAgIGUudHlwZSA/ICclJyArIGUudHlwZSA6IGUudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3ltYm9sU2VxdWVuY2UgPSAodHlwZW9mIHdpdGhDdXJzb3JBdCA9PT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyB0aGlzLnN5bWJvbHMubWFwKHN0cmluZ2lmeVN5bWJvbFNlcXVlbmNlKS5qb2luKCcgJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAoICAgdGhpcy5zeW1ib2xzLnNsaWNlKDAsIHdpdGhDdXJzb3JBdCkubWFwKHN0cmluZ2lmeVN5bWJvbFNlcXVlbmNlKS5qb2luKCcgJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXCIg4pePIFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIHRoaXMuc3ltYm9scy5zbGljZSh3aXRoQ3Vyc29yQXQpLm1hcChzdHJpbmdpZnlTeW1ib2xTZXF1ZW5jZSkuam9pbignICcpICAgICApO1xuICAgICAgICByZXR1cm4gdGhpcy5uYW1lICsgXCIg4oaSIFwiICsgc3ltYm9sU2VxdWVuY2U7XG4gICAgfVxuXG5cbiAgICAvLyBhIFN0YXRlIGlzIGEgcnVsZSBhdCBhIHBvc2l0aW9uIGZyb20gYSBnaXZlbiBzdGFydGluZyBwb2ludCBpbiB0aGUgaW5wdXQgc3RyZWFtIChyZWZlcmVuY2UpXG4gICAgZnVuY3Rpb24gU3RhdGUocnVsZSwgZG90LCByZWZlcmVuY2UsIHdhbnRlZEJ5KSB7XG4gICAgICAgIHRoaXMucnVsZSA9IHJ1bGU7XG4gICAgICAgIHRoaXMuZG90ID0gZG90O1xuICAgICAgICB0aGlzLnJlZmVyZW5jZSA9IHJlZmVyZW5jZTtcbiAgICAgICAgdGhpcy5kYXRhID0gW107XG4gICAgICAgIHRoaXMud2FudGVkQnkgPSB3YW50ZWRCeTtcbiAgICAgICAgdGhpcy5pc0NvbXBsZXRlID0gdGhpcy5kb3QgPT09IHJ1bGUuc3ltYm9scy5sZW5ndGg7XG4gICAgfVxuXG4gICAgU3RhdGUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBcIntcIiArIHRoaXMucnVsZS50b1N0cmluZyh0aGlzLmRvdCkgKyBcIn0sIGZyb206IFwiICsgKHRoaXMucmVmZXJlbmNlIHx8IDApO1xuICAgIH07XG5cbiAgICBTdGF0ZS5wcm90b3R5cGUubmV4dFN0YXRlID0gZnVuY3Rpb24oY2hpbGQpIHtcbiAgICAgICAgdmFyIHN0YXRlID0gbmV3IFN0YXRlKHRoaXMucnVsZSwgdGhpcy5kb3QgKyAxLCB0aGlzLnJlZmVyZW5jZSwgdGhpcy53YW50ZWRCeSk7XG4gICAgICAgIHN0YXRlLmxlZnQgPSB0aGlzO1xuICAgICAgICBzdGF0ZS5yaWdodCA9IGNoaWxkO1xuICAgICAgICBpZiAoc3RhdGUuaXNDb21wbGV0ZSkge1xuICAgICAgICAgICAgc3RhdGUuZGF0YSA9IHN0YXRlLmJ1aWxkKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH07XG5cbiAgICBTdGF0ZS5wcm90b3R5cGUuYnVpbGQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gW107XG4gICAgICAgIHZhciBub2RlID0gdGhpcztcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChub2RlLnJpZ2h0LmRhdGEpO1xuICAgICAgICAgICAgbm9kZSA9IG5vZGUubGVmdDtcbiAgICAgICAgfSB3aGlsZSAobm9kZS5sZWZ0KTtcbiAgICAgICAgY2hpbGRyZW4ucmV2ZXJzZSgpO1xuICAgICAgICByZXR1cm4gY2hpbGRyZW47XG4gICAgfTtcblxuICAgIFN0YXRlLnByb3RvdHlwZS5maW5pc2ggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMucnVsZS5wb3N0cHJvY2Vzcykge1xuICAgICAgICAgICAgdGhpcy5kYXRhID0gdGhpcy5ydWxlLnBvc3Rwcm9jZXNzKHRoaXMuZGF0YSwgdGhpcy5yZWZlcmVuY2UsIFBhcnNlci5mYWlsKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIGZ1bmN0aW9uIENvbHVtbihncmFtbWFyLCBpbmRleCkge1xuICAgICAgICB0aGlzLmdyYW1tYXIgPSBncmFtbWFyO1xuICAgICAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgICAgIHRoaXMuc3RhdGVzID0gW107XG4gICAgICAgIHRoaXMud2FudHMgPSB7fTsgLy8gc3RhdGVzIGluZGV4ZWQgYnkgdGhlIG5vbi10ZXJtaW5hbCB0aGV5IGV4cGVjdFxuICAgICAgICB0aGlzLnNjYW5uYWJsZSA9IFtdOyAvLyBsaXN0IG9mIHN0YXRlcyB0aGF0IGV4cGVjdCBhIHRva2VuXG4gICAgICAgIHRoaXMuY29tcGxldGVkID0ge307IC8vIHN0YXRlcyB0aGF0IGFyZSBudWxsYWJsZVxuICAgIH1cblxuXG4gICAgQ29sdW1uLnByb3RvdHlwZS5wcm9jZXNzID0gZnVuY3Rpb24obmV4dENvbHVtbikge1xuICAgICAgICB2YXIgc3RhdGVzID0gdGhpcy5zdGF0ZXM7XG4gICAgICAgIHZhciB3YW50cyA9IHRoaXMud2FudHM7XG4gICAgICAgIHZhciBjb21wbGV0ZWQgPSB0aGlzLmNvbXBsZXRlZDtcblxuICAgICAgICBmb3IgKHZhciB3ID0gMDsgdyA8IHN0YXRlcy5sZW5ndGg7IHcrKykgeyAvLyBuYi4gd2UgcHVzaCgpIGR1cmluZyBpdGVyYXRpb25cbiAgICAgICAgICAgIHZhciBzdGF0ZSA9IHN0YXRlc1t3XTtcblxuICAgICAgICAgICAgaWYgKHN0YXRlLmlzQ29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5maW5pc2goKTtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUuZGF0YSAhPT0gUGFyc2VyLmZhaWwpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29tcGxldGVcbiAgICAgICAgICAgICAgICAgICAgdmFyIHdhbnRlZEJ5ID0gc3RhdGUud2FudGVkQnk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSB3YW50ZWRCeS5sZW5ndGg7IGktLTsgKSB7IC8vIHRoaXMgbGluZSBpcyBob3RcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsZWZ0ID0gd2FudGVkQnlbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbXBsZXRlKGxlZnQsIHN0YXRlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIHNwZWNpYWwtY2FzZSBudWxsYWJsZXNcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRlLnJlZmVyZW5jZSA9PT0gdGhpcy5pbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbWFrZSBzdXJlIGZ1dHVyZSBwcmVkaWN0b3JzIG9mIHRoaXMgcnVsZSBnZXQgY29tcGxldGVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4cCA9IHN0YXRlLnJ1bGUubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICh0aGlzLmNvbXBsZXRlZFtleHBdID0gdGhpcy5jb21wbGV0ZWRbZXhwXSB8fCBbXSkucHVzaChzdGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gcXVldWUgc2Nhbm5hYmxlIHN0YXRlc1xuICAgICAgICAgICAgICAgIHZhciBleHAgPSBzdGF0ZS5ydWxlLnN5bWJvbHNbc3RhdGUuZG90XTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGV4cCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zY2FubmFibGUucHVzaChzdGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHByZWRpY3RcbiAgICAgICAgICAgICAgICBpZiAod2FudHNbZXhwXSkge1xuICAgICAgICAgICAgICAgICAgICB3YW50c1tleHBdLnB1c2goc3RhdGUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wbGV0ZWQuaGFzT3duUHJvcGVydHkoZXhwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG51bGxzID0gY29tcGxldGVkW2V4cF07XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bGxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJpZ2h0ID0gbnVsbHNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb21wbGV0ZShzdGF0ZSwgcmlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgd2FudHNbZXhwXSA9IFtzdGF0ZV07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJlZGljdChleHApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIENvbHVtbi5wcm90b3R5cGUucHJlZGljdCA9IGZ1bmN0aW9uKGV4cCkge1xuICAgICAgICB2YXIgcnVsZXMgPSB0aGlzLmdyYW1tYXIuYnlOYW1lW2V4cF0gfHwgW107XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBydWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHIgPSBydWxlc1tpXTtcbiAgICAgICAgICAgIHZhciB3YW50ZWRCeSA9IHRoaXMud2FudHNbZXhwXTtcbiAgICAgICAgICAgIHZhciBzID0gbmV3IFN0YXRlKHIsIDAsIHRoaXMuaW5kZXgsIHdhbnRlZEJ5KTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGVzLnB1c2gocyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBDb2x1bW4ucHJvdG90eXBlLmNvbXBsZXRlID0gZnVuY3Rpb24obGVmdCwgcmlnaHQpIHtcbiAgICAgICAgdmFyIGNvcHkgPSBsZWZ0Lm5leHRTdGF0ZShyaWdodCk7XG4gICAgICAgIHRoaXMuc3RhdGVzLnB1c2goY29weSk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBHcmFtbWFyKHJ1bGVzLCBzdGFydCkge1xuICAgICAgICB0aGlzLnJ1bGVzID0gcnVsZXM7XG4gICAgICAgIHRoaXMuc3RhcnQgPSBzdGFydCB8fCB0aGlzLnJ1bGVzWzBdLm5hbWU7XG4gICAgICAgIHZhciBieU5hbWUgPSB0aGlzLmJ5TmFtZSA9IHt9O1xuICAgICAgICB0aGlzLnJ1bGVzLmZvckVhY2goZnVuY3Rpb24ocnVsZSkge1xuICAgICAgICAgICAgaWYgKCFieU5hbWUuaGFzT3duUHJvcGVydHkocnVsZS5uYW1lKSkge1xuICAgICAgICAgICAgICAgIGJ5TmFtZVtydWxlLm5hbWVdID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBieU5hbWVbcnVsZS5uYW1lXS5wdXNoKHJ1bGUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBTbyB3ZSBjYW4gYWxsb3cgcGFzc2luZyAocnVsZXMsIHN0YXJ0KSBkaXJlY3RseSB0byBQYXJzZXIgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gICAgR3JhbW1hci5mcm9tQ29tcGlsZWQgPSBmdW5jdGlvbihydWxlcywgc3RhcnQpIHtcbiAgICAgICAgdmFyIGxleGVyID0gcnVsZXMuTGV4ZXI7XG4gICAgICAgIGlmIChydWxlcy5QYXJzZXJTdGFydCkge1xuICAgICAgICAgIHN0YXJ0ID0gcnVsZXMuUGFyc2VyU3RhcnQ7XG4gICAgICAgICAgcnVsZXMgPSBydWxlcy5QYXJzZXJSdWxlcztcbiAgICAgICAgfVxuICAgICAgICB2YXIgcnVsZXMgPSBydWxlcy5tYXAoZnVuY3Rpb24gKHIpIHsgcmV0dXJuIChuZXcgUnVsZShyLm5hbWUsIHIuc3ltYm9scywgci5wb3N0cHJvY2VzcykpOyB9KTtcbiAgICAgICAgdmFyIGcgPSBuZXcgR3JhbW1hcihydWxlcywgc3RhcnQpO1xuICAgICAgICBnLmxleGVyID0gbGV4ZXI7IC8vIG5iLiBzdG9yaW5nIGxleGVyIG9uIEdyYW1tYXIgaXMgaWZmeSwgYnV0IHVuYXZvaWRhYmxlXG4gICAgICAgIHJldHVybiBnO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gU3RyZWFtTGV4ZXIoKSB7XG4gICAgICB0aGlzLnJlc2V0KFwiXCIpO1xuICAgIH1cblxuICAgIFN0cmVhbUxleGVyLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uKGRhdGEsIHN0YXRlKSB7XG4gICAgICAgIHRoaXMuYnVmZmVyID0gZGF0YTtcbiAgICAgICAgdGhpcy5pbmRleCA9IDA7XG4gICAgICAgIHRoaXMubGluZSA9IHN0YXRlID8gc3RhdGUubGluZSA6IDE7XG4gICAgICAgIHRoaXMubGFzdExpbmVCcmVhayA9IHN0YXRlID8gLXN0YXRlLmNvbCA6IDA7XG4gICAgfVxuXG4gICAgU3RyZWFtTGV4ZXIucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPCB0aGlzLmJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBjaCA9IHRoaXMuYnVmZmVyW3RoaXMuaW5kZXgrK107XG4gICAgICAgICAgICBpZiAoY2ggPT09ICdcXG4nKSB7XG4gICAgICAgICAgICAgIHRoaXMubGluZSArPSAxO1xuICAgICAgICAgICAgICB0aGlzLmxhc3RMaW5lQnJlYWsgPSB0aGlzLmluZGV4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHt2YWx1ZTogY2h9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgU3RyZWFtTGV4ZXIucHJvdG90eXBlLnNhdmUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxpbmU6IHRoaXMubGluZSxcbiAgICAgICAgY29sOiB0aGlzLmluZGV4IC0gdGhpcy5sYXN0TGluZUJyZWFrLFxuICAgICAgfVxuICAgIH1cblxuICAgIFN0cmVhbUxleGVyLnByb3RvdHlwZS5mb3JtYXRFcnJvciA9IGZ1bmN0aW9uKHRva2VuLCBtZXNzYWdlKSB7XG4gICAgICAgIC8vIG5iLiB0aGlzIGdldHMgY2FsbGVkIGFmdGVyIGNvbnN1bWluZyB0aGUgb2ZmZW5kaW5nIHRva2VuLFxuICAgICAgICAvLyBzbyB0aGUgY3VscHJpdCBpcyBpbmRleC0xXG4gICAgICAgIHZhciBidWZmZXIgPSB0aGlzLmJ1ZmZlcjtcbiAgICAgICAgaWYgKHR5cGVvZiBidWZmZXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB2YXIgbmV4dExpbmVCcmVhayA9IGJ1ZmZlci5pbmRleE9mKCdcXG4nLCB0aGlzLmluZGV4KTtcbiAgICAgICAgICAgIGlmIChuZXh0TGluZUJyZWFrID09PSAtMSkgbmV4dExpbmVCcmVhayA9IGJ1ZmZlci5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgbGluZSA9IGJ1ZmZlci5zdWJzdHJpbmcodGhpcy5sYXN0TGluZUJyZWFrLCBuZXh0TGluZUJyZWFrKVxuICAgICAgICAgICAgdmFyIGNvbCA9IHRoaXMuaW5kZXggLSB0aGlzLmxhc3RMaW5lQnJlYWs7XG4gICAgICAgICAgICBtZXNzYWdlICs9IFwiIGF0IGxpbmUgXCIgKyB0aGlzLmxpbmUgKyBcIiBjb2wgXCIgKyBjb2wgKyBcIjpcXG5cXG5cIjtcbiAgICAgICAgICAgIG1lc3NhZ2UgKz0gXCIgIFwiICsgbGluZSArIFwiXFxuXCJcbiAgICAgICAgICAgIG1lc3NhZ2UgKz0gXCIgIFwiICsgQXJyYXkoY29sKS5qb2luKFwiIFwiKSArIFwiXlwiXG4gICAgICAgICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBtZXNzYWdlICsgXCIgYXQgaW5kZXggXCIgKyAodGhpcy5pbmRleCAtIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBQYXJzZXIocnVsZXMsIHN0YXJ0LCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChydWxlcyBpbnN0YW5jZW9mIEdyYW1tYXIpIHtcbiAgICAgICAgICAgIHZhciBncmFtbWFyID0gcnVsZXM7XG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHN0YXJ0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGdyYW1tYXIgPSBHcmFtbWFyLmZyb21Db21waWxlZChydWxlcywgc3RhcnQpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ3JhbW1hciA9IGdyYW1tYXI7XG5cbiAgICAgICAgLy8gUmVhZCBvcHRpb25zXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGtlZXBIaXN0b3J5OiBmYWxzZSxcbiAgICAgICAgICAgIGxleGVyOiBncmFtbWFyLmxleGVyIHx8IG5ldyBTdHJlYW1MZXhlcixcbiAgICAgICAgfTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIChvcHRpb25zIHx8IHt9KSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zW2tleV0gPSBvcHRpb25zW2tleV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZXR1cCBsZXhlclxuICAgICAgICB0aGlzLmxleGVyID0gdGhpcy5vcHRpb25zLmxleGVyO1xuICAgICAgICB0aGlzLmxleGVyU3RhdGUgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgLy8gU2V0dXAgYSB0YWJsZVxuICAgICAgICB2YXIgY29sdW1uID0gbmV3IENvbHVtbihncmFtbWFyLCAwKTtcbiAgICAgICAgdmFyIHRhYmxlID0gdGhpcy50YWJsZSA9IFtjb2x1bW5dO1xuXG4gICAgICAgIC8vIEkgY291bGQgYmUgZXhwZWN0aW5nIGFueXRoaW5nLlxuICAgICAgICBjb2x1bW4ud2FudHNbZ3JhbW1hci5zdGFydF0gPSBbXTtcbiAgICAgICAgY29sdW1uLnByZWRpY3QoZ3JhbW1hci5zdGFydCk7XG4gICAgICAgIC8vIFRPRE8gd2hhdCBpZiBzdGFydCBydWxlIGlzIG51bGxhYmxlP1xuICAgICAgICBjb2x1bW4ucHJvY2VzcygpO1xuICAgICAgICB0aGlzLmN1cnJlbnQgPSAwOyAvLyB0b2tlbiBpbmRleFxuICAgIH1cblxuICAgIC8vIGNyZWF0ZSBhIHJlc2VydmVkIHRva2VuIGZvciBpbmRpY2F0aW5nIGEgcGFyc2UgZmFpbFxuICAgIFBhcnNlci5mYWlsID0ge307XG5cbiAgICBQYXJzZXIucHJvdG90eXBlLmZlZWQgPSBmdW5jdGlvbihjaHVuaykge1xuICAgICAgICB2YXIgbGV4ZXIgPSB0aGlzLmxleGVyO1xuICAgICAgICBsZXhlci5yZXNldChjaHVuaywgdGhpcy5sZXhlclN0YXRlKTtcblxuICAgICAgICB2YXIgdG9rZW47XG4gICAgICAgIHdoaWxlICh0b2tlbiA9IGxleGVyLm5leHQoKSkge1xuICAgICAgICAgICAgLy8gV2UgYWRkIG5ldyBzdGF0ZXMgdG8gdGFibGVbY3VycmVudCsxXVxuICAgICAgICAgICAgdmFyIGNvbHVtbiA9IHRoaXMudGFibGVbdGhpcy5jdXJyZW50XTtcblxuICAgICAgICAgICAgLy8gR0MgdW51c2VkIHN0YXRlc1xuICAgICAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMua2VlcEhpc3RvcnkpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy50YWJsZVt0aGlzLmN1cnJlbnQgLSAxXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG4gPSB0aGlzLmN1cnJlbnQgKyAxO1xuICAgICAgICAgICAgdmFyIG5leHRDb2x1bW4gPSBuZXcgQ29sdW1uKHRoaXMuZ3JhbW1hciwgbik7XG4gICAgICAgICAgICB0aGlzLnRhYmxlLnB1c2gobmV4dENvbHVtbik7XG5cbiAgICAgICAgICAgIC8vIEFkdmFuY2UgYWxsIHRva2VucyB0aGF0IGV4cGVjdCB0aGUgc3ltYm9sXG4gICAgICAgICAgICB2YXIgbGl0ZXJhbCA9IHRva2VuLnRleHQgIT09IHVuZGVmaW5lZCA/IHRva2VuLnRleHQgOiB0b2tlbi52YWx1ZTtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGxleGVyLmNvbnN0cnVjdG9yID09PSBTdHJlYW1MZXhlciA/IHRva2VuLnZhbHVlIDogdG9rZW47XG4gICAgICAgICAgICB2YXIgc2Nhbm5hYmxlID0gY29sdW1uLnNjYW5uYWJsZTtcbiAgICAgICAgICAgIGZvciAodmFyIHcgPSBzY2FubmFibGUubGVuZ3RoOyB3LS07ICkge1xuICAgICAgICAgICAgICAgIHZhciBzdGF0ZSA9IHNjYW5uYWJsZVt3XTtcbiAgICAgICAgICAgICAgICB2YXIgZXhwZWN0ID0gc3RhdGUucnVsZS5zeW1ib2xzW3N0YXRlLmRvdF07XG4gICAgICAgICAgICAgICAgLy8gVHJ5IHRvIGNvbnN1bWUgdGhlIHRva2VuXG4gICAgICAgICAgICAgICAgLy8gZWl0aGVyIHJlZ2V4IG9yIGxpdGVyYWxcbiAgICAgICAgICAgICAgICBpZiAoZXhwZWN0LnRlc3QgPyBleHBlY3QudGVzdCh2YWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICBleHBlY3QudHlwZSA/IGV4cGVjdC50eXBlID09PSB0b2tlbi50eXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogZXhwZWN0LmxpdGVyYWwgPT09IGxpdGVyYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGl0XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXh0ID0gc3RhdGUubmV4dFN0YXRlKHtkYXRhOiB2YWx1ZSwgdG9rZW46IHRva2VuLCBpc1Rva2VuOiB0cnVlLCByZWZlcmVuY2U6IG4gLSAxfSk7XG4gICAgICAgICAgICAgICAgICAgIG5leHRDb2x1bW4uc3RhdGVzLnB1c2gobmV4dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBOZXh0LCBmb3IgZWFjaCBvZiB0aGUgcnVsZXMsIHdlIGVpdGhlclxuICAgICAgICAgICAgLy8gKGEpIGNvbXBsZXRlIGl0LCBhbmQgdHJ5IHRvIHNlZSBpZiB0aGUgcmVmZXJlbmNlIHJvdyBleHBlY3RlZCB0aGF0XG4gICAgICAgICAgICAvLyAgICAgcnVsZVxuICAgICAgICAgICAgLy8gKGIpIHByZWRpY3QgdGhlIG5leHQgbm9udGVybWluYWwgaXQgZXhwZWN0cyBieSBhZGRpbmcgdGhhdFxuICAgICAgICAgICAgLy8gICAgIG5vbnRlcm1pbmFsJ3Mgc3RhcnQgc3RhdGVcbiAgICAgICAgICAgIC8vIFRvIHByZXZlbnQgZHVwbGljYXRpb24sIHdlIGFsc28ga2VlcCB0cmFjayBvZiBydWxlcyB3ZSBoYXZlIGFscmVhZHlcbiAgICAgICAgICAgIC8vIGFkZGVkXG5cbiAgICAgICAgICAgIG5leHRDb2x1bW4ucHJvY2VzcygpO1xuXG4gICAgICAgICAgICAvLyBJZiBuZWVkZWQsIHRocm93IGFuIGVycm9yOlxuICAgICAgICAgICAgaWYgKG5leHRDb2x1bW4uc3RhdGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIC8vIE5vIHN0YXRlcyBhdCBhbGwhIFRoaXMgaXMgbm90IGdvb2QuXG4gICAgICAgICAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcih0aGlzLnJlcG9ydEVycm9yKHRva2VuKSk7XG4gICAgICAgICAgICAgICAgZXJyLm9mZnNldCA9IHRoaXMuY3VycmVudDtcbiAgICAgICAgICAgICAgICBlcnIudG9rZW4gPSB0b2tlbjtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIG1heWJlIHNhdmUgbGV4ZXIgc3RhdGVcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMua2VlcEhpc3RvcnkpIHtcbiAgICAgICAgICAgICAgY29sdW1uLmxleGVyU3RhdGUgPSBsZXhlci5zYXZlKClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jdXJyZW50Kys7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbHVtbikge1xuICAgICAgICAgIHRoaXMubGV4ZXJTdGF0ZSA9IGxleGVyLnNhdmUoKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSW5jcmVtZW50YWxseSBrZWVwIHRyYWNrIG9mIHJlc3VsdHNcbiAgICAgICAgdGhpcy5yZXN1bHRzID0gdGhpcy5maW5pc2goKTtcblxuICAgICAgICAvLyBBbGxvdyBjaGFpbmluZywgZm9yIHdoYXRldmVyIGl0J3Mgd29ydGhcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIFBhcnNlci5wcm90b3R5cGUucmVwb3J0RXJyb3IgPSBmdW5jdGlvbih0b2tlbikge1xuICAgICAgICB2YXIgbGluZXMgPSBbXTtcbiAgICAgICAgdmFyIHRva2VuRGlzcGxheSA9ICh0b2tlbi50eXBlID8gdG9rZW4udHlwZSArIFwiIHRva2VuOiBcIiA6IFwiXCIpICsgSlNPTi5zdHJpbmdpZnkodG9rZW4udmFsdWUgIT09IHVuZGVmaW5lZCA/IHRva2VuLnZhbHVlIDogdG9rZW4pO1xuICAgICAgICBsaW5lcy5wdXNoKHRoaXMubGV4ZXIuZm9ybWF0RXJyb3IodG9rZW4sIFwiU3ludGF4IGVycm9yXCIpKTtcbiAgICAgICAgbGluZXMucHVzaCgnVW5leHBlY3RlZCAnICsgdG9rZW5EaXNwbGF5ICsgJy4gSW5zdGVhZCwgSSB3YXMgZXhwZWN0aW5nIHRvIHNlZSBvbmUgb2YgdGhlIGZvbGxvd2luZzpcXG4nKTtcbiAgICAgICAgdmFyIGxhc3RDb2x1bW5JbmRleCA9IHRoaXMudGFibGUubGVuZ3RoIC0gMjtcbiAgICAgICAgdmFyIGxhc3RDb2x1bW4gPSB0aGlzLnRhYmxlW2xhc3RDb2x1bW5JbmRleF07XG4gICAgICAgIHZhciBleHBlY3RhbnRTdGF0ZXMgPSBsYXN0Q29sdW1uLnN0YXRlc1xuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0U3ltYm9sID0gc3RhdGUucnVsZS5zeW1ib2xzW3N0YXRlLmRvdF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHRTeW1ib2wgJiYgdHlwZW9mIG5leHRTeW1ib2wgIT09IFwic3RyaW5nXCI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIERpc3BsYXkgYSBcInN0YXRlIHN0YWNrXCIgZm9yIGVhY2ggZXhwZWN0YW50IHN0YXRlXG4gICAgICAgIC8vIC0gd2hpY2ggc2hvd3MgeW91IGhvdyB0aGlzIHN0YXRlIGNhbWUgdG8gYmUsIHN0ZXAgYnkgc3RlcC4gXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIG1vcmUgdGhhbiBvbmUgZGVyaXZhdGlvbiwgd2Ugb25seSBkaXNwbGF5IHRoZSBmaXJzdCBvbmUuXG4gICAgICAgIHZhciBzdGF0ZVN0YWNrcyA9IGV4cGVjdGFudFN0YXRlc1xuICAgICAgICAgICAgLm1hcChmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgICAgICAgICAgIHZhciBzdGFja3MgPSB0aGlzLmJ1aWxkU3RhdGVTdGFja3Moc3RhdGUsIFtdKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhY2tzWzBdO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIC8vIERpc3BsYXkgZWFjaCBzdGF0ZSB0aGF0IGlzIGV4cGVjdGluZyBhIHRlcm1pbmFsIHN5bWJvbCBuZXh0LlxuICAgICAgICBzdGF0ZVN0YWNrcy5mb3JFYWNoKGZ1bmN0aW9uKHN0YXRlU3RhY2spIHtcbiAgICAgICAgICAgIHZhciBzdGF0ZSA9IHN0YXRlU3RhY2tbMF07XG4gICAgICAgICAgICB2YXIgbmV4dFN5bWJvbCA9IHN0YXRlLnJ1bGUuc3ltYm9sc1tzdGF0ZS5kb3RdO1xuICAgICAgICAgICAgdmFyIHN5bWJvbERpc3BsYXkgPSB0aGlzLmdldFN5bWJvbERpc3BsYXkobmV4dFN5bWJvbCk7XG4gICAgICAgICAgICBsaW5lcy5wdXNoKCdBICcgKyBzeW1ib2xEaXNwbGF5ICsgJyBiYXNlZCBvbjonKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheVN0YXRlU3RhY2soc3RhdGVTdGFjaywgbGluZXMpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIFxuICAgICAgICBsaW5lcy5wdXNoKFwiXCIpO1xuICAgICAgICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKTtcbiAgICB9O1xuXG4gICAgUGFyc2VyLnByb3RvdHlwZS5kaXNwbGF5U3RhdGVTdGFjayA9IGZ1bmN0aW9uKHN0YXRlU3RhY2ssIGxpbmVzKSB7XG4gICAgICAgIHZhciBsYXN0RGlzcGxheTtcbiAgICAgICAgdmFyIHNhbWVEaXNwbGF5Q291bnQgPSAwO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHN0YXRlU3RhY2subGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciBzdGF0ZSA9IHN0YXRlU3RhY2tbal07XG4gICAgICAgICAgICB2YXIgZGlzcGxheSA9IHN0YXRlLnJ1bGUudG9TdHJpbmcoc3RhdGUuZG90KTtcbiAgICAgICAgICAgIGlmIChkaXNwbGF5ID09PSBsYXN0RGlzcGxheSkge1xuICAgICAgICAgICAgICAgIHNhbWVEaXNwbGF5Q291bnQrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHNhbWVEaXNwbGF5Q291bnQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVzLnB1c2goJyAgICDirIYg77iOJyArIHNhbWVEaXNwbGF5Q291bnQgKyAnIG1vcmUgbGluZXMgaWRlbnRpY2FsIHRvIHRoaXMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2FtZURpc3BsYXlDb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgbGluZXMucHVzaCgnICAgICcgKyBkaXNwbGF5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhc3REaXNwbGF5ID0gZGlzcGxheTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBQYXJzZXIucHJvdG90eXBlLmdldFN5bWJvbERpc3BsYXkgPSBmdW5jdGlvbihzeW1ib2wpIHtcbiAgICAgICAgdmFyIHR5cGUgPSB0eXBlb2Ygc3ltYm9sO1xuICAgICAgICBpZiAodHlwZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgcmV0dXJuIHN5bWJvbDtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSBcIm9iamVjdFwiICYmIHN5bWJvbC5saXRlcmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoc3ltYm9sLmxpdGVyYWwpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFwib2JqZWN0XCIgJiYgc3ltYm9sIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2NoYXJhY3RlciBtYXRjaGluZyAnICsgc3ltYm9sO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFwib2JqZWN0XCIgJiYgc3ltYm9sLnR5cGUpIHtcbiAgICAgICAgICAgIHJldHVybiBzeW1ib2wudHlwZSArICcgdG9rZW4nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIHN5bWJvbCB0eXBlOiAnICsgc3ltYm9sKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKlxuICAgIEJ1aWxkcyBhIG51bWJlciBvZiBcInN0YXRlIHN0YWNrc1wiLiBZb3UgY2FuIHRoaW5rIG9mIGEgc3RhdGUgc3RhY2sgYXMgdGhlIGNhbGwgc3RhY2tcbiAgICBvZiB0aGUgcmVjdXJzaXZlLWRlc2NlbnQgcGFyc2VyIHdoaWNoIHRoZSBOZWFybGV5IHBhcnNlIGFsZ29yaXRobSBzaW11bGF0ZXMuXG4gICAgQSBzdGF0ZSBzdGFjayBpcyByZXByZXNlbnRlZCBhcyBhbiBhcnJheSBvZiBzdGF0ZSBvYmplY3RzLiBXaXRoaW4gYSBcbiAgICBzdGF0ZSBzdGFjaywgdGhlIGZpcnN0IGl0ZW0gb2YgdGhlIGFycmF5IHdpbGwgYmUgdGhlIHN0YXJ0aW5nXG4gICAgc3RhdGUsIHdpdGggZWFjaCBzdWNjZXNzaXZlIGl0ZW0gaW4gdGhlIGFycmF5IGdvaW5nIGZ1cnRoZXIgYmFjayBpbnRvIGhpc3RvcnkuXG4gICAgXG4gICAgVGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSBnaXZlbiBhIHN0YXJ0aW5nIHN0YXRlIGFuZCBhbiBlbXB0eSBhcnJheSByZXByZXNlbnRpbmdcbiAgICB0aGUgdmlzaXRlZCBzdGF0ZXMsIGFuZCBpdCByZXR1cm5zIGFuIGFycmF5IG9mIHN0YXRlIHN0YWNrcy4gXG4gICAgXG4gICAgKi9cbiAgICBQYXJzZXIucHJvdG90eXBlLmJ1aWxkU3RhdGVTdGFja3MgPSBmdW5jdGlvbihzdGF0ZSwgdmlzaXRlZCkge1xuICAgICAgICBpZiAodmlzaXRlZC5pbmRleE9mKHN0YXRlKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIC8vIEZvdW5kIGN5Y2xlLCByZXR1cm4gZW1wdHkgYXJyYXkgKG1lYW5pbmcgbm8gc3RhY2tzKVxuICAgICAgICAgICAgLy8gdG8gZWxpbWluYXRlIHRoaXMgcGF0aCBmcm9tIHRoZSByZXN1bHRzLCBiZWNhdXNlXG4gICAgICAgICAgICAvLyB3ZSBkb24ndCBrbm93IGhvdyB0byBkaXNwbGF5IGl0IG1lYW5pbmdmdWxseVxuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGF0ZS53YW50ZWRCeS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBbW3N0YXRlXV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgICAgIHJldHVybiBzdGF0ZS53YW50ZWRCeS5yZWR1Y2UoZnVuY3Rpb24oc3RhY2tzLCBwcmV2U3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiBzdGFja3MuY29uY2F0KHRoYXQuYnVpbGRTdGF0ZVN0YWNrcyhcbiAgICAgICAgICAgICAgICBwcmV2U3RhdGUsXG4gICAgICAgICAgICAgICAgW3N0YXRlXS5jb25jYXQodmlzaXRlZCkpXG4gICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbihzdGFjaykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW3N0YXRlXS5jb25jYXQoc3RhY2spO1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSwgW10pO1xuICAgIH07XG5cbiAgICBQYXJzZXIucHJvdG90eXBlLnNhdmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNvbHVtbiA9IHRoaXMudGFibGVbdGhpcy5jdXJyZW50XTtcbiAgICAgICAgY29sdW1uLmxleGVyU3RhdGUgPSB0aGlzLmxleGVyU3RhdGU7XG4gICAgICAgIHJldHVybiBjb2x1bW47XG4gICAgfTtcblxuICAgIFBhcnNlci5wcm90b3R5cGUucmVzdG9yZSA9IGZ1bmN0aW9uKGNvbHVtbikge1xuICAgICAgICB2YXIgaW5kZXggPSBjb2x1bW4uaW5kZXg7XG4gICAgICAgIHRoaXMuY3VycmVudCA9IGluZGV4O1xuICAgICAgICB0aGlzLnRhYmxlW2luZGV4XSA9IGNvbHVtbjtcbiAgICAgICAgdGhpcy50YWJsZS5zcGxpY2UoaW5kZXggKyAxKTtcbiAgICAgICAgdGhpcy5sZXhlclN0YXRlID0gY29sdW1uLmxleGVyU3RhdGU7XG5cbiAgICAgICAgLy8gSW5jcmVtZW50YWxseSBrZWVwIHRyYWNrIG9mIHJlc3VsdHNcbiAgICAgICAgdGhpcy5yZXN1bHRzID0gdGhpcy5maW5pc2goKTtcbiAgICB9O1xuXG4gICAgLy8gbmIuIGRlcHJlY2F0ZWQ6IHVzZSBzYXZlL3Jlc3RvcmUgaW5zdGVhZCFcbiAgICBQYXJzZXIucHJvdG90eXBlLnJld2luZCA9IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmtlZXBIaXN0b3J5KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldCBvcHRpb24gYGtlZXBIaXN0b3J5YCB0byBlbmFibGUgcmV3aW5kaW5nJylcbiAgICAgICAgfVxuICAgICAgICAvLyBuYi4gcmVjYWxsIGNvbHVtbiAodGFibGUpIGluZGljaWVzIGZhbGwgYmV0d2VlbiB0b2tlbiBpbmRpY2llcy5cbiAgICAgICAgLy8gICAgICAgIGNvbCAwICAgLS0gICB0b2tlbiAwICAgLS0gICBjb2wgMVxuICAgICAgICB0aGlzLnJlc3RvcmUodGhpcy50YWJsZVtpbmRleF0pO1xuICAgIH07XG5cbiAgICBQYXJzZXIucHJvdG90eXBlLmZpbmlzaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBSZXR1cm4gdGhlIHBvc3NpYmxlIHBhcnNpbmdzXG4gICAgICAgIHZhciBjb25zaWRlcmF0aW9ucyA9IFtdO1xuICAgICAgICB2YXIgc3RhcnQgPSB0aGlzLmdyYW1tYXIuc3RhcnQ7XG4gICAgICAgIHZhciBjb2x1bW4gPSB0aGlzLnRhYmxlW3RoaXMudGFibGUubGVuZ3RoIC0gMV1cbiAgICAgICAgY29sdW1uLnN0YXRlcy5mb3JFYWNoKGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICBpZiAodC5ydWxlLm5hbWUgPT09IHN0YXJ0XG4gICAgICAgICAgICAgICAgICAgICYmIHQuZG90ID09PSB0LnJ1bGUuc3ltYm9scy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgJiYgdC5yZWZlcmVuY2UgPT09IDBcbiAgICAgICAgICAgICAgICAgICAgJiYgdC5kYXRhICE9PSBQYXJzZXIuZmFpbCkge1xuICAgICAgICAgICAgICAgIGNvbnNpZGVyYXRpb25zLnB1c2godCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY29uc2lkZXJhdGlvbnMubWFwKGZ1bmN0aW9uKGMpIHtyZXR1cm4gYy5kYXRhOyB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgUGFyc2VyOiBQYXJzZXIsXG4gICAgICAgIEdyYW1tYXI6IEdyYW1tYXIsXG4gICAgICAgIFJ1bGU6IFJ1bGUsXG4gICAgfTtcblxufSkpO1xuIl19

(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"C:\\Users\\filip\\Desktop\\PROGRAMMING\\calculator\\node_modules\\nearley\\lib\\nearley.js":[function(require,module,exports){
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

},{}],"C:\\Users\\filip\\Desktop\\PROGRAMMING\\calculator\\src\\grammar.js":[function(require,module,exports){
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

},{}],"C:\\Users\\filip\\Desktop\\PROGRAMMING\\calculator\\src\\main.js":[function(require,module,exports){
const nearley = require("nearley");
const grammar = require("./grammar.js");

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

},{"./grammar.js":"C:\\Users\\filip\\Desktop\\PROGRAMMING\\calculator\\src\\grammar.js","nearley":"C:\\Users\\filip\\Desktop\\PROGRAMMING\\calculator\\node_modules\\nearley\\lib\\nearley.js"}]},{},["C:\\Users\\filip\\Desktop\\PROGRAMMING\\calculator\\src\\main.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9ub2RlX21vZHVsZXMvbmVhcmxleS9saWIvbmVhcmxleS5qcyIsImdyYW1tYXIuanMiLCJtYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiKGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdC5uZWFybGV5ID0gZmFjdG9yeSgpO1xuICAgIH1cbn0odGhpcywgZnVuY3Rpb24oKSB7XG5cbiAgICBmdW5jdGlvbiBSdWxlKG5hbWUsIHN5bWJvbHMsIHBvc3Rwcm9jZXNzKSB7XG4gICAgICAgIHRoaXMuaWQgPSArK1J1bGUuaGlnaGVzdElkO1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLnN5bWJvbHMgPSBzeW1ib2xzOyAgICAgICAgLy8gYSBsaXN0IG9mIGxpdGVyYWwgfCByZWdleCBjbGFzcyB8IG5vbnRlcm1pbmFsXG4gICAgICAgIHRoaXMucG9zdHByb2Nlc3MgPSBwb3N0cHJvY2VzcztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFJ1bGUuaGlnaGVzdElkID0gMDtcblxuICAgIFJ1bGUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24od2l0aEN1cnNvckF0KSB7XG4gICAgICAgIGZ1bmN0aW9uIHN0cmluZ2lmeVN5bWJvbFNlcXVlbmNlIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gZS5saXRlcmFsID8gSlNPTi5zdHJpbmdpZnkoZS5saXRlcmFsKSA6XG4gICAgICAgICAgICAgICAgICAgZS50eXBlID8gJyUnICsgZS50eXBlIDogZS50b1N0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzeW1ib2xTZXF1ZW5jZSA9ICh0eXBlb2Ygd2l0aEN1cnNvckF0ID09PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHRoaXMuc3ltYm9scy5tYXAoc3RyaW5naWZ5U3ltYm9sU2VxdWVuY2UpLmpvaW4oJyAnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICggICB0aGlzLnN5bWJvbHMuc2xpY2UoMCwgd2l0aEN1cnNvckF0KS5tYXAoc3RyaW5naWZ5U3ltYm9sU2VxdWVuY2UpLmpvaW4oJyAnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBcIiDil48gXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgdGhpcy5zeW1ib2xzLnNsaWNlKHdpdGhDdXJzb3JBdCkubWFwKHN0cmluZ2lmeVN5bWJvbFNlcXVlbmNlKS5qb2luKCcgJykgICAgICk7XG4gICAgICAgIHJldHVybiB0aGlzLm5hbWUgKyBcIiDihpIgXCIgKyBzeW1ib2xTZXF1ZW5jZTtcbiAgICB9XG5cblxuICAgIC8vIGEgU3RhdGUgaXMgYSBydWxlIGF0IGEgcG9zaXRpb24gZnJvbSBhIGdpdmVuIHN0YXJ0aW5nIHBvaW50IGluIHRoZSBpbnB1dCBzdHJlYW0gKHJlZmVyZW5jZSlcbiAgICBmdW5jdGlvbiBTdGF0ZShydWxlLCBkb3QsIHJlZmVyZW5jZSwgd2FudGVkQnkpIHtcbiAgICAgICAgdGhpcy5ydWxlID0gcnVsZTtcbiAgICAgICAgdGhpcy5kb3QgPSBkb3Q7XG4gICAgICAgIHRoaXMucmVmZXJlbmNlID0gcmVmZXJlbmNlO1xuICAgICAgICB0aGlzLmRhdGEgPSBbXTtcbiAgICAgICAgdGhpcy53YW50ZWRCeSA9IHdhbnRlZEJ5O1xuICAgICAgICB0aGlzLmlzQ29tcGxldGUgPSB0aGlzLmRvdCA9PT0gcnVsZS5zeW1ib2xzLmxlbmd0aDtcbiAgICB9XG5cbiAgICBTdGF0ZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFwie1wiICsgdGhpcy5ydWxlLnRvU3RyaW5nKHRoaXMuZG90KSArIFwifSwgZnJvbTogXCIgKyAodGhpcy5yZWZlcmVuY2UgfHwgMCk7XG4gICAgfTtcblxuICAgIFN0YXRlLnByb3RvdHlwZS5uZXh0U3RhdGUgPSBmdW5jdGlvbihjaGlsZCkge1xuICAgICAgICB2YXIgc3RhdGUgPSBuZXcgU3RhdGUodGhpcy5ydWxlLCB0aGlzLmRvdCArIDEsIHRoaXMucmVmZXJlbmNlLCB0aGlzLndhbnRlZEJ5KTtcbiAgICAgICAgc3RhdGUubGVmdCA9IHRoaXM7XG4gICAgICAgIHN0YXRlLnJpZ2h0ID0gY2hpbGQ7XG4gICAgICAgIGlmIChzdGF0ZS5pc0NvbXBsZXRlKSB7XG4gICAgICAgICAgICBzdGF0ZS5kYXRhID0gc3RhdGUuYnVpbGQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfTtcblxuICAgIFN0YXRlLnByb3RvdHlwZS5idWlsZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY2hpbGRyZW4gPSBbXTtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKG5vZGUucmlnaHQuZGF0YSk7XG4gICAgICAgICAgICBub2RlID0gbm9kZS5sZWZ0O1xuICAgICAgICB9IHdoaWxlIChub2RlLmxlZnQpO1xuICAgICAgICBjaGlsZHJlbi5yZXZlcnNlKCk7XG4gICAgICAgIHJldHVybiBjaGlsZHJlbjtcbiAgICB9O1xuXG4gICAgU3RhdGUucHJvdG90eXBlLmZpbmlzaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5ydWxlLnBvc3Rwcm9jZXNzKSB7XG4gICAgICAgICAgICB0aGlzLmRhdGEgPSB0aGlzLnJ1bGUucG9zdHByb2Nlc3ModGhpcy5kYXRhLCB0aGlzLnJlZmVyZW5jZSwgUGFyc2VyLmZhaWwpO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgZnVuY3Rpb24gQ29sdW1uKGdyYW1tYXIsIGluZGV4KSB7XG4gICAgICAgIHRoaXMuZ3JhbW1hciA9IGdyYW1tYXI7XG4gICAgICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICAgICAgdGhpcy5zdGF0ZXMgPSBbXTtcbiAgICAgICAgdGhpcy53YW50cyA9IHt9OyAvLyBzdGF0ZXMgaW5kZXhlZCBieSB0aGUgbm9uLXRlcm1pbmFsIHRoZXkgZXhwZWN0XG4gICAgICAgIHRoaXMuc2Nhbm5hYmxlID0gW107IC8vIGxpc3Qgb2Ygc3RhdGVzIHRoYXQgZXhwZWN0IGEgdG9rZW5cbiAgICAgICAgdGhpcy5jb21wbGV0ZWQgPSB7fTsgLy8gc3RhdGVzIHRoYXQgYXJlIG51bGxhYmxlXG4gICAgfVxuXG5cbiAgICBDb2x1bW4ucHJvdG90eXBlLnByb2Nlc3MgPSBmdW5jdGlvbihuZXh0Q29sdW1uKSB7XG4gICAgICAgIHZhciBzdGF0ZXMgPSB0aGlzLnN0YXRlcztcbiAgICAgICAgdmFyIHdhbnRzID0gdGhpcy53YW50cztcbiAgICAgICAgdmFyIGNvbXBsZXRlZCA9IHRoaXMuY29tcGxldGVkO1xuXG4gICAgICAgIGZvciAodmFyIHcgPSAwOyB3IDwgc3RhdGVzLmxlbmd0aDsgdysrKSB7IC8vIG5iLiB3ZSBwdXNoKCkgZHVyaW5nIGl0ZXJhdGlvblxuICAgICAgICAgICAgdmFyIHN0YXRlID0gc3RhdGVzW3ddO1xuXG4gICAgICAgICAgICBpZiAoc3RhdGUuaXNDb21wbGV0ZSkge1xuICAgICAgICAgICAgICAgIHN0YXRlLmZpbmlzaCgpO1xuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5kYXRhICE9PSBQYXJzZXIuZmFpbCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb21wbGV0ZVxuICAgICAgICAgICAgICAgICAgICB2YXIgd2FudGVkQnkgPSBzdGF0ZS53YW50ZWRCeTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IHdhbnRlZEJ5Lmxlbmd0aDsgaS0tOyApIHsgLy8gdGhpcyBsaW5lIGlzIGhvdFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxlZnQgPSB3YW50ZWRCeVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29tcGxldGUobGVmdCwgc3RhdGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gc3BlY2lhbC1jYXNlIG51bGxhYmxlc1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdGUucmVmZXJlbmNlID09PSB0aGlzLmluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgZnV0dXJlIHByZWRpY3RvcnMgb2YgdGhpcyBydWxlIGdldCBjb21wbGV0ZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXhwID0gc3RhdGUucnVsZS5uYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgKHRoaXMuY29tcGxldGVkW2V4cF0gPSB0aGlzLmNvbXBsZXRlZFtleHBdIHx8IFtdKS5wdXNoKHN0YXRlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBxdWV1ZSBzY2FubmFibGUgc3RhdGVzXG4gICAgICAgICAgICAgICAgdmFyIGV4cCA9IHN0YXRlLnJ1bGUuc3ltYm9sc1tzdGF0ZS5kb3RdO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZXhwICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNjYW5uYWJsZS5wdXNoKHN0YXRlKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gcHJlZGljdFxuICAgICAgICAgICAgICAgIGlmICh3YW50c1tleHBdKSB7XG4gICAgICAgICAgICAgICAgICAgIHdhbnRzW2V4cF0ucHVzaChzdGF0ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXBsZXRlZC5oYXNPd25Qcm9wZXJ0eShleHApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbnVsbHMgPSBjb21wbGV0ZWRbZXhwXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVsbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmlnaHQgPSBudWxsc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbXBsZXRlKHN0YXRlLCByaWdodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB3YW50c1tleHBdID0gW3N0YXRlXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmVkaWN0KGV4cCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgQ29sdW1uLnByb3RvdHlwZS5wcmVkaWN0ID0gZnVuY3Rpb24oZXhwKSB7XG4gICAgICAgIHZhciBydWxlcyA9IHRoaXMuZ3JhbW1hci5ieU5hbWVbZXhwXSB8fCBbXTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJ1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgciA9IHJ1bGVzW2ldO1xuICAgICAgICAgICAgdmFyIHdhbnRlZEJ5ID0gdGhpcy53YW50c1tleHBdO1xuICAgICAgICAgICAgdmFyIHMgPSBuZXcgU3RhdGUociwgMCwgdGhpcy5pbmRleCwgd2FudGVkQnkpO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZXMucHVzaChzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIENvbHVtbi5wcm90b3R5cGUuY29tcGxldGUgPSBmdW5jdGlvbihsZWZ0LCByaWdodCkge1xuICAgICAgICB2YXIgY29weSA9IGxlZnQubmV4dFN0YXRlKHJpZ2h0KTtcbiAgICAgICAgdGhpcy5zdGF0ZXMucHVzaChjb3B5KTtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIEdyYW1tYXIocnVsZXMsIHN0YXJ0KSB7XG4gICAgICAgIHRoaXMucnVsZXMgPSBydWxlcztcbiAgICAgICAgdGhpcy5zdGFydCA9IHN0YXJ0IHx8IHRoaXMucnVsZXNbMF0ubmFtZTtcbiAgICAgICAgdmFyIGJ5TmFtZSA9IHRoaXMuYnlOYW1lID0ge307XG4gICAgICAgIHRoaXMucnVsZXMuZm9yRWFjaChmdW5jdGlvbihydWxlKSB7XG4gICAgICAgICAgICBpZiAoIWJ5TmFtZS5oYXNPd25Qcm9wZXJ0eShydWxlLm5hbWUpKSB7XG4gICAgICAgICAgICAgICAgYnlOYW1lW3J1bGUubmFtZV0gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJ5TmFtZVtydWxlLm5hbWVdLnB1c2gocnVsZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFNvIHdlIGNhbiBhbGxvdyBwYXNzaW5nIChydWxlcywgc3RhcnQpIGRpcmVjdGx5IHRvIFBhcnNlciBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgICBHcmFtbWFyLmZyb21Db21waWxlZCA9IGZ1bmN0aW9uKHJ1bGVzLCBzdGFydCkge1xuICAgICAgICB2YXIgbGV4ZXIgPSBydWxlcy5MZXhlcjtcbiAgICAgICAgaWYgKHJ1bGVzLlBhcnNlclN0YXJ0KSB7XG4gICAgICAgICAgc3RhcnQgPSBydWxlcy5QYXJzZXJTdGFydDtcbiAgICAgICAgICBydWxlcyA9IHJ1bGVzLlBhcnNlclJ1bGVzO1xuICAgICAgICB9XG4gICAgICAgIHZhciBydWxlcyA9IHJ1bGVzLm1hcChmdW5jdGlvbiAocikgeyByZXR1cm4gKG5ldyBSdWxlKHIubmFtZSwgci5zeW1ib2xzLCByLnBvc3Rwcm9jZXNzKSk7IH0pO1xuICAgICAgICB2YXIgZyA9IG5ldyBHcmFtbWFyKHJ1bGVzLCBzdGFydCk7XG4gICAgICAgIGcubGV4ZXIgPSBsZXhlcjsgLy8gbmIuIHN0b3JpbmcgbGV4ZXIgb24gR3JhbW1hciBpcyBpZmZ5LCBidXQgdW5hdm9pZGFibGVcbiAgICAgICAgcmV0dXJuIGc7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBTdHJlYW1MZXhlcigpIHtcbiAgICAgIHRoaXMucmVzZXQoXCJcIik7XG4gICAgfVxuXG4gICAgU3RyZWFtTGV4ZXIucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24oZGF0YSwgc3RhdGUpIHtcbiAgICAgICAgdGhpcy5idWZmZXIgPSBkYXRhO1xuICAgICAgICB0aGlzLmluZGV4ID0gMDtcbiAgICAgICAgdGhpcy5saW5lID0gc3RhdGUgPyBzdGF0ZS5saW5lIDogMTtcbiAgICAgICAgdGhpcy5sYXN0TGluZUJyZWFrID0gc3RhdGUgPyAtc3RhdGUuY29sIDogMDtcbiAgICB9XG5cbiAgICBTdHJlYW1MZXhlci5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5pbmRleCA8IHRoaXMuYnVmZmVyLmxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIGNoID0gdGhpcy5idWZmZXJbdGhpcy5pbmRleCsrXTtcbiAgICAgICAgICAgIGlmIChjaCA9PT0gJ1xcbicpIHtcbiAgICAgICAgICAgICAgdGhpcy5saW5lICs9IDE7XG4gICAgICAgICAgICAgIHRoaXMubGFzdExpbmVCcmVhayA9IHRoaXMuaW5kZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge3ZhbHVlOiBjaH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBTdHJlYW1MZXhlci5wcm90b3R5cGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGluZTogdGhpcy5saW5lLFxuICAgICAgICBjb2w6IHRoaXMuaW5kZXggLSB0aGlzLmxhc3RMaW5lQnJlYWssXG4gICAgICB9XG4gICAgfVxuXG4gICAgU3RyZWFtTGV4ZXIucHJvdG90eXBlLmZvcm1hdEVycm9yID0gZnVuY3Rpb24odG9rZW4sIG1lc3NhZ2UpIHtcbiAgICAgICAgLy8gbmIuIHRoaXMgZ2V0cyBjYWxsZWQgYWZ0ZXIgY29uc3VtaW5nIHRoZSBvZmZlbmRpbmcgdG9rZW4sXG4gICAgICAgIC8vIHNvIHRoZSBjdWxwcml0IGlzIGluZGV4LTFcbiAgICAgICAgdmFyIGJ1ZmZlciA9IHRoaXMuYnVmZmVyO1xuICAgICAgICBpZiAodHlwZW9mIGJ1ZmZlciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHZhciBuZXh0TGluZUJyZWFrID0gYnVmZmVyLmluZGV4T2YoJ1xcbicsIHRoaXMuaW5kZXgpO1xuICAgICAgICAgICAgaWYgKG5leHRMaW5lQnJlYWsgPT09IC0xKSBuZXh0TGluZUJyZWFrID0gYnVmZmVyLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBsaW5lID0gYnVmZmVyLnN1YnN0cmluZyh0aGlzLmxhc3RMaW5lQnJlYWssIG5leHRMaW5lQnJlYWspXG4gICAgICAgICAgICB2YXIgY29sID0gdGhpcy5pbmRleCAtIHRoaXMubGFzdExpbmVCcmVhaztcbiAgICAgICAgICAgIG1lc3NhZ2UgKz0gXCIgYXQgbGluZSBcIiArIHRoaXMubGluZSArIFwiIGNvbCBcIiArIGNvbCArIFwiOlxcblxcblwiO1xuICAgICAgICAgICAgbWVzc2FnZSArPSBcIiAgXCIgKyBsaW5lICsgXCJcXG5cIlxuICAgICAgICAgICAgbWVzc2FnZSArPSBcIiAgXCIgKyBBcnJheShjb2wpLmpvaW4oXCIgXCIpICsgXCJeXCJcbiAgICAgICAgICAgIHJldHVybiBtZXNzYWdlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG1lc3NhZ2UgKyBcIiBhdCBpbmRleCBcIiArICh0aGlzLmluZGV4IC0gMSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIFBhcnNlcihydWxlcywgc3RhcnQsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHJ1bGVzIGluc3RhbmNlb2YgR3JhbW1hcikge1xuICAgICAgICAgICAgdmFyIGdyYW1tYXIgPSBydWxlcztcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gc3RhcnQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgZ3JhbW1hciA9IEdyYW1tYXIuZnJvbUNvbXBpbGVkKHJ1bGVzLCBzdGFydCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ncmFtbWFyID0gZ3JhbW1hcjtcblxuICAgICAgICAvLyBSZWFkIG9wdGlvbnNcbiAgICAgICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgICAgICAga2VlcEhpc3Rvcnk6IGZhbHNlLFxuICAgICAgICAgICAgbGV4ZXI6IGdyYW1tYXIubGV4ZXIgfHwgbmV3IFN0cmVhbUxleGVyLFxuICAgICAgICB9O1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gKG9wdGlvbnMgfHwge30pKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnNba2V5XSA9IG9wdGlvbnNba2V5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldHVwIGxleGVyXG4gICAgICAgIHRoaXMubGV4ZXIgPSB0aGlzLm9wdGlvbnMubGV4ZXI7XG4gICAgICAgIHRoaXMubGV4ZXJTdGF0ZSA9IHVuZGVmaW5lZDtcblxuICAgICAgICAvLyBTZXR1cCBhIHRhYmxlXG4gICAgICAgIHZhciBjb2x1bW4gPSBuZXcgQ29sdW1uKGdyYW1tYXIsIDApO1xuICAgICAgICB2YXIgdGFibGUgPSB0aGlzLnRhYmxlID0gW2NvbHVtbl07XG5cbiAgICAgICAgLy8gSSBjb3VsZCBiZSBleHBlY3RpbmcgYW55dGhpbmcuXG4gICAgICAgIGNvbHVtbi53YW50c1tncmFtbWFyLnN0YXJ0XSA9IFtdO1xuICAgICAgICBjb2x1bW4ucHJlZGljdChncmFtbWFyLnN0YXJ0KTtcbiAgICAgICAgLy8gVE9ETyB3aGF0IGlmIHN0YXJ0IHJ1bGUgaXMgbnVsbGFibGU/XG4gICAgICAgIGNvbHVtbi5wcm9jZXNzKCk7XG4gICAgICAgIHRoaXMuY3VycmVudCA9IDA7IC8vIHRva2VuIGluZGV4XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIGEgcmVzZXJ2ZWQgdG9rZW4gZm9yIGluZGljYXRpbmcgYSBwYXJzZSBmYWlsXG4gICAgUGFyc2VyLmZhaWwgPSB7fTtcblxuICAgIFBhcnNlci5wcm90b3R5cGUuZmVlZCA9IGZ1bmN0aW9uKGNodW5rKSB7XG4gICAgICAgIHZhciBsZXhlciA9IHRoaXMubGV4ZXI7XG4gICAgICAgIGxleGVyLnJlc2V0KGNodW5rLCB0aGlzLmxleGVyU3RhdGUpO1xuXG4gICAgICAgIHZhciB0b2tlbjtcbiAgICAgICAgd2hpbGUgKHRva2VuID0gbGV4ZXIubmV4dCgpKSB7XG4gICAgICAgICAgICAvLyBXZSBhZGQgbmV3IHN0YXRlcyB0byB0YWJsZVtjdXJyZW50KzFdXG4gICAgICAgICAgICB2YXIgY29sdW1uID0gdGhpcy50YWJsZVt0aGlzLmN1cnJlbnRdO1xuXG4gICAgICAgICAgICAvLyBHQyB1bnVzZWQgc3RhdGVzXG4gICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5rZWVwSGlzdG9yeSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnRhYmxlW3RoaXMuY3VycmVudCAtIDFdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgbiA9IHRoaXMuY3VycmVudCArIDE7XG4gICAgICAgICAgICB2YXIgbmV4dENvbHVtbiA9IG5ldyBDb2x1bW4odGhpcy5ncmFtbWFyLCBuKTtcbiAgICAgICAgICAgIHRoaXMudGFibGUucHVzaChuZXh0Q29sdW1uKTtcblxuICAgICAgICAgICAgLy8gQWR2YW5jZSBhbGwgdG9rZW5zIHRoYXQgZXhwZWN0IHRoZSBzeW1ib2xcbiAgICAgICAgICAgIHZhciBsaXRlcmFsID0gdG9rZW4udGV4dCAhPT0gdW5kZWZpbmVkID8gdG9rZW4udGV4dCA6IHRva2VuLnZhbHVlO1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gbGV4ZXIuY29uc3RydWN0b3IgPT09IFN0cmVhbUxleGVyID8gdG9rZW4udmFsdWUgOiB0b2tlbjtcbiAgICAgICAgICAgIHZhciBzY2FubmFibGUgPSBjb2x1bW4uc2Nhbm5hYmxlO1xuICAgICAgICAgICAgZm9yICh2YXIgdyA9IHNjYW5uYWJsZS5sZW5ndGg7IHctLTsgKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXRlID0gc2Nhbm5hYmxlW3ddO1xuICAgICAgICAgICAgICAgIHZhciBleHBlY3QgPSBzdGF0ZS5ydWxlLnN5bWJvbHNbc3RhdGUuZG90XTtcbiAgICAgICAgICAgICAgICAvLyBUcnkgdG8gY29uc3VtZSB0aGUgdG9rZW5cbiAgICAgICAgICAgICAgICAvLyBlaXRoZXIgcmVnZXggb3IgbGl0ZXJhbFxuICAgICAgICAgICAgICAgIGlmIChleHBlY3QudGVzdCA/IGV4cGVjdC50ZXN0KHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdC50eXBlID8gZXhwZWN0LnR5cGUgPT09IHRva2VuLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBleHBlY3QubGl0ZXJhbCA9PT0gbGl0ZXJhbCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBZGQgaXRcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5leHQgPSBzdGF0ZS5uZXh0U3RhdGUoe2RhdGE6IHZhbHVlLCB0b2tlbjogdG9rZW4sIGlzVG9rZW46IHRydWUsIHJlZmVyZW5jZTogbiAtIDF9KTtcbiAgICAgICAgICAgICAgICAgICAgbmV4dENvbHVtbi5zdGF0ZXMucHVzaChuZXh0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE5leHQsIGZvciBlYWNoIG9mIHRoZSBydWxlcywgd2UgZWl0aGVyXG4gICAgICAgICAgICAvLyAoYSkgY29tcGxldGUgaXQsIGFuZCB0cnkgdG8gc2VlIGlmIHRoZSByZWZlcmVuY2Ugcm93IGV4cGVjdGVkIHRoYXRcbiAgICAgICAgICAgIC8vICAgICBydWxlXG4gICAgICAgICAgICAvLyAoYikgcHJlZGljdCB0aGUgbmV4dCBub250ZXJtaW5hbCBpdCBleHBlY3RzIGJ5IGFkZGluZyB0aGF0XG4gICAgICAgICAgICAvLyAgICAgbm9udGVybWluYWwncyBzdGFydCBzdGF0ZVxuICAgICAgICAgICAgLy8gVG8gcHJldmVudCBkdXBsaWNhdGlvbiwgd2UgYWxzbyBrZWVwIHRyYWNrIG9mIHJ1bGVzIHdlIGhhdmUgYWxyZWFkeVxuICAgICAgICAgICAgLy8gYWRkZWRcblxuICAgICAgICAgICAgbmV4dENvbHVtbi5wcm9jZXNzKCk7XG5cbiAgICAgICAgICAgIC8vIElmIG5lZWRlZCwgdGhyb3cgYW4gZXJyb3I6XG4gICAgICAgICAgICBpZiAobmV4dENvbHVtbi5zdGF0ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgLy8gTm8gc3RhdGVzIGF0IGFsbCEgVGhpcyBpcyBub3QgZ29vZC5cbiAgICAgICAgICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKHRoaXMucmVwb3J0RXJyb3IodG9rZW4pKTtcbiAgICAgICAgICAgICAgICBlcnIub2Zmc2V0ID0gdGhpcy5jdXJyZW50O1xuICAgICAgICAgICAgICAgIGVyci50b2tlbiA9IHRva2VuO1xuICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gbWF5YmUgc2F2ZSBsZXhlciBzdGF0ZVxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5rZWVwSGlzdG9yeSkge1xuICAgICAgICAgICAgICBjb2x1bW4ubGV4ZXJTdGF0ZSA9IGxleGVyLnNhdmUoKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQrKztcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29sdW1uKSB7XG4gICAgICAgICAgdGhpcy5sZXhlclN0YXRlID0gbGV4ZXIuc2F2ZSgpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBJbmNyZW1lbnRhbGx5IGtlZXAgdHJhY2sgb2YgcmVzdWx0c1xuICAgICAgICB0aGlzLnJlc3VsdHMgPSB0aGlzLmZpbmlzaCgpO1xuXG4gICAgICAgIC8vIEFsbG93IGNoYWluaW5nLCBmb3Igd2hhdGV2ZXIgaXQncyB3b3J0aFxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgUGFyc2VyLnByb3RvdHlwZS5yZXBvcnRFcnJvciA9IGZ1bmN0aW9uKHRva2VuKSB7XG4gICAgICAgIHZhciBsaW5lcyA9IFtdO1xuICAgICAgICB2YXIgdG9rZW5EaXNwbGF5ID0gKHRva2VuLnR5cGUgPyB0b2tlbi50eXBlICsgXCIgdG9rZW46IFwiIDogXCJcIikgKyBKU09OLnN0cmluZ2lmeSh0b2tlbi52YWx1ZSAhPT0gdW5kZWZpbmVkID8gdG9rZW4udmFsdWUgOiB0b2tlbik7XG4gICAgICAgIGxpbmVzLnB1c2godGhpcy5sZXhlci5mb3JtYXRFcnJvcih0b2tlbiwgXCJTeW50YXggZXJyb3JcIikpO1xuICAgICAgICBsaW5lcy5wdXNoKCdVbmV4cGVjdGVkICcgKyB0b2tlbkRpc3BsYXkgKyAnLiBJbnN0ZWFkLCBJIHdhcyBleHBlY3RpbmcgdG8gc2VlIG9uZSBvZiB0aGUgZm9sbG93aW5nOlxcbicpO1xuICAgICAgICB2YXIgbGFzdENvbHVtbkluZGV4ID0gdGhpcy50YWJsZS5sZW5ndGggLSAyO1xuICAgICAgICB2YXIgbGFzdENvbHVtbiA9IHRoaXMudGFibGVbbGFzdENvbHVtbkluZGV4XTtcbiAgICAgICAgdmFyIGV4cGVjdGFudFN0YXRlcyA9IGxhc3RDb2x1bW4uc3RhdGVzXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRTeW1ib2wgPSBzdGF0ZS5ydWxlLnN5bWJvbHNbc3RhdGUuZG90XTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV4dFN5bWJvbCAmJiB0eXBlb2YgbmV4dFN5bWJvbCAhPT0gXCJzdHJpbmdcIjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gRGlzcGxheSBhIFwic3RhdGUgc3RhY2tcIiBmb3IgZWFjaCBleHBlY3RhbnQgc3RhdGVcbiAgICAgICAgLy8gLSB3aGljaCBzaG93cyB5b3UgaG93IHRoaXMgc3RhdGUgY2FtZSB0byBiZSwgc3RlcCBieSBzdGVwLiBcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgbW9yZSB0aGFuIG9uZSBkZXJpdmF0aW9uLCB3ZSBvbmx5IGRpc3BsYXkgdGhlIGZpcnN0IG9uZS5cbiAgICAgICAgdmFyIHN0YXRlU3RhY2tzID0gZXhwZWN0YW50U3RhdGVzXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YWNrcyA9IHRoaXMuYnVpbGRTdGF0ZVN0YWNrcyhzdGF0ZSwgW10pO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdGFja3NbMF07XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgLy8gRGlzcGxheSBlYWNoIHN0YXRlIHRoYXQgaXMgZXhwZWN0aW5nIGEgdGVybWluYWwgc3ltYm9sIG5leHQuXG4gICAgICAgIHN0YXRlU3RhY2tzLmZvckVhY2goZnVuY3Rpb24oc3RhdGVTdGFjaykge1xuICAgICAgICAgICAgdmFyIHN0YXRlID0gc3RhdGVTdGFja1swXTtcbiAgICAgICAgICAgIHZhciBuZXh0U3ltYm9sID0gc3RhdGUucnVsZS5zeW1ib2xzW3N0YXRlLmRvdF07XG4gICAgICAgICAgICB2YXIgc3ltYm9sRGlzcGxheSA9IHRoaXMuZ2V0U3ltYm9sRGlzcGxheShuZXh0U3ltYm9sKTtcbiAgICAgICAgICAgIGxpbmVzLnB1c2goJ0EgJyArIHN5bWJvbERpc3BsYXkgKyAnIGJhc2VkIG9uOicpO1xuICAgICAgICAgICAgdGhpcy5kaXNwbGF5U3RhdGVTdGFjayhzdGF0ZVN0YWNrLCBsaW5lcyk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgXG4gICAgICAgIGxpbmVzLnB1c2goXCJcIik7XG4gICAgICAgIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xuICAgIH07XG5cbiAgICBQYXJzZXIucHJvdG90eXBlLmRpc3BsYXlTdGF0ZVN0YWNrID0gZnVuY3Rpb24oc3RhdGVTdGFjaywgbGluZXMpIHtcbiAgICAgICAgdmFyIGxhc3REaXNwbGF5O1xuICAgICAgICB2YXIgc2FtZURpc3BsYXlDb3VudCA9IDA7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgc3RhdGVTdGFjay5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdmFyIHN0YXRlID0gc3RhdGVTdGFja1tqXTtcbiAgICAgICAgICAgIHZhciBkaXNwbGF5ID0gc3RhdGUucnVsZS50b1N0cmluZyhzdGF0ZS5kb3QpO1xuICAgICAgICAgICAgaWYgKGRpc3BsYXkgPT09IGxhc3REaXNwbGF5KSB7XG4gICAgICAgICAgICAgICAgc2FtZURpc3BsYXlDb3VudCsrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoc2FtZURpc3BsYXlDb3VudCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZXMucHVzaCgnICAgIOKshiDvuI4nICsgc2FtZURpc3BsYXlDb3VudCArICcgbW9yZSBsaW5lcyBpZGVudGljYWwgdG8gdGhpcycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzYW1lRGlzcGxheUNvdW50ID0gMDtcbiAgICAgICAgICAgICAgICBsaW5lcy5wdXNoKCcgICAgJyArIGRpc3BsYXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGFzdERpc3BsYXkgPSBkaXNwbGF5O1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIFBhcnNlci5wcm90b3R5cGUuZ2V0U3ltYm9sRGlzcGxheSA9IGZ1bmN0aW9uKHN5bWJvbCkge1xuICAgICAgICB2YXIgdHlwZSA9IHR5cGVvZiBzeW1ib2w7XG4gICAgICAgIGlmICh0eXBlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICByZXR1cm4gc3ltYm9sO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFwib2JqZWN0XCIgJiYgc3ltYm9sLmxpdGVyYWwpIHtcbiAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShzeW1ib2wubGl0ZXJhbCk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJvYmplY3RcIiAmJiBzeW1ib2wgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIHJldHVybiAnY2hhcmFjdGVyIG1hdGNoaW5nICcgKyBzeW1ib2w7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJvYmplY3RcIiAmJiBzeW1ib2wudHlwZSkge1xuICAgICAgICAgICAgcmV0dXJuIHN5bWJvbC50eXBlICsgJyB0b2tlbic7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gc3ltYm9sIHR5cGU6ICcgKyBzeW1ib2wpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qXG4gICAgQnVpbGRzIGEgbnVtYmVyIG9mIFwic3RhdGUgc3RhY2tzXCIuIFlvdSBjYW4gdGhpbmsgb2YgYSBzdGF0ZSBzdGFjayBhcyB0aGUgY2FsbCBzdGFja1xuICAgIG9mIHRoZSByZWN1cnNpdmUtZGVzY2VudCBwYXJzZXIgd2hpY2ggdGhlIE5lYXJsZXkgcGFyc2UgYWxnb3JpdGhtIHNpbXVsYXRlcy5cbiAgICBBIHN0YXRlIHN0YWNrIGlzIHJlcHJlc2VudGVkIGFzIGFuIGFycmF5IG9mIHN0YXRlIG9iamVjdHMuIFdpdGhpbiBhIFxuICAgIHN0YXRlIHN0YWNrLCB0aGUgZmlyc3QgaXRlbSBvZiB0aGUgYXJyYXkgd2lsbCBiZSB0aGUgc3RhcnRpbmdcbiAgICBzdGF0ZSwgd2l0aCBlYWNoIHN1Y2Nlc3NpdmUgaXRlbSBpbiB0aGUgYXJyYXkgZ29pbmcgZnVydGhlciBiYWNrIGludG8gaGlzdG9yeS5cbiAgICBcbiAgICBUaGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIGdpdmVuIGEgc3RhcnRpbmcgc3RhdGUgYW5kIGFuIGVtcHR5IGFycmF5IHJlcHJlc2VudGluZ1xuICAgIHRoZSB2aXNpdGVkIHN0YXRlcywgYW5kIGl0IHJldHVybnMgYW4gYXJyYXkgb2Ygc3RhdGUgc3RhY2tzLiBcbiAgICBcbiAgICAqL1xuICAgIFBhcnNlci5wcm90b3R5cGUuYnVpbGRTdGF0ZVN0YWNrcyA9IGZ1bmN0aW9uKHN0YXRlLCB2aXNpdGVkKSB7XG4gICAgICAgIGlmICh2aXNpdGVkLmluZGV4T2Yoc3RhdGUpICE9PSAtMSkge1xuICAgICAgICAgICAgLy8gRm91bmQgY3ljbGUsIHJldHVybiBlbXB0eSBhcnJheSAobWVhbmluZyBubyBzdGFja3MpXG4gICAgICAgICAgICAvLyB0byBlbGltaW5hdGUgdGhpcyBwYXRoIGZyb20gdGhlIHJlc3VsdHMsIGJlY2F1c2VcbiAgICAgICAgICAgIC8vIHdlIGRvbid0IGtub3cgaG93IHRvIGRpc3BsYXkgaXQgbWVhbmluZ2Z1bGx5XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXRlLndhbnRlZEJ5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFtbc3RhdGVdXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAgICAgcmV0dXJuIHN0YXRlLndhbnRlZEJ5LnJlZHVjZShmdW5jdGlvbihzdGFja3MsIHByZXZTdGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0YWNrcy5jb25jYXQodGhhdC5idWlsZFN0YXRlU3RhY2tzKFxuICAgICAgICAgICAgICAgIHByZXZTdGF0ZSxcbiAgICAgICAgICAgICAgICBbc3RhdGVdLmNvbmNhdCh2aXNpdGVkKSlcbiAgICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uKHN0YWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbc3RhdGVdLmNvbmNhdChzdGFjayk7XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICB9LCBbXSk7XG4gICAgfTtcblxuICAgIFBhcnNlci5wcm90b3R5cGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29sdW1uID0gdGhpcy50YWJsZVt0aGlzLmN1cnJlbnRdO1xuICAgICAgICBjb2x1bW4ubGV4ZXJTdGF0ZSA9IHRoaXMubGV4ZXJTdGF0ZTtcbiAgICAgICAgcmV0dXJuIGNvbHVtbjtcbiAgICB9O1xuXG4gICAgUGFyc2VyLnByb3RvdHlwZS5yZXN0b3JlID0gZnVuY3Rpb24oY29sdW1uKSB7XG4gICAgICAgIHZhciBpbmRleCA9IGNvbHVtbi5pbmRleDtcbiAgICAgICAgdGhpcy5jdXJyZW50ID0gaW5kZXg7XG4gICAgICAgIHRoaXMudGFibGVbaW5kZXhdID0gY29sdW1uO1xuICAgICAgICB0aGlzLnRhYmxlLnNwbGljZShpbmRleCArIDEpO1xuICAgICAgICB0aGlzLmxleGVyU3RhdGUgPSBjb2x1bW4ubGV4ZXJTdGF0ZTtcblxuICAgICAgICAvLyBJbmNyZW1lbnRhbGx5IGtlZXAgdHJhY2sgb2YgcmVzdWx0c1xuICAgICAgICB0aGlzLnJlc3VsdHMgPSB0aGlzLmZpbmlzaCgpO1xuICAgIH07XG5cbiAgICAvLyBuYi4gZGVwcmVjYXRlZDogdXNlIHNhdmUvcmVzdG9yZSBpbnN0ZWFkIVxuICAgIFBhcnNlci5wcm90b3R5cGUucmV3aW5kID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMua2VlcEhpc3RvcnkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc2V0IG9wdGlvbiBga2VlcEhpc3RvcnlgIHRvIGVuYWJsZSByZXdpbmRpbmcnKVxuICAgICAgICB9XG4gICAgICAgIC8vIG5iLiByZWNhbGwgY29sdW1uICh0YWJsZSkgaW5kaWNpZXMgZmFsbCBiZXR3ZWVuIHRva2VuIGluZGljaWVzLlxuICAgICAgICAvLyAgICAgICAgY29sIDAgICAtLSAgIHRva2VuIDAgICAtLSAgIGNvbCAxXG4gICAgICAgIHRoaXMucmVzdG9yZSh0aGlzLnRhYmxlW2luZGV4XSk7XG4gICAgfTtcblxuICAgIFBhcnNlci5wcm90b3R5cGUuZmluaXNoID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFJldHVybiB0aGUgcG9zc2libGUgcGFyc2luZ3NcbiAgICAgICAgdmFyIGNvbnNpZGVyYXRpb25zID0gW107XG4gICAgICAgIHZhciBzdGFydCA9IHRoaXMuZ3JhbW1hci5zdGFydDtcbiAgICAgICAgdmFyIGNvbHVtbiA9IHRoaXMudGFibGVbdGhpcy50YWJsZS5sZW5ndGggLSAxXVxuICAgICAgICBjb2x1bW4uc3RhdGVzLmZvckVhY2goZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIGlmICh0LnJ1bGUubmFtZSA9PT0gc3RhcnRcbiAgICAgICAgICAgICAgICAgICAgJiYgdC5kb3QgPT09IHQucnVsZS5zeW1ib2xzLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAmJiB0LnJlZmVyZW5jZSA9PT0gMFxuICAgICAgICAgICAgICAgICAgICAmJiB0LmRhdGEgIT09IFBhcnNlci5mYWlsKSB7XG4gICAgICAgICAgICAgICAgY29uc2lkZXJhdGlvbnMucHVzaCh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBjb25zaWRlcmF0aW9ucy5tYXAoZnVuY3Rpb24oYykge3JldHVybiBjLmRhdGE7IH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBQYXJzZXI6IFBhcnNlcixcbiAgICAgICAgR3JhbW1hcjogR3JhbW1hcixcbiAgICAgICAgUnVsZTogUnVsZSxcbiAgICB9O1xuXG59KSk7XG4iLCIvLyBHZW5lcmF0ZWQgYXV0b21hdGljYWxseSBieSBuZWFybGV5LCB2ZXJzaW9uIDIuMTkuMFxuLy8gaHR0cDovL2dpdGh1Yi5jb20vSGFyZG1hdGgxMjMvbmVhcmxleVxuKGZ1bmN0aW9uICgpIHtcbmZ1bmN0aW9uIGlkKHgpIHsgcmV0dXJuIHhbMF07IH1cbnZhciBncmFtbWFyID0ge1xuICAgIExleGVyOiB1bmRlZmluZWQsXG4gICAgUGFyc2VyUnVsZXM6IFtcbiAgICB7XCJuYW1lXCI6IFwiaW5wdXRcIiwgXCJzeW1ib2xzXCI6IFtcImV4cHJlc3Npb25cIl0sIFwicG9zdHByb2Nlc3NcIjogZGF0YSA9PiBldmFsKGRhdGFbMF0pfSxcbiAgICB7XCJuYW1lXCI6IFwiZXhwcmVzc2lvblwiLCBcInN5bWJvbHNcIjogW1wiZXhwcmVzc2lvblwiLCBcIm9wZXJhdG9yXCIsIFwibnVtYmVyXCJdLCBcInBvc3Rwcm9jZXNzXCI6IGRhdGEgPT4gZGF0YS5qb2luKFwiXCIpfSxcbiAgICB7XCJuYW1lXCI6IFwiZXhwcmVzc2lvblwiLCBcInN5bWJvbHNcIjogW1wibnVtYmVyXCJdLCBcInBvc3Rwcm9jZXNzXCI6IGlkfSxcbiAgICB7XCJuYW1lXCI6IFwib3BlcmF0b3Ikc3RyaW5nJDFcIiwgXCJzeW1ib2xzXCI6IFt7XCJsaXRlcmFsXCI6XCJcXFxcXCJ9LCB7XCJsaXRlcmFsXCI6XCJ0XCJ9LCB7XCJsaXRlcmFsXCI6XCJpXCJ9LCB7XCJsaXRlcmFsXCI6XCJtXCJ9LCB7XCJsaXRlcmFsXCI6XCJlXCJ9LCB7XCJsaXRlcmFsXCI6XCJzXCJ9XSwgXCJwb3N0cHJvY2Vzc1wiOiBmdW5jdGlvbiBqb2luZXIoZCkge3JldHVybiBkLmpvaW4oJycpO319LFxuICAgIHtcIm5hbWVcIjogXCJvcGVyYXRvclwiLCBcInN5bWJvbHNcIjogW1wib3BlcmF0b3Ikc3RyaW5nJDFcIl0sIFwicG9zdHByb2Nlc3NcIjogXyA9PiBcIipcIn0sXG4gICAge1wibmFtZVwiOiBcIm9wZXJhdG9yJHN0cmluZyQyXCIsIFwic3ltYm9sc1wiOiBbe1wibGl0ZXJhbFwiOlwiXFxcXFwifSwge1wibGl0ZXJhbFwiOlwiZFwifSwge1wibGl0ZXJhbFwiOlwiaVwifSwge1wibGl0ZXJhbFwiOlwidlwifV0sIFwicG9zdHByb2Nlc3NcIjogZnVuY3Rpb24gam9pbmVyKGQpIHtyZXR1cm4gZC5qb2luKCcnKTt9fSxcbiAgICB7XCJuYW1lXCI6IFwib3BlcmF0b3JcIiwgXCJzeW1ib2xzXCI6IFtcIm9wZXJhdG9yJHN0cmluZyQyXCJdLCBcInBvc3Rwcm9jZXNzXCI6IF8gPT4gXCIvXCJ9LFxuICAgIHtcIm5hbWVcIjogXCJvcGVyYXRvclwiLCBcInN5bWJvbHNcIjogW3tcImxpdGVyYWxcIjpcIitcIn1dLCBcInBvc3Rwcm9jZXNzXCI6IGlkfSxcbiAgICB7XCJuYW1lXCI6IFwib3BlcmF0b3JcIiwgXCJzeW1ib2xzXCI6IFt7XCJsaXRlcmFsXCI6XCItXCJ9XSwgXCJwb3N0cHJvY2Vzc1wiOiBpZH0sXG4gICAge1wibmFtZVwiOiBcIm51bWJlclwiLCBcInN5bWJvbHNcIjogW1wiZGlnaXRzXCJdLCBcInBvc3Rwcm9jZXNzXCI6IGlkfSxcbiAgICB7XCJuYW1lXCI6IFwibnVtYmVyXCIsIFwic3ltYm9sc1wiOiBbXCJkaWdpdHNcIiwge1wibGl0ZXJhbFwiOlwiLlwifSwgXCJkaWdpdHNcIl0sIFwicG9zdHByb2Nlc3NcIjogZGF0YSA9PiBkYXRhLmpvaW4oXCJcIil9LFxuICAgIHtcIm5hbWVcIjogXCJkaWdpdHMkZWJuZiQxXCIsIFwic3ltYm9sc1wiOiBbL1swLTldL119LFxuICAgIHtcIm5hbWVcIjogXCJkaWdpdHMkZWJuZiQxXCIsIFwic3ltYm9sc1wiOiBbXCJkaWdpdHMkZWJuZiQxXCIsIC9bMC05XS9dLCBcInBvc3Rwcm9jZXNzXCI6IGZ1bmN0aW9uIGFycnB1c2goZCkge3JldHVybiBkWzBdLmNvbmNhdChbZFsxXV0pO319LFxuICAgIHtcIm5hbWVcIjogXCJkaWdpdHNcIiwgXCJzeW1ib2xzXCI6IFtcImRpZ2l0cyRlYm5mJDFcIl0sIFwicG9zdHByb2Nlc3NcIjogZGF0YSA9PiBkYXRhWzBdLmpvaW4oXCJcIil9XG5dXG4gICwgUGFyc2VyU3RhcnQ6IFwiaW5wdXRcIlxufVxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgbW9kdWxlLmV4cG9ydHMgPSBncmFtbWFyO1xufSBlbHNlIHtcbiAgIHdpbmRvdy5ncmFtbWFyID0gZ3JhbW1hcjtcbn1cbn0pKCk7XG4iLCJjb25zdCBuZWFybGV5ID0gcmVxdWlyZShcIm5lYXJsZXlcIik7XHJcbmNvbnN0IGdyYW1tYXIgPSByZXF1aXJlKFwiLi9ncmFtbWFyLmpzXCIpO1xyXG5cclxuY29uc3QgTVEgPSBNYXRoUXVpbGwuZ2V0SW50ZXJmYWNlKDIpO1xyXG5cclxuY29uc3QgY2FsY3VsYXRvciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuY2FsY3VsYXRvclwiKTtcclxuY29uc3Qga2V5cyA9IGNhbGN1bGF0b3IucXVlcnlTZWxlY3RvcihcIi5jYWxjdWxhdG9yX2tleXNcIik7XHJcbmNvbnN0IGRpc3BsYXkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmNhbGN1bGF0b3JfZGlzcGxheVwiKTtcclxuY29uc3QgbWF0aERpc3BsYXkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI21hdGhEaXNwbGF5XCIpO1xyXG5cclxuY29uc3QgbWF0aEZpZWxkID0gTVEuTWF0aEZpZWxkKG1hdGhEaXNwbGF5LCB7XHJcbiAgc3BhY2VCZWhhdmVzTGlrZVRhYjogdHJ1ZSxcclxuICBzdW1TdGFydHNXaXRoTkVxdWFsczogdHJ1ZSxcclxuICBzdXBTdWJzUmVxdWlyZU9wZXJhbmQ6IHRydWUsXHJcbiAgYXV0b0NvbW1hbmRzOiBcInBpIHN1bVwiLFxyXG4gIC8vIG1heERlcHRoOiAxMCxcclxuICAvLyBhdXRvT3BlcmF0b3JOYW1lczogXCJzaW4gY29zXCJcclxuICBoYW5kbGVyczoge1xyXG4gICAgZW50ZXI6ICgpID0+IGNvbnNvbGUubG9nKG1hdGhGaWVsZC5sYXRleCgpKVxyXG4gIH1cclxufSk7XHJcblxyXG5tYXRoRmllbGQuZm9jdXMoKTtcclxuXHJcbi8vIFBhcnNlIGZ1bmN0aW9uIGZvciBlcXVhbHMta2V5XHJcbmZ1bmN0aW9uIHBhcnNlKHN0cikge1xyXG4gIGNvbnN0IHBhcnNlciA9IG5ldyBuZWFybGV5LlBhcnNlcihuZWFybGV5LkdyYW1tYXIuZnJvbUNvbXBpbGVkKGdyYW1tYXIpKTtcclxuICB0cnkge1xyXG4gICAgcGFyc2VyLmZlZWQoc3RyKTtcclxuICAgIHJldHVybiBwYXJzZXIucmVzdWx0cztcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXR1cm4gXCJTeW50YXggRXJyb3JcIjtcclxuICB9XHJcbn1cclxuXHJcbmtleXMuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGV2ZW50ID0+IHtcclxuICBjb25zdCBrZXkgPSBldmVudC50YXJnZXQ7XHJcbiAgY29uc3QgYWN0aW9uID0ga2V5LmRhdGFzZXQuYWN0aW9uO1xyXG5cclxuICBpZiAoa2V5Lm1hdGNoZXMoXCJidXR0b25cIikpIHtcclxuICAgIGlmICghYWN0aW9uKSB7XHJcbiAgICAgIG1hdGhGaWVsZC53cml0ZShrZXkudGV4dENvbnRlbnQpXHJcbiAgICAgIGNvbnNvbGUubG9nKG1hdGhGaWVsZC5sYXRleCgpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChhY3Rpb24gIT0gXCJjbGVhclwiICYmIGFjdGlvbiAhPSBcImNhbGN1bGF0ZVwiKSB7XHJcbiAgICAgICAgbWF0aEZpZWxkLndyaXRlKGFjdGlvbilcclxuICAgICAgICBjb25zb2xlLmxvZyhtYXRoRmllbGQubGF0ZXgoKSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZXtcclxuICAgICAgICBpZiAoYWN0aW9uID09PSBcImNsZWFyXCIpIHtcclxuICAgICAgICAgIG1hdGhGaWVsZC5sYXRleChcIlwiKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoYWN0aW9uID09PSBcImNhbGN1bGF0ZVwiKSB7XHJcbiAgICAgICAgICBtYXRoRmllbGQubGF0ZXgocGFyc2UobWF0aEZpZWxkLmxhdGV4KCkpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG4iXX0=

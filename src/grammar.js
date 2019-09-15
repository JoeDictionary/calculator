// Generated automatically by nearley, version 2.19.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "input", "symbols": ["expression"], "postprocess": data => eval(data[0])},
    {"name": "expression", "symbols": ["expression", "infixOp", "number"], "postprocess": data => data.join("")},
    {"name": "expression$string$1", "symbols": [{"literal":"\\"}, {"literal":"l"}, {"literal":"e"}, {"literal":"f"}, {"literal":"t"}, {"literal":"("}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "expression$string$2", "symbols": [{"literal":"\\"}, {"literal":"r"}, {"literal":"i"}, {"literal":"g"}, {"literal":"h"}, {"literal":"t"}, {"literal":")"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "expression", "symbols": ["expression$string$1", "expression", "expression$string$2"], "postprocess": ([a, b, c]) => "(" + b + ")"},
    {"name": "expression", "symbols": ["function"], "postprocess": id},
    {"name": "expression", "symbols": ["number"], "postprocess": id},
    {"name": "function$string$1", "symbols": [{"literal":"\\"}, {"literal":"s"}, {"literal":"q"}, {"literal":"r"}, {"literal":"t"}, {"literal":"{"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "function", "symbols": ["function$string$1", "number", {"literal":"}"}], "postprocess": ([a, b, c]) => "Math.sqrt(" + b + ")"},
    {"name": "function$string$2", "symbols": [{"literal":"\\"}, {"literal":"l"}, {"literal":"o"}, {"literal":"g"}, {"literal":"\\"}, {"literal":"l"}, {"literal":"e"}, {"literal":"f"}, {"literal":"t"}, {"literal":"("}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "function$string$3", "symbols": [{"literal":"\\"}, {"literal":"r"}, {"literal":"i"}, {"literal":"g"}, {"literal":"h"}, {"literal":"t"}, {"literal":")"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "function", "symbols": ["function$string$2", "number", "function$string$3"], "postprocess": ([a, b, c]) => "Math.log(" + b + ")"},
    {"name": "function$string$4", "symbols": [{"literal":"\\"}, {"literal":"l"}, {"literal":"o"}, {"literal":"g"}, {"literal":"_"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "function$string$5", "symbols": [{"literal":"\\"}, {"literal":"l"}, {"literal":"e"}, {"literal":"f"}, {"literal":"t"}, {"literal":"("}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "function$string$6", "symbols": [{"literal":"\\"}, {"literal":"r"}, {"literal":"i"}, {"literal":"g"}, {"literal":"h"}, {"literal":"t"}, {"literal":")"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "function", "symbols": ["function$string$4", "number", "function$string$5", "number", "function$string$6"], "postprocess": ([a, b, c, d, e]) => "Math.log(" + d + ") / Math.log(" + b + ")"},
    {"name": "function$string$7", "symbols": [{"literal":"\\"}, {"literal":"f"}, {"literal":"r"}, {"literal":"a"}, {"literal":"c"}, {"literal":"{"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "function$string$8", "symbols": [{"literal":"}"}, {"literal":"{"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "function", "symbols": ["function$string$7", "expression", "function$string$8", "expression", {"literal":"}"}], "postprocess": ([a, b, c, d, e]) => "(" + b + ") / (" + d + ")"},
    {"name": "infixOp$string$1", "symbols": [{"literal":"\\"}, {"literal":"t"}, {"literal":"i"}, {"literal":"m"}, {"literal":"e"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "infixOp", "symbols": ["infixOp$string$1"], "postprocess": _ => "*"},
    {"name": "infixOp$string$2", "symbols": [{"literal":"\\"}, {"literal":"c"}, {"literal":"d"}, {"literal":"o"}, {"literal":"t"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "infixOp", "symbols": ["infixOp$string$2"], "postprocess": _ => "*"},
    {"name": "infixOp$string$3", "symbols": [{"literal":"\\"}, {"literal":"d"}, {"literal":"i"}, {"literal":"v"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "infixOp", "symbols": ["infixOp$string$3"], "postprocess": _ => "/"},
    {"name": "infixOp", "symbols": [{"literal":"+"}], "postprocess": id},
    {"name": "infixOp", "symbols": [{"literal":"-"}], "postprocess": id},
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

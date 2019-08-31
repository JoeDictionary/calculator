// Generated automatically by nearley, version 2.18.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "input", "symbols": ["number"]},
    {"name": "input", "symbols": ["mulExpr"]},
    {"name": "input", "symbols": ["addExpr"]},
    {"name": "input", "symbols": [{"literal":"("}, "input", {"literal":")"}]},
    {"name": "mulExpr$subexpression$1", "symbols": [{"literal":"*"}]},
    {"name": "mulExpr$subexpression$1", "symbols": [{"literal":"/"}]},
    {"name": "mulExpr", "symbols": ["number", "mulExpr$subexpression$1", "number"]},
    {"name": "addExpr$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "addExpr$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "addExpr", "symbols": ["number", "addExpr$subexpression$1", "number"]},
    {"name": "number", "symbols": ["digits", {"literal":"."}, "digits"]},
    {"name": "number", "symbols": ["digits"]},
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

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
    {"name": "mulExpr", "symbols": ["number", "mulOp", "number"], "postprocess": ([fst, op, snd]) => Number(fst) * Number(snd)},
    {"name": "addExpr", "symbols": ["number", "addOp", "number"], "postprocess": ([fst, op, snd]) => Number(fst) + Number(snd)},
    {"name": "number", "symbols": ["digits"]},
    {"name": "number", "symbols": ["digits", {"literal":"."}, "digits"], "postprocess": ([fst, dec, snd]) => Number(fst + dec + snd)},
    {"name": "mulOp", "symbols": [{"literal":"*"}]},
    {"name": "mulOp", "symbols": [{"literal":"/"}]},
    {"name": "addOp", "symbols": [{"literal":"+"}]},
    {"name": "addOp", "symbols": [{"literal":"-"}]},
    {"name": "digits$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "digits$ebnf$1", "symbols": ["digits$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "digits", "symbols": ["digits$ebnf$1"], "postprocess": data => Number(data[0].join(""))}
]
  , ParserStart: "input"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();

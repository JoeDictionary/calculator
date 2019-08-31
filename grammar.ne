input -> number | mulExpr | addExpr | "(" input ")"
mulExpr -> number mulOp number {% ([fst, op, snd]) => Number(fst) * Number(snd) %}
addExpr -> number addOp number {% ([fst, op, snd]) => Number(fst) + Number(snd) %}
number -> digits | digits "." digits {% ([fst, dec, snd]) => Number(fst + dec + snd) %}

mulOp -> "*"  | "/"
addOp -> "+"  | "-"
digits -> [0-9]:+ {% data => Number(data[0].join("")) %}


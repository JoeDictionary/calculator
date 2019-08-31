input -> number | mulExpr | addExpr | "(" input ")"
mulExpr -> number ("*" | "/") number
addExpr -> number ("+" | "-") number
number -> digits "." digits | digits
digits -> [0-9]:+ {% data => data[0].join("") %}


# Styleguide: https://github.com/kach/nearley/blob/master/docs/md/how-to-grammar-good.md
#  https://nearley.js.org/docs/grammar


input ->
    expression {% data => eval(data[0]) %}

expression ->
    expression infixOp number         {% data => data.join("") %}
    | "\\left(" expression "\\right)" {% ([a, b, c]) => "(" + b + ")" %}
    | function                        {% id %}
    | number                          {% id %}
    
function ->
    "\\sqrt{" number "}" {% ([a, b, c]) => "Math.sqrt(" + b + ")" %}
    | "\\log\\left(" number "\\right)" {% ([a, b, c]) => "Math.log(" + b + ")" %}
    | "\\log_" number "\\left(" number "\\right)" {% ([a, b, c, d, e]) => "Math.log(" + d + ") / Math.log(" + b + ")" %}
    | "\\frac{" expression "}{" expression "}" {% ([a, b, c, d, e]) => "(" + b + ") / (" + d + ")" %}

infixOp -> 
    "\\times"  {% _ => "*" %} 
    | "\\cdot" {% _ => "*" %}
    | "\\div"  {% _ => "/" %}
    | "+"      {% id %}
    | "-"      {% id %}

number -> 
    digits              {% id %}
    | digits "." digits {% data => data.join("") %}

digits ->
    [0-9]:+ {% data => data[0].join("") %}

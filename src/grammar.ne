# Styleguide: https://github.com/kach/nearley/blob/master/docs/md/how-to-grammar-good.md


input ->
    expression {% data => eval(data[0]) %}

expression ->
    expression operator number {% data => data.join("") %}
    | number                   {% id %}

operator -> 
    "\\times" {% _ => "*" %} 
    | "\\div"  {% _ => "/" %}
    | "+"      {% id %}
    | "-"      {% id %}

number -> 
    digits              {% id %}
    | digits "." digits {% data => data.join("") %}

digits ->
    [0-9]:+ {% data => data[0].join("") %}

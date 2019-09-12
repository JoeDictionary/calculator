
input -> expression {% data => eval(data[0]) %}

expression -> expression operator number {% data => data.join("") %} | number {% id %}

operator ->  "*" {% id %} | "/" {% id %} | "+" {% id %} | "-" {% id %}

number -> digits {% id %} | digits "." digits {% data => data.join("") %}
digits -> [0-9]:+ {% data => data[0].join("") %}
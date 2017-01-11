{% macro title(text) %}
    <text:h text:outline-level="1" text:style-name="P25">{{ text }}</text:h>
{% endmacro %}

{% macro company_info_subtitle(companyName, companyNumber) %}
    <text:h text:outline-level="1" text:style-name="P26">
        <text:span text:style-name="T3">
            {{ companyName }} ({{ companyNumber }}) (“Company”)
        </text:span>
    </text:h>
{% endmacro %}


{% macro date_subtitle(text) %}
<text:h text:outline-level="1" text:style-name="P27">
    <text:span text:style-name="T11">
        {{ text }}
    </text:span>
</text:h>
{% endmacro %}

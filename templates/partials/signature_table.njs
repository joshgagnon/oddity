<table:table table:name="Table1" table:style-name="Table1">
    <table:table-column table:style-name="Table1.A"/>
    <table:table-column table:style-name="Table1.B"/>
    <table:table-row>
        <table:table-cell office:value-type="string" table:style-name="Table1.A1">
            <text:p text:style-name="P8">Signed by Me:</text:p>

            {% include 'partials/signature_line' %}
        </table:table-cell>
        <table:table-cell office:value-type="string" table:style-name="Table1.A1">
            <text:p text:style-name="P8">Signed by Me:</text:p>

            {% include 'partials/signature_line' %}
        </table:table-cell>
    </table:table-row>
    <table:table-row>
        <table:table-cell office:value-type="string" table:style-name="Table1.A1">
            <text:p text:style-name="P8">Signed by Me:</text:p>

            {% include 'partials/signature_line' %}
        </table:table-cell>
    </table:table-row>
</table:table>

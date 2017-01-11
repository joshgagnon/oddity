{% if notes %}
    <text:p text:style-name="P14">It is noted that:</text:p>

    {% for note in notes %}
        <text:list text:style-name="L2" xml:id="list1301401201315558174">
            <text:list-item>
                <text:p text:style-name="P28">
                    <text:span>{{ note }}</text:span>
                </text:p>
            </text:list-item>
        </text:list>
    {% endfor %}
{% endif %}

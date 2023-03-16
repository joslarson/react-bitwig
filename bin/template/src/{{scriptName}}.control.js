import ReactBitwig, { ControllerScript } from 'react-bitwig';

ReactBitwig.render(
  <ControllerScript
    api={% raw %}{{% endraw %}{{ apiVersion }}{% raw %}}{% endraw %}
    vendor="{{ vendor }}"
    name="{{ name }}"
    version="{{ version }}"
    uuid="{{ uuid }}"
    author="{{ author }}"
    midi={% raw %}{{ inputs: 1, outputs: 1 }}{% endraw %}
  >
    {/* ...add components to render here */}
  </ControllerScript>
);

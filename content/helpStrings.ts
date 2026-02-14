export default {
  dangerScale:
    'The <a class="nac-html-a nac-native-link" href="https://avalanche.org/avalanche-encyclopedia/danger-scale/" target="_blank">North American Avalanche Danger Scale</a> is a tool used by avalanche forecasters to communicate the potential for avalanches to cause harm or injury to backcountry travelers.',
  avalancheDanger:
    '<p class="nac-html-p"><strong>Avalanche Danger</strong> is a tool used by avalanche forecasters to communicate the potential for avalanches to cause harm or injury to backcountry travelers.</p><p class="nac-html-p">Watch this <a class="nac-html-a nac-native-link" href="https://avalanche.org/avalanche-encyclopedia/danger-scale/"" target="_blank">video</a> to learn more about Avalanche Danger.</p>',
  avalancheDangerOutlook:
    '<p class="nac-html-p">The <strong>Outlook</strong> is different than today\'s Forecast. The Outlook has a higher level of uncertainty but can still communicate expected danger trends over time.</p>',
  avalancheProblem:
    '<p class="nac-html-p"><strong>Avalanche Problems</strong> use four factors to give a more nuanced description of the days avalanche conditions: the type of potential avalanche, its location in the terrain, the likelihood of triggering it, and the potential size of the avalanche.</p><p class="nac-html-p">Watch this <a class="nac-html-a nac-native-link" href="https://avalanche.org/avalanche-encyclopedia/avalanche-problem/" target="_blank">video</a> to learn more about Avalanche Problems.</p>',
  avalancheObservationOccurrenceDate: '<p>To the best of your knowledge, when did the avalanche occur?</p>',
  avalancheObservationAspect: '<p>Provide primary or average aspect of the slope where the avalanche released.</p>',
  avalancheObservationSize: `
<div>
  <h4>Destructive Potential:</h4>
  <ul>
    <li><strong>D1</strong> - Relatively harmless to people.</li>
    <li><strong>D2</strong> - Could bury, injure, or kill a person.</li>
    <li><strong>D3</strong> - Could bury or destroy a car, damage a truck, destroy a wood frame house, or break a few trees.</li>
    <li><strong>D4</strong> - Could destroy a railway car, a large truck, several buildings, or substantial amount of forest.</li>
    <li><strong>D5</strong> - Could gouge the landscape. Largest snow avalanche known.</li>
  </ul>
</div>`,
  problemType:
    '<p class="nac-html-p">Avalanche Problems are categories of avalanche activity. The Problems may not describe all avalanche activity you might observe, but they categorize the avalanches by how we manage the risk in the terrain. This approach focuses on relevant observations you can make in the field and how to treat the avalanche risk.</p><p class="nac-html-p">The forecasts list up to three current Problems, along with the spatial distribution, the likelihood of avalanches, and anticipated size. Forecasters may provide specific details to a Problem in the Discussion tab.</p><p class="nac-html-p">This <a class="nac-html-a nac-native-link" href="https://avalanche.org/avalanche-encyclopedia/avalanche-problem/" target="_blank">link</a> has detailed descriptions of each Avalanche Problem and suggestions for risk treatment.</p>',
  problemLocation:
    'The Aspect/Elevation diagram describes the spatial pattern of the Avalanche Problem by aspect (the direction a slope faces) and elevation band (Above, Near, or Below Treeline). The diagram will be filled with black where the Avalanche Problem may exist. You can view the diagram as you would a mountain on a topographic map. The outer ring represents the Below Treeline elevation band, middle ring Near Treeline, and the inner ring Above Treeline. The diagram is oriented like a compass, with the top wedges representing north aspects, the left wedges representing west, etc.',
  problemLikelihood:
    'Likelihood is a description of the chance of encountering a particular Avalanche Problem. It combines the spatial distribution of the Problem and the sensitivity or ease of triggering an avalanche. The spatial distribution indicates how likely you are to encounter the Problem in the highlighted avalanche terrain. The sensitivity indicates how easy it is to trigger avalanches including both natural and human triggered avalanches.',
  problemSize:
    'Size is based on the destructive potential of avalanches. SMALL avalanches are relatively harmless to people unless they push you into a terrain trap. LARGE avalanches could bury, injure or kill a person. VERY LARGE avalanches could bury cars, destroy a house, or break trees. HISTORIC avalanches are even more destructive, and nearing the maximum size the slope could produce.',
  dangerScaleDetail: `
    <p>The North American Public Avalanche Danger Scale (NAPADS) is a system that rates avalanche danger and provides general travel advice
    based on the likelihood, size, and distribution of expected avalanches. It consists of five levels, from least to highest amount of
    danger:</p>
    <table>
        <tr>
            <td>1 - Low</td>
        </tr>
        <tr>
            <td>2 - Moderate</td>
        </tr>
        <tr>
            <td>3 - Considerable</td>
        </tr>
        <tr>
            <td>4 - High</td>
        </tr>
        <tr>
            <td>5 - Extreme</td>
        </tr>
    </table><p>Danger ratings are typically provided for three distinct
    elevation bands. Although the danger ratings are assigned numerical levels, the danger increases exponentially between levels.
    In other words, the hazard rises more dramatically as it ascends toward the higher levels on the scale.</p>
    <p><a href='https://avalanche.org/avalanche-encyclopedia/danger-scale/'><strong>Learn more</strong></a></p>`,
  weather: {
    precipitation: `
      <p><strong>Water Equivalent (WE)</strong> is the liquid water equivalent of all precipitation types; rain, snow, ice pellets, etc., forecast to the hundredth of an inch at specific locations. To use WE as a proxy for snowfall amounts, start with a snow to water ratio of 10:1 (10 inches of snow = 1 inch WE). Temperatures at or near freezing will generally have a lower ratio (heavy wet snow) and very cold temperatures can have a much higher ratio (dry fluffy snow).</p>
      <p>The label <strong>LT</strong> is shorthand for ‘less than’.</p>
    `,
    temperature: `
      <p>The 5000’ temperature forecast does not imply a trend over the 12 hr period and only represents the max and min temperatures within a 12 hr period in the zone. The 6-hr snow level forecast, the forecast discussion, and weather forecast sections may add detail regarding temperature trends.</p>
      `,
    wind: `
      <p>Ridgeline winds are the average wind speed and direction over a 6 hr time period.</p>
      <p>The wind forecast represents an elevation range instead of a single elevation slice. The elevation range overlaps with the near and above treeline elevation bands in the avalanche forecast and differs per zone.</p>
      <p>Wind direction indicates the direction the wind originates or comes from on the 16-point compass rose.</p>
    `,
    snowLevelNoAsterisk: `
      <p>The snow level forecast represents the general snow level over a 6 hr time period. Freezing levels are forecast when precipitation is not expected.</p>
    `,
    snowLevel: `
      <p>The snow level forecast represents the general snow level over a 6 hr time period. Freezing levels are forecast when precipitation is not expected.</p>
      <p>*Easterly or offshore flow is highlighted with an asterisk when we expect relatively cool east winds in the major Cascade Passes. Easterly flow will often lead to temperature inversions and is a key variable for forecasting precipitation type in the Cascade Passes. Strong easterly flow events can affect terrain on a more regional scale.</p>
    `,
  },
} as const;

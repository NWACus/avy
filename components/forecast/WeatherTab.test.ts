import {adaptSierraWeatherForecast} from 'components/forecast/WeatherTab';
import {weatherSchema} from 'types/nationalAvalancheCenter';

describe('WeatherTab', () => {
  it('adapts Sierra weather correctly', () => {
    const input = `{
    "announcement": null,
    "author": "Steve Reynaud",
    "avalanche_center":
    {
        "city": "Truckee",
        "id": "SAC",
        "name": "Sierra Avalanche Center",
        "state": "CA",
        "url": "https://www.sierraavalanchecenter.org/"
    },
    "bottom_line": null,
    "created_at": "2024-04-02T12:17:45+00:00",
    "danger":
    [],
    "expires_time": null,
    "forecast_avalanche_problems":
    [],
    "forecast_zone":
    [
        {
            "config": null,
            "id": 1605,
            "name": "Central Sierra Nevada",
            "state": "CA",
            "url": "https://www.sierraavalanchecenter.org/forecasts/#/central-sierra-nevada",
            "zone_id": "1"
        }
    ],
    "hazard_discussion": null,
    "id": 135333,
    "media": null,
    "product_type": "weather",
    "published_time": "2024-04-02T13:45:00+00:00",
    "status": "published",
    "updated_at": "2024-04-02T13:45:59+00:00",
    "weather_data":
    [
        {
            "columns":
            [
                [
                    {
                        "heading": "Conditions in the last 24hrs",
                        "subheading": "",
                        "width": 25
                    },
                    {
                        "heading": "Weather Forecast for Today",
                        "subheading": "Produced in partnership with the Reno NWS",
                        "width": 25
                    },
                    {
                        "heading": "Weather Forecast for Tonight",
                        "subheading": "Produced in partnership with the Reno NWS",
                        "width": 25
                    },
                    {
                        "heading": "Weather Forecast for Tomorrow",
                        "subheading": "Produced in partnership with the Reno NWS",
                        "width": 25
                    }
                ]
            ],
            "data":
            [
                [
                    {
                        "value": "Sunny and clear."
                    },
                    {
                        "value": "Sunny. Snow levels 7500 feet increasing to 8500 feet in the afternoon. Chance of precipitation is 0%."
                    },
                    {
                        "value": "Clear. Snow levels 9000 feet. Chance of precipitation is 0%."
                    },
                    {
                        "value": "Sunny then becoming partly cloudy. Snow levels 8500 feet. Chance of precipitation is 5%."
                    }
                ],
                [
                    {
                        "value": "@ 5am: 30 to 41° F | Max: 36 to 47° F"
                    },
                    {
                        "value": "50 to 56.  ° F"
                    },
                    {
                        "value": "29 to 35.  ° F"
                    },
                    {
                        "value": "47 to 53.  ° F"
                    }
                ],
                [
                    {
                        "value": "@ 5am: 28 to 40° F | Max: 32 to 46° F"
                    },
                    {
                        "value": "45 to 51.  ° F"
                    },
                    {
                        "value": "26 to 31.  ° F"
                    },
                    {
                        "value": "41 to 47.  ° F"
                    }
                ],
                [
                    {
                        "value": "Light winds."
                    },
                    {
                        "value": "Light winds."
                    },
                    {
                        "value": "Light winds."
                    },
                    {
                        "value": "Southwest 15 to 25 mph. Gusts up to 50 mph in the  afternoon."
                    }
                ],
                [
                    {
                        "value": "NE winds 20 to 40mph with gusts to 58mph."
                    },
                    {
                        "value": "Northeast winds 15 to 20 mph with gusts up to 35 mph in the morning becoming light."
                    },
                    {
                        "value": "Light winds becoming southwest around 15 mph with  gusts to 25 mph after midnight."
                    },
                    {
                        "value": "Southwest around 15 to 20 mph with gusts to 35 mph  increasing to 20 to 30 mph with gusts to 55 mph in the afternoon."
                    }
                ],
                [
                    {
                        "value": "0 inches"
                    },
                    {
                        "value": "No accumulation. | SWE = None."
                    },
                    {
                        "value": "No accumulation. | SWE = None."
                    },
                    {
                        "value": "No accumulation. | SWE = Less than 0.10 inch."
                    }
                ],
                [
                    {
                        "value": "0 inches"
                    },
                    {
                        "value": "No accumulation. | SWE = None."
                    },
                    {
                        "value": "No accumulation. | SWE = None."
                    },
                    {
                        "value": "No accumulation. | SWE = Less than 0.10 inch."
                    }
                ],
                [
                    {
                        "value": "78 to 119 inches"
                    }
                ]
            ],
            "meta": "Loaded from JSON file, the NWS published this forecast on Tue, Apr 02, 2024 at 01:58 AM.",
            "rows":
            [
                {
                    "field": "textarea",
                    "heading": "Weather",
                    "help": null,
                    "options": null,
                    "unit": null
                },
                {
                    "field": "input",
                    "heading": "Temperatures 7000 to 8000 ft.",
                    "help": null,
                    "options": null,
                    "unit": null
                },
                {
                    "field": "input",
                    "heading": "Temperatures 8000 to 9000 ft.",
                    "help": null,
                    "options": null,
                    "unit": null
                },
                {
                    "field": "textarea",
                    "heading": "Mid Slope Winds",
                    "help": null,
                    "options": null,
                    "unit": null
                },
                {
                    "field": "textarea",
                    "heading": "Ridgetop Winds",
                    "help": null,
                    "options": null,
                    "unit": null
                },
                {
                    "field": "textarea",
                    "heading": "Snowfall 7000 to 8000 ft.",
                    "help": null,
                    "options": null,
                    "unit": null
                },
                {
                    "field": "textarea",
                    "heading": "Snowfall 8000 to 9000 ft.",
                    "help": null,
                    "options": null,
                    "unit": null
                },
                {
                    "field": "input",
                    "heading": "Total Snow Depth between 8200 and 8700 ft.",
                    "help": null,
                    "options": null,
                    "unit": null
                }
            ],
            "zone_id": "1",
            "zone_name": "Central Sierra Nevada"
        }
    ],
        "weather_discussion": "<p>High pressure will continue with warm, dry, and sunny weather for today.&nbsp; High temperatures will be in the mid 40's to mid 50's above 7000'.&nbsp; Remote sensors are showing overnight temperatures near to above freezing at stations above 7000'.&nbsp; Moderate to strong NE winds are expected to decrease to light by midday.&nbsp; Wednesday will remain dry and warm with increasing SW winds as a storm approaches on Thursday.&nbsp; Unsettled winter weather will continue through the weekend.</p>"
}`;
    const weather = weatherSchema.parse(JSON.parse(input));
    const output = adaptSierraWeatherForecast(weather);
    expect(output.weather_data).toEqual([
      {
        columns: [
          [
            {
              heading: 'Conditions in the last 24hrs',
              subheading: `Sunny and clear.`,
              width: 25,
            },
            {
              heading: 'Weather Forecast for Today',
              subheading: `Sunny. Snow levels 7500 feet increasing to 8500 feet in the afternoon. Chance of precipitation is 0%.

Produced in partnership with the Reno NWS`,
              width: 25,
            },
            {
              heading: 'Weather Forecast for Tonight',
              subheading: `Clear. Snow levels 9000 feet. Chance of precipitation is 0%.

Produced in partnership with the Reno NWS`,
              width: 25,
            },
            {
              heading: 'Weather Forecast for Tomorrow',
              subheading: `Sunny then becoming partly cloudy. Snow levels 8500 feet. Chance of precipitation is 5%.

Produced in partnership with the Reno NWS`,
              width: 25,
            },
          ],
        ],
        data: [
          [
            {
              value: '@ 5am: 30 to 41° F | Max: 36 to 47° F',
            },
            {
              value: '50 to 56.  ° F',
            },
            {
              value: '29 to 35.  ° F',
            },
            {
              value: '47 to 53.  ° F',
            },
          ],
          [
            {
              value: '@ 5am: 28 to 40° F | Max: 32 to 46° F',
            },
            {
              value: '45 to 51.  ° F',
            },
            {
              value: '26 to 31.  ° F',
            },
            {
              value: '41 to 47.  ° F',
            },
          ],
          [
            {
              value: 'Light winds.',
            },
            {
              value: 'Light winds.',
            },
            {
              value: 'Light winds.',
            },
            {
              value: 'Southwest 15 to 25 mph. Gusts up to 50 mph in the  afternoon.',
            },
          ],
          [
            {
              value: 'NE winds 20 to 40mph with gusts to 58mph.',
            },
            {
              value: 'Northeast winds 15 to 20 mph with gusts up to 35 mph in the morning becoming light.',
            },
            {
              value: 'Light winds becoming southwest around 15 mph with  gusts to 25 mph after midnight.',
            },
            {
              value: 'Southwest around 15 to 20 mph with gusts to 35 mph  increasing to 20 to 30 mph with gusts to 55 mph in the afternoon.',
            },
          ],
          [
            {
              value: '0 inches',
            },
            {
              value: 'No accumulation. | SWE = None.',
            },
            {
              value: 'No accumulation. | SWE = None.',
            },
            {
              value: 'No accumulation. | SWE = Less than 0.10 inch.',
            },
          ],
          [
            {
              value: '0 inches',
            },
            {
              value: 'No accumulation. | SWE = None.',
            },
            {
              value: 'No accumulation. | SWE = None.',
            },
            {
              value: 'No accumulation. | SWE = Less than 0.10 inch.',
            },
          ],
          [
            {
              value: '78 to 119 inches',
            },
          ],
        ],
        rows: [
          {
            field: 'input',
            heading: 'Temperatures 7000 to 8000 ft.',
            help: null,
            options: null,
            unit: null,
          },
          {
            field: 'input',
            heading: 'Temperatures 8000 to 9000 ft.',
            help: null,
            options: null,
            unit: null,
          },
          {
            field: 'textarea',
            heading: 'Mid Slope Winds',
            help: null,
            options: null,
            unit: null,
          },
          {
            field: 'textarea',
            heading: 'Ridgetop Winds',
            help: null,
            options: null,
            unit: null,
          },
          {
            field: 'textarea',
            heading: 'Snowfall 7000 to 8000 ft.',
            help: null,
            options: null,
            unit: null,
          },
          {
            field: 'textarea',
            heading: 'Snowfall 8000 to 9000 ft.',
            help: null,
            options: null,
            unit: null,
          },
          {
            field: 'input',
            heading: 'Total Snow Depth between 8200 and 8700 ft.',
            help: null,
            options: null,
            unit: null,
          },
        ],
        zone_id: '1',
        zone_name: 'Central Sierra Nevada',
      },
    ]);
  });
});

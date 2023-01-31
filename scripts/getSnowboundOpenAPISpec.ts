import axios from 'axios';

// This script takes the OpenAPI spec from Snowbound and forcibly adds the `token` query param to all HTTP request paths
(async () => {
  const {data} = await axios.get('https://api.snowobs.com/wx/v1/openapi.json');
  data.paths = Object.fromEntries(
    Object.entries(data.paths).map(([k, v]) => {
      if (k.match(/^\/wx/)) {
        v = Object.fromEntries(
          Object.entries(v).map(([k, v]) => {
            if (v && typeof v === 'object') {
              v.parameters = Array.isArray(v.parameters) ? v.parameters : [];
              v.parameters.push({
                description: 'API key',
                required: false,
                schema: {
                  title: 'token',
                  type: 'string',
                  description: 'API key',
                },
                name: 'token',
                in: 'query',
              });
            }
            return [k, v];
          }),
        );
      }
      return [k, v];
    }),
  );
  console.log(JSON.stringify(data, null, 2));
})();

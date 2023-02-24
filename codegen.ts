import type {CodegenConfig} from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './types/nationalAvalancheCenter/observations-schema.graphql',
  documents: ['./types/nationalAvalancheCenter/observations-queries.graphql'],
  generates: {
    './hooks/useObservations.ts': {
      plugins: [
        {
          add: {
            content: '/* eslint-disable @typescript-eslint/no-explicit-any */',
          },
        },
        'typescript',
        'typescript-operations',
        'typescript-react-query',
      ],
      config: {
        fetcher: {
          func: './observations-fetcher#useFetch',
          isReactHook: true,
          errorType: 'AxiosError', // this doesn't seem to take effect ... why ?
        },
      },
    },
  },
};
export default config;

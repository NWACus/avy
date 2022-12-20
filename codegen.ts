import type {CodegenConfig} from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './types/nationalAvalancheCenter/observations-schema.graphql',
  documents: ['./types/nationalAvalancheCenter/observations-queries.graphql'],
  generates: {
    './hooks/useObservations.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-react-query'],
      config: {
        fetcher: {
          func: './observations-fetcher#fetch',
          isReactHook: true,
          errorType: 'AxiosError', // this doesn't seem to take effect ... why ?
        },
        legacyMode: true,
      },
    },
  },
};
export default config;

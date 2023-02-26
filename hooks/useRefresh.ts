import * as React from 'react';

export const useRefresh = (...refetch: (() => Promise<unknown>)[]) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  async function refresh() {
    setIsRefreshing(true);

    try {
      await Promise.all(refetch.map(item => item()));
    } finally {
      setIsRefreshing(false);
    }
  }

  return {
    isRefreshing,
    refresh,
  };
};

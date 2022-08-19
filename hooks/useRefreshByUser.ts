import * as React from 'react';

export const useRefreshByUser = (...refetch: (() => Promise<unknown>)[]) => {
  const [isRefetchingByUser, setIsRefetchingByUser] = React.useState(false);

  async function refetchByUser() {
    setIsRefetchingByUser(true);

    try {
      await Promise.all(refetch.map(item => item()));
    } finally {
      setIsRefetchingByUser(false);
    }
  }

  return {
    isRefetchingByUser,
    refetchByUser,
  };
};

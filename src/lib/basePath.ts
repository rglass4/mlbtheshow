const trimSlash = (value: string) => value.replace(/^\/+|\/+$/g, '');

export const getBasePath = (): string => {
  const explicit = import.meta.env.VITE_APP_BASE_PATH as string | undefined;
  if (explicit) {
    const clean = trimSlash(explicit);
    return clean ? `/${clean}` : '';
  }

  const repoName = import.meta.env.VITE_GITHUB_PAGES_REPO as string | undefined;
  if (repoName) return `/${trimSlash(repoName)}`;
  return '';
};

export const normalizeGithubPagesRedirect = (): void => {
  const params = new URLSearchParams(window.location.search);
  const pendingPath = params.get('p');
  if (!pendingPath) return;

  const basePath = getBasePath();
  const nextUrl = `${basePath}${pendingPath.startsWith('/') ? pendingPath : `/${pendingPath}`}`;
  window.history.replaceState(null, '', nextUrl);
};

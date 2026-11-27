import type { ConfigContext, ExpoConfig } from 'expo/config';

/** Pages hosts under the repository path; local/native builds keep their default URLs. */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Woodland Wonders',
  slug: config.slug ?? 'woodland-wonders',
  ...(process.env.WW_WEB_BASE_URL
    ? { experiments: { ...config.experiments, baseUrl: process.env.WW_WEB_BASE_URL } }
    : {}),
});

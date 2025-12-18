import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  {
    ignores: ['.next/**', 'out/**', 'node_modules/**'],
  },
  ...nextCoreWebVitals,
];

export default config;

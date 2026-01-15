import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';

const getEnvVar = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const getAwsRegion = (): string => {
  return getEnvVar(import.meta.env.VITE_AWS_REGION, 'VITE_AWS_REGION');
};

let credentialsProvider:
  | ReturnType<typeof fromCognitoIdentityPool>
  | null = null;

export const getAwsCredentials = () => {
  if (!credentialsProvider) {
    const region = getAwsRegion();
    const identityPoolId = getEnvVar(
      import.meta.env.VITE_AWS_COGNITO_IDENTITY_POOL_ID,
      'VITE_AWS_COGNITO_IDENTITY_POOL_ID',
    );

    credentialsProvider = fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region }),
      identityPoolId,
    });
  }

  return credentialsProvider;
};

export const getLexLocaleId = (): string => {
  return (
    import.meta.env.VITE_AWS_LEX_LOCALE_ID?.trim() || 'en_US'
  );
};

export const getTranscribeLanguageCode = (): string => {
  return (
    import.meta.env.VITE_AWS_TRANSCRIBE_LANGUAGE?.trim() || 'en-US'
  );
};

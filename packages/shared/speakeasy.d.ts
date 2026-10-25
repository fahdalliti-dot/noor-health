declare module 'speakeasy' {
  export interface GeneratedSecret {
    ascii: string;
    hex: string;
    base32: string;
    otpauth_url?: string;
  }

  export interface GenerateSecretOptions {
    length?: number;
    symbols?: boolean;
    otpauth_url?: boolean;
    name?: string;
    issuer?: string;
    secret?: string;
  }

  export interface TotpVerifyOptions {
    secret: string;
    encoding?: string;
    token: string;
    window?: number;
    step?: number;
    time?: number;
  }

  export function generateSecret(options?: GenerateSecretOptions): GeneratedSecret;

  export namespace totp {
    export function verify(options: TotpVerifyOptions): boolean;
  }

  const speakeasy: {
    generateSecret(options?: GenerateSecretOptions): GeneratedSecret;
    totp: {
      verify(options: TotpVerifyOptions): boolean;
    };
  };

  export default speakeasy;
}

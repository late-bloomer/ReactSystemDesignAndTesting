import * as KJUR from 'jsrsasign';

interface JWTPayload {
  sub: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

export class JWTGenerator {
  private privateKey: string;
  private keyId: string;

  constructor(privateKey: string, keyId: string) {
    this.privateKey = privateKey;
    this.keyId = keyId;
  }

  generateToken(
    subject: string,
    issuer: string,
    audience: string,
    expirationInSeconds: number,
  ): string {
    try {
      const now = Math.floor(Date.now() / 1000);

      // Create header
      const header = {
        alg: 'RS256',
        typ: 'JWT',
        kid: this.keyId,
      };

      // Create payload
      const payload: JWTPayload = {
        sub: subject,
        iss: issuer,
        aud: audience,
        exp: now + expirationInSeconds,
        iat: now,
      };

      // Generate JWT
      const sHeader = JSON.stringify(header);
      const sPayload = JSON.stringify(payload);

      return KJUR.jws.JWS.sign(
        'RS256',
        sHeader,
        sPayload,
        this.privateKey,
        'PKCS8PEM',
      );
    } catch (error) {
      console.error('Error generating JWT JSRSAsign:', error);
      throw error;
    }
  }
}

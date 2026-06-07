import {SignJWT, importPKCS8} from 'jose';

// Create the JWT
async function generateJwtTokenJose(
  privateKeyPem: string,
  kid: string,
  subject: string,
  issuer: string,
  audience: string,
  expirationInSeconds: number,
) {
  try {
    // Set JWT claims
    const jwtClaims = {
      sub: subject,
      iss: issuer,
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + expirationInSeconds,
    };

    // Import the private key as a CryptoKey object
    const privateKey = await importPKCS8(privateKeyPem, 'RS256'); // For PEM PKCS#8 keys

    const jwt = await new SignJWT(jwtClaims)
      .setProtectedHeader({alg: 'RS256', typ: 'JWT', kid: kid})
      .sign(privateKey);

    console.log('jwt generateJwtTokenJose', jwt);
    return jwt;
  } catch (error) {
    console.error('Error signing payload generateJwtTokenJose:', error);
    return error;
  }
}

export default generateJwtTokenJose;

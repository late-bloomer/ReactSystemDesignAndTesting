declare module 'jsrsasign' {
  namespace jws {
    interface JWS {
      sign: (
        alg: string,
        header: string,
        payload: string,
        key: string,
        format?: string,
      ) => string;
    }
  }

  export const jws: {
    JWS: jws.JWS;
  };
}

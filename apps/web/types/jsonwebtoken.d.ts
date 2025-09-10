declare module 'jsonwebtoken' {
  export function verify(token: string, secretOrPublicKey: any): any
  export function sign(...args: any[]): any
}


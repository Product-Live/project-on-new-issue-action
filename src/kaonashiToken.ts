import { Issuer } from 'openid-client';

export enum Env {
    DEV = 'DEV',
    STAGE = 'STAGE',
    PROD = 'PROD'
}

export async function getKaonashiToken(env: Env): Promise<string> {
    if (!process.env.KEYCLOAK_CLIENT_ID) {
        throw new Error('Missing env var KEYCLOAK_CLIENT_ID');
    }
    if (!process.env.KEYCLOAK_REALM) {
        throw new Error('Missing env var KEYCLOAK_REALM');
    }
    if (!process.env[`KEYCLOAK_${env}_HOST`]) {
        throw new Error(`Missing env var KEYCLOAK_${env}_HOST`);
    }
    if (!process.env[`AUTOMATION_${env}_EMAIL`]) {
        throw new Error(`Missing env var AUTOMATION_${env}_EMAIL`);
    }
    if (!process.env[`AUTOMATION_${env}_PWD`]) {
        throw new Error(`Missing env var AUTOMATION_${env}_PWD`);
    }
    const issuer = await Issuer.discover(`${process.env[`KEYCLOAK_${env}_HOST`]}/realms/${process.env.KEYCLOAK_REALM}`);
    const client = new issuer.Client({
        client_id: process.env.KEYCLOAK_CLIENT_ID as string,
        token_endpoint_auth_method: 'none' // We don't need client_secret to request token.
    });

    const result = await client.grant({
        client_id: process.env.KEYCLOAK_CLIENT_ID as string,
        grant_type: 'password',
        username: process.env[`AUTOMATION_${env}_EMAIL`],
        password: process.env[`AUTOMATION_${env}_PWD`]
    });
    const token = result.access_token as string;
    return token;
}

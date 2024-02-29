import * as dotenv from 'dotenv';
dotenv.config();
import { LoggedKaoClient } from '@product-live/yuba-sdk';
import { Env, getKaonashiToken } from './kaonashiToken';
import { isTokenExpired } from './jwtToken';

class KaonashiClientSingleton {
    private static instanceDev: LoggedKaoClient;
    private static instanceStage: LoggedKaoClient;
    private static instanceProd: LoggedKaoClient;

    private constructor() {}

    public static async getInstance(env: Env = Env.PROD): Promise<LoggedKaoClient> {
        if (
            env === Env.DEV &&
            KaonashiClientSingleton.instanceDev &&
            !isTokenExpired(KaonashiClientSingleton.instanceDev.token)
        ) {
            return KaonashiClientSingleton.instanceDev;
        }
        if (
            env === Env.STAGE &&
            KaonashiClientSingleton.instanceStage &&
            !isTokenExpired(KaonashiClientSingleton.instanceStage.token)
        ) {
            return KaonashiClientSingleton.instanceStage;
        }
        if (
            env === Env.PROD &&
            KaonashiClientSingleton.instanceProd &&
            !isTokenExpired(KaonashiClientSingleton.instanceProd.token)
        ) {
            return KaonashiClientSingleton.instanceProd;
        }

        if (env === Env.DEV) {
            if (!process.env.KAONASHI_DEV_HOST) {
                throw new Error('Missing KAONASHI_DEV_HOST environment variable');
            }
            let loggedKaonashiClient = new LoggedKaoClient(await getKaonashiToken(env));
            loggedKaonashiClient.host = process.env.KAONASHI_DEV_HOST;
            KaonashiClientSingleton.instanceDev = loggedKaonashiClient;
            return KaonashiClientSingleton.instanceDev;
        } else if (env === Env.STAGE) {
            if (!process.env.KAONASHI_STAGE_HOST) {
                throw new Error('Missing KAONASHI_STAGE_HOST environment variable');
            }
            let loggedKaonashiClient = new LoggedKaoClient(await getKaonashiToken(env));
            loggedKaonashiClient.host = process.env.KAONASHI_STAGE_HOST;
            KaonashiClientSingleton.instanceStage = loggedKaonashiClient;
            return KaonashiClientSingleton.instanceStage;
        }
        if (!process.env.KAONASHI_PROD_HOST) {
            throw new Error('Missing KAONASHI_PROD_HOST environment variable');
        }
        let loggedKaonashiClient = new LoggedKaoClient(await getKaonashiToken(env));
        loggedKaonashiClient.host = process.env.KAONASHI_PROD_HOST;
        KaonashiClientSingleton.instanceProd = loggedKaonashiClient;
        return KaonashiClientSingleton.instanceProd;
    }
}

export { KaonashiClientSingleton };

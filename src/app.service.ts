import { Injectable } from '@nestjs/common';
import { EnvConfig } from './interfaces/env-config.interface';
import * as devConfig from '../config/dev';
// import * as prodConfig from '../config/prod';

@Injectable()
export class AppService {
    private ENV = process.env.NODE_ENV;
    // private prod: any = prodConfig.config;
    private dev: EnvConfig = devConfig.config;

    constructor() {}

    getEnvironmentConfig(): EnvConfig {
        const environment = process.env.NODE_ENV;

        return this.dev;
    }

    getHello(): string {
        return 'Hello World!';
    }
}

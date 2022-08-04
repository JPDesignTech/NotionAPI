import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

// Import firebase-admin
import * as admin from 'firebase-admin';
import * as devConfig from '../config/dev';
import * as serviceAccount from '../private/personalportfolio-4caf3-e397f4744ce4.json';

const firebaseParams = {
  type: 'service_account',
  projectId: devConfig.config.firebase.projectId,
  privateKeyId: serviceAccount.private_key_id,
  privateKey: serviceAccount.private_key,
  clientEmail: serviceAccount.client_email,
  clientId: serviceAccount.client_id,
  authUri: serviceAccount.auth_uri,
  tokenUri: serviceAccount.token_uri,
  authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
  clientC509CertUrl: serviceAccount.client_x509_cert_url,
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Initialize the firebase admin app
  //   admin.initializeApp({
  //     credential: admin.credential.cert(firebaseParams),
  //     databaseURL: devConfig.config.firebase.databaseURL,
  //   });

  app.setGlobalPrefix('api/v1');
  app.enableCors();
  await app.listen(devConfig.config.port);
}
bootstrap();

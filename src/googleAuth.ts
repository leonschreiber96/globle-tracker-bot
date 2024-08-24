// import fs from 'fs/promises';
// import path from 'path';
// import process from 'process';
// // import { authenticate } from '@google-cloud/local-auth';
// // import { google, Auth } from 'googleapis';

// // If modifying these scopes, delete token.json.
// const SCOPES: string[] = ['https://www.googleapis.com/auth/spreadsheets'];

// // The file token.json stores the user's access and refresh tokens, and is
// // created automatically when the authorization flow completes for the first
// // time.
// const TOKEN_PATH: string = path.join(process.cwd(), 'auth/token.json');
// console.log(TOKEN_PATH);
// const CREDENTIALS_PATH: string = path.join(process.cwd(), 'auth/credentials.json');

// /**
//  * Reads previously authorized credentials from the save file.
//  *
//  * @return {Promise<Auth.OAuth2Client | null>}
//  */
// async function loadSavedCredentialsIfExist(): Promise<Auth.OAuth2Client | null> {
//   try {
//     const content = await fs.readFile(TOKEN_PATH, 'utf-8');
//     const credentials = JSON.parse(content);
//     return google.auth.fromJSON(credentials) as Auth.OAuth2Client;
//   } catch (err) {
//     console.log(err);
//     return null;
//   }
// }

// /**
//  * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
//  *
//  * @param {Auth.OAuth2Client} client
//  * @return {Promise<void>}
//  */
// async function saveCredentials(client: Auth.OAuth2Client): Promise<void> {
//   const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
//   const keys = JSON.parse(content);
//   const key = keys.installed || keys.web;
//   const payload = JSON.stringify({
//     type: 'authorized_user',
//     client_id: key.client_id,
//     client_secret: key.client_secret,
//     refresh_token: client.credentials.refresh_token,
//   });
//   await fs.writeFile(TOKEN_PATH, payload);
// }

// /**
//  * Load or request or authorization to call APIs.
//  *
//  * @return {Promise<Auth.OAuth2Client>}
//  */
// export default async function authorize(): Promise<Auth.OAuth2Client> {
//   let client = await loadSavedCredentialsIfExist();
//   if (client) {
//     return client;
//   } else {
//     console.log("no client :(");
//   }
//   client = await authenticate({
//     scopes: SCOPES,
//     keyfilePath: CREDENTIALS_PATH,
//   });
//   if (client.credentials) {
//     await saveCredentials(client);
//   }
//   return client;
// }

// export type AuthClient = Auth.OAuth2Client;
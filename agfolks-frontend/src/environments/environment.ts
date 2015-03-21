// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  config: {
    API_URL: 'http://localhost:4010/api/',
    PORTAL_URL: 'http://local.agfolks-missio.io/portal/',
    //API_URL: "http://agfolks-api.nhdigital.co/api/",
    //PORTAL_URL:"http://portal.nhdigital.co/portal/",
    CID: 1,
    APIKEY: "25442A472D4B6150645367566B59703373357638792F423F4528482B4D6251655468576D5A7134743777397A24432646294A404E635266556A586E3272357538",
    MANUFACTURER_GROUP_ID:122
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.

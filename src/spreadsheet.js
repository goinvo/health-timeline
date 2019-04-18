import * as moment from 'moment';
import config from "./config";

export function load(callback) {
  window.gapi.client.load("sheets", "v4", () => {
    window.gapi.client.sheets.spreadsheets.values
      .get({
        spreadsheetId: config.spreadsheetId,
        range: "od1!A3:T"
      })
      .then(
        response => {
          const data = response.result.values;

          const events = data.map(event => ({
            date: moment(`${event[0]}-${event[1]}-${event[2]}`, 'YYYY-MM-DD').toString(),
            title: event[9],
            body: event[10],
            category: event[16] ? event[16] : "Medicine" // TODO: Placeholder for uncategorized events
          })) || [];
          callback({
            events
          });
        },
        response => {
          callback(false, response.result.error);
        }
      );
  });
}

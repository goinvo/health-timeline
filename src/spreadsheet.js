import * as moment from 'moment';
import config from "./config";

export function load(callback) {
  window.gapi.client.load("sheets", "v4", () => {
    window.gapi.client.sheets.spreadsheets.values
      .get({
        spreadsheetId: config.spreadsheetId,
        range: "od1!A3:X"
      })
      .then(
        response => {
          const data = response.result.values;

          const datasets = [];

          const events = data.map(event => {
            [22, 23].forEach(n => {
              if (!datasets.includes(event[n]) && event[n] !== undefined) {
                datasets.push(event[n]);
              }
            });

            return {
              date: moment(`${event[0]}-${event[1]}-${event[2]}`, 'YYYY-MM-DD').toString(),
              title: event[9],
              body: event[10],
              category: event[16] ? event[16] : "Medicine", // TODO: Placeholder for uncategorized events
              milestoneText: event[17],
              dataset: [ event[22], event[23] ],
            };
          }) || [];

          callback({
            datasets,
            events
          });
        },
        response => {
          callback(false, response.result.error);
        }
      );
  });
}

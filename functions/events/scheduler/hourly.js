const lib = require('lib')({token: process.env.STDLIB_SECRET_TOKEN});
/**
* An HTTP endpoint that acts as a webhook for Scheduler hourly event
* @returns {object} workflow The result of your workflow steps
*/
module.exports = async () => {

  // Prepare workflow object to store API responses

  let workflow = {};

  console.log(`Running airtable.query[@0.3.0].select()...`);

  workflow.selectQueryResult = await lib.airtable.query['@0.3.0'].select({
    table: `Emails`,
    where: [
      {
        'Scheduled At__lte': new Date(),
        'Sent At__is_null': `true`
      }
    ],
    limit: {
      'count': 0,
      'offset': 0
    }
  });

  let emailRecords = workflow.selectQueryResult.rows;

  console.log(`Running airtable.query[@0.1.11].replace()...`);

  await	lib.airtable.query['@0.1.11'].replace({
    table: `Emails`,
    replaceRows: emailRecords.map((emailRecord) => {
      emailRecord.fields['Sent At'] = new Date().toISOString();
      return emailRecord;
    })
  });

  console.log(`Running gmail.messages[@0.1.6].create()...`);

  let messageFns = emailRecords.map((emailRecord) => {
    let fields = emailRecord.fields;
    return lib.gmail.messages['@0.1.6'].create({
      to: fields['E-mail'],
      subject: fields['Subject'],
      text: fields['Body']
    })
  });

  await Promise.all(messageFns);

  return workflow;

};
migrate((app) => {
  const cases = app.findCollectionByNameOrId("surgery_cases");
  cases.listRule = "";
  cases.viewRule = "";
  app.save(cases);
}, (app) => {
  const cases = app.findCollectionByNameOrId("surgery_cases");
  const authenticated = '@request.auth.id != "" && @request.auth.active = true';
  cases.listRule = authenticated;
  cases.viewRule = authenticated;
  app.save(cases);
});

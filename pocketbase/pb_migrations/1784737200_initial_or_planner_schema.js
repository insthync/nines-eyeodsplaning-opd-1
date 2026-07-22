migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.listRule = 'id = @request.auth.id && active = true';
  users.viewRule = 'id = @request.auth.id && active = true';
  users.createRule = null;
  users.updateRule = null;
  users.deleteRule = null;
  users.authRule = 'active = true';
  users.fields.add(
    new TextField({
      name: "name",
      required: true,
      max: 120,
      presentable: true,
    }),
    new SelectField({
      name: "role",
      required: true,
      maxSelect: 1,
      values: ["viewer", "editor", "admin"],
    }),
    new BoolField({
      name: "active",
    }),
  );
  users.passwordAuth.enabled = true;
  users.passwordAuth.identityFields = ["email"];
  app.save(users);

  const authenticated = '@request.auth.id != "" && @request.auth.active = true';
  const canWrite = `${authenticated} && (@request.auth.role = "admin" || @request.auth.role = "editor")`;
  const cases = new Collection({
    type: "base",
    name: "surgery_cases",
    listRule: authenticated,
    viewRule: authenticated,
    createRule: canWrite,
    updateRule: canWrite,
    deleteRule: canWrite,
    fields: [
      {
        type: "text",
        name: "surgery_date",
        required: true,
        min: 10,
        max: 10,
        pattern: "^\\d{4}-\\d{2}-\\d{2}$",
      },
      {
        type: "select",
        name: "operating_room",
        required: true,
        maxSelect: 1,
        values: ["OR 1", "OR 2"],
      },
      {
        type: "text",
        name: "start_time",
        required: true,
        min: 5,
        max: 5,
        pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
      },
      {
        type: "number",
        name: "duration",
        required: true,
        min: 30,
        max: 240,
        onlyInt: true,
      },
      {
        type: "text",
        name: "patient_name",
        required: true,
        max: 200,
        presentable: true,
      },
      {
        type: "text",
        name: "hn",
        max: 80,
      },
      {
        type: "text",
        name: "doctor",
        required: true,
        max: 200,
      },
      {
        type: "text",
        name: "procedure",
        required: true,
        max: 2000,
      },
      {
        type: "select",
        name: "anesthesia",
        required: true,
        maxSelect: 1,
        values: ["general", "local", "regional"],
      },
      {
        type: "select",
        name: "status",
        required: true,
        maxSelect: 1,
        values: ["confirmed", "waitlist", "coordination"],
      },
    ],
    indexes: [
      "CREATE INDEX `idx_surgery_cases_schedule` ON `surgery_cases` (`surgery_date`, `operating_room`, `start_time`)",
    ],
  });
  app.save(cases);

  const settings = app.settings();
  settings.meta.appName = "OR Planning Board";
  app.save(settings);
}, (app) => {
  try {
    app.delete(app.findCollectionByNameOrId("surgery_cases"));
  } catch {
    // The collection may already have been removed manually.
  }
  const users = app.findCollectionByNameOrId("users");
  users.fields.removeByName("name");
  users.fields.removeByName("role");
  users.fields.removeByName("active");
  users.listRule = null;
  users.viewRule = null;
  users.createRule = null;
  users.updateRule = null;
  users.deleteRule = null;
  users.authRule = "";
  app.save(users);
});

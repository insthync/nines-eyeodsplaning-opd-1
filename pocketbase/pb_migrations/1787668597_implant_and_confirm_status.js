migrate((app) => {
  const cases = app.findCollectionByNameOrId("surgery_cases");
  cases.fields.add(
    new TextField({
      type: "text",
      name: "implant",
      required: false,
      max: 2000,
    }),
    new SelectField({
        name: "statusConfirm",
        maxSelect: 1,
        values: ["confirmed", "no-answer", "cancelled"],
        required: true,
    }),
  )
  app.save(cases);
}, (app) => {
  const cases = app.findCollectionByNameOrId("surgery_cases")
  cases.fields.removeByName("implant")
  cases.fields.removeByName("statusConfirm")
  app.save(cases);
});

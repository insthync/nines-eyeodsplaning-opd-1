function rejectScheduleConflict(e) {
  const timeToMinutes = (value) => {
    const parts = String(value).split(":");
    return Number(parts[0]) * 60 + Number(parts[1]);
  };
  const record = e.record;
  const surgeryDate = record.getString("surgery_date");
  const room = record.getString("operating_room");
  const start = timeToMinutes(record.getString("start_time"));
  const end = start + record.getInt("duration");
  const records = e.app.findRecordsByFilter(
    "surgery_cases",
    "surgery_date = {:date} && operating_room = {:room} && id != {:id}",
    "start_time",
    500,
    0,
    { date: surgeryDate, room: room, id: record.id },
  );

  const conflict = records.find((item) => {
    const itemStart = timeToMinutes(item.getString("start_time"));
    const itemEnd = itemStart + item.getInt("duration");
    return start < itemEnd && end > itemStart;
  });

  if (conflict) {
    throw new BadRequestError("The selected operating room and time overlap another case.", {
      start_time: new ValidationError(
        "schedule_conflict",
        `Conflicts with ${conflict.getString("patient_name")} at ${conflict.getString("start_time")}.`,
      ),
    });
  }

  return e.next();
}

onRecordCreateRequest(rejectScheduleConflict, "surgery_cases");
onRecordUpdateRequest(rejectScheduleConflict, "surgery_cases");

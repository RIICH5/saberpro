"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";

import "moment/locale/es";
moment.locale("es");
moment.updateLocale("es", {
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 1, // The week that contains Jan 1st is the first week of the year.
  },
});
const localizer = momentLocalizer(moment);

const BigCalendar = ({
  data,
}: {
  data: { title: string; start: Date; end: Date }[];
}) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  return (
    <Calendar
      localizer={localizer}
      events={data}
      startAccessor="start"
      endAccessor="end"
      views={["work_week", "day"]}
      view={view}
      style={{ height: "98%" }}
      onView={handleOnChangeView}
      min={new Date(2025, 1, 0, 8, 0, 0)}
      max={new Date(2025, 1, 0, 17, 0, 0)}
      culture="es"
      messages={{
        allDay: "Todo el día",
        previous: "Anterior",
        next: "Siguiente",
        today: "Hoy",
        month: "Mes",
        week: "Semana",
        work_week: "Semana laboral",
        day: "Día",
        agenda: "Agenda",
        date: "Fecha",
        time: "Hora",
        event: "Evento",
        showMore: (total) => `+ Ver más (${total})`,
      }}
    />
  );
};

export default BigCalendar;

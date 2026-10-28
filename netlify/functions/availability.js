// GET /api/availability?date=YYYY-MM-DD&service=haircut
// Returns every start time that day and which professionals are free. No customer details.
import { daySlots } from "../../public/shop-data.js";
import { findService, isBookableDate, json, listDay } from "../lib/bookings.js";

export default async (req) => {
  if (req.method !== "GET") return json(405, { error: "method_not_allowed" });

  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const service = findService(url.searchParams.get("service"));
  if (!service) return json(400, { error: "unknown_service", message: "Please choose a service." });
  if (!isBookableDate(date)) return json(400, { error: "bad_date", message: "Please choose a date in the next two weeks." });

  try {
    const bookings = await listDay(date);
    const slots = daySlots(date, service, bookings)
      .filter((slot) => !slot.past)
      .map(({ time, free }) => ({ time, free }));
    return json(200, { date, service: service.id, slots });
  } catch (error) {
    console.error("availability failed", error);
    return json(503, { error: "unavailable", message: "We couldn't load times right now. Please try again." });
  }
};

export const config = { path: "/api/availability" };

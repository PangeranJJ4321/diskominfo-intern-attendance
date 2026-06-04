import { nagerPublicHolidaySchema } from "@/lib/schemas/agency-holiday";
import { z } from "zod";

const NAGER_DATE_API_BASE_URL = "https://date.nager.at/api/v3";
const NAGER_DATE_COUNTRY_CODE = "ID";

const nagerPublicHolidayListSchema = z.array(nagerPublicHolidaySchema);

type AgencyHolidaySeed = {
  date: Date;
  description: string;
};

type NagerPublicHoliday = z.infer<typeof nagerPublicHolidaySchema>;

function toAgencyHolidaySeed(holiday: NagerPublicHoliday): AgencyHolidaySeed {
  return {
    date: new Date(`${holiday.date}T00:00:00.000Z`),
    description: holiday.localName || holiday.name,
  };
}

/**
 * Fetch holiday seeds for the current and next year from Nager.Date.
 */
export async function fetchAgencyHolidaySeeds(): Promise<AgencyHolidaySeed[]> {
  const currentYear = new Date().getUTCFullYear();
  const years = [currentYear, currentYear + 1];

  const holidayResponses = await Promise.all(
    years.map(async (year) => {
      const response = await fetch(
        `${NAGER_DATE_API_BASE_URL}/PublicHolidays/${year}/${NAGER_DATE_COUNTRY_CODE}`,
        {
          cache: "no-store",
          headers: {
            accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Gagal mengambil libur nasional untuk tahun ${year}`);
      }

      const payload: unknown = await response.json();
      const parsed = nagerPublicHolidayListSchema.safeParse(payload);

      if (!parsed.success) {
        throw new Error(
          `Format data libur nasional tidak valid untuk tahun ${year}`,
        );
      }

      return parsed.data;
    }),
  );

  const uniqueHolidays = new Map<string, AgencyHolidaySeed>();

  for (const holiday of holidayResponses.flat()) {
    uniqueHolidays.set(holiday.date, toAgencyHolidaySeed(holiday));
  }

  return [...uniqueHolidays.values()].sort(
    (left, right) => left.date.getTime() - right.date.getTime(),
  );
}

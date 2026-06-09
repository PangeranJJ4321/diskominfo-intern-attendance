import { z } from "zod";

const NAGER_DATE_API_BASE_URL = "https://date.nager.at/api/v3";
const NAGER_DATE_COUNTRY_CODE = "ID";

export const nagerPublicHolidaySchema = z.object({
  date: z.string(), // YYYY-MM-DD
  localName: z.string(),
  name: z.string(),
});

const nagerPublicHolidayListSchema = z.array(nagerPublicHolidaySchema);

export type HolidaySeed = {
  date: string; // YYYY-MM-DD format
  description: string;
};

type NagerPublicHoliday = z.infer<typeof nagerPublicHolidaySchema>;

function toHolidaySeed(holiday: NagerPublicHoliday): HolidaySeed {
  return {
    date: holiday.date,
    description: holiday.localName || holiday.name,
  };
}

/**
 * Fetch holiday seeds for the current and next year from Nager.Date.
 */
export async function fetchHolidaySeeds(): Promise<HolidaySeed[]> {
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
        throw new Error(`Gagal mengambil libur untuk tahun ${year}`);
      }

      const payload = await response.json();
      const parsed = nagerPublicHolidayListSchema.safeParse(payload);

      if (!parsed.success) {
        throw new Error(
          `Format data libur tidak valid untuk tahun ${year}`,
        );
      }

      return parsed.data;
    }),
  );

  const uniqueHolidays = new Map<string, HolidaySeed>();

  for (const holiday of holidayResponses.flat()) {
    uniqueHolidays.set(holiday.date, toHolidaySeed(holiday));
  }

  return [...uniqueHolidays.values()].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
}

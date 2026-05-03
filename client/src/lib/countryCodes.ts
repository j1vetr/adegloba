export interface CountryCode { code: string; country: string; flag?: string; }

export const COUNTRY_CODES: CountryCode[] = [
  { code: "+90",  country: "Türkiye",     flag: "🇹🇷" },
  { code: "+1",   country: "ABD/Kanada",  flag: "🇺🇸" },
  { code: "+44",  country: "İngiltere",   flag: "🇬🇧" },
  { code: "+49",  country: "Almanya",     flag: "🇩🇪" },
  { code: "+33",  country: "Fransa",      flag: "🇫🇷" },
  { code: "+39",  country: "İtalya",      flag: "🇮🇹" },
  { code: "+34",  country: "İspanya",     flag: "🇪🇸" },
  { code: "+31",  country: "Hollanda",    flag: "🇳🇱" },
  { code: "+7",   country: "Rusya",       flag: "🇷🇺" },
  { code: "+86",  country: "Çin",         flag: "🇨🇳" },
  { code: "+81",  country: "Japonya",     flag: "🇯🇵" },
  { code: "+91",  country: "Hindistan",   flag: "🇮🇳" },
  { code: "+61",  country: "Avustralya",  flag: "🇦🇺" },
  { code: "+971", country: "BAE",         flag: "🇦🇪" },
];

export function findCountryByPhone(phone: string): { code: string; rest: string } {
  const m = COUNTRY_CODES.find((c) => phone.startsWith(c.code));
  return m ? { code: m.code, rest: phone.substring(m.code.length) } : { code: "+90", rest: phone };
}

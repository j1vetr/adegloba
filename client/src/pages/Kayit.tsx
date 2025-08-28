import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, Mail, Lock, Ship as ShipIcon, MapPin, UserPlus, Phone } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useUserAuth } from "@/hooks/useUserAuth";
import type { Ship } from "@shared/schema";
import adeGlobaLogo from '@assets/adegloba-1_1756252463127.png';

export default function Kayit() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    phoneCountryCode: "+90",
    phoneNumber: "",
    ship_id: "",
    address: ""
  });

  const [countrySearch, setCountrySearch] = useState("");

  const allCountryCodes = [
    { code: "+93", country: "Afganistan", flag: "🇦🇫" },
    { code: "+355", country: "Arnavutluk", flag: "🇦🇱" },
    { code: "+213", country: "Cezayir", flag: "🇩🇿" },
    { code: "+1684", country: "Amerikan Samoası", flag: "🇦🇸" },
    { code: "+376", country: "Andorra", flag: "🇦🇩" },
    { code: "+244", country: "Angola", flag: "🇦🇴" },
    { code: "+1264", country: "Anguilla", flag: "🇦🇮" },
    { code: "+1268", country: "Antigua ve Barbuda", flag: "🇦🇬" },
    { code: "+54", country: "Arjantin", flag: "🇦🇷" },
    { code: "+374", country: "Ermenistan", flag: "🇦🇲" },
    { code: "+297", country: "Aruba", flag: "🇦🇼" },
    { code: "+61", country: "Avustralya", flag: "🇦🇺" },
    { code: "+43", country: "Avusturya", flag: "🇦🇹" },
    { code: "+994", country: "Azerbaycan", flag: "🇦🇿" },
    { code: "+1242", country: "Bahamalar", flag: "🇧🇸" },
    { code: "+973", country: "Bahreyn", flag: "🇧🇭" },
    { code: "+880", country: "Bangladeş", flag: "🇧🇩" },
    { code: "+1246", country: "Barbados", flag: "🇧🇧" },
    { code: "+375", country: "Belarus", flag: "🇧🇾" },
    { code: "+32", country: "Belçika", flag: "🇧🇪" },
    { code: "+501", country: "Belize", flag: "🇧🇿" },
    { code: "+229", country: "Benin", flag: "🇧🇯" },
    { code: "+1441", country: "Bermuda", flag: "🇧🇲" },
    { code: "+975", country: "Butan", flag: "🇧🇹" },
    { code: "+591", country: "Bolivya", flag: "🇧🇴" },
    { code: "+387", country: "Bosna Hersek", flag: "🇧🇦" },
    { code: "+267", country: "Botsvana", flag: "🇧🇼" },
    { code: "+55", country: "Brezilya", flag: "🇧🇷" },
    { code: "+246", country: "İngiliz Hint Okyanusu Bölgesi", flag: "🇮🇴" },
    { code: "+1284", country: "İngiliz Virgin Adaları", flag: "🇻🇬" },
    { code: "+673", country: "Brunei", flag: "🇧🇳" },
    { code: "+359", country: "Bulgaristan", flag: "🇧🇬" },
    { code: "+226", country: "Burkina Faso", flag: "🇧🇫" },
    { code: "+257", country: "Burundi", flag: "🇧🇮" },
    { code: "+855", country: "Kamboçya", flag: "🇰🇭" },
    { code: "+237", country: "Kamerun", flag: "🇨🇲" },
    { code: "+1", country: "Kanada", flag: "🇨🇦" },
    { code: "+238", country: "Cabo Verde", flag: "🇨🇻" },
    { code: "+1345", country: "Cayman Adaları", flag: "🇰🇾" },
    { code: "+236", country: "Orta Afrika Cumhuriyeti", flag: "🇨🇫" },
    { code: "+235", country: "Çad", flag: "🇹🇩" },
    { code: "+56", country: "Şili", flag: "🇨🇱" },
    { code: "+86", country: "Çin", flag: "🇨🇳" },
    { code: "+61", country: "Christmas Adası", flag: "🇨🇽" },
    { code: "+61", country: "Cocos Adaları", flag: "🇨🇨" },
    { code: "+57", country: "Kolombiya", flag: "🇨🇴" },
    { code: "+269", country: "Komorlar", flag: "🇰🇲" },
    { code: "+682", country: "Cook Adaları", flag: "🇨🇰" },
    { code: "+506", country: "Kosta Rika", flag: "🇨🇷" },
    { code: "+385", country: "Hırvatistan", flag: "🇭🇷" },
    { code: "+53", country: "Küba", flag: "🇨🇺" },
    { code: "+599", country: "Curaçao", flag: "🇨🇼" },
    { code: "+357", country: "Kıbrıs", flag: "🇨🇾" },
    { code: "+420", country: "Çek Cumhuriyeti", flag: "🇨🇿" },
    { code: "+243", country: "Kongo Demokratik Cumhuriyeti", flag: "🇨🇩" },
    { code: "+45", country: "Danimarka", flag: "🇩🇰" },
    { code: "+253", country: "Cibuti", flag: "🇩🇯" },
    { code: "+1767", country: "Dominika", flag: "🇩🇲" },
    { code: "+1809", country: "Dominik Cumhuriyeti", flag: "🇩🇴" },
    { code: "+670", country: "Doğu Timor", flag: "🇹🇱" },
    { code: "+593", country: "Ekvador", flag: "🇪🇨" },
    { code: "+20", country: "Mısır", flag: "🇪🇬" },
    { code: "+503", country: "El Salvador", flag: "🇸🇻" },
    { code: "+240", country: "Ekvator Ginesi", flag: "🇬🇶" },
    { code: "+291", country: "Eritre", flag: "🇪🇷" },
    { code: "+372", country: "Estonya", flag: "🇪🇪" },
    { code: "+251", country: "Etiyopya", flag: "🇪🇹" },
    { code: "+500", country: "Falkland Adaları", flag: "🇫🇰" },
    { code: "+298", country: "Faroe Adaları", flag: "🇫🇴" },
    { code: "+679", country: "Fiji", flag: "🇫🇯" },
    { code: "+358", country: "Finlandiya", flag: "🇫🇮" },
    { code: "+33", country: "Fransa", flag: "🇫🇷" },
    { code: "+689", country: "Fransız Polinezyası", flag: "🇵🇫" },
    { code: "+241", country: "Gabon", flag: "🇬🇦" },
    { code: "+220", country: "Gambiya", flag: "🇬🇲" },
    { code: "+995", country: "Gürcistan", flag: "🇬🇪" },
    { code: "+49", country: "Almanya", flag: "🇩🇪" },
    { code: "+233", country: "Gana", flag: "🇬🇭" },
    { code: "+350", country: "Cebelitarık", flag: "🇬🇮" },
    { code: "+30", country: "Yunanistan", flag: "🇬🇷" },
    { code: "+299", country: "Grönland", flag: "🇬🇱" },
    { code: "+1473", country: "Grenada", flag: "🇬🇩" },
    { code: "+1671", country: "Guam", flag: "🇬🇺" },
    { code: "+502", country: "Guatemala", flag: "🇬🇹" },
    { code: "+441481", country: "Guernsey", flag: "🇬🇬" },
    { code: "+224", country: "Gine", flag: "🇬🇳" },
    { code: "+245", country: "Gine-Bissau", flag: "🇬🇼" },
    { code: "+592", country: "Guyana", flag: "🇬🇾" },
    { code: "+509", country: "Haiti", flag: "🇭🇹" },
    { code: "+504", country: "Honduras", flag: "🇭🇳" },
    { code: "+852", country: "Hong Kong", flag: "🇭🇰" },
    { code: "+36", country: "Macaristan", flag: "🇭🇺" },
    { code: "+354", country: "İzlanda", flag: "🇮🇸" },
    { code: "+91", country: "Hindistan", flag: "🇮🇳" },
    { code: "+62", country: "Endonezya", flag: "🇮🇩" },
    { code: "+98", country: "İran", flag: "🇮🇷" },
    { code: "+964", country: "Irak", flag: "🇮🇶" },
    { code: "+353", country: "İrlanda", flag: "🇮🇪" },
    { code: "+441624", country: "Man Adası", flag: "🇮🇲" },
    { code: "+972", country: "İsrail", flag: "🇮🇱" },
    { code: "+39", country: "İtalya", flag: "🇮🇹" },
    { code: "+225", country: "Fildişi Sahili", flag: "🇨🇮" },
    { code: "+1876", country: "Jamaika", flag: "🇯🇲" },
    { code: "+81", country: "Japonya", flag: "🇯🇵" },
    { code: "+441534", country: "Jersey", flag: "🇯🇪" },
    { code: "+962", country: "Ürdün", flag: "🇯🇴" },
    { code: "+7", country: "Kazakistan", flag: "🇰🇿" },
    { code: "+254", country: "Kenya", flag: "🇰🇪" },
    { code: "+686", country: "Kiribati", flag: "🇰🇮" },
    { code: "+383", country: "Kosova", flag: "🇽🇰" },
    { code: "+965", country: "Kuveyt", flag: "🇰🇼" },
    { code: "+996", country: "Kırgızistan", flag: "🇰🇬" },
    { code: "+856", country: "Laos", flag: "🇱🇦" },
    { code: "+371", country: "Letonya", flag: "🇱🇻" },
    { code: "+961", country: "Lübnan", flag: "🇱🇧" },
    { code: "+266", country: "Lesotho", flag: "🇱🇸" },
    { code: "+231", country: "Liberya", flag: "🇱🇷" },
    { code: "+218", country: "Libya", flag: "🇱🇾" },
    { code: "+423", country: "Liechtenstein", flag: "🇱🇮" },
    { code: "+370", country: "Litvanya", flag: "🇱🇹" },
    { code: "+352", country: "Lüksemburg", flag: "🇱🇺" },
    { code: "+853", country: "Makao", flag: "🇲🇴" },
    { code: "+389", country: "Kuzey Makedonya", flag: "🇲🇰" },
    { code: "+261", country: "Madagaskar", flag: "🇲🇬" },
    { code: "+265", country: "Malavi", flag: "🇲🇼" },
    { code: "+60", country: "Malezya", flag: "🇲🇾" },
    { code: "+960", country: "Maldivler", flag: "🇲🇻" },
    { code: "+223", country: "Mali", flag: "🇲🇱" },
    { code: "+356", country: "Malta", flag: "🇲🇹" },
    { code: "+692", country: "Marshall Adaları", flag: "🇲🇭" },
    { code: "+222", country: "Moritanya", flag: "🇲🇷" },
    { code: "+230", country: "Mauritius", flag: "🇲🇺" },
    { code: "+262", country: "Mayotte", flag: "🇾🇹" },
    { code: "+52", country: "Meksika", flag: "🇲🇽" },
    { code: "+691", country: "Mikronezya", flag: "🇫🇲" },
    { code: "+373", country: "Moldova", flag: "🇲🇩" },
    { code: "+377", country: "Monako", flag: "🇲🇨" },
    { code: "+976", country: "Moğolistan", flag: "🇲🇳" },
    { code: "+382", country: "Karadağ", flag: "🇲🇪" },
    { code: "+1664", country: "Montserrat", flag: "🇲🇸" },
    { code: "+212", country: "Fas", flag: "🇲🇦" },
    { code: "+258", country: "Mozambik", flag: "🇲🇿" },
    { code: "+95", country: "Myanmar", flag: "🇲🇲" },
    { code: "+264", country: "Namibya", flag: "🇳🇦" },
    { code: "+674", country: "Nauru", flag: "🇳🇷" },
    { code: "+977", country: "Nepal", flag: "🇳🇵" },
    { code: "+31", country: "Hollanda", flag: "🇳🇱" },
    { code: "+687", country: "Yeni Kaledonya", flag: "🇳🇨" },
    { code: "+64", country: "Yeni Zelanda", flag: "🇳🇿" },
    { code: "+505", country: "Nikaragua", flag: "🇳🇮" },
    { code: "+227", country: "Nijer", flag: "🇳🇪" },
    { code: "+234", country: "Nijerya", flag: "🇳🇬" },
    { code: "+683", country: "Niue", flag: "🇳🇺" },
    { code: "+672", country: "Norfolk Adası", flag: "🇳🇫" },
    { code: "+850", country: "Kuzey Kore", flag: "🇰🇵" },
    { code: "+1670", country: "Kuzey Mariana Adaları", flag: "🇲🇵" },
    { code: "+47", country: "Norveç", flag: "🇳🇴" },
    { code: "+968", country: "Umman", flag: "🇴🇲" },
    { code: "+92", country: "Pakistan", flag: "🇵🇰" },
    { code: "+680", country: "Palau", flag: "🇵🇼" },
    { code: "+970", country: "Filistin", flag: "🇵🇸" },
    { code: "+507", country: "Panama", flag: "🇵🇦" },
    { code: "+675", country: "Papua Yeni Gine", flag: "🇵🇬" },
    { code: "+595", country: "Paraguay", flag: "🇵🇾" },
    { code: "+51", country: "Peru", flag: "🇵🇪" },
    { code: "+63", country: "Filipinler", flag: "🇵🇭" },
    { code: "+48", country: "Polonya", flag: "🇵🇱" },
    { code: "+351", country: "Portekiz", flag: "🇵🇹" },
    { code: "+1787", country: "Porto Riko", flag: "🇵🇷" },
    { code: "+974", country: "Katar", flag: "🇶🇦" },
    { code: "+242", country: "Kongo Cumhuriyeti", flag: "🇨🇬" },
    { code: "+262", country: "Réunion", flag: "🇷🇪" },
    { code: "+40", country: "Romanya", flag: "🇷🇴" },
    { code: "+7", country: "Rusya", flag: "🇷🇺" },
    { code: "+250", country: "Ruanda", flag: "🇷🇼" },
    { code: "+290", country: "Saint Helena", flag: "🇸🇭" },
    { code: "+1869", country: "Saint Kitts ve Nevis", flag: "🇰🇳" },
    { code: "+1758", country: "Saint Lucia", flag: "🇱🇨" },
    { code: "+508", country: "Saint Pierre ve Miquelon", flag: "🇵🇲" },
    { code: "+1784", country: "Saint Vincent ve Grenadinler", flag: "🇻🇨" },
    { code: "+685", country: "Samoa", flag: "🇼🇸" },
    { code: "+378", country: "San Marino", flag: "🇸🇲" },
    { code: "+239", country: "São Tomé ve Príncipe", flag: "🇸🇹" },
    { code: "+966", country: "Suudi Arabistan", flag: "🇸🇦" },
    { code: "+221", country: "Senegal", flag: "🇸🇳" },
    { code: "+381", country: "Sırbistan", flag: "🇷🇸" },
    { code: "+248", country: "Seyşeller", flag: "🇸🇨" },
    { code: "+232", country: "Sierra Leone", flag: "🇸🇱" },
    { code: "+65", country: "Singapur", flag: "🇸🇬" },
    { code: "+1721", country: "Sint Maarten", flag: "🇸🇽" },
    { code: "+421", country: "Slovakya", flag: "🇸🇰" },
    { code: "+386", country: "Slovenya", flag: "🇸🇮" },
    { code: "+677", country: "Solomon Adaları", flag: "🇸🇧" },
    { code: "+252", country: "Somali", flag: "🇸🇴" },
    { code: "+27", country: "Güney Afrika", flag: "🇿🇦" },
    { code: "+82", country: "Güney Kore", flag: "🇰🇷" },
    { code: "+211", country: "Güney Sudan", flag: "🇸🇸" },
    { code: "+34", country: "İspanya", flag: "🇪🇸" },
    { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
    { code: "+249", country: "Sudan", flag: "🇸🇩" },
    { code: "+597", country: "Surinam", flag: "🇸🇷" },
    { code: "+4779", country: "Svalbard ve Jan Mayen", flag: "🇸🇯" },
    { code: "+268", country: "Eswatini", flag: "🇸🇿" },
    { code: "+46", country: "İsveç", flag: "🇸🇪" },
    { code: "+41", country: "İsviçre", flag: "🇨🇭" },
    { code: "+963", country: "Suriye", flag: "🇸🇾" },
    { code: "+886", country: "Tayvan", flag: "🇹🇼" },
    { code: "+992", country: "Tacikistan", flag: "🇹🇯" },
    { code: "+255", country: "Tanzanya", flag: "🇹🇿" },
    { code: "+66", country: "Tayland", flag: "🇹🇭" },
    { code: "+228", country: "Togo", flag: "🇹🇬" },
    { code: "+690", country: "Tokelau", flag: "🇹🇰" },
    { code: "+676", country: "Tonga", flag: "🇹🇴" },
    { code: "+1868", country: "Trinidad ve Tobago", flag: "🇹🇹" },
    { code: "+216", country: "Tunus", flag: "🇹🇳" },
    { code: "+90", country: "Türkiye", flag: "🇹🇷" },
    { code: "+993", country: "Türkmenistan", flag: "🇹🇲" },
    { code: "+1649", country: "Turks ve Caicos Adaları", flag: "🇹🇨" },
    { code: "+688", country: "Tuvalu", flag: "🇹🇻" },
    { code: "+256", country: "Uganda", flag: "🇺🇬" },
    { code: "+380", country: "Ukrayna", flag: "🇺🇦" },
    { code: "+971", country: "Birleşik Arap Emirlikleri", flag: "🇦🇪" },
    { code: "+44", country: "Birleşik Krallık", flag: "🇬🇧" },
    { code: "+1", country: "Amerika Birleşik Devletleri", flag: "🇺🇸" },
    { code: "+598", country: "Uruguay", flag: "🇺🇾" },
    { code: "+998", country: "Özbekistan", flag: "🇺🇿" },
    { code: "+678", country: "Vanuatu", flag: "🇻🇺" },
    { code: "+379", country: "Vatikan", flag: "🇻🇦" },
    { code: "+58", country: "Venezuela", flag: "🇻🇪" },
    { code: "+84", country: "Vietnam", flag: "🇻🇳" },
    { code: "+1284", country: "Virgin Adaları (İngiliz)", flag: "🇻🇬" },
    { code: "+1340", country: "Virgin Adaları (ABD)", flag: "🇻🇮" },
    { code: "+681", country: "Wallis ve Futuna", flag: "🇼🇫" },
    { code: "+212", country: "Batı Sahara", flag: "🇪🇭" },
    { code: "+967", country: "Yemen", flag: "🇾🇪" },
    { code: "+260", country: "Zambiya", flag: "🇿🇲" },
    { code: "+263", country: "Zimbabve", flag: "🇿🇼" }
  ];

  // Popüler ülkeler - en üstte gösterilecek
  const popularCountries = [
    { code: "+90", country: "Türkiye", flag: "🇹🇷" },
    { code: "+1", country: "Amerika Birleşik Devletleri", flag: "🇺🇸" },
    { code: "+44", country: "Birleşik Krallık", flag: "🇬🇧" },
    { code: "+49", country: "Almanya", flag: "🇩🇪" },
    { code: "+33", country: "Fransa", flag: "🇫🇷" },
    { code: "+39", country: "İtalya", flag: "🇮🇹" },
    { code: "+34", country: "İspanya", flag: "🇪🇸" },
    { code: "+31", country: "Hollanda", flag: "🇳🇱" },
    { code: "+7", country: "Rusya", flag: "🇷🇺" },
    { code: "+86", country: "Çin", flag: "🇨🇳" }
  ];

  // Arama ve filtreleme
  const filteredCountries = allCountryCodes.filter(country => 
    country.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.includes(countrySearch)
  ).sort((a, b) => a.country.localeCompare(b.country, 'tr'));

  // Final liste: popüler + filtrelenmiş (popülerler hariç)
  const countryCodes = countrySearch ? filteredCountries : [
    ...popularCountries,
    ...allCountryCodes.filter(country => 
      !popularCountries.some(pop => pop.code === country.code)
    ).sort((a, b) => a.country.localeCompare(b.country, 'tr'))
  ];

  const { user, isLoading: authLoading } = useUserAuth();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      setLocation("/panel");
    }
  }, [user, authLoading, setLocation]);

  // Fetch active ships for dropdown
  const { data: ships, isLoading: shipsLoading } = useQuery<Ship[]>({
    queryKey: ["/api/ships/active"]
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          phone: `${formData.phoneCountryCode}${formData.phoneNumber}`
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Invalidate user auth cache and redirect to user dashboard after successful registration
        await queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
        // Force a brief delay for cache invalidation to take effect
        setTimeout(() => {
          setLocation("/panel");
        }, 100);
      } else {
        setError(data.message || "Kayıt işlemi başarısız");
      }
    } catch (error) {
      setError("Bağlantı hatası oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleCountryCodeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      phoneCountryCode: value
    }));
  };

  const handleShipChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      ship_id: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 py-8">
      {/* Subtle background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 sm:top-20 sm:left-20 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 w-32 h-32 sm:w-60 sm:h-60 bg-gradient-to-r from-slate-600/10 to-slate-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] sm:bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img 
              src={adeGlobaLogo} 
              alt="AdeGloba Limited" 
              className="h-16 sm:h-20 object-contain filter drop-shadow-lg"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Sisteme Kayıt
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            AdeGloba Starlink System'e katılın
          </p>
        </div>

        {/* Registration Card */}
        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 shadow-2xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-center text-white text-xl flex items-center justify-center gap-2">
              <UserPlus className="h-5 w-5 text-amber-400" />
              Yeni Hesap Oluştur
            </CardTitle>
            <p className="text-center text-slate-400 text-sm">
              Sisteme erişim için gerekli bilgileri doldurun
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-slate-300 flex items-center gap-2 font-medium">
                  <User className="h-4 w-4 text-amber-400" />
                  İsim Soyisim *
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="bg-slate-800/50 border-slate-600/50 text-white h-12 placeholder:text-slate-400 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm"
                  placeholder="Adınız ve soyadınızı girin"
                  data-testid="input-full-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300 flex items-center gap-2 font-medium">
                  <User className="h-4 w-4 text-amber-400" />
                  Kullanıcı Adı *
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="bg-slate-800/50 border-slate-600/50 text-white h-12 placeholder:text-slate-400 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm"
                  placeholder="Kullanıcı adınızı girin"
                  data-testid="input-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 flex items-center gap-2 font-medium">
                  <Mail className="h-4 w-4 text-amber-400" />
                  E-posta *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-slate-800/50 border-slate-600/50 text-white h-12 placeholder:text-slate-400 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm"
                  placeholder="E-posta adresinizi girin"
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 flex items-center gap-2 font-medium">
                  <Lock className="h-4 w-4 text-amber-400" />
                  Şifre *
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="bg-slate-800/50 border-slate-600/50 text-white h-12 placeholder:text-slate-400 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm"
                  placeholder="Şifrenizi girin (en az 6 karakter)"
                  data-testid="input-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300 flex items-center gap-2 font-medium">
                  <Phone className="h-4 w-4 text-amber-400" />
                  Telefon Numarası *
                </Label>
                <div className="flex gap-2">
                  <Select onValueChange={handleCountryCodeChange} defaultValue="+90">
                    <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-white w-[140px] h-12 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm" data-testid="select-country-code">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800/95 border-slate-600 backdrop-blur-xl max-h-80">
                      <div className="p-2 border-b border-slate-700">
                        <Input
                          placeholder="Ülke ara..."
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className="h-8 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                        />
                      </div>
                      {!countrySearch && popularCountries.length > 0 && (
                        <>
                          <div className="p-2 text-xs text-amber-400 font-medium border-b border-slate-700">
                            Popüler Ülkeler
                          </div>
                          {popularCountries.map((country) => (
                            <SelectItem key={`popular-${country.code}`} value={country.code} className="text-white hover:bg-slate-700">
                              <div className="flex items-center gap-2">
                                <span>{country.flag}</span>
                                <span>{country.code}</span>
                                <span className="text-sm text-slate-400">{country.country}</span>
                              </div>
                            </SelectItem>
                          ))}
                          <div className="p-2 text-xs text-slate-500 font-medium border-b border-slate-700">
                            Tüm Ülkeler (Alfabetik)
                          </div>
                        </>
                      )}
                      {countryCodes.filter(country => 
                        countrySearch || !popularCountries.some(pop => pop.code === country.code)
                      ).map((country) => (
                        <SelectItem key={country.code} value={country.code} className="text-white hover:bg-slate-700">
                          <div className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.code}</span>
                            <span className="text-sm text-slate-400">{country.country}</span>
                          </div>
                        </SelectItem>
                      ))}
                      {countrySearch && filteredCountries.length === 0 && (
                        <div className="p-3 text-center text-slate-400 text-sm">
                          Aradığınız ülke bulunamadı
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    className="bg-slate-800/50 border-slate-600/50 text-white h-12 placeholder:text-slate-400 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm flex-1"
                    placeholder="532 123 45 67"
                    data-testid="input-phone-number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ship_id" className="text-slate-300 flex items-center gap-2 font-medium">
                  <ShipIcon className="h-4 w-4 text-amber-400" />
                  Gemi Seçin *
                </Label>
                <Select onValueChange={handleShipChange} required>
                  <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-white h-12 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm" data-testid="select-ship">
                    <SelectValue placeholder="Geminizi seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800/95 border-slate-600 backdrop-blur-xl">
                    {shipsLoading ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Gemiler yükleniyor...
                        </div>
                      </SelectItem>
                    ) : (
                      ships?.map((ship) => (
                        <SelectItem key={ship.id} value={ship.id} className="text-white hover:bg-slate-700">
                          {ship.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-slate-300 flex items-center gap-2 font-medium">
                  <MapPin className="h-4 w-4 text-amber-400" />
                  Adresiniz
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="bg-slate-800/50 border-slate-600/50 text-white min-h-[80px] placeholder:text-slate-400 focus:border-amber-400/50 focus:ring-amber-400/20 focus:ring-2 transition-all duration-200 backdrop-blur-sm resize-none"
                  placeholder="Faturalama/kargo adresinizi girin..."
                  data-testid="textarea-address"
                />
              </div>

              {error && (
                <Alert className="border-red-500/50 bg-red-500/10 backdrop-blur-sm">
                  <AlertDescription className="text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-700 hover:via-amber-600 hover:to-yellow-600 text-slate-900 h-12 text-lg font-bold shadow-2xl hover:shadow-amber-500/25 transition-all duration-300 hover:scale-105"
                disabled={isLoading}
                data-testid="button-register"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Kayıt işlemi devam ediyor...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" />
                    Sisteme Kayıt Ol
                  </>
                )}
              </Button>
              
              {/* Private system notice */}
              <p className="text-xs text-slate-500 text-center">
                Bu sistem AdeGloba Starlink System müşterilerine özeldir.
              </p>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Zaten hesabınız var mı?{" "}
                <button
                  onClick={() => setLocation("/giris")}
                  className="text-amber-400 hover:text-amber-300 underline transition-colors"
                  data-testid="link-login"
                >
                  Giriş Yap
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-400 text-sm">
          <div className="flex items-center justify-center mb-2">
            <img 
              src={adeGlobaLogo} 
              alt="AdeGloba Limited" 
              className="h-6 object-contain opacity-70"
            />
          </div>
          <p>© 2025 AdeGloba Limited</p>
          <p className="mt-1">Güvenli ve hızlı deniz internet bağlantısı</p>
        </div>
      </div>
    </div>
  );
}
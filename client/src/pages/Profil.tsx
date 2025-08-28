import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserAuth } from "@/hooks/useUserAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  User,
  Ship as ShipIcon,
  Mail,
  Calendar,
  MapPin,
  Edit,
  Save,
  X,
  Lock,
  Key,
  Phone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserNavigation } from "@/components/UserNavigation";
import type { User as UserType, Ship } from "@shared/schema";

export default function Profil() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
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
    { code: "+6161", country: "Christmas Adası", flag: "🇨🇽" },
    { code: "+6162", country: "Cocos Adaları", flag: "🇨🇨" },
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
    { code: "+1340", country: "Virgin Adaları (ABD)", flag: "🇻🇮" },
    { code: "+681", country: "Wallis ve Futuna", flag: "🇼🇫" },
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
    { code: "+86", country: "Çin", flag: "🇨🇳" }
  ];

  const [countrySearch, setCountrySearch] = useState("");
  // Arama ve filtreleme
  const filteredCountries = allCountryCodes.filter(country => 
    country.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.includes(countrySearch)
  ).sort((a, b) => a.country.localeCompare(b.country, 'tr'));

  // Final liste: popüler + filtrelenmiş (popülerler hariç)  
  const countryCodes = countrySearch ? filteredCountries : [
    ...popularCountries,
    ...allCountryCodes.filter(country => 
      !popularCountries.some(pop => pop.code === country.code && pop.country === country.country)
    ).sort((a, b) => a.country.localeCompare(b.country, 'tr'))
  ];

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phoneCountryCode: "+90",
    phoneNumber: "",
    ship_id: "",
    address: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Fetch user profile with ship information
  const { data: user, isLoading: authLoading } = useQuery<UserType & { ship?: Ship }>({
    queryKey: ['/api/user/me'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch ships for dropdown
  const { data: ships } = useQuery<Ship[]>({
    queryKey: ["/api/ships"],
    enabled: !!user
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Validate password fields if password change is attempted
      if (data.newPassword || data.currentPassword) {
        if (!data.currentPassword) {
          throw new Error("Mevcut şifre gerekli");
        }
        if (!data.newPassword) {
          throw new Error("Yeni şifre gerekli");
        }
        if (data.newPassword !== data.confirmPassword) {
          throw new Error("Yeni şifreler eşleşmiyor");
        }
        if (data.newPassword.length < 6) {
          throw new Error("Yeni şifre en az 6 karakter olmalı");
        }
      }

      // Combine phone country code and number
      const submitData = {
        ...data,
        phone: `${data.phoneCountryCode}${data.phoneNumber}`
      };
      
      const response = await apiRequest('PUT', '/api/user/profile', submitData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Profil bilgileriniz güncellendi.",
      });
      setIsEditing(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
      // Refresh user data and packages if ship was changed
      queryClient.invalidateQueries({ queryKey: ['/api/user/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/active-packages'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Profil güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  // Initialize form data when user data loads
  React.useEffect(() => {
    if (user) {
      // Parse phone number
      const phone = user.phone || "";
      let phoneCountryCode = "+90";
      let phoneNumber = "";
      
      if (phone) {
        // Find matching country code
        const matchingCountry = countryCodes.find(country => phone.startsWith(country.code));
        if (matchingCountry) {
          phoneCountryCode = matchingCountry.code;
          phoneNumber = phone.substring(matchingCountry.code.length);
        } else {
          phoneNumber = phone;
        }
      }
      
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phoneCountryCode,
        phoneNumber,
        ship_id: user.ship_id || "",
        address: user.address || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    // Parse phone number
    const phone = user?.phone || "";
    let phoneCountryCode = "+90";
    let phoneNumber = "";
    
    if (phone) {
      const matchingCountry = countryCodes.find(country => phone.startsWith(country.code));
      if (matchingCountry) {
        phoneCountryCode = matchingCountry.code;
        phoneNumber = phone.substring(matchingCountry.code.length);
      } else {
        phoneNumber = phone;
      }
    }
    
    setFormData({
      full_name: user?.full_name || "",
      email: user?.email || "",
      phoneCountryCode,
      phoneNumber,
      ship_id: user?.ship_id || "",
      address: user?.address || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setIsEditing(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <UserNavigation />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = '/giris';
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <UserNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              AdeGloba Starlink System - Profil
            </h1>
            <p className="text-slate-400">
              Profil bilgilerinizi görüntüleyin ve güncelleyin
            </p>
          </div>

          {/* Profile Card */}
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <User className="h-6 w-6 text-blue-400" />
                Profil Bilgileri
              </CardTitle>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white w-full sm:w-auto"
                  data-testid="button-edit-profile"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Profil Düzenle
                </Button>
              )}
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                {/* Read-only Username field */}
                <div className="space-y-2">
                  <Label className="text-slate-400 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-400" />
                    Kullanıcı Adı
                  </Label>
                  <div className="text-white bg-slate-800/50 p-3 rounded-lg border border-slate-600">
                    {user?.username || "-"}
                  </div>
                  <p className="text-xs text-slate-500">Bu alan değiştirilemez</p>
                </div>

                {/* Editable Email field */}
                <div className="space-y-2">
                  <Label className="text-slate-400 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-cyan-400" />
                    E-posta
                  </Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="E-posta adresiniz"
                      className="bg-slate-700 border-slate-600 text-white"
                      data-testid="input-email"
                    />
                  ) : (
                    <div className="text-white bg-slate-800/50 p-3 rounded-lg border border-slate-600">
                      {user?.email || "Henüz girilmemiş"}
                    </div>
                  )}
                </div>

                {/* Editable Name field */}
                <div className="space-y-2">
                  <Label className="text-slate-400 flex items-center gap-2">
                    <User className="h-4 w-4 text-green-400" />
                    İsim Soyisim
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Ad Soyad"
                      className="bg-slate-700 border-slate-600 text-white"
                      data-testid="input-full-name"
                    />
                  ) : (
                    <div className="text-white bg-slate-800/50 p-3 rounded-lg border border-slate-600">
                      {user?.full_name || "Henüz girilmemiş"}
                    </div>
                  )}
                </div>

                {/* Editable Phone field */}
                <div className="space-y-2">
                  <Label className="text-slate-400 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-amber-400" />
                    Telefon Numarası
                  </Label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Select value={formData.phoneCountryCode} onValueChange={(value) => handleInputChange('phoneCountryCode', value)}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-[140px]" data-testid="select-country-code">
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
                              {popularCountries.map((country, index) => (
                                <SelectItem key={`popular-${index}-${country.code}`} value={country.code} className="text-white hover:bg-slate-700">
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
                          ).map((country, index) => (
                            <SelectItem key={`all-${index}-${country.code}`} value={country.code} className="text-white hover:bg-slate-700">
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
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        placeholder="532 123 45 67"
                        className="bg-slate-700 border-slate-600 text-white flex-1"
                        data-testid="input-phone-number"
                      />
                    </div>
                  ) : (
                    <div className="text-white bg-slate-800/50 p-3 rounded-lg border border-slate-600">
                      {user?.phone || "Henüz girilmemiş"}
                    </div>
                  )}
                </div>

                {/* Editable Ship Selection */}
                <div className="space-y-2">
                  <Label className="text-slate-400 flex items-center gap-2">
                    <ShipIcon className="h-4 w-4 text-purple-400" />
                    Seçili Gemi
                  </Label>
                  {isEditing ? (
                    <Select value={formData.ship_id} onValueChange={(value) => handleInputChange('ship_id', value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white" data-testid="select-ship">
                        <SelectValue placeholder="Gemi seçin..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {(ships as Ship[])?.map((ship) => (
                          <SelectItem key={ship.id} value={ship.id} className="text-white focus:bg-slate-600">
                            {ship.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-white bg-slate-800/50 p-3 rounded-lg border border-slate-600">
                      {user?.ship?.name || "Gemi seçilmemiş"}
                    </div>
                  )}
                  {isEditing && (
                    <p className="text-xs text-blue-400">Gemi değiştirildiğinde paket atamaları yenilenecek</p>
                  )}
                </div>

                <Separator className="bg-slate-700" />

                {/* Editable Address Field */}
                <div className="space-y-2">
                  <Label className="text-slate-400 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-400" />
                    Adres
                  </Label>
                  {isEditing ? (
                    <Textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Teslimat/fatura adresi"
                      className="bg-slate-700 border-slate-600 text-white resize-none min-h-[80px]"
                      rows={3}
                      data-testid="input-address"
                    />
                  ) : (
                    <div className="text-white bg-slate-800/50 p-3 rounded-lg border border-slate-600 min-h-[80px] whitespace-pre-wrap">
                      {user?.address || "Henüz girilmemiş"}
                    </div>
                  )}
                </div>

                {/* Password Change Section - Only show when editing */}
                {isEditing && (
                  <>
                    <Separator className="bg-slate-700" />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <Key className="h-5 w-5 text-yellow-400" />
                        Şifre Değiştir (İsteğe Bağlı)
                      </h3>
                      
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-400 flex items-center gap-2">
                            <Lock className="h-4 w-4 text-red-400" />
                            Mevcut Şifre
                          </Label>
                          <Input
                            type="password"
                            value={formData.currentPassword}
                            onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                            placeholder="Mevcut şifrenizi girin"
                            className="bg-slate-700 border-slate-600 text-white"
                            data-testid="input-current-password"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-400 flex items-center gap-2">
                            <Lock className="h-4 w-4 text-green-400" />
                            Yeni Şifre
                          </Label>
                          <Input
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => handleInputChange('newPassword', e.target.value)}
                            placeholder="Yeni şifrenizi girin (en az 6 karakter)"
                            className="bg-slate-700 border-slate-600 text-white"
                            data-testid="input-new-password"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-400 flex items-center gap-2">
                            <Lock className="h-4 w-4 text-green-400" />
                            Yeni Şifre Tekrar
                          </Label>
                          <Input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            placeholder="Yeni şifrenizi tekrar girin"
                            className="bg-slate-700 border-slate-600 text-white"
                            data-testid="input-confirm-password"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label className="text-slate-400 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-pink-400" />
                    Kayıt Tarihi
                  </Label>
                  <div className="text-white bg-slate-800/50 p-3 rounded-lg border border-slate-600">
                    {user?.created_at 
                      ? new Date(user.created_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long', 
                          day: 'numeric'
                        })
                      : "-"
                    }
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white flex-1 sm:flex-initial"
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Değişiklikleri Kaydet
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 flex-1 sm:flex-initial"
                    data-testid="button-cancel-edit"
                  >
                    <X className="h-4 w-4 mr-2" />
                    İptal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
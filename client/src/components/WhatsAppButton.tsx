import { Button } from "@/components/ui/button";

export default function WhatsAppButton() {
  const handleClick = () => {
    const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '+1234567890';
    const message = 'Hello! I need support with StarLink Marine data packages.';
    const url = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleClick}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all animate-float neon-glow p-0"
        data-testid="whatsapp-button"
      >
        <i className="fab fa-whatsapp text-2xl"></i>
      </Button>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/privatumas")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privatumo politika · PaslaugosGrožiui" },
      { name: "description", content: "Kaip PaslaugosGrožiui renka, naudoja ir saugo tavo duomenis: paskyros, rezervacijos, mokėjimai, slapukai ir tavo teisės." },
      { property: "og:title", content: "Privatumo politika · PaslaugosGrožiui" },
      { property: "og:description", content: "PaslaugosGrožiui duomenų tvarkymo principai ir naudotojų teisės." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.testinispuslapis.online/privatumas" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://www.testinispuslapis.online/privatumas" }],
  }),
});

type Section = { h: string; p: string[] };

const DOC: Record<string, { title: string; intro: string; sections: Section[]; note: string }> = {
  lt: {
    title: "Privatumo politika",
    intro: "Šią politiką tvarko PaslaugosGrožiui platformos savininkas. Ji paaiškina, kokius duomenis renkame naudojantis platforma ir kaip juos naudojame.",
    sections: [
      { h: "1. Kokius duomenis renkame", p: [
        "Paskyros duomenys: el. paštas, vardas, telefonas, miestas, rolė (klientas, meistras, salonas, tiekėjas, mokykla, darbdavys).",
        "Verslo profilio duomenys: pavadinimas, adresas, aprašymas, nuotraukos, paslaugos ir kainos.",
        "Rezervacijų ir užsakymų duomenys: pasirinkta paslauga ar prekė, laikas, kaina, pristatymo informacija.",
        "Techniniai duomenys: prisijungimo laikas, naršyklės tipas, apytikslė vieta pagal IP — saugumui ir statistikai.",
      ] },
      { h: "2. Kam naudojame duomenis", p: [
        "Kad veiktų paskyra, rezervacijos, pranešimai ir užsakymai.",
        "Kad salonai ir tiekėjai galėtų susisiekti dėl konkrečios rezervacijos ar užsakymo.",
        "Kad apsaugotume platformą nuo piktnaudžiavimo ir netikrų rezervacijų.",
        "Kad tobulintume paslaugą — apibendrinta, neasmenine statistika.",
      ] },
      { h: "3. Kam perduodame duomenis", p: [
        "Salonui ar tiekėjui, pas kurį atlieki rezervaciją arba užsakymą — tik tiek, kiek būtina jai įvykdyti.",
        "Techniniams partneriams: prieglobos ir duomenų bazės tiekėjui, el. laiškų siuntimo paslaugai, mokėjimų paslaugų teikėjui.",
        "Niekada neparduodame tavo duomenų tretiesiems asmenims reklamos tikslais.",
      ] },
      { h: "4. Mokėjimai", p: [
        "Mokėjimų kortelių duomenų platformoje nesaugome — juos tvarko mokėjimų paslaugų teikėjas.",
        "Mes saugome tik mokėjimo faktą, sumą ir statusą, kad galėtume išrašyti dokumentus ir spręsti ginčus.",
      ] },
      { h: "5. Slapukai", p: [
        "Naudojame būtinuosius slapukus prisijungimo sesijai ir kalbos pasirinkimui išsaugoti.",
        "Analitinius slapukus naudojame tik apibendrintai statistikai; jų gali atsisakyti naršyklės nustatymuose.",
      ] },
      { h: "6. Saugojimo terminai", p: [
        "Paskyros duomenys saugomi tol, kol paskyra aktyvi.",
        "Rezervacijų ir užsakymų įrašai saugomi tiek, kiek reikalauja apskaitos teisės aktai.",
        "Ištrynus paskyrą, asmens duomenys pašalinami arba nuasmeninami.",
      ] },
      { h: "7. Tavo teisės", p: [
        "Turi teisę susipažinti su savo duomenimis, juos ištaisyti, ištrinti arba apriboti jų tvarkymą.",
        "Turi teisę gauti savo duomenų kopiją ir nesutikti su tvarkymu.",
        "Prašymus siųsk kontaktų puslapyje nurodytu el. paštu — atsakome per 30 dienų.",
      ] },
      { h: "8. Saugumas", p: [
        "Duomenys perduodami šifruotu ryšiu, prieiga prie duomenų bazės ribojama pagal roles.",
        "Įtaręs saugumo pažeidimą, susisiek su mumis — reaguojame nedelsdami.",
      ] },
    ],
    note: "Šis dokumentas yra bendro pobūdžio informacija, o ne teisinė konsultacija. Prieš viešą naudojimą rekomenduojame suderinti su teisininku.",
  },
  en: {
    title: "Privacy policy",
    intro: "This policy is maintained by the owner of the PaslaugosGrožiui platform. It explains what data we collect when you use the platform and how we use it.",
    sections: [
      { h: "1. Data we collect", p: [
        "Account data: email, name, phone, city, role (client, master, salon, supplier, school, employer).",
        "Business profile data: name, address, description, photos, services and prices.",
        "Booking and order data: chosen service or product, time, price, delivery details.",
        "Technical data: sign-in time, browser type, approximate location from IP — for security and statistics.",
      ] },
      { h: "2. How we use it", p: [
        "To operate your account, bookings, notifications and orders.",
        "So salons and suppliers can contact you about a specific booking or order.",
        "To protect the platform from abuse and fake bookings.",
        "To improve the service using aggregated, non-personal statistics.",
      ] },
      { h: "3. Who we share it with", p: [
        "The salon or supplier you book or order from — only what is needed to fulfil it.",
        "Technical partners: hosting and database provider, email delivery service, payment provider.",
        "We never sell your data to third parties for advertising.",
      ] },
      { h: "4. Payments", p: [
        "We do not store card details — they are handled by the payment provider.",
        "We store only the payment fact, amount and status for accounting and dispute resolution.",
      ] },
      { h: "5. Cookies", p: [
        "Essential cookies keep your session and language preference.",
        "Analytics cookies are used only for aggregated statistics and can be disabled in your browser.",
      ] },
      { h: "6. Retention", p: [
        "Account data is kept while the account is active.",
        "Booking and order records are kept as long as accounting law requires.",
        "When an account is deleted, personal data is removed or anonymised.",
      ] },
      { h: "7. Your rights", p: [
        "You can access, correct, delete or restrict processing of your data.",
        "You can request a copy of your data and object to processing.",
        "Send requests to the email on our contact page — we reply within 30 days.",
      ] },
      { h: "8. Security", p: [
        "Data is transmitted over encrypted connections and database access is role-restricted.",
        "If you suspect a security issue, contact us — we respond immediately.",
      ] },
    ],
    note: "This document is general information, not legal advice. Have it reviewed by a lawyer before public use.",
  },
  ru: {
    title: "Политика конфиденциальности",
    intro: "Эту политику поддерживает владелец платформы PaslaugosGrožiui. Она объясняет, какие данные мы собираем и как их используем.",
    sections: [
      { h: "1. Какие данные мы собираем", p: [
        "Данные аккаунта: эл. почта, имя, телефон, город, роль.",
        "Данные бизнес-профиля: название, адрес, описание, фото, услуги и цены.",
        "Данные броней и заказов: услуга или товар, время, цена, данные доставки.",
        "Технические данные: время входа, тип браузера, приблизительное местоположение по IP.",
      ] },
      { h: "2. Как мы используем данные", p: [
        "Для работы аккаунта, броней, уведомлений и заказов.",
        "Чтобы салон или поставщик мог связаться по конкретной брони или заказу.",
        "Для защиты платформы от злоупотреблений и фиктивных броней.",
        "Для улучшения сервиса на основе обобщённой статистики.",
      ] },
      { h: "3. Кому передаём", p: [
        "Салону или поставщику, у которого вы бронируете или заказываете — только необходимое.",
        "Техническим партнёрам: хостинг и база данных, сервис писем, платёжный провайдер.",
        "Мы никогда не продаём ваши данные для рекламы.",
      ] },
      { h: "4. Платежи", p: [
        "Данные карт мы не храним — их обрабатывает платёжный провайдер.",
        "Мы храним только факт, сумму и статус платежа.",
      ] },
      { h: "5. Файлы cookie", p: [
        "Необходимые cookie хранят сессию и выбранный язык.",
        "Аналитические cookie используются только для обобщённой статистики.",
      ] },
      { h: "6. Сроки хранения", p: [
        "Данные аккаунта хранятся, пока аккаунт активен.",
        "Записи о бронях и заказах — согласно требованиям бухгалтерского учёта.",
        "При удалении аккаунта персональные данные удаляются или обезличиваются.",
      ] },
      { h: "7. Ваши права", p: [
        "Доступ, исправление, удаление или ограничение обработки данных.",
        "Копия данных и возражение против обработки.",
        "Запросы — на адрес со страницы контактов, ответ в течение 30 дней.",
      ] },
      { h: "8. Безопасность", p: [
        "Данные передаются по зашифрованному соединению, доступ ограничен по ролям.",
        "При подозрении на инцидент безопасности свяжитесь с нами.",
      ] },
    ],
    note: "Этот документ — общая информация, а не юридическая консультация.",
  },
};

function PrivacyPage() {
  const { i18n } = useTranslation();
  const lang = (i18n.language || "lt").slice(0, 2);
  const doc = DOC[lang] ?? DOC.lt;

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-10 md:py-16">
      <div className="flex items-center gap-3 mb-3">
        <div className="rounded-xl gradient-gold p-2.5 text-primary-foreground shrink-0">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl">{doc.title}</h1>
      </div>
      <p className="text-muted-foreground">{doc.intro}</p>

      <div className="mt-8 space-y-4">
        {doc.sections.map((s) => (
          <Card key={s.h} className="p-5">
            <h2 className="font-display text-lg mb-2">{s.h}</h2>
            <ul className="space-y-1.5 text-sm text-muted-foreground leading-relaxed list-disc pl-4">
              {s.p.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">{doc.note}</p>
    </div>
  );
}

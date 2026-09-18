import { createFileRoute } from "@tanstack/react-router";
import { useSection } from "@/lib/use-site-content";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/duk")({
  component: FaqPage,
  head: () => ({
    meta: [
      { title: "DUK — dažniausiai užduodami klausimai · PaslaugosGrožiui" },
      { name: "description", content: "Atsakymai apie rezervacijas, narystes, parduotuvę, tiekėjų prekių importą ir demo paskyras PaslaugosGrožiui platformoje." },
      { property: "og:title", content: "DUK · PaslaugosGrožiui" },
      { property: "og:description", content: "Viskas, ką reikia žinoti apie PaslaugosGrožiui: rezervacijos, narystės, parduotuvė, tiekėjai." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.testinispuslapis.online/duk" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://www.testinispuslapis.online/duk" }],
  }),
});

const FAQ: Record<string, Array<{ q: string; a: string }>> = {
  lt: [
    { q: "Kas yra PaslaugosGrožiui?", a: "PaslaugosGrožiui — grožio ekosistema: salonų ir meistrų paieška su rezervacija, profesionalų parduotuvė, grožio mokyklos, darbo skelbimai, renginiai ir forumas vienoje vietoje." },
    { q: "Kaip rezervuoti vizitą?", a: "Pasirink paslaugą arba saloną, pasirink laisvą laiką kalendoriuje ir patvirtink. Rezervacijai reikia prisijungti — taip apsaugome salonus nuo netikrų užsakymų. Patvirtinimą gauni el. paštu, priminimą — likus 24 val." },
    { q: "Ar galiu atšaukti vizitą?", a: "Taip, atšaukti gali per nuorodą patvirtinimo laiške arba savo paskyroje. Atšaukus vėliau nei salono nurodytas terminas, depozitas negrąžinamas." },
    { q: "Kiek kainuoja narystė?", a: "Klientams — nemokama. Salonams, meistrams, tiekėjams, mokykloms ir darbdaviams veikia mėnesiniai arba metiniai planai (metiniai su nuolaida). Nauji salonai gauna 1 savaitės nemokamą paryškinimą." },
    { q: "Kas nutinka pasibaigus narystei?", a: "Tavo duomenys, profilis ir istorija išlieka. Tiesiog laikinai nerodomas paryškinimas ir dalis pro funkcijų — atnaujinus narystę viskas grįžta." },
    { q: "Kuo skiriasi kainos parduotuvėje?", a: "Klientai mato mažmeninę kainą. Meistrai, salonai ir kiti profesionalai prisijungę mato didmeninę (B2B) kainą — ji visada mažesnė." },
    { q: "Esu tiekėjas — kaip įkelti prekes?", a: "Tiekėjo skydelyje → „Prekės“. Gali pridėti prekę ranka arba įkelti visą katalogą per XML/CSV nuorodą. Prekė parduotuvėje matoma iš karto, jei pažymėta „Aktyvi“." },
    { q: "Kodėl mano prekių nesimato parduotuvėje?", a: "Patikrink tris dalykus: 1) prekė pažymėta kaip aktyvi; 2) tavo paskyra turi tiekėjo rolę; 3) puslapis atnaujintas. Prekės su 0 likučiu rodomos su žyma „Pagal užsakymą“, o ne slepiamos." },
    { q: "Kokie mokesčiai taikomi?", a: "Platformos mokestis — 0,49 € už užsakymą arba rezervaciją su depozitu. Jokių paslėptų komisinių." },
    { q: "Ar galiu išbandyti platformą be registracijos?", a: "Taip. Prisijungimo puslapyje rasi demo paskyras visoms rolėms (klientas, meistrė, salonas, tiekėjas, mokykla, darbdavys, administratorius). Bendras slaptažodis — Demo1234!" },
    { q: "Ar bus mobili programėlė?", a: "Puslapis pritaikytas telefonui ir veikia kaip programėlė — netrukus paruošime ir atskiras iOS/Android versijas." },
  ],
  en: [
    { q: "What is PaslaugosGrožiui?", a: "PaslaugosGrožiui is a beauty ecosystem: salon and master discovery with instant booking, a professional shop, beauty schools, job listings, events and a forum — all in one place." },
    { q: "How do I book an appointment?", a: "Pick a service or salon, choose a free slot in the calendar and confirm. Booking requires an account so salons are protected from fake bookings. You get an email confirmation and a reminder 24h before." },
    { q: "Can I cancel?", a: "Yes — via the link in your confirmation email or in your account. If you cancel later than the salon's cut-off, the deposit is non-refundable." },
    { q: "How much does membership cost?", a: "Free for clients. Salons, masters, suppliers, schools and employers use monthly or yearly plans (yearly is discounted). New salons get 1 week of free highlighting." },
    { q: "What happens when membership ends?", a: "Your data, profile and history stay. Only highlighting and some pro features pause — everything returns when you renew." },
    { q: "Why are shop prices different?", a: "Clients see retail prices. Logged-in masters, salons and other pros see wholesale (B2B) prices, which are always lower." },
    { q: "I'm a supplier — how do I upload products?", a: "Supplier dashboard → Products. Add items manually or import your whole catalogue from an XML/CSV feed URL. Products appear in the shop immediately if marked Active." },
    { q: "Why aren't my products visible?", a: "Check three things: the product is Active, your account has the supplier role, and the page is refreshed. Items with 0 stock are shown as 'Made to order' rather than hidden." },
    { q: "What fees apply?", a: "A €0.49 platform fee per order or deposit booking. No hidden commissions." },
    { q: "Can I try the platform without signing up?", a: "Yes. The sign-in page has demo accounts for every role (client, master, salon, supplier, school, employer, admin). Shared password: Demo1234!" },
    { q: "Will there be a mobile app?", a: "The site is fully mobile-optimised and works like an app — native iOS/Android versions are coming next." },
  ],
  ru: [
    { q: "Что такое PaslaugosGrožiui?", a: "PaslaugosGrožiui — экосистема красоты: поиск салонов и мастеров с бронированием, профессиональный магазин, школы, вакансии, события и форум в одном месте." },
    { q: "Как забронировать визит?", a: "Выберите услугу или салон, свободное время в календаре и подтвердите. Для брони нужен аккаунт — так салоны защищены от фиктивных записей. Подтверждение приходит на почту, напоминание — за 24 часа." },
    { q: "Можно ли отменить визит?", a: "Да — по ссылке из письма или в личном кабинете. При отмене позже указанного салоном срока депозит не возвращается." },
    { q: "Сколько стоит членство?", a: "Для клиентов бесплатно. Для салонов, мастеров, поставщиков, школ и работодателей — месячные или годовые планы (годовые со скидкой). Новые салоны получают неделю бесплатного продвижения." },
    { q: "Что будет после окончания членства?", a: "Данные, профиль и история сохраняются. Приостанавливается только продвижение и часть pro-функций." },
    { q: "Почему цены в магазине разные?", a: "Клиенты видят розничную цену. Мастера, салоны и другие профессионалы после входа видят оптовую (B2B) цену — она всегда ниже." },
    { q: "Я поставщик — как загрузить товары?", a: "Панель поставщика → Товары. Добавьте вручную или импортируйте весь каталог по ссылке XML/CSV. Товар появляется в магазине сразу, если отмечен «Активен»." },
    { q: "Почему моих товаров не видно?", a: "Проверьте: товар активен, у аккаунта есть роль поставщика, страница обновлена. Товары с нулевым остатком показываются как «Под заказ», а не скрываются." },
    { q: "Какие комиссии?", a: "Комиссия платформы — 0,49 € за заказ или бронь с депозитом. Скрытых комиссий нет." },
    { q: "Можно попробовать без регистрации?", a: "Да. На странице входа есть демо-аккаунты для всех ролей. Общий пароль: Demo1234!" },
    { q: "Будет ли мобильное приложение?", a: "Сайт полностью адаптирован под телефон и работает как приложение — версии для iOS/Android в планах." },
  ],
};

function FaqPage() {
  const block = useSection("duk", "intro");
  const { i18n } = useTranslation();
  const lang = (i18n.language || "lt").slice(0, 2);
  const items = FAQ[lang] ?? FAQ.lt;

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-10 md:py-16">
      <div className="flex items-center gap-3 mb-3">
        <div className="rounded-xl gradient-gold p-2.5 text-primary-foreground shrink-0">
          <HelpCircle className="h-5 w-5" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl">{block?.title || "DUK / FAQ"}</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        {lang === "en" ? "Everything about booking, memberships, the shop and supplier imports."
          : lang === "ru" ? "Всё о бронировании, членстве, магазине и импорте товаров."
          : "Viskas apie rezervacijas, narystes, parduotuvę ir tiekėjų prekių importą."}
      </p>

      <Card className="p-2 md:p-4">
        <Accordion type="single" collapsible className="w-full">
          {items.map((f, i) => (
            <AccordionItem key={i} value={`i${i}`}>
              <AccordionTrigger className="text-left text-sm md:text-base">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
    </div>
  );
}

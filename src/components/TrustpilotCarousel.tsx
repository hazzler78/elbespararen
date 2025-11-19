"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";


export interface TrustpilotReview {
  id: string;
  name: string;
  rating: number;
  reviewText: string;
  fullReviewText?: string;
  image: string;
  date?: string;
}

// Riktiga Trustpilot-recensioner från Elchef.se
const placeholderReviews: TrustpilotReview[] = [
  {
    id: "1",
    name: "Erik Kronberg",
    rating: 5,
    reviewText: "Kan ju säga såhär, jag har aldrig haft så låg elräkning som nu. Ja visst jag jobbar borta två till tre veckor på en månad men helt ärligt jag har inte haft en elräkning på över två hundra kronor sen jag bytte.",
    fullReviewText: "Kan ju säga såhär, jag har aldrig haft så låg elräkning som nu. Ja visst jag jobbar borta två till tre veckor på en månad men helt ärligt jag har inte haft en elräkning på över två hundra kronor sen jag bytte. Och bara en av mina räkningar har varit på över 100kr så ja du ska ha tack för hjälpen",
    image: "",
    date: "2025-10-01"
  },
  {
    id: "2",
    name: "Kerstof Andreas",
    rating: 5,
    reviewText: "Va din egna elchef, grymt säger jag bara. Spara en massa pengar med elchef, de gör jag 👍😊",
    fullReviewText: "Va din egna elchef, grymt säger jag bara. Spara en massa pengar med elchef, de gör jag 👍😊",
    image: "",
    date: "2025-10-14"
  },
  {
    id: "3",
    name: "Ilona",
    rating: 5,
    reviewText: "I have changed and become my own 'elchef'.. Of course the cost to the grid owner hasn't changed but the electricity cost, the variable cost, has changed dramatically.",
    fullReviewText: "I have changed and become my own 'elchef'.. Of course the cost to the grid owner hasn't changed but the electricity cost, the variable cost, has changed dramatically. Very happy to have found Elchef and l can warmly recommend <3",
    image: "",
    date: "2025-06-15"
  },
  {
    id: "4",
    name: "Goran Gajski",
    rating: 5,
    reviewText: "Direkt, transparent och ärlig!",
    fullReviewText: "Direkt, transparent och ärlig!",
    image: "",
    date: "2025-09-25"
  },
  {
    id: "5",
    name: "Fabio Pezzetti",
    rating: 5,
    reviewText: "Great work to help people don't throw money! Strictly suggested! 👌🏻",
    fullReviewText: "Great work to help people don't throw money! Strictly suggested! 👌🏻",
    image: "",
    date: "2025-08-09"
  },
  {
    id: "6",
    name: "Mohammad Ali Nowandish",
    rating: 5,
    reviewText: "jag skulle berätta att elchef är det bästa bolaget man kan ha eftersom man slipper betala månadsavgift och påslag.",
    fullReviewText: "jag skulle berätta att elchef är det bästa bolaget man kan ha eftersom man slipper betala månadsavgift och påslag.",
    image: "",
    date: "2025-09-16"
  },
  {
    id: "7",
    name: "Jonina Ara",
    rating: 5,
    reviewText: "Tack Elchef betalar inte månadsavgift 👏eller extra kostnader alla borde bli sin egen elchef 😍",
    fullReviewText: "Tack Elchef betalar inte månadsavgift 👏eller extra kostnader alla borde bli sin egen elchef 😍",
    image: "",
    date: "2025-08-17"
  },
  {
    id: "8",
    name: "Anders Dahlberg",
    rating: 5,
    reviewText: "Tack vare elchef.se kunde jag teckna ett tre årigt fast pris avtal på 82.38 öre och en månadsavgift på 49kr med Svealand elbolag.se",
    fullReviewText: "Tack vare elchef.se kunde jag teckna ett tre årigt fast pris avtal på 82.38 öre och en månadsavgift på 49kr med Svealand elbolag.se Nu har jag även fått ett erbjudande från Eon på 800kr i rabatt. Detta gäller om man tecknar ett fast pris på 4 eller 6månader. 4mån kostade 131 öre per kilowattimme. 6månader kostade 141 öre per kilowattimme och avdraget som var på 800kr gällde bara på den första fakturan så det gäller att vara mycket observant på alla erbjudanden. Håll koll på elchef.se",
    image: "",
    date: "2025-10-02"
  },
  {
    id: "9",
    name: "Jasmina Stefanovic",
    rating: 5,
    reviewText: "Nu har min granne blivit kund hos er! Nu är hon sin egen chef över sin el! Hon är så tacksam!",
    fullReviewText: "Nu har min granne blivit kund hos er! Nu är hon sin egen chef över sin el! Hon är så tacksam!",
    image: "",
    date: "2025-10-04"
  },
  {
    id: "10",
    name: "Heléne Olsson",
    rating: 5,
    reviewText: "Tack för att jag hittade er 🙏🙏🙏 nu kommer det bli mycket roligare framöver när man slipper påslag från alla håll o kanter och månadsavgift...",
    fullReviewText: "Tack för att jag hittade er 🙏🙏🙏 nu kommer det bli mycket roligare framöver när man slipper påslag från alla håll o kanter och månadsavgift... Hoppas verkligen fler hittar er och byter elavtal bums. Jag delar er till alla mina vänner ialf.. Tack Mattias 👍🏻👍🏻👍🏻",
    image: "",
    date: "2025-07-11"
  },
  {
    id: "11",
    name: "Dennis",
    rating: 5,
    reviewText: "Fick snabb och effektiv hjälp. 10/10 service och behandling. Kommer rekommendera honom till alla mina vänner",
    fullReviewText: "Fick snabb och effektiv hjälp. 10/10 service och behandling. Kommer rekommendera honom till alla mina vänner",
    image: "",
    date: "2025-07-11"
  },
  {
    id: "12",
    name: "Joakim Bergendahl",
    rating: 5,
    reviewText: "Bästa nånsin. Jobbar i Norge och sparar mellan 3000-5000NOK med chefens elavtal! 👍",
    fullReviewText: "Bästa nånsin. Jobbar i Norge och sparar mellan 3000-5000NOK med chefens elavtal! 👍",
    image: "",
    date: "2025-07-09"
  },
  {
    id: "13",
    name: "Alex",
    rating: 5,
    reviewText: "Jag blev min egen elchef och min första månad, maj 2025, så fick jag en faktura på 290kr. Innan betalade jag närmare 1000kr för samma mäng el av Vattenfall.",
    fullReviewText: "Jag blev min egen elchef och min första månad, maj 2025, så fick jag en faktura på 290kr. Innan betalade jag närmare 1000kr för samma mäng el av Vattenfall. Rekommenderar starkt",
    image: "",
    date: "2025-06-15"
  },
  {
    id: "14",
    name: "Mathias Nilsson",
    rating: 5,
    reviewText: "Min Pappa hade Eon betala månadsavgift påslag påslag sparar nu ca 5000 kr på 1 år.",
    fullReviewText: "Min Pappa hade Eon betala månadsavgift påslag påslag sparar nu ca 5000 kr på 1 år.",
    image: "",
    date: "2025-06-07"
  },
  {
    id: "15",
    name: "Ulf Åberg",
    rating: 5,
    reviewText: "Elens Robin Hood är Mathias Nilsson, från södra Halland. Han har järn- och el koll som få. Helt suverän hjälpsamhet och vänlighet, samt kompetens.",
    fullReviewText: "Elens Robin Hood är Mathias Nilsson, från södra Halland. Han har järn- och el koll som få. Vilken hjälpsamhet i denna djungel där priser läggs på av elbolagen och där vi konsumenter får betala det ena efter det andra, men som inte blir oss till gagn, utan el-bolagen. Helt suverän hjälpsamhet och vänlighet, samt kompetens. Min fru sa: Finns det sådana människor idag? Ja, en heter Mathias Nilsson, svarade jag efter att ha sett honom på Hallands nytt. Tack gode Gud för att det finns ljus i vår mörka tidsålder.",
    image: "",
    date: "2025-11-18"
  }
];

export default function TrustpilotCarousel() {
  const [selectedReview, setSelectedReview] = useState<TrustpilotReview | null>(null);

  const formatDateToSwedish = (dateString: string): string => {
    const date = new Date(dateString);
    const months = [
      "januari", "februari", "mars", "april", "maj", "juni",
      "juli", "augusti", "september", "oktober", "november", "december"
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? "text-yellow-400 fill-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .trustpilot-swiper .swiper-pagination-bullet {
          background-color: rgba(0, 135, 90, 0.3) !important;
          opacity: 1 !important;
          width: 10px !important;
          height: 10px !important;
        }
        .trustpilot-swiper .swiper-pagination-bullet-active {
          background-color: #00875a !important;
          width: 24px !important;
          border-radius: 5px !important;
        }
      `}} />
      <section className="py-12 md:py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Vad säger våra användare?
            </h2>
            <p className="text-muted">Förtroendefulla recensioner från riktiga användare</p>
          </motion.div>

          <div className="relative">
            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              spaceBetween={20}
              slidesPerView={1}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                  spaceBetween: 20,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 24,
                },
              }}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              pagination={{
                clickable: true,
              }}
              navigation={false}
              loop={true}
              className="trustpilot-swiper !pb-12"
            >
              {placeholderReviews.map((review) => (
                <SwiperSlide key={review.id}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="
                      bg-white rounded-lg border border-border p-6
                      cursor-pointer h-full flex flex-col
                      hover:shadow-lg transition-shadow duration-200
                    "
                    onClick={() => setSelectedReview(review)}
                  >
                    {/* Avatar and Name */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden flex items-center justify-center text-primary font-semibold text-lg">
                        {review.image && review.image.trim() !== "" && !review.image.startsWith("/placeholder-avatar") ? (
                          <img
                            src={review.image}
                            alt={review.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                        ) : (
                          <span>{review.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{review.name}</h3>
                        {review.date && (
                          <p className="text-sm text-muted">{formatDateToSwedish(review.date)}</p>
                        )}
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-3">
                      {renderStars(review.rating)}
                    </div>

                    {/* Review Text */}
                    <p className="text-muted text-sm leading-relaxed line-clamp-4 flex-1">
                      {review.reviewText}
                    </p>

                    {/* Read More Hint */}
                    <p className="text-xs text-primary mt-4 font-medium">
                      Klicka för att läsa mer →
                    </p>
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {selectedReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedReview(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-primary/5 border-b border-border p-6 flex-shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden flex items-center justify-center text-primary font-bold text-2xl">
                      {selectedReview.image && selectedReview.image.trim() !== "" && !selectedReview.image.startsWith("/placeholder-avatar") ? (
                        <img
                          src={selectedReview.image}
                          alt={selectedReview.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      ) : (
                        <span>{selectedReview.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-xl mb-1">{selectedReview.name}</h3>
                      {selectedReview.date && (
                        <p className="text-sm text-muted mb-2">{formatDateToSwedish(selectedReview.date)}</p>
                      )}
                      <div className="flex items-center gap-1">
                        {renderStars(selectedReview.rating)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="
                      text-muted hover:text-foreground transition-colors flex-shrink-0
                      p-2 hover:bg-gray-100 rounded-full
                    "
                    aria-label="Stäng"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1">
                <p className="text-foreground leading-relaxed whitespace-pre-line">
                  {selectedReview.fullReviewText || selectedReview.reviewText}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


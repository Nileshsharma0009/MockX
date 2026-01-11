import { useState } from "react";
import { Star, ChevronDown, Quote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {faqs} from "../data/review.js";
import { reviews } from "../data/review.js";

/* ------------------ REVIEWS DATA (JSON) ------------------ */

/* ------------------ FAQ DATA (JSON) ------------------ */

/* ------------------ PAGE ------------------ */
const ReviewsFaqPage = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO */}
      <section className="max-w-6xl mx-auto pt-20 px-6 text-center">
        <h1 className="text-4xl font-semibold text-gray-900">
          Reviews & Student Feedback
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
          See how MockX has helped students prepare with confidence and clarity.
          Honest feedback from real exam aspirants.
        </p>
      </section>

      {/* REVIEWS */}
      <section className="max-w-6xl mx-auto mt-20 px-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-10">
          What students say
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition"
            >
              <Quote className="h-6 w-6 text-gray-300 mb-4" />

              <p className="text-sm text-gray-700 leading-relaxed mb-6">
                “{r.text}”
              </p>

              <div className="flex items-center gap-4">
                <img
                  src={r.image}
                  alt={r.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.role}</p>
                  <div className="flex mt-1">
                    {[...Array(r.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 text-yellow-500 fill-yellow-500"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Rating summary */}
        <div className="mt-16 text-center">
          <p className="text-xl font-medium text-gray-900">
            Average rating: 4.8 / 5
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Based on feedback from mock test users
          </p>
        </div>
      </section>

      {/* FAQ */}
      {/* <section className="max-w-4xl mx-auto mt-28 px-6">
        <h2 className="text-3xl font-semibold text-gray-900 mb-8">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex justify-between items-center px-6 py-4 text-left"
              >
                <span className="font-medium text-gray-900">{f.q}</span>
                <ChevronDown
                  className={`h-5 w-5 transition ${
                    openFaq === i ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openFaq === i && (
                <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section> */}

      {/* CTA */}
      <section className="max-w-6xl mx-auto mt-32 px-6 text-center pb-24">
        <h3 className="text-2xl font-semibold text-gray-900">
          Ready to invest in your preparation?
        </h3>
        <p className="mt-3 text-gray-600">
          Structured practice today leads to confidence on exam day.
        </p>

        <button
          onClick={() => navigate("/mock-tests")}
          className="mt-6 px-8 py-3 rounded-full bg-gray-900 text-white font-medium hover:bg-black transition"
        >
          Explore Mock Tests →
        </button>
      </section>
    </div>
  );
};

export default ReviewsFaqPage;

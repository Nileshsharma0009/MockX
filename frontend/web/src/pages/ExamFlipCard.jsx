import { useNavigate } from "react-router-dom";

const ExamFlipCard = ({
  name,
  price,
  title,
  description,
  features,
  route,
  gradient,
}) => {
  const navigate = useNavigate();

  return (
    <div className="perspective w-full h-[420px]">
      <div
        className="relative w-full h-full transform-style-preserve transition-transform duration-700 hover:rotate-y-180"
      >
        {/* FRONT */}
        <div
          className={`absolute inset-0 backface-hidden rounded-3xl p-8 text-white shadow-xl ${gradient}`}
        >
          <div className="flex flex-col justify-between h-full">
            <div>
              <span className="uppercase tracking-widest text-xs font-semibold opacity-90">
                {name}
              </span>

              <h2 className="text-3xl font-extrabold mt-4">
                {title}
              </h2>

              <p className="mt-4 text-sm opacity-90">
                Real exam-level mock tests with smart analytics.
              </p>
            </div>

            <div>
              <p className="text-4xl font-extrabold">₹{price}</p>
              <p className="text-sm opacity-80 mt-1">
                One-time access
              </p>

              <div className="mt-6 text-sm opacity-90">
                Hover to view details →
              </div>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl p-8 bg-white shadow-xl border"
        >
          <div className="flex flex-col justify-between h-full">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                What you get
              </h3>

              <ul className="space-y-3 text-sm text-gray-700">
                {features.map((f, i) => (
                  <li key={i}>✔ {f}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => navigate(route)}
              className="mt-8 w-full py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:opacity-95 transition"
            >
              Unlock Test Series →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamFlipCard;

import React from "react";

const QuestionCard = ({ question, onOptionSelect }) => {
  return (
    <div className="space-y-4">
      {/* Question text */}
      <p className="font-semibold text-gray-800 text-lg">
        {question.question}
      </p>

      {/* Optional image */}
      {question.image && (
        <div className="my-4 flex justify-center">
          <img
            src={question.image}
            alt="Question diagram"
            className="max-h-64 w-auto rounded-lg shadow-md border border-gray-200 object-contain"
          />
        </div>
      )}

      {/* Options */}
      <ul className="space-y-3">
        {question.options.map((opt, index) => (
          <li
            key={index}
            onClick={() => onOptionSelect(index)}
            className="border rounded-xl px-4 py-3 bg-white shadow-sm hover:shadow-md 
                       transition cursor-pointer hover:bg-slate-50"
          >
            {opt}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuestionCard;

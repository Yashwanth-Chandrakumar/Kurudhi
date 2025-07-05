export default function Stepper({ steps, currentStep }) {
    return (
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex flex-col items-center ${index <= currentStep ? "text-red-600" : "text-gray-400"}`}
          >
            <div
              className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${index <= currentStep ? "border-red-600" : "border-gray-400"}`}
            >
              {index + 1}
            </div>
            <div className="text-sm mt-2">{step}</div>
          </div>
        ))}
      </div>
    )
  }
  
  
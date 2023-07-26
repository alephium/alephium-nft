import React, { useState } from 'react'

const SwitchButton = ({ onToggle } : { onToggle: (enabled: boolean) => void }) => {
  const [isEnabled, setIsEnabled] = useState(false)

  const handleToggle = () => {
    setIsEnabled((prevState) => !prevState)
    if (onToggle) {
      onToggle(!isEnabled)
    }
  }

  const background = isEnabled ? 'bg-green-400' : 'bg-gray-400'

  return (
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={isEnabled}
          onChange={handleToggle}
        />
        <div className={`block ${background} w-14 h-8 rounded-full`}></div>
        <div
          className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${
            isEnabled ? 'translate-x-6 bg-green-500' : 'bg-gray-500'
          }`}
        ></div>
      </div>
    </label>
  );
}

export default SwitchButton
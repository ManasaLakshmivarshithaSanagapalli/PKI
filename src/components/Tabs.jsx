import React, { useState } from "react";

function Tabs({ tabs }) {
  const [activeTab, setActiveTab] = useState(Object.keys(tabs)[0]);

  return (
    <div>
      <div className="tab-buttons">
        {Object.keys(tabs).map((key) => (
          <button
            key={key}
            className={activeTab === key ? "active" : ""}
            onClick={() => setActiveTab(key)}
          >
            {key}
          </button>
        ))}
      </div>
      <div className="tab-content">{tabs[activeTab]}</div>
    </div>
  );
}

export default Tabs;

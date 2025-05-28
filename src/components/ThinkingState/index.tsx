import React from 'react';

interface ThinkingStateProps {}

const ThinkingState: React.FC<ThinkingStateProps> = () => (
  <div className="absolute w-full flex align-items-center justify-content-center gap-4"
    style={{ bottom: '160px' }}>
    <p className="m-0 text-xl text-white">Thinking...</p>
    
  </div>
);

export default ThinkingState;

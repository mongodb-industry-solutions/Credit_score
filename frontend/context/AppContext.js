import { createContext, useContext, useState } from 'react';

const ShrinkContext = createContext();

const useShrinkContext = () => {
  const [isShrunk, setIsShrunk] = useState(false);

  return { isShrunk, setIsShrunk };
};

export { ShrinkContext, useShrinkContext };


export const env = (() => {

  // Destructure environment variables
  const { VITE_DEBUG_MODE, VITE_ASSERT_ENABLE, VITE_BASE_PATH } = import.meta.env;

  return {
    DEBUG_MODE: VITE_DEBUG_MODE === 'true',
    ASSERT_ENABLE: VITE_ASSERT_ENABLE === 'true',
    BASE_PATH: VITE_BASE_PATH,
  };

})();

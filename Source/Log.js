import { env } from './Env'


export const log = (() => {

  function debug(msg)
  {
    if (env.DEBUG_MODE)
    {
      log_(msg, "DEBUG");
    }
  }

  function info(msg)
  {
    log_(msg, "INFO");
  }

  function warn(msg)
  {
    log_(msg, "WARN");
  }

  function error(msg)
  {
    log_(msg, "ERROR");
  }

  function log_(msg, level)
  {
    console.log(`[${level}] ${msg}`);
  }

  return {
    debug: debug,
    info: info,
    warn: warn,
    error: error,
  };

})();

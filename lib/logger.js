const logger = {
  error: (message, err) => {
    const entry = {
      level: "error",
      message,
      timestamp: new Date().toISOString(),
    };
    if (err) {
      entry.name = err.name;
      entry.code = err.code;
      if (process.env.NODE_ENV !== "production") {
        entry.stack = err.stack;
      }
    }
    console.error(JSON.stringify(entry));
  },
};

module.exports = logger;

const { EventEmitter } = require("events");

class Poller extends EventEmitter {
  /**
   * @param {number} timeout - How long should we wait after the poll started (in milliseconds)?
   * @param {string} name - The name of the poll event.
   */
  constructor(timeout = 100, name = "poll") {
    super();
    this.timeout = timeout;
    this.name = name;
    this.currentTimer = null; // To store the active timer reference
  }

  /**
   * Triggers the 'poll' event after the configured timeout.
   */
  poll() {
    this.clearCurrentTimer(); // Stop any existing poll
    this.currentTimer = setTimeout(() => {
      this.emit(this.name);
    }, this.timeout);
  }

  /**
   * Refreshes the current timer if it exists.
   */
  pollRefresh() {
    console.log("pollRefresh");
    if (this.currentTimer) {
      this.currentTimer.refresh(); // Refresh the existing timer
    } else {
      console.log("no timer");
    }
  }

  /**
   * Registers a callback to be invoked when the 'poll' event is emitted.
   * @param {Function} cb - The callback function to execute on the 'poll' event.
   */
  onPoll(cb) {
    this.on(this.name, cb);
  }

  /**
   * Stops the polling for a given session.
   * @param {string} session - The session name for logging.
   */
  stop(session) {
    console.log("stop", session);
    this.clearCurrentTimer();
  }

  /**
   * Clears the current timer if it exists.
   * @private
   */
  clearCurrentTimer() {
    if (this.currentTimer) {
      clearTimeout(this.currentTimer); // Stops the active timer
      this.currentTimer = null;       // Clears the reference
    }
  }
}

module.exports = Poller;

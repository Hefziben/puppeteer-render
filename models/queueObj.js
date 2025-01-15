  const Poller = require("../utlis/poller");


module.exports = {
  // This structure represents a queue item
  QueueObject: {},
  
  queueItem: class QueueItem {
    constructor(name, poller) {
      this.name = name;
      this.poller = poller; // poller is expected to be an instance of Poller
    }
  }
};

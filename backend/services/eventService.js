const events = {
  '1': { id: '1', content: 'This is event 1' },
  '2': { id: '2', content: 'This is event 2' },
  '3': { id: '3', content: 'This is event 3' },
};

exports.getEvent = (id) => {
  return events[id] || { error: 'Event not found' };
};

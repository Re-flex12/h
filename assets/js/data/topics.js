// Topic explainer pages (school physics and mathematics basics).
import physics from './topics-physics.js';
import maths from './topics-maths.js';

export const TOPICS = [...physics.map(t => ({ ...t, sec: 'physics' })), ...maths.map(t => ({ ...t, sec: 'maths' }))];
export const TOPIC = Object.fromEntries(TOPICS.map(t => [t.id, t]));

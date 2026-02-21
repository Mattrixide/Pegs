export class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event).push(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    const fns = this._listeners.get(event);
    if (fns) this._listeners.set(event, fns.filter(f => f !== fn));
  }

  emit(event, data) {
    (this._listeners.get(event) || []).forEach(fn => fn(data));
  }
}

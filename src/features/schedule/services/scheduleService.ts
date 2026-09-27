import { FirebaseScheduleAdapter } from './firebaseScheduleAdapter';
import type { SchedulePort } from './schedulePort';

class ScheduleService implements SchedulePort {
  private adapter: SchedulePort;

  constructor() {
    this.adapter = new FirebaseScheduleAdapter();
  }

  getEvents() {
    return this.adapter.getEvents();
  }

  createEvent(event: Parameters<SchedulePort['createEvent']>[0]) {
    return this.adapter.createEvent(event);
  }

  updateEvent(id: string, updates: Parameters<SchedulePort['updateEvent']>[1]) {
    return this.adapter.updateEvent(id, updates);
  }

  deleteEvent(id: string) {
    return this.adapter.deleteEvent(id);
  }
}

export const scheduleService = new ScheduleService();

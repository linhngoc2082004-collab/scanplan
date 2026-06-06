export interface Deadline {
  id: string;
  title: string;
  date: string;
  month: string;
  day: string;
  // Backend fields
  user_id?: string;
  course_name?: string;
  deadline_type?: string;
  due_date?: string;
}

export interface ReminderSettings {
  remind5Days: boolean;
  remind3Days: boolean;
  remind1Day: boolean;
  notifications: boolean;
}

export interface FormErrors {
  email?: string;
  password?: string;
  fullName?: string;
  confirmPassword?: string;
  terms?: string;
}
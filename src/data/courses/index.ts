import { Course } from '../../models/course';
import { REIKI_COURSES } from './reiki';
import { NLP_COURSES } from './nlp';
import { TIMELINE_THERAPY_COURSES } from './timelineTherapy';
import { ENERGY_HEALING_COURSES } from './energyHealing';

export const ALL_COURSES: Course[] = [
  ...REIKI_COURSES,
  ...NLP_COURSES,
  ...TIMELINE_THERAPY_COURSES,
  ...ENERGY_HEALING_COURSES
];

export { REIKI_COURSES, NLP_COURSES, TIMELINE_THERAPY_COURSES, ENERGY_HEALING_COURSES };

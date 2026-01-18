import { Student } from './student';
import { MenuSelection } from './menu-selection';

/**
 * Booking submission model interface
 * Represents a complete meal booking submission
 */
export interface BookingSubmission {
  schoolId: number;
  email: string;
  children: Student[];
  menuSelections: Record<string, MenuSelection>;
  saveChildrenInfo: boolean;
}

// sample json
// {
//   'schoolCode': '5NHWGD',
//   'email': 'test@test.com',
//   'children': [
//     {
//       'lastName': 'Doe',
//       'firstName': 'John',
//       'class': 'CM1',
//       'feedingRegime': ''
//     },
//     {
//       'lastName': 'Doe',
//       'firstName': 'Jane',
//       'class': 'CE2',
//       'feedingRegime': 'Mange Hallal'
//     }
//   ],
//   'menuSelections': {
//     'John-Doe-0': {'lundi': true, 'mardi': true, 'jeudi': true, 'vendredi': true},
//     'Jane-Doe-1': {'lundi': false, 'mardi': true, 'jeudi': true, 'vendredi': false}
//   },
//   'saveChildrenInfo': false
// }
